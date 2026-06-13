/** Resolve the public app URL from the incoming request (works on Vercel/proxies). */
export function getSiteUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured && !configured.includes("localhost")) {
    return configured;
  }

  // Vercel injects this on every deployment (e.g. bidflow.vercel.app).
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    const origin = `${proto}://${host.split(",")[0].trim()}`;
    if (!(process.env.VERCEL === "1" && origin.includes("localhost"))) {
      return origin;
    }
  }

  return new URL(request.url).origin;
}
