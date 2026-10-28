import { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/data/blogs";
import { absoluteUrl } from "@/lib/seo";

// Bump when the content of the static pages changes meaningfully; Google ignores lastmod values that change on every request.
const PAGES_UPDATED = new Date("2026-10-28");

const STATIC_PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/services", changeFrequency: "monthly", priority: 0.9 },
  { path: "/book-appointment", changeFrequency: "monthly", priority: 0.9 },
  { path: "/blogs", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/guarantee", changeFrequency: "monthly", priority: 0.6 },
  { path: "/signup", changeFrequency: "yearly", priority: 0.5 },
  { path: "/security", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/disclaimer", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const latestPost = BLOG_POSTS.reduce(
    (latest, post) => (new Date(post.seo.modifiedIso) > latest ? new Date(post.seo.modifiedIso) : latest),
    PAGES_UPDATED
  );

  const staticRoutes: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: page.path === "/blogs" ? latestPost : PAGES_UPDATED,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: absoluteUrl(`/blogs/${post.slug}`),
    lastModified: new Date(post.seo.modifiedIso),
    changeFrequency: "monthly",
    priority: 0.7,
    images: [absoluteUrl(`/blogs/${post.slug}/opengraph-image`)],
  }));

  return [...staticRoutes, ...blogRoutes];
}
