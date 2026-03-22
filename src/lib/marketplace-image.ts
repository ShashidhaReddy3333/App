const STRIPE_HOST_SUFFIX = ".stripe.com";
const ALLOWED_MARKETPLACE_IMAGE_HOSTS = new Set(["public.blob.vercel-storage.com", "stripe.com"]);

function isAllowedMarketplaceImageHost(hostname: string) {
  return ALLOWED_MARKETPLACE_IMAGE_HOSTS.has(hostname) || hostname.endsWith(STRIPE_HOST_SUFFIX);
}

export function getSafeMarketplaceImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);
    return url.protocol === "https:" && isAllowedMarketplaceImageHost(url.hostname)
      ? imageUrl
      : null;
  } catch {
    return null;
  }
}
