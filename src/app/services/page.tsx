import type { Metadata } from "next";
import { buildMetadata, breadcrumbSchema, absoluteUrl } from "@/lib/seo";
import { SERVICES } from "@/data/services";
import { JsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageIntro } from "@/components/public/PageIntro";
import { ClosingCta } from "@/components/public/ClosingCta";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Tax Preparation & IRS Help Services",
  description: "CPA tax preparation for individuals from $59 and small businesses from $199, plus IRS notice help, bookkeeping and tax planning. Fixed prices, all 50 states.",
  path: "/services",
  keywords: ["individual tax return preparation", "small business tax preparation", "S-Corp tax preparation", "partnership tax return 1065", "IRS notice help", "bookkeeping services", "tax planning services", "Roth conversion planning"],
});

// Hub view of the catalogue; each entry links to its own landing page.
// The section ids keep older /services#personal style links working.
const services = SERVICES.map((s) => ({
  id: s.legacyAnchor,
  slug: s.slug,
  title: s.name,
  form: s.forms,
  description: s.intro[0],
  features: s.included.slice(0, 4),
  price: s.price,
  pricePeriod: s.pricePeriod,
}));

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
        lede="Six areas of practice, each handled by licensed CPAs and Enrolled Agents. Prices are fixed and agreed before any work begins."
        aside={
          <nav aria-label="Services on this page" className="border-t border-ink pt-4">
            <ul className="space-y-2 text-[14.5px]">
              {services.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-3 text-ink-soft hover:text-ink">
                    <span className="font-mono text-[12px] text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        }
      />

      <div className="site-container">
        {services.map((service, i) => (
          <section
            key={service.id}
            id={service.id}
            className="grid scroll-mt-28 gap-8 border-b border-paper-line py-14 lg:grid-cols-12 lg:py-16"
          >
            <div className="lg:col-span-5">
              <p className="font-mono text-[12px] text-ink-muted">
                {String(i + 1).padStart(2, "0")} · {service.form}
              </p>
              <h2 className="mt-3 font-display text-[32px] leading-[1.1] text-ink sm:text-[38px]">
                <Link href={`/services/${service.slug}`} className="hover:text-brass-dark">
                  {service.title}
                </Link>
              </h2>
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

      <section className="site-container py-16">
        <p className="max-w-3xl font-display text-[24px] leading-snug text-ink-soft sm:text-[28px]">
          Not sure which of these fits? Most clients aren&apos;t. Book a short call and we&apos;ll point you to the
          right one.
        </p>
      </section>

      <ClosingCta />
    </PublicLayout>
  );
}
