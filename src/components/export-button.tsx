"use client";

import { Download } from "lucide-react";
import { downloadCsv, toCsv } from "@/lib/export-csv";

interface ExportButtonBaseProps {
  filename: string;
  label?: string;
}

interface ExportButtonDataProps extends ExportButtonBaseProps {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  fetchUrl?: never;
}

interface ExportButtonFetchProps extends ExportButtonBaseProps {
  fetchUrl: string;
  headers?: never;
  rows?: never;
}

type ExportButtonProps = ExportButtonDataProps | ExportButtonFetchProps;

export function ExportButton({ filename, headers, rows, fetchUrl, label = "Export CSV" }: ExportButtonProps) {
  const handleExport = async () => {
    if (headers && rows) {
      const csv = toCsv(headers, rows);
      downloadCsv(filename, csv);
    } else if (fetchUrl) {
      const res = await fetch(fetchUrl);
      if (!res.ok) return;
      const csvText = await res.text();
      downloadCsv(filename, csvText);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
