import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ClosingCta } from "@/components/public/ClosingCta";
import { FaqList } from "@/components/public/FaqList";
import { JsonLd } from "@/components/seo/JsonLd";
import { SERVICES, getServiceBySlug } from "@/data/services";
import { BLOG_POSTS } from "@/data/blogs";
import { buildMetadata, breadcrumbSchema, faqSchema, serviceSchema, SITE } from "@/lib/seo";

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: "Service not found", robots: { index: false, follow: true } };

  return buildMetadata({
    title: service.metaTitle,
    description: service.metaDescription,
    path: `/services/${service.slug}`,
    keywords: service.keywords,
    // Keep the rendered title within ~60 characters.
    absoluteTitle: service.metaTitle.length + SITE.name.length + 3 > 60,
  });
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-[15.5px]">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-ink-soft">
          <span className="mt-[11px] h-px w-3 shrink-0 bg-brass" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const path = `/services/${service.slug}`;
  const related = service.relatedPostSlugs
    .map((s) => BLOG_POSTS.find((post) => post.slug === s))
    .filter((post): post is (typeof BLOG_POSTS)[number] => Boolean(post));
  const others = SERVICES.filter((s) => s.slug !== service.slug);

  return (
    <PublicLayout>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Services", path: "/services" },
            { name: service.name, path },
          ]),
          serviceSchema({ name: service.name, description: service.metaDescription, path, price: service.price }),
          faqSchema(service.faqs),
        ]}
      />

      <section className="border-b border-paper-line">
        <div className="site-container grid gap-10 pb-14 pt-10 md:pb-20 md:pt-14 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <nav aria-label="Breadcrumb" className="text-[13.5px] text-ink-muted">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-ink">Home</Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/services" className="hover:text-ink">Services</Link>
                </li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-ink">{service.shortName}</li>
              </ol>
            </nav>
            <p className="eyebrow mt-8">{service.forms}</p>
            <h1 className="mt-4 font-display text-[38px] font-normal leading-[1.08] text-ink sm:text-[52px]">{service.h1}</h1>
            <div className="mt-6 max-w-2xl space-y-4 text-[17px] leading-relaxed text-ink-soft">
              {service.intro.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/book-appointment" className="btn-ink px-6 py-3.5">
                Book a free 15-minute call
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/signup" className="btn-line px-6 py-3.5">
                Start online
              </Link>
            </div>
          </div>

          <aside className="lg:col-span-4 lg:self-end">
            <div className="rounded-[4px] border border-paper-line bg-white p-6">
              <p className="text-[13.5px] text-ink-muted">Price</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-[44px] leading-none text-ink">{service.price}</span>
                <span className="text-sm text-ink-muted">{service.pricePeriod}</span>
              </p>
              <p className="mt-4 border-t border-paper-line pt-4 text-[14px] leading-relaxed text-ink-soft">{service.priceNote}</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-paper-line">
        <div className="site-container grid gap-12 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <h2 className="font-display text-[30px] leading-tight text-ink">Who this is for</h2>
            <div className="mt-6">
              <Checklist items={service.whoFor} />
            </div>
          </div>
          <div>
            <h2 className="font-display text-[30px] leading-tight text-ink">What&apos;s included</h2>
            <div className="mt-6">
              <Checklist items={service.included} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-paper-line bg-paper-deep/60">
        <div className="site-container py-14 lg:py-20">
          <h2 className="font-display text-[30px] leading-tight text-ink">How it works</h2>
          <ol className="mt-8 grid gap-px overflow-hidden border border-paper-line bg-paper-line md:grid-cols-3">
            {service.steps.map((step, i) => (
              <li key={step.title} className="bg-paper p-7">
                <span className="font-display text-[40px] leading-none text-brass">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-6 lg:grid-cols-12">
            <h3 className="font-display text-[24px] text-ink lg:col-span-4">What to have ready</h3>
            <div className="lg:col-span-8">
              <Checklist items={service.documents} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-paper-line">
        <div className="site-container grid gap-10 py-14 lg:grid-cols-12 lg:py-20">
          <h2 className="font-display text-[30px] leading-tight text-ink lg:col-span-4">Questions about {service.shortName.toLowerCase()}</h2>
          <div className="lg:col-span-8">
            <FaqList items={service.faqs} />
            <p className="mt-6 text-[14.5px] text-ink-muted">
              More answers on our <Link href="/faq" className="link-under">FAQ page</Link>.
            </p>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-b border-paper-line">
          <div className="site-container py-14 lg:py-16">
            <h2 className="font-display text-[28px] text-ink">Related reading</h2>
            <ul className="mt-6 grid border-t border-ink md:grid-cols-3">
              {related.map((post, i) => (
                <li key={post.slug} className={`border-b border-paper-line py-6 md:border-b-0 md:px-6 ${i === 0 ? "md:pl-0" : "md:border-l"}`}>
                  <Link href={`/blogs/${post.slug}`} className="group block">
                    <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-muted">{post.category}</p>
                    <p className="mt-2 font-display text-[20px] leading-snug text-ink group-hover:text-brass-dark">{post.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="site-container py-14">
        <h2 className="font-display text-[24px] text-ink">Other services</h2>
        <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-[15px]">
          {others.map((s) => (
            <li key={s.slug}>
              <Link href={`/services/${s.slug}`} className="link-under">
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ClosingCta />
    </PublicLayout>
  );
}
