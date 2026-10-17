import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { BLOG_POSTS, getBlogPostBySlug, getRelatedBlogs } from "@/data/blogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Flame,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Tag,
  HelpCircle,
} from "lucide-react";

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
      title: "Article Not Found | Polaris Tax Services",
      description: "The requested tax guide could not be found.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://polaristaxservices.com";
  const canonicalUrl = `${siteUrl}/blogs/${post.slug}`;

  return {
    title: `${post.seo.metaTitle} | Polaris Tax Services`,
    description: post.seo.metaDescription,
    keywords: post.seo.keywords,
    authors: [{ name: post.author.name }],
    creator: post.author.name,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      url: canonicalUrl,
      siteName: "Polaris Tax Services",
      type: "article",
      publishedTime: post.seo.publishedIso,
      modifiedTime: post.seo.modifiedIso,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: post.imageUrl,
          width: 1200,
          height: 675,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      images: [post.imageUrl],
      creator: "@polaristax",
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://polaristaxservices.com";
  const articleUrl = `${siteUrl}/blogs/${post.slug}`;
  const relatedPosts = getRelatedBlogs(post.slug, 3);

  // Schema.org BlogPosting Structured Data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo.metaDescription,
    image: [post.imageUrl],
    datePublished: post.seo.publishedIso,
    dateModified: post.seo.modifiedIso,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
      image: post.author.avatar,
    },
    publisher: {
      "@type": "Organization",
      name: "Polaris Tax Services",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    keywords: post.seo.keywords.join(", "),
    articleSection: post.category,
    wordCount: 1500,
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
        name: "Tax Insights & Blogs",
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

      <article className="min-h-screen bg-background">
        {/* Breadcrumb & Navigation Bar */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 md:px-6 py-4 max-w-5xl flex items-center justify-between text-sm">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all insights
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-normal">
                {post.category}
              </Badge>
            </div>
          </div>
        </div>

        {/* Hero Article Header */}
        <header className="py-10 md:py-16 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge className="bg-primary text-primary-foreground font-semibold">
                {post.category}
              </Badge>
              {post.trending && (
                <Badge className="bg-amber-500 text-white font-semibold flex items-center gap-1">
                  <Flame className="h-3 w-3 fill-white" />
                  Trending Guide
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-foreground tracking-tight leading-tight mb-6">
              {post.title}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
              {post.excerpt}
            </p>

            {/* Author & Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border/80">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20">
                  <Image
                    src={post.author.avatar}
                    alt={post.author.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {post.author.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {post.author.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <time dateTime={post.seo.publishedIso}>{post.date}</time>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readTime}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {post.views.toLocaleString()} reads
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Feature Image */}
        <div className="container mx-auto px-4 md:px-6 max-w-4xl mb-12">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-xl border border-border">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          </div>
        </div>

        {/* Main Article Body Layout */}
        <div className="container mx-auto px-4 md:px-6 max-w-4xl pb-16">
          {/* Key Takeaways Box */}
          {post.keyTakeaways && post.keyTakeaways.length > 0 && (
            <div className="mb-10 rounded-xl border border-primary/20 bg-primary/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Key Takeaways at a Glance
              </h3>
              <ul className="space-y-3">
                {post.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm md:text-base text-foreground/90">
                    <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Article Introduction */}
          <div className="prose prose-lg dark:prose-invert max-w-none mb-10">
            <p className="text-lg leading-relaxed text-foreground/90 font-normal">
              {post.content.introduction}
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {post.content.sections.map((section, idx) => (
              <section key={idx} className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-headline font-bold text-foreground tracking-tight pt-4 border-t">
                  {section.heading}
                </h2>
                {section.body.map((paragraph, pIdx) => (
                  <p key={pIdx} className="text-base md:text-lg leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}

                {/* Pro-Tip Box */}
                {section.tip && (
                  <aside className="rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-4 md:p-5 mt-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-sm text-amber-900 dark:text-amber-300 block mb-1">
                          Polaris Pro-Tip:
                        </span>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {section.tip}
                        </p>
                      </div>
                    </div>
                  </aside>
                )}
              </section>
            ))}
          </div>

          {/* Frequently Asked Questions */}
          {post.content.faq && post.content.faq.length > 0 && (
            <section className="mt-14 pt-8 border-t" aria-labelledby="faq-section-title">
              <h3 id="faq-section-title" className="text-2xl font-headline font-bold text-foreground mb-6 flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                Frequently Asked Questions
              </h3>
              <Accordion type="single" collapsible className="w-full space-y-3">
                {post.content.faq.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
                    className="border border-border/70 rounded-lg px-4 bg-card"
                  >
                    <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {/* Tags & Keywords */}
          <div className="mt-12 pt-6 border-t flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Related Topics:
            </span>
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blogs?q=${encodeURIComponent(tag)}`}
                className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {/* Author Card Box */}
          <div className="mt-10 rounded-xl border bg-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative h-16 w-16 rounded-full overflow-hidden shrink-0 border-2 border-primary/20">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold text-base text-foreground">
                Written by {post.author.name}
              </h4>
              <p className="text-xs text-primary font-medium mb-2">
                {post.author.role} • Polaris Tax Services
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Specializing in federal compliance, state apportionments, and tax optimization strategies for individuals and businesses across the United States.
              </p>
            </div>
          </div>

          {/* Inline CTA Card */}
          <Card className="mt-10 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Polaris Tax Guarantee</span>
                </div>
                <h4 className="text-xl md:text-2xl font-bold text-foreground">
                  Need Help Applying These Rules to Your Return?
                </h4>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Schedule a 1-on-1 strategy call with our tax experts or let us handle your entire filing with 100% accuracy guaranteed.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/book-appointment">Book Consultation</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login">Get Started</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section className="border-t bg-muted/30 py-16">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-headline font-bold text-foreground">
                    More Tax Guides & Insights
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Continue learning with our latest expert analyses
                  </p>
                </div>
                <Button asChild variant="ghost" className="text-primary hover:text-primary">
                  <Link href="/blogs" className="flex items-center gap-1 text-sm font-semibold">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((rel) => (
                  <Card
                    key={rel.id}
                    className="group flex flex-col overflow-hidden border bg-card hover:shadow-lg transition-all"
                  >
                    <Link href={`/blogs/${rel.slug}`} className="relative h-44 w-full overflow-hidden bg-muted">
                      <Image
                        src={rel.imageUrl}
                        alt={rel.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <Badge className="absolute top-2 left-2 bg-primary/90 text-[10px]">
                        {rel.category}
                      </Badge>
                    </Link>
                    <CardContent className="p-4 flex-grow">
                      <div className="text-[11px] text-muted-foreground mb-1">
                        {rel.readTime} • {rel.date}
                      </div>
                      <Link href={`/blogs/${rel.slug}`}>
                        <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {rel.title}
                        </h4>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </PublicLayout>
  );
}
