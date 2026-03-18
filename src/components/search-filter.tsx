"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";

type SearchFilterProps = {
  placeholder?: string;
  paramName?: string;
};

export function SearchFilter({ placeholder = "Search...", paramName = "q" }: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get(paramName) ?? "");

  const handleSearch = useCallback(
    (term: string) => {
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
    },
    [router, searchParams, paramName]
  );

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
