"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageFaq } from "@/components/public/PageFaq";
import { PAGE_FAQS } from "@/data/faqs";
import { ClosingCta } from "@/components/public/ClosingCta";
import { ArrowRight, ArrowUpRight, Star } from "lucide-react";
import { BLOG_POSTS } from "@/data/blogs";
import { HomeAppointmentBooking } from "@/components/home/HomeAppointmentBooking";
import { TaxCompass } from "@/components/home/TaxCompass";
import { useFirebase } from "@/firebase";
import { getCachedAuth } from "@/lib/cache/auth-cache";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/lib/seo";

const STATS = [
  { value: "10,000+", label: "returns filed across all 50 states" },
  { value: "$4,280", label: "average in deductions found that clients had missed" },
  { value: "99.9%", label: "of returns accepted by the IRS on first submission" },
  { value: "4.9 / 5", label: "average rating from clients after filing" },
];

const STEPS = [
  { title: "Tell us about your situation", body: "Share the basics so the appropriate service can be identified." },
  { title: "Upload your documents", body: "Use the designated secure client portal and checklist." },
  { title: "Preparation & questions", body: "Provide any missing information needed to prepare the return." },
  { title: "Review & approve", body: "Review the return, ask questions and complete required signatures." },
  { title: "Track & access your copy", body: "Check available status updates and download completed documents." },
];

const SERVICES = [
  { href: "/services/individual-tax-preparation", name: "Individual & family returns", detail: "W-2s, stock compensation, crypto, rental property, multi-state moves", price: "from $59" },
  { href: "/services/small-business-tax-preparation", name: "Self-employed & single-member LLCs", detail: "Schedule C, quarterly estimates, home office and vehicle", price: "from $199" },
  { href: "/services/small-business-tax-preparation", name: "S-Corps & partnerships", detail: "Form 1120-S and 1065, K-1s, reasonable salary, PTET elections", price: "from $499" },
  { href: "/services/mnc-tax-filing", name: "MNC tax filing", detail: "US subsidiaries and parents: Form 1120, 5471, 5472, foreign tax credits", price: "quoted per group" },
  { href: "/services/irs-notice-audit-help", name: "IRS notices & audits", detail: "CP2000 responses, penalty abatement, representation under Form 2848", price: "quoted per case" },
  { href: "/services/bookkeeping", name: "Monthly bookkeeping", detail: "Reconciliations, P&L and balance sheet, books that are ready at tax time", price: "from $250/mo" },
  { href: "/services/payroll", name: "Payroll", detail: "Pay runs, payroll tax deposits, Forms 941 and 940, W-2s, S-Corp owner salaries", price: "quoted monthly" },
  { href: "/services/business-formation", name: "Business formation", detail: "Entity choice, LLC or corporation filing, EIN and S-Corp election", price: "quoted one-time" },
  { href: "/services/tax-planning", name: "Planning & corporate advisory", detail: "Entity structure, R&D credits, multi-state nexus, QSBS", price: "from $2,500/mo" },
];

// Placeholder reviews: replace with real client feedback (with permission) before launch.
const REVIEWS = [
  {
    quote: "I moved from Pune to New Jersey mid-year and had no idea how to handle income in both countries. They sorted out my foreign tax credit and explained everything on one call.",
    name: "Priya S.",
    role: "Software engineer",
    location: "New Jersey, USA",
  },
  {
    quote: "As an NRI with rental income back home, filing was always confusing. The team was patient, quick to reply, and my return was done in three days.",
    name: "Rahul M.",
    role: "NRI professional",
    location: "Hyderabad, India",
  },
  {
    quote: "We set up a US subsidiary last year. They handled our 1120 and Form 5472 and worked well with our accountants in Bengaluru. No missed deadlines.",
    name: "Ankit G.",
    role: "Co-founder, SaaS company",
    location: "Bengaluru, India",
  },
  {
    quote: "Clear pricing, no surprises. My CPA found deductions I'd missed for two years and actually picked up the phone when I called.",
    name: "Emily R.",
    role: "Freelance designer",
    location: "Austin, USA",
  },
  {
    quote: "I'm a British expat working in the US. They made my dual-status year simple and told me exactly which documents to send.",
    name: "James W.",
    role: "Finance manager",
    location: "London, UK",
  },
  {
    quote: "Our group has entities in Dubai and the US. One team now coordinates all the US filings, which has saved our finance team a lot of time.",
    name: "Fatima A.",
    role: "Group CFO",
    location: "Dubai, UAE",
  },
];

