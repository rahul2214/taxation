import { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Only the API is blocked. Private pages (/admin, /dashboard, /auth, /login, /signup,
        // /refer) are kept out of search with noindex (meta tag or X-Robots-Tag header, see
        // next.config.ts); blocking them here would stop crawlers from ever seeing that noindex,
        // and Google can still list a blocked URL that other pages link to.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
