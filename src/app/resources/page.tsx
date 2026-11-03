import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { buildMetadata, breadcrumbSchema, absoluteUrl, SITE } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageIntro } from "@/components/public/PageIntro";
import { PageFaq } from "@/components/public/PageFaq";
import { ClosingCta } from "@/components/public/ClosingCta";
import { TaxCompass } from "@/components/home/TaxCompass";
import { TaxTools } from "@/components/resources/TaxTools";
import { PAGE_FAQS } from "@/data/faqs";
import { BLOG_POSTS } from "@/data/blogs";
import { KEY_DATES, RESOURCE_TOPICS, TAX_YEAR } from "@/data/resources";

export const metadata: Metadata = buildMetadata({
  title: `Tax Tools & Resources for ${TAX_YEAR}`,
  description: `Free ${TAX_YEAR} tax refund estimator and self-employment tax calculator, key IRS filing dates, and plain-English guides from licensed CPAs.`,
  path: "/resources",
  keywords: ["tax refund estimator", "self-employment tax calculator", "tax filing deadlines 2027", "tax guides", "tax help", "IRS due dates"],
});

const SECTIONS = [
  { id: "calculators", label: "Tax calculators" },
  { id: "tax-tools", label: "Find where to start" },
  { id: "key-dates", label: "Key filing dates" },
  { id: "guides", label: "Guides by topic" },
  { id: "articles", label: "Latest articles" },
];

const postBySlug = (slug: string) => BLOG_POSTS.find((post) => post.slug === slug);

const latestPosts = [...BLOG_POSTS].sort((a, b) => Date.parse(b.seo.modifiedIso) - Date.parse(a.seo.modifiedIso)).slice(0, 3);

