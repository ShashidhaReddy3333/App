import { z } from "zod";
import { db } from "@/lib/db";
import { notFoundError, validationError } from "@/lib/errors";

// ── Input schemas ──────────────────────────────────────────────────────────

export const listBusinessesSchema = z.object({
  query: z.string().optional(),
  categorySlug: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListBusinessesInput = z.infer<typeof listBusinessesSchema>;

export const updateBusinessProfileSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens")
    .optional(),
  tagline: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(60).optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>;

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
  orderId: z.string().optional(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

// ── Service functions ──────────────────────────────────────────────────────

export async function listBusinesses(input: ListBusinessesInput) {
  const { query, categorySlug, featured, page, limit } = listBusinessesSchema.parse(input);
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    business: { isMarketplaceVisible: true, isActive: true },
  };

  if (query) {
    where.OR = [
      { business: { businessName: { contains: query, mode: "insensitive" } } },
      { tagline: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { city: { contains: query, mode: "insensitive" } },
    ];
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (featured === true) {
    where.isFeatured = true;
  }

  const [profiles, total] = await Promise.all([
    db.businessProfile.findMany({
      where,
      include: {
        business: { select: { businessName: true, businessType: true, currency: true } },
        category: { select: { name: true, slug: true, iconName: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { averageRating: "desc" }, { reviewCount: "desc" }],
      skip,
      take: limit,
    }),
    db.businessProfile.count({ where }),
  ]);

  return {
    profiles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getBusinessProfile(slug: string) {
  const profile = await db.businessProfile.findUnique({
    where: { slug },
    include: {
      business: {
        select: {
          id: true,
          businessName: true,
          businessType: true,
          currency: true,
          isMarketplaceVisible: true,
          isActive: true,
          products: {
            where: { isArchived: false },
            select: {
              id: true,
              name: true,
              category: true,
              sellingPrice: true,
              imageUrl: true,
              description: true,
            },
            take: 20,
          },
        },
      },
      category: true,
    },
  });

  if (!profile || !profile.business.isMarketplaceVisible || !profile.business.isActive) {
    throw notFoundError("Business not found on marketplace.");
  }

  return profile;
}

export async function updateBusinessProfile(businessId: string, input: UpdateBusinessProfileInput) {
  const data = updateBusinessProfileSchema.parse(input);

  // Check slug uniqueness if changing
  if (data.slug) {
    const conflict = await db.businessProfile.findFirst({
      where: { slug: data.slug, businessId: { not: businessId } },
    });
    if (conflict) {
      throw validationError("This slug is already taken.");
    }
  }

  const existing = await db.businessProfile.findUnique({ where: { businessId } });

  if (!existing) {
    const slug = data.slug ?? businessId.toLowerCase().slice(0, 20);
    return db.businessProfile.create({
      data: {
        id: crypto.randomUUID(),
        businessId,
        slug,
        ...data,
      },
    });
  }

  return db.businessProfile.update({
    where: { businessId },
    data,
  });
}

export async function listBusinessCategories() {
  return db.businessCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 100,
  });
}

export async function getFeaturedBusinesses(limit = 6) {
  return db.businessProfile.findMany({
    where: {
      isFeatured: true,
      business: { isMarketplaceVisible: true, isActive: true },
    },
    include: {
      business: { select: { businessName: true, businessType: true } },
      category: { select: { name: true, slug: true } },
    },
    orderBy: { averageRating: "desc" },
    take: limit,
  });
}

export async function submitReview(userId: string, businessId: string, input: SubmitReviewInput) {
  const data = submitReviewSchema.parse(input);

  // One review per user per business
  const existing = await db.marketplaceReview.findFirst({
    where: { businessId, reviewerId: userId },
  });

  if (existing) {
    throw validationError("You have already reviewed this business.");
  }

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business || !business.isMarketplaceVisible) {
    throw notFoundError("Business not found.");
  }

  const review = await db.marketplaceReview.create({
    data: {
      id: crypto.randomUUID(),
      businessId,
      reviewerId: userId,
      orderId: data.orderId ?? null,
      rating: data.rating,
      title: data.title ?? null,
      body: data.body ?? null,
    },
  });

  // Recalculate average rating
  const stats = await db.marketplaceReview.aggregate({
    where: { businessId, isHidden: false },
    _avg: { rating: true },
    _count: { id: true },
  });

  await db.businessProfile.updateMany({
    where: { businessId },
    data: {
      averageRating: stats._avg.rating ?? 0,
      reviewCount: stats._count.id,
    },
  });

  return review;
}

export async function listReviews(businessId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    db.marketplaceReview.findMany({
      where: { businessId, isHidden: false },
      include: {
        reviewer: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.marketplaceReview.count({ where: { businessId, isHidden: false } }),
  ]);

  return { reviews, total, page, limit };
}
