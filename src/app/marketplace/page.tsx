import type { Metadata } from "next";

import { MarketplacePageClient } from "./marketplace-page-client";

export const metadata: Metadata = {
  title: "Marketplace | Human Pulse",
  description: "Discover local and online retailers through the Human Pulse marketplace."
};

export default function MarketplacePage() {
  return <MarketplacePageClient />;
}
