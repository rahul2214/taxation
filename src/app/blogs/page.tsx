import type { Metadata } from "next";
import { buildMetadata, breadcrumbSchema, absoluteUrl, SITE } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { BlogsClient } from "./BlogsClient";
import { BLOG_POSTS } from "@/data/blogs";

export const metadata: Metadata = buildMetadata({
  title: "Tax Guides & Articles for 2026",
  description: "Plain-English guides from licensed CPAs: 2026 tax brackets, LLC vs S-Corp, small business deductions, crypto taxes, backdoor Roth IRAs and more.",
  path: "/blogs",
  keywords: ["tax blog", "2026 tax brackets", "small business tax deductions", "LLC vs S-Corp", "crypto tax guide", "backdoor Roth IRA"],
});

export default function BlogsPage() {
  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tax articles and guides from Polaris Tax Services",
    description: "Plain-English tax guides written by licensed CPAs.",
    url: absoluteUrl("/blogs"),
    isPartOf: { "@id": `${SITE.url}/#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: BLOG_POSTS.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: post.title,
        url: absoluteUrl(`/blogs/${post.slug}`),
      })),
    },
  };

  return (
    <PublicLayout>
      <JsonLd data={[collection, breadcrumbSchema([{ name: "Articles", path: "/blogs" }])]} />
      <BlogsClient />
    </PublicLayout>
  );
}
