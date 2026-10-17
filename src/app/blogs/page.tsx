import { Metadata } from "next";
import { Suspense } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { BlogsClient } from "./BlogsClient";
import { BLOG_POSTS } from "@/data/blogs";

export const metadata: Metadata = {
  title: "Tax Insights, Guides & IRS Updates (2026) | Polaris Tax Services",
  description: "Comprehensive tax guides, 2026 IRS tax bracket changes, LLC vs S-Corp strategies, small business deductions, crypto taxation, and expert CPA advice.",
  keywords: [
    "tax blogs",
    "IRS tax updates 2026",
    "small business tax deductions",
    "LLC vs S-Corp guide",
    "crypto tax laws",
    "backdoor Roth IRA tutorial",
    "remote work state taxes",
    "EV tax credit rules",
    "CPA tax insights",
  ],
  alternates: {
    canonical: "/blogs",
  },
  openGraph: {
    title: "Tax Insights, Guides & IRS Updates (2026) | Polaris Tax Services",
    description: "Stay ahead of IRS policy shifts, maximize your deductions, and optimize your business tax strategy with expert-backed guides from Polaris CPAs.",
    url: "/blogs",
    type: "website",
    siteName: "Polaris Tax Services",
    images: [
      {
        url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200&h=630",
        width: 1200,
        height: 630,
        alt: "Polaris Tax Services - Blog and Tax Insights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tax Insights, Guides & IRS Updates (2026) | Polaris Tax Services",
    description: "Stay ahead of IRS policy shifts and tax deductions with expert guides from licensed CPAs.",
    images: ["https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200&h=630"],
  },
};

export default function BlogsPage() {
  // Schema.org CollectionPage & ItemList Structured Data for Google Rich Results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Polaris Tax Insights & Guides Hub",
    description: "Authoritative tax planning guides, 2026 IRS changes, and money-saving strategies curated by Polaris licensed CPAs.",
    url: "https://polaristaxservices.com/blogs",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: BLOG_POSTS.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: post.title,
        url: `https://polaristaxservices.com/blogs/${post.slug}`,
        description: post.excerpt,
        image: post.imageUrl,
      })),
    },
  };

  return (
    <PublicLayout>
      {/* Inject Google Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-24 text-center">
            <p className="text-muted-foreground">Loading tax intelligence hub...</p>
          </div>
        }
      >
        <BlogsClient />
      </Suspense>
    </PublicLayout>
  );
}
