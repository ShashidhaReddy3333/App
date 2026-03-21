import { PaymentStatus, Prisma } from "@prisma/client";

import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { priceCheckout } from "@/lib/domain/pricing";
import { conflictError, notFoundError, validationError } from "@/lib/errors";
import { roundMoney, toDecimal } from "@/lib/money";
import { addCartItemSchema, customerCheckoutSchema, removeCartItemSchema } from "@/lib/schemas/customer-commerce";
import { allocateOrderNumber, commitReservedInventory, createIdempotencyRecord, reserveInventory } from "@/lib/services/command-helpers";
import { enqueueRoleNotifications } from "@/lib/services/notification-service";
import { findIdempotentResult, getDefaultLocation } from "@/lib/services/platform-service";

function taxRateCategories(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.filter((item): item is string => typeof item === "string");
}

async function getStorefrontBusiness() {
  const business = await db.business.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      locations: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        take: 1
      }
    }
  });

  if (!business || !business.locations[0]) {
    throw notFoundError("No active storefront is available.");
  }

  return {
    business,
    location: business.locations[0]
  };
}

export async function getStorefrontData() {
  const { business, location } = await getStorefrontBusiness();
  const products = await db.product.findMany({
    where: {
      businessId: business.id,
      isArchived: false
    },
    include: {
      inventoryBalances: {
        where: { locationId: location.id }
      }
    },
    orderBy: [{ category: "asc" }, { name: "asc" }]
  });

  const categories = [...new Set(products.map((product) => product.category))];

  return {
    business,
    location,
    categories,
    products: products.map((product) => ({
      ...product,
      availableQuantity: Number(product.inventoryBalances[0]?.availableQuantity ?? 0)
    }))
  };
}

export async function getStorefrontProduct(productId: string) {
  const { business, location } = await getStorefrontBusiness();
  const product = await db.product.findFirst({
    where: {
      id: productId,
      businessId: business.id,
      isArchived: false
    },
    include: {
      inventoryBalances: {
        where: { locationId: location.id }
      },
      supplier: true
    }
  });

  if (!product) {
    throw notFoundError("Product not found.");
  }

  return {
    business,
    location,
    product,
    availableQuantity: Number(product.inventoryBalances[0]?.availableQuantity ?? 0)
  };
}

async function getOrCreateActiveCart(customerId: string) {
  const { business, location } = await getStorefrontBusiness();
  const existing = await db.cart.findFirst({
    where: {
      customerId,
      businessId: business.id,
      status: "active"
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  if (existing) {
    return existing;
  }

  return db.cart.create({
    data: {
      customerId,
      businessId: business.id,
      locationId: location.id
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });
}

export async function getCustomerCart(customerId: string) {
  return getOrCreateActiveCart(customerId);
}

export async function addItemToCustomerCart(customerId: string, input: unknown) {
  const values = addCartItemSchema.parse(input);
  const cart = await getOrCreateActiveCart(customerId);
  const product = await db.product.findFirst({
    where: {
      id: values.productId,
      businessId: cart.businessId,
      isArchived: false
    }
  });
  if (!product) {
    throw notFoundError("Product not found.");
  }
  const lineQuantity = toDecimal(values.quantity);
  const unitPrice = product.sellingPrice;
  const totalPrice = toDecimal(roundMoney(values.quantity * Number(product.sellingPrice)));

  const existingItem = cart.items.find((item) => item.productId === values.productId);
  if (existingItem) {
    await db.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: toDecimal(Number(existingItem.quantity) + values.quantity),
        totalPrice: toDecimal(roundMoney((Number(existingItem.quantity) + values.quantity) * Number(unitPrice)))
      }
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: lineQuantity,
        unitPrice,
        totalPrice
      }
    });
  }

  return getCustomerCart(customerId);
}

export async function removeItemFromCustomerCart(customerId: string, input: unknown) {
  const values = removeCartItemSchema.parse(input);
  const cart = await getOrCreateActiveCart(customerId);
  const item = await db.cartItem.findFirst({
    where: {
      id: values.itemId,
      cartId: cart.id
    }
  });

  if (!item) {
    throw notFoundError("Cart item not found.");
  }

  await db.cartItem.delete({
    where: { id: item.id }
  });

  return getCustomerCart(customerId);
}