const TIERS = [
  {
    name: "Individual",
    for: "W-2 earners, investors, homeowners",
    price: "$59",
    unit: "simple return",
    note: "Itemized (Schedule A) $129 · each extra state $39",
    items: [
      "Federal 1040 and one state return",
      "Standard vs. itemized comparison",
      "Child, education and energy credits",
      "Reviewed by a licensed CPA before filing",
      "Refund tracking after e-file",
    ],
    cta: "Start your return",
  },
  {
    name: "Business",
    for: "Freelancers, LLCs and S-Corps",
    price: "$199",
    unit: "Schedule C",
    note: "Form 1120-S or 1065 from $499",
    items: [
      "A named CPA assigned to your business",
      "Schedule C, 1120-S and K-1 preparation",
      "Section 199A QBI deduction",
      "Quarterly estimated tax vouchers",
      "Notice and audit support all year",
    ],
    cta: "File a business return",
    featured: true,
  },
  {
    name: "Advisory",
    for: "Growing companies, multi-entity groups",
    price: "$2,500",
    unit: "per month",
    note: "All entity returns and planning included",
    items: [
      "Partner-level contact for every decision",
      "R&D credit study and payroll offset",
      "Multi-state nexus and apportionment",
      "QSBS and exit planning",
      "Same-day response on business days",
    ],
    cta: "Talk to a partner",
  },
];

