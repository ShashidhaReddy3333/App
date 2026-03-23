import type { Metadata } from "next";
import Image from "next/image";
import { Globe, Mail, MapPin, Phone, Star, Tag } from "lucide-react";
import { notFound } from "next/navigation";

import { MarketplaceReviewForm } from "@/components/marketplace-review-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getSafeMarketplaceImageUrl } from "@/lib/marketplace-image";
import { getCanonicalPath } from "@/lib/public-metadata";
import { getBusinessProfile, listReviews } from "@/lib/services/marketplace-service";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: "Marketplace Business | Human Pulse",
    description: "Browse business details, products, and reviews in the Human Pulse marketplace.",
    alternates: {
      canonical: getCanonicalPath(`/marketplace/${slug}`),
    },
  };
}

export const dynamic = "force-dynamic";

export default async function BusinessProfilePage({ params }: Props) {
  const { slug } = await params;
  const session = await getCurrentSession();

  let profile;
  try {
    profile = await getBusinessProfile(slug);
  } catch {
    notFound();
  }

  const reviewsData = await listReviews(profile.businessId, 1, 10);

  const { business } = profile;
  const safeBannerUrl = getSafeMarketplaceImageUrl(profile.bannerUrl);
  const safeLogoUrl = getSafeMarketplaceImageUrl(profile.logoUrl);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-56 bg-gradient-to-r from-primary/20 to-primary/10">
        {safeBannerUrl && (
          <Image
            src={safeBannerUrl}
            alt="Business banner"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="page-shell max-w-6xl">
        <div className="-mt-16 relative z-10 mb-6">
          <div className="flex items-end gap-4">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[24px] border-4 border-[hsl(var(--surface-lowest))] bg-background shadow-float">
              {safeLogoUrl ? (
                <Image
                  src={safeLogoUrl}
                  alt={business.businessName}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground">
                  {business.businessName.charAt(0)}
                </span>
              )}
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white drop-shadow">
                  {business.businessName}
                </h1>
                {profile.isFeatured && (
                  <Badge className="bg-yellow-400 text-yellow-900">Featured</Badge>
                )}
              </div>
              {profile.category && (
                <Badge variant="secondary" className="mt-1">
                  <Tag className="mr-1 h-3 w-3" />
                  {profile.category.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.tagline ? (
                  <p className="mb-2 text-base font-medium">{profile.tagline}</p>
                ) : null}
                {profile.description ? (
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {profile.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">No description provided.</p>
                )}
              </CardContent>
            </Card>

            {business.products.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {business.products.map((product) => {
                      const safeProductImageUrl = getSafeMarketplaceImageUrl(product.imageUrl);

                      return (
                        <div key={product.id} className="data-row rounded-[18px] p-3">
                          {safeProductImageUrl ? (
                            <div className="relative mb-2 h-20 w-full overflow-hidden rounded">
                              <Image
                                src={safeProductImageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, 33vw"
                              />
                            </div>
                          ) : null}
                          <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {business.currency} {Number(product.sellingPrice).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Reviews
                  {profile.reviewCount > 0 ? (
                    <span className="flex items-center gap-1 text-base font-normal">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {Number(profile.averageRating).toFixed(1)}
                      <span className="text-muted-foreground">({profile.reviewCount})</span>
                    </span>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {session ? (
                  <div className="mb-6 border-b pb-6">
                    <MarketplaceReviewForm slug={slug} />
                  </div>
                ) : null}
                {reviewsData.reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviewsData.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b border-border/30 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium">{review.reviewer.fullName}</span>
                          <div className="flex">
                            {Array.from({ length: review.rating }).map((_, index) => (
                              <Star
                                key={`filled-${review.id}-${index}`}
                                className="h-3 w-3 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                            {Array.from({ length: 5 - review.rating }).map((_, index) => (
                              <Star
                                key={`empty-${review.id}-${index}`}
                                className="h-3 w-3 text-muted-foreground"
                              />
                            ))}
                          </div>
                        </div>
                        {review.title ? (
                          <p className="text-sm font-medium">{review.title}</p>
                        ) : null}
                        {review.body ? (
                          <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contact &amp; Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.city ? (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  </div>
                ) : null}
                {profile.websiteUrl ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-primary hover:underline"
                    >
                      {profile.websiteUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                ) : null}
                {profile.phone ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                ) : null}
                {profile.email ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a
                      href={`mailto:${profile.email}`}
                      className="truncate text-primary hover:underline"
                    >
                      {profile.email}
                    </a>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
