"use client";

import { Search } from "lucide-react";
import { useState, useMemo, type ReactNode } from "react";

export function SearchFilter<T>({
  data,
  searchKey,
  placeholder,
  children
}: {
  data: T[];
  searchKey: keyof T;
  placeholder: string;
  children: (filteredData: T[]) => ReactNode;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const lower = query.toLowerCase();
    return data.filter((item) => {
      const value = item[searchKey];
      return typeof value === "string" && value.toLowerCase().includes(lower);
    });
  }, [data, query, searchKey]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {children(filtered)}
    </div>
  );
}
