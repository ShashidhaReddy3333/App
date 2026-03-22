"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = {
  id: string;
  name: string;
  slug: string;
};

export function MarketplacePageClient({
  categories,
  initialQuery,
  initialCategory
}: {
  categories: Category[];
  initialQuery: string;
  initialCategory: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query.trim());
      }
      if (initialCategory) {
        params.set("category", initialCategory);
      }

      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl as Route);
    }, 300);

    return () => clearTimeout(timer);
  }, [initialCategory, pathname, query, router]);

  function setCategory(category: string | null) {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    if (category) {
      params.set("category", category);
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl as Route);
  }

  return (
    <div className="space-y-6">
      <div className="relative mx-auto max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 pl-9 text-base"
          placeholder="Search businesses, categories, cities..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant={initialCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant={initialCategory === category.slug ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(category.slug)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
