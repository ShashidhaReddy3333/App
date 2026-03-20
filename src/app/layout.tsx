import type { Metadata } from "next";

import "@/app/globals.css";
import { CookieConsent } from "@/components/cookie-consent";
import { CsrfProvider } from "@/components/csrf-provider";
import { MonitoringClient } from "@/components/monitoring-client";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Human Pulse | Commerce Operating System",
  description:
    "Customer ordering, POS, inventory, supplier procurement, and owner analytics in one unified platform.",
  keywords: ["commerce", "POS", "inventory", "retail", "supplier", "management"],
  openGraph: {
    title: "Human Pulse | Commerce Operating System",
    description:
      "Customer ordering, POS, inventory, supplier procurement, and owner analytics in one unified platform.",
    type: "website",
    siteName: "Human Pulse",
  },
  twitter: {
    card: "summary_large_image",
    title: "Human Pulse | Commerce Operating System",
    description:
      "Customer ordering, POS, inventory, supplier procurement, and owner analytics in one unified platform.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00C853" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Human Pulse" />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:shadow-lg focus:rounded-lg focus:top-2 focus:left-2"
        >
          Skip to main content
        </a>
        <CsrfProvider>{children}</CsrfProvider>
        <MonitoringClient />
        <Toaster richColors position="top-right" />
        <CookieConsent />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); }); }`,
          }}
        />
      </body>
    </html>
  );
}
