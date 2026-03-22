import { db } from "@/lib/db";

export async function searchCustomers(query?: string) {
  const q = query?.trim();

  const customers = await db.user.findMany({
    where: {
      role: "customer",
      customerProfile: { isNot: null },
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      customerProfile: true,
    },
    orderBy: { fullName: "asc" },
    take: 10,
  });

  return customers.map((customer) => ({
    id: customer.id,
    fullName: customer.fullName,
    email: customer.email,
    loyaltyPoints: customer.customerProfile?.loyaltyPoints ?? 0,
  }));
}
