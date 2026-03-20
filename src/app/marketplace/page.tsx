"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Star, MapPin, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function MarketplacePage() {
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
  }, [query, activeCategory, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Human Pulse Marketplace</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Discover local and online retailers, all in one place.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-12 text-base"
              placeholder="Search businesses, categories, cities…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category filters */}
        {data?.categories && data.categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveCategory(null); setPage(1); }}
            >
              All
            </Button>
            {data.categories.map((cat) => (
              <Button
                key={cat.slug}
                variant={activeCategory === cat.slug ? "default" : "outline"}
                size="sm"
                onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {/* Results count */}
        {data && (
          <p className="text-sm text-muted-foreground mb-4">
            {data.total === 0
              ? "No businesses found"
              : `Showing ${data.profiles.length} of ${data.total} businesses`}
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full rounded mb-3" />
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))
            : data?.profiles.map((profile) => (
                <Link key={profile.id} href={`/marketplace/${profile.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4">
                      {/* Logo / Banner placeholder */}
                      <div className="h-28 bg-muted rounded-md flex items-center justify-center mb-3 overflow-hidden">
                        {profile.logoUrl ? (
                          <img
                            src={profile.logoUrl}
                            alt={profile.business.businessName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-muted-foreground">
                            {profile.business.businessName.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm leading-tight">
                          {profile.business.businessName}
                        </h3>
                        {profile.isFeatured && (
                          <Badge variant="secondary" className="text-xs shrink-0">Featured</Badge>
                        )}
                      </div>

                      {profile.tagline && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {profile.tagline}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {profile.reviewCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {Number(profile.averageRating).toFixed(1)}
                            <span>({profile.reviewCount})</span>
                          </span>
                        )}
                        {profile.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {profile.city}
                          </span>
                        )}
                        {profile.category && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {profile.category.name}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center text-sm text-muted-foreground px-2">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
