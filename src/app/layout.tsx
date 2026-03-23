import type { Metadata } from "next";

import "@/app/globals.css";
import { CookieConsent } from "@/components/cookie-consent";
import { CsrfProvider } from "@/components/csrf-provider";
import { MonitoringClient } from "@/components/monitoring-client";
import { Toaster } from "@/components/ui/sonner";
import { getCanonicalPath, getMetadataBase } from "@/lib/public-metadata";
import { getCurrentPortal } from "@/lib/portal";

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: await getMetadataBase(),
    title: "Human Pulse | Connected Commerce Ecosystem",
    description:
      "Human Pulse connects customer ordering, retail operations, and supplier fulfillment through dedicated portals.",
    keywords: ["commerce", "retail", "supplier", "customer portal", "operations"],
    alternates: {
      canonical: getCanonicalPath("/"),
    },
    openGraph: {
      title: "Human Pulse | Connected Commerce Ecosystem",
      description:
        "Customer ordering, retail operations, and supplier fulfillment connected through one Human Pulse ecosystem.",
      type: "website",
      siteName: "Human Pulse",
    },
    twitter: {
      card: "summary_large_image",
      title: "Human Pulse | Connected Commerce Ecosystem",
      description:
        "Customer ordering, retail operations, and supplier fulfillment connected through one Human Pulse ecosystem.",
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const portal = await getCurrentPortal();

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b6058" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Human Pulse" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body data-portal={portal}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:shadow-lg focus:top-2 focus:left-2"
        >
          Skip to main content
        </a>
        <CsrfProvider>{children}</CsrfProvider>
        <MonitoringClient />
        <Toaster richColors position="top-right" />
        <CookieConsent />
      </body>
    </html>
  );
}
