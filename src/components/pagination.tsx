import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
};

export function Pagination({ basePath, currentPage, totalPages, totalItems }: PaginationProps) {
  if (totalPages <= 1) return null;

  const separator = basePath.includes("?") ? "&" : "?";

  return (
    <div className="surface-shell flex flex-col gap-3 rounded-[22px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} ({totalItems} total)
      </p>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`${basePath}${separator}page=${currentPage - 1}` as Route}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
        )}
        {currentPage < totalPages ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`${basePath}${separator}page=${currentPage + 1}` as Route}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