export async function checkoutCustomerCart(customerId: string, input: unknown) {
  const values = customerCheckoutSchema.parse(input);
  const storefront = await getStorefrontBusiness();
  const existing = await findIdempotentResult(storefront.business.id, "customer_checkout", values.idempotencyKey);
  if (existing) {
    return db.order.findUniqueOrThrow({
      where: { id: existing.resourceId },
      include: {
        items: { include: { product: true } },
        fulfillment: { include: { deliveryAddress: true } },
        payments: true
      }
    });
  }

  return db.$transaction(
    async (tx) => {
      const cart = await tx.cart.findFirst({
        where: {
          customerId,
          status: "active"
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        throw validationError("Your cart is empty.");
      }

      const business = await tx.business.findUniqueOrThrow({
        where: { id: cart.businessId },
        include: { taxRates: true }
      });
      await getDefaultLocation(cart.businessId);

      const pricing = priceCheckout(
        cart.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          category: item.product.category,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        })),
        business.taxRates.map((rate) => ({
          name: rate.name,
          ratePercent: Number(rate.ratePercent),
          appliesToCategories: taxRateCategories(rate.appliesToCategories),
          compoundOrder: rate.compoundOrder
        })),
        business.taxMode
      );

      const order = await tx.order.create({
        data: {
          businessId: cart.businessId,
          locationId: cart.locationId,
          orderNumber: await allocateOrderNumber(tx, cart.businessId),
          orderType: "online",
          customerId,
          createdByUserId: customerId,
          status: "confirmed",
          subtotalAmount: toDecimal(pricing.subtotalAmount),
          taxAmount: toDecimal(pricing.taxAmount),
          discountAmount: toDecimal(pricing.discountAmount),
          totalAmount: toDecimal(pricing.totalAmount),
          paymentStatus: PaymentStatus.settled,
          fulfillmentType: values.fulfillmentType,
          notes: values.notes || null
        }
      });

      for (const line of pricing.items) {
        const product = cart.items.find((item) => item.productId === line.productId)?.product;
        if (!product) {
          throw notFoundError("Product not found in cart.");
        }

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: line.productId,
            quantity: toDecimal(line.quantity),
            unitPrice: toDecimal(line.unitPrice),
            discountAmount: toDecimal(line.lineDiscount + line.allocatedSaleDiscount),
            taxAmount: toDecimal(line.taxAmount),
            totalAmount: toDecimal(line.lineTotal)
          }
        });

        await reserveInventory(tx, {
          productId: line.productId,
          locationId: cart.locationId,
          quantity: line.quantity,
          allowOversell: product.allowOversell,
          referenceId: order.id,
          createdById: customerId,
          referenceType: "order",
          reason: "online_checkout_reservation"
        });
        await commitReservedInventory(tx, {
          productId: line.productId,
          locationId: cart.locationId,
          quantity: line.quantity,
          referenceId: order.id,
          createdById: customerId,
          referenceType: "order",
          reason: "online_order_completed"
        });
      }

      let addressId: string | null = null;
      if (values.fulfillmentType === "delivery") {
        if (!values.address) {
          throw validationError("Delivery address is required for delivery orders.", {
            fieldErrors: {
              address: ["Delivery address is required for delivery orders."]
            }
          });
        }

        const address = await tx.address.create({
          data: {
            userId: customerId,
            label: values.address.label,
            line1: values.address.line1,
            line2: values.address.line2 || null,
            city: values.address.city,
            province: values.address.province,
            postalCode: values.address.postalCode,
            country: values.address.country
          }
        });
        addressId = address.id;
      }

      await tx.orderFulfillment.create({
        data: {
          orderId: order.id,
          status: values.fulfillmentType === "pickup" ? "ready" : "pending",
          deliveryAddressId: addressId
        }
      });

      await tx.orderPayment.create({
        data: {
          orderId: order.id,
          method: values.paymentMethod,
          provider: values.paymentProvider ?? "manual",
          amount: toDecimal(pricing.totalAmount),
          status: PaymentStatus.settled
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          oldStatus: null,
          newStatus: "confirmed",
          changedByUserId: customerId,
          notes: "Customer checkout completed."
        }
      });

      await createIdempotencyRecord(tx, cart.businessId, "customer_checkout", values.idempotencyKey, "order", order.id);

      await tx.cart.update({
        where: { id: cart.id },
        data: { status: "checked_out" }
      });

      await logAudit({
        tx,
        businessId: cart.businessId,
        actorUserId: customerId,
        action: "customer_order_created",
        resourceType: "order",
        resourceId: order.id,
        metadata: { orderNumber: order.orderNumber }
      });

      await enqueueRoleNotifications(tx, {
        businessId: cart.businessId,
        roles: ["owner", "manager"],
        type: "customer_order_created",
        title: "New online order",
        message: `Order ${order.orderNumber} was placed through the storefront.`,
        channel: "in_app"
      });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
          items: { include: { product: true } },
          fulfillment: { include: { deliveryAddress: true } },
          payments: true
        }
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );
}

export async function listCustomerOrders(customerId: string, options?: { q?: string; page?: number; pageSize?: number }) {
  const query = options?.q?.trim();
  const where = {
    customerId,
    ...(query
      ? {
          orderNumber: {
            contains: query,
            mode: "insensitive" as const
          }
        }
      : {})
  };

  if (typeof options?.page !== "number" && typeof options?.pageSize !== "number") {
    const items = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        fulfillment: true
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      items,
      totalCount: items.length,
      totalPages: 1,
      currentPage: 1
    };
  }

  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, options?.pageSize ?? 20);
  const skip = (page - 1) * pageSize;

  const [items, totalCount] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        fulfillment: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize
    }),
    db.order.count({ where })
  ]);

  return {
    items,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page
  };
}

export async function getCustomerOrderDetail(customerId: string, orderId: string) {
  const order = await db.order.findFirst({
    where: {
      id: orderId,
      customerId
    },
    include: {
      business: true,
      location: true,
      items: {
        include: {
          product: true
        }
      },
      fulfillment: {
        include: {
          deliveryAddress: true
        }
      },
      payments: true,
      statusHistory: {
        orderBy: { changedAt: "desc" }
      }
    }
  });

  if (!order) {
    throw notFoundError("Order not found.");
  }

  return order;
}