export function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { user } = useFirebase();
  const cached = mounted ? getCachedAuth() : { user: null, role: null, isAdmin: false };
  const activeUser = mounted ? user || cached.user : null;
  const isAdmin = cached.isAdmin || (activeUser as any)?.role === "admin" || (activeUser as any)?.role === "superadmin";
  const primaryHref = activeUser ? (isAdmin ? "/admin" : "/dashboard") : "/signup";
  const primaryLabel = activeUser ? "Go to your dashboard" : "Start your return";

  const offerCatalog = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Tax preparation and advisory packages",
    url: `${SITE.url}/#pricing`,
    itemListElement: TIERS.map((tier) => ({
      "@type": "Offer",
      name: `${tier.name} tax package`,
      description: `${tier.for}. ${tier.items.join(". ")}.`,
      price: tier.price.replace(/[^0-9.]/g, ""),
      priceCurrency: "USD",
      seller: { "@id": `${SITE.url}/#organization` },
    })),
  };

  return (
    <PublicLayout>
      <JsonLd data={offerCatalog} />
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-paper-line">
        <div className="site-container grid items-center gap-14 pb-16 pt-12 md:pt-16 lg:grid-cols-12 lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="lg:col-span-7">
            <p className="eyebrow">Tax preparation &amp; advisory · New York</p>
            <h1 className="mt-6 font-display text-[44px] font-normal leading-[1.04] tracking-[-0.015em] text-ink sm:text-[60px] lg:text-[72px]">
              Your taxes, <em className="italic text-brass-dark">done right.</em>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
              Prepared and checked by a licensed CPA. Simple, accurate and on time.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={primaryHref} className="btn-ink px-6 py-3.5">
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#book-consultation" className="btn-line px-6 py-3.5">
                Book a free 15-minute call
              </a>
            </div>

            <dl className="mt-12 grid max-w-xl grid-cols-3 border-t border-paper-line pt-6 text-[13px] sm:text-sm">
              <div>
                <dt className="text-ink-muted">Returns from</dt>
                <dd className="mt-1 font-display text-xl text-ink sm:text-2xl">$59</dd>
              </div>
              <div className="border-l border-paper-line pl-3 sm:pl-5">
                <dt className="text-ink-muted">Typical turnaround</dt>
                <dd className="mt-1 font-display text-xl text-ink sm:text-2xl">2–3 days</dd>
              </div>
              <div className="border-l border-paper-line pl-3 sm:pl-5">
                <dt className="text-ink-muted">Notice support</dt>
                <dd className="mt-1 font-display text-xl text-ink sm:text-2xl">Included</dd>
              </div>
            </dl>
          </div>

          {/* Hero image */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] border border-paper-line bg-paper-deep shadow-[0_1px_0_#DCD5C5,0_24px_48px_-24px_rgba(20,32,46,0.25)]">
                <Image
                  src="/images/home-hero-cpa-review.webp"
                  alt="Tax professional in a navy blazer smiling as she reviews a tax return at her office desk"
                  fill
                  priority
                  sizes="(min-width: 1024px) 448px, 100vw"
                  className="object-cover"
                />
              </div>

              {/* Review stamp */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-8 hidden sm:flex bg-white/80 backdrop-blur-[1px] h-[92px] w-[92px] rotate-[-12deg] flex-col items-center justify-center rounded-full border-2 border-brass/70 text-center text-brass-dark/90 sm:-right-6"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.18em]">Polaris</span>
                <span className="font-display text-[17px] font-semibold uppercase leading-tight tracking-wide">Reviewed</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em]">CPA · 2025</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-b border-paper-line bg-paper-deep/60">
        <div className="site-container grid grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "py-10 pr-6 lg:py-12",
                i % 2 === 1 && "border-l border-paper-line pl-6",
                i >= 2 && "border-t border-paper-line lg:border-t-0",
                i === 2 && "lg:border-l lg:pl-6"
              )}
            >
              <p className="font-display text-[38px] leading-none text-ink sm:text-[44px]">{stat.value}</p>
              <p className="mt-3 max-w-[220px] text-[14px] leading-snug text-ink-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-paper-line">
        <div className="site-container py-20 lg:py-28">
          <div className="grid gap-6 lg:grid-cols-12">
            <p className="eyebrow lg:col-span-3 lg:pt-3">A process you can follow</p>
            <div className="lg:col-span-9">
              <h2 className="font-display text-[36px] leading-[1.1] text-ink sm:text-[46px]">
                From first document to final return.
              </h2>
              <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-soft">
                Know what to expect at each stage. The exact steps depend on your filing situation and the services
                agreed upon.
              </p>
            </div>
          </div>

          <ol className="mt-14 grid gap-px overflow-hidden border border-paper-line bg-paper-line sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, i) => (
              <li key={step.title} className="bg-paper p-7 lg:p-8">
                <span className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-brass-dark">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 text-lg font-semibold leading-snug text-ink">{step.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <TaxCompass />

      {/* Services */}
      <section id="services" className="scroll-mt-28 border-b border-paper-line">
        <div className="site-container py-20 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">What we do</p>
              <h2 className="mt-5 font-display text-[36px] leading-[1.1] text-ink sm:text-[42px]">
                From a single W-2 to a group of companies.
              </h2>
              <p className="mt-5 text-[15.5px] leading-relaxed text-ink-soft">
                Every engagement has a fixed price agreed before work starts. If your situation changes, we&apos;ll
                tell you before the price does.
              </p>
              <Link href="/services" className="link-under mt-7 inline-block text-[15px]">
                See all services
              </Link>
              <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-[4px] border border-paper-line bg-paper-deep">
                <Image
                  src="/images/tax-return-review.webp"
                  alt="Hands checking a Form 1040 on a clipboard next to a calculator and laptop"
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>

            <ul className="border-t border-ink lg:col-span-8">
              {SERVICES.map((s) => (
                <li key={s.name} className="border-b border-paper-line">
                  <Link
                    href={s.href}
                    className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-5 sm:grid-cols-[1fr_auto_20px]"
                  >
                    <span className="font-display text-[22px] text-ink transition-colors group-hover:text-brass-dark sm:text-[24px]">
                      {s.name}
                    </span>
                    <span className="font-mono text-[13px] text-ink-muted">{s.price}</span>
                    <ArrowUpRight className="hidden h-4 w-4 self-center text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink sm:block" />
                    <span className="col-span-2 text-[14.5px] text-ink-muted sm:col-span-3">{s.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-28 border-b border-paper-line">
        <div className="site-container py-20 lg:py-28">
          <div className="grid gap-6 lg:grid-cols-12">
            <p className="eyebrow lg:col-span-3 lg:pt-3">Pricing</p>
            <div className="lg:col-span-9">
              <h2 className="font-display text-[36px] leading-[1.1] text-ink sm:text-[46px]">
                Published prices. Agreed before we start.
              </h2>
              <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-soft">
                Every package includes CPA review and help with any IRS letter about a return we filed. No hourly
                billing.
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:gap-0">
            {TIERS.map((tier, i) => (
              <div
                key={tier.name}
                className={cn(
                  "flex flex-col rounded-[4px] border p-8 lg:rounded-none lg:p-10",
                  tier.featured
                    ? "border-2 border-brass bg-white text-ink shadow-md lg:-my-4 lg:rounded-[4px] lg:py-14"
                    : "border-paper-line bg-white",
                  i === 0 && "lg:border-r-0",
                  i === 2 && "lg:border-l-0"
                )}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-[26px]">{tier.name}</h3>
                  {tier.featured && (
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brass-dark font-medium bg-brass/10 px-2 py-0.5 rounded-[2px] border border-brass/25">
                      Most chosen
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[14px] text-ink-muted">{tier.for}</p>

                <div className="mt-8 border-t border-paper-line pt-6">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-[52px] leading-none text-ink">{tier.price}</span>
                    <span className="whitespace-nowrap text-sm text-ink-muted">{tier.unit}</span>
                  </p>
                  <p className="mt-2 font-mono text-[11.5px] text-ink-muted">{tier.note}</p>
                </div>

                <ul className="mt-8 flex-1 space-y-3 text-[14.5px]">
                  {tier.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-[9px] h-px w-3 shrink-0 bg-brass" />
                      <span className="text-ink-soft">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.name === "Advisory" ? "#book-consultation" : primaryHref}
                  className={cn("mt-10 w-full", tier.featured ? "btn-brass" : "btn-line")}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="scroll-mt-28 border-b border-paper-line bg-paper-deep/60">
        <div className="site-container py-20 lg:py-28">
          <div className="grid gap-6 lg:grid-cols-12">
            <p className="eyebrow lg:col-span-3 lg:pt-3">Client reviews</p>
            <div className="lg:col-span-9">
              <h2 className="font-display text-[36px] leading-[1.1] text-ink sm:text-[46px]">
                Trusted by clients worldwide.
              </h2>
              <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-soft">
                What people say after working with us, in their own words.
              </p>
            </div>
          </div>

          <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((review) => (
              <li key={review.name} className="flex flex-col rounded-[4px] border border-paper-line bg-white p-7">
                <div className="flex gap-0.5 text-brass" aria-label="Rated 5 out of 5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
                  ))}
                </div>
                <blockquote className="mt-5 flex-1 text-[15.5px] leading-relaxed text-ink-soft">
                  &ldquo;{review.quote}&rdquo;
                </blockquote>
                <div className="mt-6 border-t border-paper-line pt-4 text-[14px]">
                  <p className="font-semibold text-ink">{review.name}</p>
                  <p className="text-ink-muted">
                    {review.role} · {review.location}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HomeAppointmentBooking />

      {/* Articles */}
      <section className="border-t border-paper-line">
        <div className="site-container py-20 lg:py-24">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Articles</p>
              <h2 className="mt-5 font-display text-[34px] leading-[1.1] text-ink sm:text-[40px]">Written by the team</h2>
            </div>
            <Link href="/blogs" className="link-under text-[15px]">
              All articles
            </Link>
          </div>

          <div className="mt-12 grid border-t border-ink md:grid-cols-3">
            {BLOG_POSTS.slice(0, 3).map((post, i) => (
              <Link
                key={post.id}
                href={`/blogs/${post.slug}`}
                className={cn(
                  "group flex flex-col border-b border-paper-line py-8 md:border-b-0 md:px-8 md:py-10",
                  i === 0 && "md:pl-0",
                  i > 0 && "md:border-l",
                  i === 2 && "md:pr-0"
                )}
              >
                <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-muted">
                  {post.category} · {post.readTime}
                </p>
                <h3 className="mt-4 font-display text-[23px] leading-snug text-ink transition-colors group-hover:text-brass-dark">
                  {post.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-[14.5px] leading-relaxed text-ink-muted">{post.excerpt}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                  Read
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PageFaq items={PAGE_FAQS.home} />

      <ClosingCta
        title="Filing season is easier when it starts early."
        body="Open an account in two minutes and upload documents as they arrive. We'll start on your return as soon as we have what we need."
        primary={{ href: primaryHref, label: primaryLabel }}
        secondary={{ href: "/book-appointment", label: "Talk to a CPA first" }}
      />
    </PublicLayout>
  );
}
