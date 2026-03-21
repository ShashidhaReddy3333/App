import { existsSync } from "node:fs";
import bcrypt from "bcryptjs";
import { PaymentStatus, Prisma, PrismaClient, RefundStatus, SaleStatus, UserRole, UserStatus } from "@prisma/client";

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

const prisma = new PrismaClient();

const money = (value: number) => new Prisma.Decimal(value.toFixed(2));
const quantity = (value: number) => new Prisma.Decimal(value.toFixed(3));

async function resetDatabase() {
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.orderPayment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderFulfillment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.registerSession.deleteMany();
  await prisma.pOSRegister.deleteMany();
  await prisma.refundPayment.deleteMany();
  await prisma.refundItem.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.supplierProduct.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryBalance.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.location.deleteMany();
  await prisma.staffInviteToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.taxRate.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.authThrottle.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error("Unable to connect to PostgreSQL. Start the database first with `corepack pnpm db:up` or your local PostgreSQL service.");
    throw error;
  }

  await resetDatabase();

  const passwordHash = await bcrypt.hash("DemoPass!123", 12);

  const owner = await prisma.user.create({
    data: {
      fullName: "Shashi Owner",
      email: "owner@demo.local",
      passwordHash,
      role: UserRole.owner,
      status: UserStatus.active
    }
  });

  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      businessName: "Shashi Mart",
      businessType: "retail_store",
      primaryCountry: "CA",
      timezone: "America/Toronto",
      currency: "CAD",
      taxMode: "exclusive_tax",
      users: {
        connect: { id: owner.id }
      },
      locations: {
        create: {
          name: "Main Location",
          addressLine1: "123 Market Street",
          city: "Toronto",
          provinceOrState: "ON",
          postalCode: "M5V 2T6",
          country: "CA",
          timezone: "America/Toronto"
        }
      }
    },
    include: { locations: true }
  });

  const location = business.locations[0]!;
  await prisma.user.update({
    where: { id: owner.id },
    data: { businessId: business.id }
  });

  const [manager, cashier, inventoryStaff] = await Promise.all([
    prisma.user.create({
      data: {
        businessId: business.id,
        fullName: "Mina Manager",
        email: "manager@demo.local",
        passwordHash,
        role: UserRole.manager,
        status: UserStatus.active
      }
    }),
    prisma.user.create({
      data: {
        businessId: business.id,
        fullName: "Casey Cashier",
        email: "cashier@demo.local",
        passwordHash,
        role: UserRole.cashier,
        status: UserStatus.active
      }
    }),
    prisma.user.create({
      data: {
        businessId: business.id,
        fullName: "Ivy Inventory",
        email: "inventory@demo.local",
        passwordHash,
        role: UserRole.inventory_staff,
        status: UserStatus.active
      }
    })
  ]);

  await prisma.taxRate.create({
    data: {
      businessId: business.id,
      name: "HST",
      ratePercent: new Prisma.Decimal("13.00"),
      isDefault: true
    }
  });

  const suppliers = await prisma.supplier.createManyAndReturn({
    data: [
      {
        businessId: business.id,
        name: "North Foods Wholesale",
        contactName: "Noah Patel",
        email: "northfoods@demo.local",
        phone: "416-555-0101"
      },
      {
        businessId: business.id,
        name: "Urban Essentials Supply",
        contactName: "Ella Martin",
        email: "urbanessentials@demo.local",
        phone: "416-555-0199"
      }
    ]
  });

  const [supplierUser, customer] = await Promise.all([
    prisma.user.create({
      data: {
        businessId: business.id,
        supplierId: suppliers[0]!.id,
        fullName: "Nora Supplier",
        email: "supplier@demo.local",
        passwordHash,
        role: UserRole.supplier,
        status: UserStatus.active,
        notificationPreference: {
          create: {}
        }
      }
    }),
    prisma.user.create({
      data: {
        fullName: "Chloe Customer",
        email: "customer@demo.local",
        passwordHash,
        role: UserRole.customer,
        status: UserStatus.active,
        customerProfile: {
          create: {
            preferredStoreId: location.id
          }
        },
        notificationPreference: {
          create: {}
        }
      }
    })
  ]);

  const catalog = [
    ["Rice Bag", "grocery", "RICE-001", 9.5, 15, 40, 48],
    ["Milk Carton", "dairy", "MILK-001", 2.1, 3.99, 30, 22],
    ["Bread Loaf", "bakery", "BREAD-001", 1.2, 2.99, 25, 18],
    ["Eggs Dozen", "dairy", "EGGS-001", 3.5, 5.49, 20, 16],
    ["Cooking Oil", "grocery", "OIL-001", 6, 10.99, 18, 8],
    ["Sugar Pack", "grocery", "SUGAR-001", 2.8, 4.99, 26, 19],
    ["Salt Pack", "grocery", "SALT-001", 1.1, 2.29, 18, 14],
    ["Laundry Soap", "household", "SOAP-001", 4.6, 7.49, 15, 7],
    ["Dish Liquid", "household", "DISH-001", 2.9, 5.49, 14, 13],
    ["Toothpaste", "pharmacy", "DENT-001", 1.9, 4.79, 18, 9],
    ["Pain Relief", "pharmacy", "MED-001", 3.2, 8.99, 12, 6],
    ["Vitamin C", "pharmacy", "VITC-001", 4.4, 11.99, 12, 10],
    ["T-Shirt Black", "clothing", "TSHIRT-001", 8.5, 19.99, 14, 11],
    ["T-Shirt White", "clothing", "TSHIRT-002", 8.5, 19.99, 14, 6],
    ["Jeans Blue", "clothing", "JEANS-001", 18, 39.99, 10, 5],
    ["Cap Classic", "clothing", "CAP-001", 4.2, 12.99, 10, 9],
    ["Phone Charger", "electronics", "CHARGE-001", 6.9, 18.99, 16, 12],
    ["Battery Pack", "electronics", "BATTERY-001", 3.4, 7.99, 24, 21],
    ["Water Bottle", "grocery", "WATER-001", 0.6, 1.49, 60, 43],
    ["Chocolate Bar", "snacks", "CHOC-001", 0.8, 1.99, 40, 33]
  ] as const;

  const createdProducts = [];
  for (const [name, category, sku, purchasePrice, sellingPrice, parLevel, openingStock] of catalog) {
    const product = await prisma.product.create({
      data: {
        businessId: business.id,
        name,
        category,
        sku,
        supplierId: category === "clothing" || category === "electronics" ? suppliers[1]!.id : suppliers[0]!.id,
        unitType: "unit",
        purchasePrice: money(purchasePrice),
        sellingPrice: money(sellingPrice),
        parLevel: quantity(parLevel)
      }
    });
    createdProducts.push(product);

    await prisma.inventoryBalance.create({
      data: {
        productId: product.id,
        locationId: location.id,
        onHandQuantity: quantity(openingStock),
        reservedQuantity: quantity(0),
        availableQuantity: quantity(openingStock)
      }
    });

    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        locationId: location.id,
        movementType: "stock_count_reconciliation",
        quantityDelta: quantity(openingStock),
        referenceType: "seed",
        referenceId: product.id,
        reason: "opening_stock",
        createdById: inventoryStaff.id
      }
    });
  }

  const rice = createdProducts[0]!;
  const milk = createdProducts[1]!;
  const oil = createdProducts[4]!;
  const soap = createdProducts[7]!;

  await prisma.pOSRegister.create({
    data: {
      businessId: business.id,
      locationId: location.id,
      name: "Front Counter",
      deviceIdentifier: "POS-001",
      status: "active",
      sessions: {
        create: {
          cashierUserId: cashier.id,
          openingBalance: money(200)
        }
      }
    }
  });

  const supplierCatalog = await prisma.supplierProduct.createManyAndReturn({
    data: [
      {
        supplierId: suppliers[0]!.id,
        mappedProductId: rice.id,
        name: "Rice Bag Wholesale Case",
        minimumOrderQuantity: quantity(10),
        casePackSize: 10,
        wholesalePrice: money(12.5),
        leadTimeDays: 3,
        deliveryFee: money(18),
        serviceArea: "Greater Toronto Area"
      },
      {
        supplierId: suppliers[0]!.id,
        mappedProductId: oil.id,
        name: "Cooking Oil Wholesale Pack",
        minimumOrderQuantity: quantity(6),
        casePackSize: 6,
        wholesalePrice: money(8.25),
        leadTimeDays: 2,
        deliveryFee: money(18),
        serviceArea: "Greater Toronto Area"
      },
      {
        supplierId: suppliers[1]!.id,
        mappedProductId: createdProducts[12]!.id,
        name: "Black T-Shirt Bulk Bundle",
        minimumOrderQuantity: quantity(8),
        casePackSize: 8,
        wholesalePrice: money(15.5),
        leadTimeDays: 5,
        deliveryFee: money(22),
        serviceArea: "Ontario"
      }
    ]
  });

  const saleOne = await prisma.sale.create({
    data: {
      businessId: business.id,
      locationId: location.id,
      cashierUserId: cashier.id,
      status: SaleStatus.completed,
      subtotalAmount: money(33.99),
      discountAmount: money(1.0),
      taxAmount: money(4.29),
      totalAmount: money(37.28),
      amountPaid: money(37.28),
      amountDue: money(0),
      completedAt: new Date(),
      businessTimezoneDate: new Date(),
      receiptNumber: "RCPT-000001"
    }
  });

  const saleOneRice = await prisma.saleItem.create({
    data: {
      saleId: saleOne.id,
      productId: rice.id,
      quantity: quantity(2),
      unitPrice: money(15),
      subtotal: money(30),
      lineDiscountAmount: money(1),
      taxAmount: money(3.77),
      taxComponents: [{ name: "HST", rate: 13, amount: 3.77 }],
      lineTotal: money(32.77)
    }
  });
  await prisma.saleItem.create({
    data: {
      saleId: saleOne.id,
      productId: milk.id,
      quantity: quantity(1),
      unitPrice: money(3.99),
      subtotal: money(3.99),
      lineDiscountAmount: money(0),
      taxAmount: money(0.52),
      taxComponents: [{ name: "HST", rate: 13, amount: 0.52 }],
      lineTotal: money(4.51)
    }
  });
  await prisma.payment.createMany({
    data: [
      {
        saleId: saleOne.id,
        method: "cash",
        provider: "manual",
        amount: money(20),
        status: "settled"
      },
      {
        saleId: saleOne.id,
        method: "debit_card",
        provider: "square",
        amount: money(17.28),
        status: "settled"
      }
    ]
  });

  const saleTwo = await prisma.sale.create({
    data: {
      businessId: business.id,
      locationId: location.id,
      cashierUserId: cashier.id,
      status: SaleStatus.completed,
      subtotalAmount: money(21.98),
      discountAmount: money(0),
      taxAmount: money(2.86),
      totalAmount: money(24.84),
      amountPaid: money(24.84),
      amountDue: money(0),
      completedAt: new Date(),
      businessTimezoneDate: new Date(),
      receiptNumber: "RCPT-000002"
    }
  });
  await prisma.saleItem.create({
    data: {
      saleId: saleTwo.id,
      productId: oil.id,
      quantity: quantity(2),
      unitPrice: money(10.99),
      subtotal: money(21.98),
      lineDiscountAmount: money(0),
      taxAmount: money(2.86),
      taxComponents: [{ name: "HST", rate: 13, amount: 2.86 }],
      lineTotal: money(24.84)
    }
  });
  await prisma.payment.create({
    data: {
      saleId: saleTwo.id,
      method: "credit_card",
      provider: "stripe",
      amount: money(24.84),
      status: "settled"
    }
  });

  const saleThree = await prisma.sale.create({
    data: {
      businessId: business.id,
      locationId: location.id,
      cashierUserId: cashier.id,
      status: SaleStatus.pending_payment,
      subtotalAmount: money(7.49),
      discountAmount: money(0),
      taxAmount: money(0.97),
      totalAmount: money(8.46),
      amountPaid: money(0),
      amountDue: money(8.46),
      reservationExpiresAt: new Date(Date.now() + 1000 * 60 * 10)
    }
  });
  await prisma.saleItem.create({
    data: {
      saleId: saleThree.id,
      productId: soap.id,
      quantity: quantity(1),
      unitPrice: money(7.49),
      subtotal: money(7.49),
      lineDiscountAmount: money(0),
      taxAmount: money(0.97),
      taxComponents: [{ name: "HST", rate: 13, amount: 0.97 }],
      lineTotal: money(8.46)
    }
  });

  await prisma.inventoryBalance.update({
    where: { productId_locationId: { productId: rice.id, locationId: location.id } },
    data: { onHandQuantity: quantity(47), availableQuantity: quantity(47) }
  });
  await prisma.inventoryBalance.update({
    where: { productId_locationId: { productId: milk.id, locationId: location.id } },
    data: { onHandQuantity: quantity(21), availableQuantity: quantity(21) }
  });
  await prisma.inventoryBalance.update({
    where: { productId_locationId: { productId: oil.id, locationId: location.id } },
    data: { onHandQuantity: quantity(6), availableQuantity: quantity(6) }
  });
  await prisma.inventoryBalance.update({
    where: { productId_locationId: { productId: soap.id, locationId: location.id } },
    data: { reservedQuantity: quantity(1), availableQuantity: quantity(6) }
  });

  await prisma.inventoryMovement.createMany({
    data: [
      {
        productId: rice.id,
        locationId: location.id,
        movementType: "sale_commit",
        quantityDelta: quantity(-2),
        referenceType: "sale",
        referenceId: saleOne.id,
        reason: "sale_completed",
        createdById: cashier.id
      },
      {
        productId: milk.id,
        locationId: location.id,
        movementType: "sale_commit",
        quantityDelta: quantity(-1),
        referenceType: "sale",
        referenceId: saleOne.id,
        reason: "sale_completed",
        createdById: cashier.id
      },
      {
        productId: oil.id,
        locationId: location.id,
        movementType: "sale_commit",
        quantityDelta: quantity(-2),
        referenceType: "sale",
        referenceId: saleTwo.id,
        reason: "sale_completed",
        createdById: cashier.id
      },
      {
        productId: soap.id,
        locationId: location.id,
        movementType: "reservation_hold",
        quantityDelta: quantity(1),
        referenceType: "sale",
        referenceId: saleThree.id,
        reason: "checkout_reservation",
        createdById: cashier.id
      }
    ]
  });

  const customerAddress = await prisma.address.create({
    data: {
      userId: customer.id,
      label: "Home",
      line1: "456 Queen Street",
      city: "Toronto",
      province: "ON",
      postalCode: "M5V 1E3",
      country: "CA"
    }
  });

  const onlineOrder = await prisma.order.create({
    data: {
      businessId: business.id,
      locationId: location.id,
      orderNumber: "ORD-000001",
      orderType: "online",
      customerId: customer.id,
      createdByUserId: customer.id,
      status: "confirmed",
      subtotalAmount: money(18.98),
      taxAmount: money(2.47),
      discountAmount: money(0),
      deliveryFee: money(0),
      totalAmount: money(21.45),
      paymentStatus: PaymentStatus.settled,
      fulfillmentType: "delivery"
    }
  });
  await prisma.orderItem.createMany({
    data: [
      {
        orderId: onlineOrder.id,
        productId: milk.id,
        quantity: quantity(2),
        unitPrice: money(3.99),
        discountAmount: money(0),
        taxAmount: money(1.04),
        totalAmount: money(9.02)
      },
      {
        orderId: onlineOrder.id,
        productId: soap.id,
        quantity: quantity(1),
        unitPrice: money(7.49),
        discountAmount: money(0),
        taxAmount: money(0.97),
        totalAmount: money(8.46)
      }
    ]
  });
  await prisma.orderPayment.create({
    data: {
      orderId: onlineOrder.id,
      method: "credit_card",
      provider: "stripe",
      amount: money(21.45),
      status: "settled"
    }
  });
  await prisma.orderStatusHistory.create({
    data: {
      orderId: onlineOrder.id,
      newStatus: "confirmed",
      changedByUserId: customer.id,
      notes: "Seeded storefront checkout"
    }
  });
  await prisma.orderFulfillment.create({
    data: {
      orderId: onlineOrder.id,
      status: "in_transit",
      deliveryAddressId: customerAddress.id
    }
  });

  await prisma.inventoryBalance.update({
    where: { productId_locationId: { productId: milk.id, locationId: location.id } },
    data: { onHandQuantity: quantity(19), availableQuantity: quantity(19) }
  });
  await prisma.inventoryBalance.update({
    where: { productId_locationId: { productId: soap.id, locationId: location.id } },
    data: { onHandQuantity: quantity(6), reservedQuantity: quantity(1), availableQuantity: quantity(5) }
  });
  await prisma.inventoryMovement.createMany({
    data: [
      {
        productId: milk.id,
        locationId: location.id,
        movementType: "sale_commit",
        quantityDelta: quantity(-2),
        referenceType: "order",
        referenceId: onlineOrder.id,
        reason: "online_order_completed",
        createdById: customer.id
      },
      {
        productId: soap.id,
        locationId: location.id,
        movementType: "sale_commit",
        quantityDelta: quantity(-1),
        referenceType: "order",
        referenceId: onlineOrder.id,
        reason: "online_order_completed",
        createdById: customer.id
      }
    ]
  });

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      businessId: business.id,
      supplierId: suppliers[0]!.id,
      locationId: location.id,
      poNumber: "PO-000001",
      createdByManagerId: manager.id,
      status: "sent",
      subtotalAmount: money(174),
      taxAmount: money(0),
      shippingAmount: money(18),
      totalCost: money(192),
      expectedDeliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }
  });
  await prisma.purchaseOrderItem.createMany({
    data: [
      {
        purchaseOrderId: purchaseOrder.id,
        supplierProductId: supplierCatalog[0]!.id,
        productId: rice.id,
        orderedQuantity: quantity(10),
        receivedQuantity: quantity(0),
        unitCost: money(12.5)
      },
      {
        purchaseOrderId: purchaseOrder.id,
        supplierProductId: supplierCatalog[1]!.id,
        productId: oil.id,
        orderedQuantity: quantity(6),
        receivedQuantity: quantity(0),
        unitCost: money(8.25)
      }
    ]
  });

  const refund = await prisma.refund.create({
    data: {
      businessId: business.id,
      saleId: saleOne.id,
      createdById: manager.id,
      status: RefundStatus.completed,
      refundTotalAmount: money(16.39),
      reasonCode: "customer_returned",
      note: "Package unopened"
    }
  });
  await prisma.refundItem.create({
    data: {
      refundId: refund.id,
      saleItemId: saleOneRice.id,
      quantityRefunded: quantity(1),
      amountRefunded: money(16.39),
      restockAction: "restock_to_sellable"
    }
  });
  const firstPayment = await prisma.payment.findFirstOrThrow({ where: { saleId: saleOne.id } });
  await prisma.refundPayment.create({
    data: {
      refundId: refund.id,
      paymentId: firstPayment.id,
      amountReversed: money(16.39)
    }
  });
  await prisma.payment.update({
    where: { id: firstPayment.id },
    data: { status: "refunded_partial" }
  });
  await prisma.sale.update({
    where: { id: saleOne.id },
    data: { status: SaleStatus.refunded_partially }
  });
  await prisma.inventoryBalance.update({
    where: { productId_locationId: { productId: rice.id, locationId: location.id } },
    data: { onHandQuantity: quantity(47), availableQuantity: quantity(47) }
  });
  await prisma.inventoryMovement.create({
    data: {
      productId: rice.id,
      locationId: location.id,
      movementType: "refund_restock",
      quantityDelta: quantity(1),
      referenceType: "refund",
      referenceId: refund.id,
      reason: "customer_returned",
      createdById: manager.id
    }
  });

  await prisma.business.update({
    where: { id: business.id },
    data: {
      nextReceiptNumber: 3,
      nextOrderNumber: 2,
      nextPurchaseOrderNumber: 2
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        businessId: business.id,
        actorUserId: owner.id,
        action: "login",
        resourceType: "session",
        resourceId: "seed",
        metadata: {}
      },
      {
        businessId: business.id,
        actorUserId: manager.id,
        action: "refund_created",
        resourceType: "refund",
        resourceId: refund.id,
        metadata: {}
      },
      {
        businessId: business.id,
        actorUserId: inventoryStaff.id,
        action: "stock_adjusted",
        resourceType: "inventory_movement",
        resourceId: "seed",
        metadata: {}
      },
      {
        businessId: business.id,
        actorUserId: customer.id,
        action: "customer_order_created",
        resourceType: "order",
        resourceId: onlineOrder.id,
        metadata: {}
      },
      {
        businessId: business.id,
        actorUserId: supplierUser.id,
        action: "supplier_portal_onboarded",
        resourceType: "supplier",
        resourceId: suppliers[0]!.id,
        metadata: {}
      }
    ]
  });

  console.log("Seed completed.");
  console.log("Business: Shashi Mart");
  console.log("Location: Main Location");
  console.log("Owner: owner@demo.local / DemoPass!123");
  console.log("Manager: manager@demo.local / DemoPass!123");
  console.log("Cashier: cashier@demo.local / DemoPass!123");
  console.log("Inventory: inventory@demo.local / DemoPass!123");
  console.log("Customer: customer@demo.local / DemoPass!123");
  console.log("Supplier: supplier@demo.local / DemoPass!123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
