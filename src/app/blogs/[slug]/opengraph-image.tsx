import { renderOgCard, OG_SIZE } from "@/components/seo/ogCard";
import { BLOG_POSTS, getBlogPostBySlug } from "@/data/blogs";

export const alt = "Polaris Tax Services article";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export default async function ArticleOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  return renderOgCard({
    eyebrow: post ? `${post.category} · ${post.readTime}` : "Articles",
    title: post?.title ?? "Tax articles from Polaris CPAs",
    footer: "polaristaxservices.com/blogs",
  });
}
