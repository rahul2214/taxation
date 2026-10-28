import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { buildMetadata, SITE } from "@/lib/seo";
import { BLOG_POSTS, getBlogPostBySlug, getRelatedBlogs } from "@/data/blogs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Article not found",
      description: "The requested tax guide could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const base = buildMetadata({
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    path: `/blogs/${post.slug}`,
    keywords: [...post.seo.keywords, ...post.tags],
    ogType: "article",
    // Keep the full title under ~60 characters so Google doesn't truncate it.
    absoluteTitle: post.seo.metaTitle.length > 37,
    images: [{ url: `/blogs/${post.slug}/opengraph-image`, width: 1200, height: 630, alt: post.title }],
  });

  return {
    ...base,
    authors: [{ name: post.author.name, url: SITE.url }],
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.seo.publishedIso,
      modifiedTime: post.seo.modifiedIso,
      authors: [post.author.name],
      section: post.category,
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const siteUrl = SITE.url;
  const articleUrl = `${siteUrl}/blogs/${post.slug}`;
  const relatedPosts = getRelatedBlogs(post.slug, 3);

  // Schema.org BlogPosting Structured Data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo.metaDescription,
    image: [`${articleUrl}/opengraph-image`],
    inLanguage: "en-US",
    datePublished: post.seo.publishedIso,
    dateModified: post.seo.modifiedIso,
    author: {
      "@type": "Organization",
      name: post.author.name,
      url: `${siteUrl}/about`,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: SITE.name,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon-512.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    keywords: post.seo.keywords.join(", "),
    articleSection: post.category,
    wordCount: [
      post.content.introduction,
      ...post.content.sections.flatMap((section) => [section.heading, ...section.body, section.tip ?? ""]),
    ]
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length,
  };

  // Schema.org BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Articles",
        item: `${siteUrl}/blogs`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: articleUrl,
      },
    ],
  };

  // Schema.org FAQPage if FAQs exist
  const faqSchema =
    post.content.faq && post.content.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.content.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <PublicLayout>
      {/* Schema.org JSON-LD Structured Data Injections for Google Search Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <article>
        <header className="border-b border-paper-line">
          <div className="site-container pb-12 pt-10 md:pb-16 md:pt-14">
            <Link href="/blogs" className="inline-flex items-center gap-1.5 text-[14px] text-ink-muted hover:text-ink">
              <ArrowLeft className="h-4 w-4" />
              All articles
            </Link>

            <div className="mt-10 max-w-3xl">
              <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-brass-dark">{post.category}</p>
              <h1 className="mt-5 font-display text-[38px] font-normal leading-[1.1] text-ink sm:text-[50px] lg:text-[56px]">
                {post.title}
              </h1>
              <p className="mt-6 text-[19px] leading-relaxed text-ink-soft">{post.excerpt}</p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-paper-line pt-5 text-[14px] text-ink-muted">
                <span>
                  By <span className="font-semibold text-ink">{post.author.name}</span>, {post.author.role}
                </span>
                <time dateTime={post.seo.publishedIso}>{post.date}</time>
                <span>{post.readTime}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="site-container grid gap-12 py-12 lg:grid-cols-12 lg:py-16">
          <div className="lg:col-span-8">
            {post.keyTakeaways && post.keyTakeaways.length > 0 && (
              <aside className="mb-12 border-l-2 border-brass bg-white px-6 py-6 sm:px-8">
                <h2 className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-brass-dark">The short version</h2>
                <ul className="mt-4 space-y-3">
                  {post.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex gap-3 text-[16px] leading-relaxed text-ink">
                      <span className="mt-[11px] h-px w-3 shrink-0 bg-brass" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            <p className="font-display text-[22px] leading-[1.55] text-ink">{post.content.introduction}</p>

            <div className="mt-12 space-y-12">
              {post.content.sections.map((section, idx) => (
                <section key={idx}>
                  <h2 className="font-display text-[30px] leading-tight text-ink">{section.heading}</h2>
                  <div className="mt-5 space-y-5">
                    {section.body.map((paragraph, pIdx) => (
                      <p key={pIdx} className="text-[17px] leading-[1.75] text-ink-soft">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {section.tip && (
                    <aside className="mt-6 rounded-[3px] bg-paper-deep px-6 py-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-brass-dark">From our CPAs</p>
                      <p className="mt-2 text-[15.5px] leading-relaxed text-ink">{section.tip}</p>
                    </aside>
                  )}
                </section>
              ))}
            </div>

            {post.content.faq && post.content.faq.length > 0 && (
              <section className="mt-16" aria-labelledby="faq-section-title">
                <h2 id="faq-section-title" className="font-display text-[30px] leading-tight text-ink">
                  Common questions
                </h2>
                <Accordion type="single" collapsible className="mt-6 border-t border-ink">
                  {post.content.faq.map((item, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`} className="border-b border-paper-line">
                      <AccordionTrigger className="py-5 text-left text-[17px] font-semibold text-ink hover:no-underline [&>svg]:text-ink-muted">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 text-[15.5px] leading-relaxed text-ink-soft">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            <div className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-paper-line pt-6 text-[14px]">
              <span className="text-ink-muted">Filed under</span>
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blogs?q=${encodeURIComponent(tag)}`}
                  className="text-ink-soft underline decoration-paper-line underline-offset-4 hover:text-ink hover:decoration-ink"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="space-y-8 lg:sticky lg:top-32">
              <div className="border-t border-ink pt-5">
                <p className="text-[14px] text-ink-muted">Written by</p>
                <p className="mt-1 font-semibold text-ink">{post.author.name}</p>
                <p className="text-[14px] text-ink-muted">{post.author.role}, Polaris Tax Services</p>
              </div>
              <div className="rounded-[4px] bg-ink p-6 text-paper">
                <p className="font-display text-[24px] leading-snug">Want this applied to your return?</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-paper/70">
                  Book a free 15-minute call and a CPA will tell you what it means for you.
                </p>
                <Link href="/book-appointment" className="btn-brass mt-5 w-full">
                  Book a consultation
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {relatedPosts.length > 0 && (
          <section className="border-t border-paper-line bg-paper-deep/60">
            <div className="site-container py-16">
              <div className="flex items-end justify-between gap-6">
                <h2 className="font-display text-[30px] text-ink">Keep reading</h2>
                <Link href="/blogs" className="link-under text-[15px]">
                  All articles
                </Link>
              </div>
              <div className="mt-8 grid border-t border-ink md:grid-cols-3">
                {relatedPosts.map((rel, i) => (
                  <Link
                    key={rel.id}
                    href={`/blogs/${rel.slug}`}
                    className={`group border-b border-paper-line py-8 md:border-b-0 md:px-8 ${i === 0 ? "md:pl-0" : "md:border-l"}`}
                  >
                    <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-muted">
                      {rel.category} · {rel.readTime}
                    </p>
                    <h3 className="mt-3 font-display text-[22px] leading-snug text-ink transition-colors group-hover:text-brass-dark">
                      {rel.title}
                    </h3>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                      Read <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </PublicLayout>
  );
}
