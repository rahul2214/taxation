import type { Metadata } from "next";
import { buildMetadata, breadcrumbSchema, serviceSchema } from "@/lib/seo";
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

const services = [
  {
    id: "personal",
    title: "Individual tax returns",
    form: "Form 1040",
    description:
      "For employees, families and investors. We go through every schedule that applies to you, compare standard and itemized deductions, and explain the result before you sign.",
    features: [
      "W-2, 1099-NEC, 1099-MISC and 1099-K income",
      "Stock options, RSUs and crypto",
      "Child, education and energy credits",
      "Multi-state returns after a move",
    ],
    price: "$59",
    pricePeriod: "simple return",
  },
  {
    id: "business",
    title: "Small business & self-employed",
    form: "Schedule C · 1065 · 1120-S",
    description:
      "For freelancers, LLCs, partnerships and S-Corps. A named CPA prepares your business and personal returns together, so nothing falls between them.",
    features: [
      "Schedule C, Form 1065 and Form 1120-S",
      "Section 179 and bonus depreciation",
      "Quarterly estimated tax vouchers",
      "Reasonable salary review for S-Corp owners",
    ],
    price: "$199",
    pricePeriod: "starting price",
  },
  {
    id: "audit",
    title: "IRS notices & audits",
    form: "Form 2848",
    description:
      "Got a letter? Send us a photo. We'll tell you what it means, what it'll cost to resolve, and then deal with the IRS or your state on your behalf.",
    features: [
      "CP2000, CP504 and math-error notices",
      "Representation by an Enrolled Agent or CPA",
      "First-time penalty abatement requests",
      "Installment agreements",
    ],
    price: "Quoted",
    pricePeriod: "per case",
  },
  {
    id: "bookkeeping",
    title: "Monthly bookkeeping",
    form: "P&L · Balance sheet",
    description:
      "Clean books every month, so tax season is a matter of hours rather than weeks. Useful for lenders and investors too.",
    features: [
      "Bank and card reconciliations",
      "Monthly P&L and balance sheet",
      "Payroll tie-out and 1099 vendor filings",
      "Year-end package ready for your return",
    ],
    price: "$250",
    pricePeriod: "per month",
  },
  {
    id: "consulting",
    title: "Tax planning",
    form: "Year-round",
    description:
      "Decisions made in March cost less than corrections made in April. We plan ahead with you on structure, timing and state exposure.",
    features: [
      "LLC vs. S-Corp analysis",
      "Remote employees and multi-state nexus",
      "Capital gains and 1031 exchanges",
      "Equity compensation strategy",
    ],
    price: "Quoted",
    pricePeriod: "per engagement",
  },
  {
    id: "retirement",
    title: "Retirement & estate",
    form: "IRA · RMD · Gifting",
    description:
      "Help with the tax side of retirement: when to draw, what to convert, and how to pass assets on without unnecessary tax.",
    features: [
      "Roth conversion planning",
      "Required minimum distributions",
      "Taxation of Social Security benefits",
      "Gifting and wealth transfer",
    ],
    price: "Quoted",
    pricePeriod: "per engagement",
  },
];

export default function ServicesPage() {
  return (
    <PublicLayout>
      <JsonLd data={[breadcrumbSchema([{ name: "Services", path: "/services" }]), ...services.map((s) => serviceSchema({ name: s.title, description: s.description, path: `/services#${s.id}`, price: s.price }))]} />
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
              <h2 className="mt-3 font-display text-[32px] leading-[1.1] text-ink sm:text-[38px]">{service.title}</h2>
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
                <Link href="/signup" className="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-brass-dark">
                  Get started <ArrowRight className="h-4 w-4" />
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
