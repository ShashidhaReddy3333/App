import type { Metadata } from "next";

import "@/app/globals.css";
import { MonitoringClient } from "@/components/monitoring-client";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Business Management App",
  description: "Run your shop from one dashboard."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <MonitoringClient />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
