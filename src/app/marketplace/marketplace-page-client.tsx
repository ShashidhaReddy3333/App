"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Search, Star, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getSafeMarketplaceImageUrl } from "@/lib/marketplace-image";

interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string | null;
}

interface BusinessProfile {
  id: string;
  slug: string;
  tagline: string | null;
  logoUrl: string | null;
  city: string | null;
  country: string | null;
  averageRating: string;
  reviewCount: number;
  isFeatured: boolean;
  business: { businessName: string; businessType: string };
  category: { name: string; slug: string } | null;
}

interface MarketplaceData {
  profiles: BusinessProfile[];
  total: number;
  totalPages: number;
  categories: Category[];
}

export function MarketplacePageClient() {
  const [data, setData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "16" });
      if (query) params.set("q", query);
      if (activeCategory) params.set("category", activeCategory);

      const res = await fetch(`/api/marketplace?${params.toString()}`);
      const json = await res.json();
      setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, page, query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">Human Pulse Marketplace</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Discover local and online retailers, all in one place.
          </p>
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 pl-9 text-base"
              placeholder="Search businesses, categories, cities..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {data?.categories && data.categories.length > 0 ? (
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveCategory(null);
                setPage(1);
              }}
            >
              All
            </Button>
            {data.categories.map((category) => (
              <Button
                key={category.slug}
                variant={activeCategory === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveCategory(category.slug);
                  setPage(1);
                }}
              >
                {category.name}
              </Button>
            ))}
          </div>
        ) : null}

        {data ? (
          <p className="mb-4 text-sm text-muted-foreground">
            {data.total === 0
              ? "No businesses found"
              : `Showing ${data.profiles.length} of ${data.total} businesses`}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <Skeleton className="mb-3 h-32 w-full rounded" />
                    <Skeleton className="mb-2 h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))
            : data?.profiles.map((profile) => {
                const safeLogoUrl = getSafeMarketplaceImageUrl(profile.logoUrl);

                return (
                  <Link key={profile.id} href={`/marketplace/${profile.slug}`}>
                    <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-md bg-muted">
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

        {data && data.totalPages > 1 ? (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((currentPage) => currentPage - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-2 text-sm text-muted-foreground">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.totalPages}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