function SectionHeading({ number, eyebrow, title, lede }: { number: string; eyebrow: string; title: string; lede?: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-6">
        <p className="eyebrow">
          {number} · {eyebrow}
        </p>
        <h2 className="mt-4 font-display text-[32px] leading-[1.1] text-ink sm:text-[40px]">{title}</h2>
      </div>
      {lede && <p className="text-[15.5px] leading-relaxed text-ink-soft lg:col-span-6">{lede}</p>}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <PublicLayout>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: "Tools & Resources", path: "/resources" }]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Tax tools and resources",
            description: "Tax calculators, filing dates and guides from Polaris Tax Services.",
            url: absoluteUrl("/resources"),
            isPartOf: { "@id": `${SITE.url}/#website` },
          },
        ]}
      />

      <PageIntro
        eyebrow="Tools & resources"
        title="Estimates, deadlines and straight answers."
        lede="Estimate your refund, check what you owe on freelance income, see the dates that matter this filing season, and read plain-English guides written by our CPAs."
        aside={
          <nav aria-label="On this page" className="border-t border-ink pt-4">
            <ul className="space-y-2 text-[14.5px]">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-3 text-ink-soft hover:text-ink">
                    <span className="font-mono text-[12px] text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        }
      />

      {/* Calculators */}
      <section id="calculators" className="scroll-mt-28 border-b border-paper-line">
        <div className="site-container py-16 lg:py-24">
          <SectionHeading
            number="01"
            eyebrow="Tax calculators"
            title="Run the numbers before you file."
            lede={`Quick federal estimates using the ${TAX_YEAR} figures. Nothing you enter is saved or sent anywhere, and no personal details are needed.`}
          />
          <div className="mt-10">
            <TaxTools />
          </div>
        </div>
      </section>

      <TaxCompass />

      {/* Key dates */}
      <section id="key-dates" className="scroll-mt-28 border-b border-paper-line">
        <div className="site-container py-16 lg:py-24">
          <SectionHeading
            number="03"
            eyebrow="Deadlines & extensions"
            title={`Key dates for your ${TAX_YEAR} taxes.`}
            lede="Federal due dates for calendar-year filers in the 2027 filing season. State deadlines usually follow, but not always, so check with us if you file in several states."
          />
          <div className="mt-10 overflow-hidden rounded-[4px] border border-paper-line bg-white">
            <ol className="divide-y divide-paper-line">
              {KEY_DATES.map((d) => (
                <li key={`${d.iso}-${d.title}`} className="grid gap-1 px-5 py-4 sm:grid-cols-[110px_1fr_auto] sm:items-baseline sm:gap-6">
                  <time dateTime={d.iso} className="font-display text-[22px] text-ink">
                    {d.date}
                  </time>
                  <p className="text-[15px] text-ink">{d.title}</p>
                  <p className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink-muted">{d.who}</p>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-5 max-w-3xl text-[13.5px] leading-relaxed text-ink-muted">
            An extension gives you more time to file, not to pay: tax owed is still due by the original date. Received a
            letter from the IRS with its own deadline?{" "}
            <Link href="/services/irs-notice-audit-help" className="text-ink underline-offset-4 hover:underline">
              Get help with IRS notices
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Topic guides */}
      <section id="guides" className="scroll-mt-28 border-b border-paper-line bg-paper-deep/40">
        <div className="site-container py-16 lg:py-24">
          <SectionHeading
            number="04"
            eyebrow="Guides by topic"
            title="Your common tax questions, explained."
            lede="As your life and work change, so do the tax rules that matter to you. Start with the topic closest to your situation."
          />
          <div className="mt-10 grid gap-px overflow-hidden rounded-[4px] border border-paper-line bg-paper-line md:grid-cols-2 lg:grid-cols-3">
            {RESOURCE_TOPICS.map((topic) => {
              const articles = topic.articleSlugs.map(postBySlug).filter((post): post is (typeof BLOG_POSTS)[number] => Boolean(post));
              return (
                <article key={topic.id} id={topic.id} className="flex scroll-mt-28 flex-col bg-white p-6 sm:p-7">
                  <h3 className="font-display text-[24px] leading-snug text-ink">{topic.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{topic.description}</p>
                  <ul className="mt-5 space-y-2 text-[14px] text-ink-soft">
                    {topic.questions.map((q) => (
                      <li key={q} className="flex gap-3">
                        <span className="mt-[9px] h-px w-3 shrink-0 bg-brass" />
                        {q}
                      </li>
                    ))}
                  </ul>
                  {articles.length > 0 && (
                    <div className="mt-6 border-t border-paper-line pt-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">Read</p>
                      <ul className="mt-2 space-y-2">
                        {articles.map((post) => (
                          <li key={post.slug}>
                            <Link href={`/blogs/${post.slug}`} className="text-[14.5px] font-medium leading-snug text-ink hover:text-brass-dark">
                              {post.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Link
                    href={topic.service.href}
                    className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14px] font-semibold text-ink hover:text-brass-dark"
                  >
                    {topic.service.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest articles */}
      <section id="articles" className="scroll-mt-28">
        <div className="site-container py-16 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading number="05" eyebrow="Latest articles" title="Recently updated." />
            <Link href="/blogs" className="link-under text-[15px]">
              View all articles
            </Link>
          </div>
          <ul className="mt-10 grid gap-8 border-t border-ink pt-8 md:grid-cols-3">
            {latestPosts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blogs/${post.slug}`} className="group block">
                  <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-brass-dark">{post.category}</p>
                  <h3 className="mt-3 font-display text-[22px] leading-snug text-ink transition-colors group-hover:text-brass-dark">
                    {post.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-[14.5px] leading-relaxed text-ink-soft">{post.excerpt}</p>
                  <p className="mt-4 inline-flex items-center gap-1 text-[13px] text-ink-muted">
                    {post.readTime}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <PageFaq items={PAGE_FAQS.resources} />

      <ClosingCta title="Have a question the guides don't answer?" />
    </PublicLayout>
  );
}
