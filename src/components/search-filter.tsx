"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition, type ReactNode } from "react";

import { Input } from "@/components/ui/input";

type SearchQueryProps = {
  placeholder?: string;
  paramName?: string;
};

type SearchDataProps<T> = {
  data: T[];
  searchKey: keyof T;
  placeholder: string;
  children: (filteredData: T[]) => ReactNode;
};

export function SearchFilter<T>(props: SearchQueryProps | SearchDataProps<T>) {
  if ("data" in props) {
    const { children, data, placeholder, searchKey } = props;
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
      if (!query.trim()) {
        return data;
      }

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
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full max-w-sm rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/20"
            aria-label={placeholder}
          />
        </div>
        {children(filtered)}
      </div>
    );
  }

  const { placeholder = "Search...", paramName = "q" } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get(paramName) ?? "");

  function handleSearch(term: string) {
    setValue(term);
    const params = new URLSearchParams(searchParams.toString());

    if (term) {
      params.set(paramName, term);
      params.delete("page");
    } else {
      params.delete(paramName);
    }

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `?${query}` : "?");
    });
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => handleSearch(event.target.value)}
        className={`pl-9 ${isPending ? "opacity-70" : ""}`}
        aria-label={placeholder}
      />
    </div>
  );
}
