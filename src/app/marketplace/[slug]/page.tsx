import { notFound } from "next/navigation";
import { Star, MapPin, Globe, Phone, Mail, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBusinessProfile, listReviews } from "@/lib/services/marketplace-service";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BusinessProfilePage({ params }: Props) {
  const { slug } = await params;

  let profile;
  try {
    profile = await getBusinessProfile(slug);
  } catch {
    notFound();
  }

  const reviewsData = await listReviews(profile.businessId, 1, 10);

  const { business } = profile;

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/10 relative">
        {profile.bannerUrl && (
          <img
            src={profile.bannerUrl}
            alt="Business banner"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Header card */}
        <div className="-mt-16 relative z-10 mb-6">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 rounded-xl bg-background border-4 border-background shadow-lg overflow-hidden flex items-center justify-center">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={business.businessName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground">
                  {business.businessName.charAt(0)}
                </span>
              )}
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white drop-shadow">{business.businessName}</h1>
                {profile.isFeatured && <Badge className="bg-yellow-400 text-yellow-900">Featured</Badge>}
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
              <CardHeader><CardTitle>About</CardTitle></CardHeader>
              <CardContent>
                {profile.tagline && (
                  <p className="text-base font-medium mb-2">{profile.tagline}</p>
                )}
                {profile.description ? (
                  <p className="text-muted-foreground text-sm whitespace-pre-line">{profile.description}</p>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No description provided.</p>
                )}
              </CardContent>
            </Card>

            {/* Products */}
            {business.products.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Products</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {business.products.map((product) => (
                      <div key={product.id} className="border rounded-lg p-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-20 w-full object-cover rounded mb-2"
                          />
                        )}
                        <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {business.currency} {Number(product.sellingPrice).toFixed(2)}
                        </p>
                      </div>
                    ))}
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
                        {review.body && <p className="text-sm text-muted-foreground mt-1">{review.body}</p>}
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
              <CardHeader><CardTitle className="text-sm">Contact & Info</CardTitle></CardHeader>
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
                    <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
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
                    <a href={`mailto:${profile.email}`} className="text-primary hover:underline truncate">
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
