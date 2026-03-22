import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Tag } from "lucide-react";

import { MarketplacePageClient } from "./marketplace-page-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/pagination";
import { getSafeMarketplaceImageUrl } from "@/lib/marketplace-image";
import { getCanonicalPath } from "@/lib/public-metadata";
import { listBusinessCategories, listBusinesses } from "@/lib/services/marketplace-service";

export const metadata: Metadata = {
  title: "Marketplace | Human Pulse",
  description: "Discover local and online retailers through the Human Pulse marketplace.",
  alternates: {
    canonical: getCanonicalPath("/marketplace"),
  },
};

export const revalidate = 300;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const [categories, data] = await Promise.all([
    listBusinessCategories(),
    listBusinesses({
      query: query || undefined,
      categorySlug: category || undefined,
      page,
      limit: 16,
    }),
  ]);

  const paginationParams = new URLSearchParams();
  if (query) {
    paginationParams.set("q", query);
  }
  if (category) {
    paginationParams.set("category", category);
  }
  const paginationBasePath = paginationParams.toString()
    ? `/marketplace?${paginationParams.toString()}`
    : "/marketplace";

  return (
    <div className="min-h-screen bg-background">
      <section className="page-shell py-10">
        <div className="surface-shell rounded-[32px] px-6 py-10 text-center sm:px-10">
          <div className="section-label">Discover active businesses</div>
          <h1 className="mb-4 mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Human Pulse Marketplace
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Discover local and online retailers, all in one place.
          </p>
          <MarketplacePageClient
            categories={categories.map((item) => ({
              id: item.id,
              name: item.name,
              slug: item.slug,
            }))}
            initialQuery={query}
            initialCategory={category || null}
          />
        </div>
      </section>

      <div className="page-shell py-2">
        <p className="mb-4 text-sm text-muted-foreground">
          {data.total === 0
            ? "No businesses match the current filters."
            : `Showing ${data.profiles.length} of ${data.total} businesses`}
        </p>

        {data.total === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">No marketplace listings are available yet</h2>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Try a different search or category, or create your business profile to be among
                  the first retailers customers can discover on Human Pulse.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Clear filters
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Create business
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.profiles.map((profile) => {
              const safeLogoUrl = getSafeMarketplaceImageUrl(profile.logoUrl);

              return (
                <Link key={profile.id} href={`/marketplace/${profile.slug}`}>
                  <Card className="h-full cursor-pointer">
                    <CardContent className="p-4">
                      <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,hsl(var(--surface-high)),hsl(var(--surface-low)))]">
                        {safeLogoUrl ? (
                          <div className="relative h-full w-full">
                            <Image
                              src={safeLogoUrl}
                              alt={profile.business.businessName}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                            />
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-muted-foreground">
                            {profile.business.businessName.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold leading-tight">
                          {profile.business.businessName}
                        </h3>
                        {profile.isFeatured ? (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            Featured
                          </Badge>
                        ) : null}
                      </div>

                      {profile.tagline ? (
                        <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                          {profile.tagline}
                        </p>
                      ) : null}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {profile.reviewCount > 0 ? (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {Number(profile.averageRating).toFixed(1)}
                            <span>({profile.reviewCount})</span>
                          </span>
                        ) : null}
                        {profile.city ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {profile.city}
                          </span>
                        ) : null}
                        {profile.category ? (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {profile.category.name}
                          </span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <Pagination
            basePath={paginationBasePath}
            currentPage={data.page}
            totalPages={Math.max(1, data.totalPages)}
            totalItems={data.total}
          />
        </div>
      </div>
    </div>
  );
}
