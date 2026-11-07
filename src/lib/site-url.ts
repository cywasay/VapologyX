// The shop's public address, for the sitemap and share links. Set NEXT_PUBLIC_SITE_URL to the real domain when there is one.
export function siteUrl() {
  const set = process.env.NEXT_PUBLIC_SITE_URL;
  if (set) return set.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}
