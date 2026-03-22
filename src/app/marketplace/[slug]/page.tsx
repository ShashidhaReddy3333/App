import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, MapPin, Globe, Phone, Mail, Tag } from "lucide-react";
import { MarketplaceReviewForm } from "@/components/marketplace-review-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getSafeMarketplaceImageUrl } from "@/lib/marketplace-image";
import { getCanonicalPath } from "@/lib/public-metadata";
import { getBusinessProfile, listReviews } from "@/lib/services/marketplace-service";

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

interface Props {
  params: Promise<{ slug: string }>;
}

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
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/10 relative">
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

      <div className="max-w-5xl mx-auto px-4">
        {/* Header card */}
        <div className="-mt-16 relative z-10 mb-6">
          <div className="flex items-end gap-4">
            <div className="relative h-24 w-24 rounded-xl bg-background border-4 border-background shadow-lg overflow-hidden flex items-center justify-center">
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
                  <Tag className="h-3 w-3 mr-1" />
                  {profile.category.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.tagline && <p className="text-base font-medium mb-2">{profile.tagline}</p>}
                {profile.description ? (
                  <p className="text-muted-foreground text-sm whitespace-pre-line">
                    {profile.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No description provided.</p>
                )}
              </CardContent>
            </Card>

            {/* Products */}
            {business.products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {business.products.map((product) => {
                      const safeProductImageUrl = getSafeMarketplaceImageUrl(product.imageUrl);

                      return (
                        <div key={product.id} className="border rounded-lg p-3">
                          {safeProductImageUrl && (
                            <div className="relative mb-2 h-20 w-full overflow-hidden rounded">
                              <Image
                                src={safeProductImageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, 33vw"
                              />
                            </div>
                          )}
                          <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {business.currency} {Number(product.sellingPrice).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Reviews
                  {profile.reviewCount > 0 && (
                    <span className="flex items-center gap-1 text-base font-normal">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {Number(profile.averageRating).toFixed(1)}
                      <span className="text-muted-foreground">({profile.reviewCount})</span>
                    </span>
                  )}
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
                      <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{review.reviewer.fullName}</span>
                          <div className="flex">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                            {Array.from({ length: 5 - review.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-muted-foreground" />
                            ))}
                          </div>
                        </div>
                        {review.title && <p className="text-sm font-medium">{review.title}</p>}
                        {review.body && (
                          <p className="text-sm text-muted-foreground mt-1">{review.body}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contact & Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {profile.websiteUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {profile.websiteUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={`mailto:${profile.email}`}
                      className="text-primary hover:underline truncate"
                    >
                      {profile.email}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
