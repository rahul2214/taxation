import type { Metadata } from "next";
import { buildMetadata, breadcrumbSchema, absoluteUrl } from "@/lib/seo";
import { SERVICES, SERVICE_GROUPS } from "@/data/services";
import { JsonLd } from "@/components/seo/JsonLd";
import Image from "next/image";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageFaq } from "@/components/public/PageFaq";
import { PAGE_FAQS } from "@/data/faqs";
import { PageIntro } from "@/components/public/PageIntro";
import { ClosingCta } from "@/components/public/ClosingCta";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Tax Preparation & Business Services",
  description: "CPA tax preparation for individuals from $59 and small businesses from $199, plus bookkeeping, payroll, business formation, IRS notice help and tax planning. All 50 states.",
  path: "/services",
  keywords: ["individual tax return preparation", "small business tax preparation", "S-Corp tax preparation", "partnership tax return 1065", "IRS notice help", "bookkeeping services", "payroll services", "business formation", "tax planning services", "Roth conversion planning", "MNC tax filing"],
});

// Business services follow the order an owner meets them: set up, books, payroll, returns, planning.
const DISPLAY_ORDER = [
  "business-formation",
  "bookkeeping",
  "payroll",
  "small-business-tax-preparation",
  "tax-planning",
  "mnc-tax-filing",
];
// Slugs not listed (the individual services) return -1 and keep their catalogue order.
const rank = (slug: string) => DISPLAY_ORDER.indexOf(slug);

// Hub view of the catalogue, grouped by audience; each entry links to its own landing page.
// The section ids keep older /services#personal style links working.
const groups = SERVICE_GROUPS.map((group) => ({
  ...group,
  services: SERVICES.filter((s) => s.audience === group.audience)
    .sort((a, b) => rank(a.slug) - rank(b.slug))
    .map((s) => ({
    id: s.legacyAnchor,
    slug: s.slug,
    title: s.name,
    form: s.forms,
    description: s.intro[0],
    features: s.included.slice(0, 4),
    price: s.price,
    pricePeriod: s.pricePeriod,
  })),
}));

// Numbering runs on across groups, so build an id -> position lookup once.
const services = groups.flatMap((g) => g.services);
const position = (id: string) => String(services.findIndex((s) => s.id === id) + 1).padStart(2, "0");

export default function ServicesPage() {
  return (
    <PublicLayout>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: "Services", path: "/services" }]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Tax services",
            itemListElement: services.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: s.title,
              url: absoluteUrl(`/services/${s.slug}`),
            })),
          },
        ]}
      />
      <PageIntro
        eyebrow="Services"
        title="Tax work for people and the businesses they run."
        lede={`${services.length} areas of practice, each handled by licensed CPAs and Enrolled Agents. Prices are fixed and agreed before any work begins.`}
        aside={
          <nav aria-label="Services on this page" className="space-y-6 border-t border-ink pt-4">
            {groups.map((group) => (
              <div key={group.audience}>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-brass-dark">{group.title}</p>
                <ul className="mt-3 space-y-2 text-[14.5px]">
                  {group.services.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="flex gap-3 text-ink-soft hover:text-ink">
                        <span className="font-mono text-[12px] text-ink-muted">{position(s.id)}</span>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        }
      />

      {groups.map((group) => (
        <div key={group.audience} id={`for-${group.audience}`} className="site-container scroll-mt-28">
          <header className="grid gap-4 border-b border-ink pb-6 pt-16 lg:grid-cols-12 lg:items-end lg:pt-20">
            <h2 className="font-display text-[30px] leading-[1.1] text-ink sm:text-[36px] lg:col-span-5">{group.title}</h2>
            <p className="text-[15.5px] leading-relaxed text-ink-soft lg:col-span-7">{group.lede}</p>
          </header>

          {group.services.map((service) => (
            <section
              key={service.id}
              id={service.id}
              className="grid scroll-mt-28 gap-8 border-b border-paper-line py-14 lg:grid-cols-12 lg:py-16"
            >
              <div className="lg:col-span-5">
                <p className="font-mono text-[12px] text-ink-muted">
                  {position(service.id)} · {service.form}
                </p>
                <h3 className="mt-3 font-display text-[32px] leading-[1.1] text-ink sm:text-[38px]">
                  <Link href={`/services/${service.slug}`} className="hover:text-brass-dark">
                    {service.title}
                  </Link>
                </h3>
                <p className="mt-6">
                  <span className="font-display text-[34px] text-ink">{service.price}</span>
                  <span className="ml-2 text-sm text-ink-muted">{service.pricePeriod}</span>
                </p>
              </div>
              <div className="lg:col-span-7">
                <p className="text-[16.5px] leading-relaxed text-ink-soft">{service.description}</p>
                <ul className="mt-6 grid gap-x-8 gap-y-3 border-t border-paper-line pt-6 text-[14.5px] sm:grid-cols-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-ink-soft">
                      <span className="mt-[10px] h-px w-3 shrink-0 bg-brass" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[15px]">
                  <Link
                    href={`/services/${service.slug}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-brass-dark"
                  >
                    More about {service.title.toLowerCase()} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/book-appointment" className="link-under">
                    Ask a question first
                  </Link>
                </div>
              </div>
            </section>
          ))}
        </div>
      ))}

      <section className="site-container grid items-center gap-10 py-16 lg:grid-cols-12">
        <p className="font-display text-[24px] leading-snug text-ink-soft sm:text-[28px] lg:col-span-7">
          Not sure which of these fits? Most clients aren&apos;t. Book a short call and we&apos;ll point you to the
          right one.
        </p>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] border border-paper-line bg-paper-deep lg:col-span-5">
          <Image
            src="/images/advisor-client-consultation.webp"
            alt="Tax advisor walking a smiling client through a tax savings chart on a laptop"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <PageFaq items={PAGE_FAQS.services} />

      <ClosingCta />
    </PublicLayout>
  );
}
