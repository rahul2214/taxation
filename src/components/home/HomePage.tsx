"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ClosingCta } from "@/components/public/ClosingCta";
import { ArrowRight, ArrowUpRight, Minus, Plus } from "lucide-react";
import { BLOG_POSTS } from "@/data/blogs";
import { HomeAppointmentBooking } from "@/components/home/HomeAppointmentBooking";
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
  {
    title: "Send us your documents",
    body: "Upload W-2s, 1099s, K-1s and statements to your private portal, or forward them by email. We'll tell you if anything is missing.",
  },
  {
    title: "Your CPA prepares the return",
    body: "One licensed preparer owns your file from start to finish. They'll call if something needs a decision, and they'll explain the choices in plain terms.",
  },
  {
    title: "Review, sign, and file",
    body: "You get a one-page summary of what changed and why. Sign Form 8879 from your phone and we e-file to the IRS and your state.",
  },
];

const SERVICES = [
  { href: "/services/individual-tax-preparation", name: "Individual & family returns", detail: "W-2s, stock compensation, crypto, rental property, multi-state moves", price: "from $59" },
  { href: "/services/small-business-tax-preparation", name: "Self-employed & single-member LLCs", detail: "Schedule C, quarterly estimates, home office and vehicle", price: "from $199" },
  { href: "/services/small-business-tax-preparation", name: "S-Corps & partnerships", detail: "Form 1120-S and 1065, K-1s, reasonable salary, PTET elections", price: "from $499" },
  { href: "/services/irs-notice-audit-help", name: "IRS notices & audits", detail: "CP2000 responses, penalty abatement, representation under Form 2848", price: "quoted per case" },
  { href: "/services/bookkeeping", name: "Monthly bookkeeping", detail: "Reconciliations, P&L and balance sheet, books that are ready at tax time", price: "from $250/mo" },
  { href: "/services/tax-planning", name: "Planning & corporate advisory", detail: "Entity structure, R&D credits, multi-state nexus, QSBS", price: "from $2,500/mo" },
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

  // Calculator State: Mode Switcher ('individual' vs 'corporate')
  const [calcMode, setCalcMode] = useState<"individual" | "corporate">("individual");

  // Corporate Mode Parameters
  const [revenue, setRevenue] = useState(12000000);
  const [entityType, setEntityType] = useState<"c-corp" | "s-corp" | "partnership" | "multi-holdco">("c-corp");
  const [rdSpend, setRdSpend] = useState(2400000);

  // Individual Mode Parameters
  const [income, setIncome] = useState(125000);
  const [filingStatus, setFilingStatus] = useState<"single" | "married" | "hoh">("single");
  const [withholding, setWithholding] = useState(24000);
  const [dependents, setDependents] = useState(1);

  // Hero document preview tab
  const [previewTab, setPreviewTab] = useState<"1040" | "business">("1040");

  // Corporate Mode Calculations
  const corporateSavings = useMemo(() => {
    const multipliers: Record<string, number> = {
      "c-corp": 1.15,
      "s-corp": 1.05,
      partnership: 0.95,
      "multi-holdco": 1.3,
    };
    const mult = multipliers[entityType] || 1.15;

    // IRC § 41 R&D credit capture (est. 8.5% of QREs)
    const rdCredit = rdSpend * 0.085;
    // PTET pass-through tax & multi-state apportionment
    const ptet = revenue * 0.012 * mult;
    // Section 179 & bonus depreciation
    const depreciation = revenue * 0.004 + rdSpend * 0.015;
    const totalShield = rdCredit + ptet + depreciation;

    return {
      rdCredit: Math.round(rdCredit),
      ptet: Math.round(ptet),
      depreciation: Math.round(depreciation),
      totalShield: Math.round(totalShield),
    };
  }, [revenue, entityType, rdSpend]);

  // Individual Mode Calculations
  const individualEstimate = useMemo(() => {
    // Tax year 2025 figures (returns filed in 2026), as amended by the One Big Beautiful Bill Act.
    // Source: IRS "Federal income tax rates and brackets" and OBBBA standard deduction guidance.
    const standardDeductions: Record<string, number> = {
      single: 15750,
      married: 31500,
      hoh: 23625,
    };

    const brackets: Record<string, { rate: number; amount: number }[]> = {
      single: [
        { rate: 0.1, amount: 11925 },
        { rate: 0.12, amount: 48475 },
        { rate: 0.22, amount: 103350 },
        { rate: 0.24, amount: 197300 },
        { rate: 0.32, amount: 250525 },
        { rate: 0.35, amount: 626350 },
        { rate: 0.37, amount: Infinity },
      ],
      married: [
        { rate: 0.1, amount: 23850 },
        { rate: 0.12, amount: 96950 },
        { rate: 0.22, amount: 206700 },
        { rate: 0.24, amount: 394600 },
        { rate: 0.32, amount: 501050 },
        { rate: 0.35, amount: 751600 },
        { rate: 0.37, amount: Infinity },
      ],
      hoh: [
        { rate: 0.1, amount: 17000 },
        { rate: 0.12, amount: 64850 },
        { rate: 0.22, amount: 103350 },
        { rate: 0.24, amount: 197300 },
        { rate: 0.32, amount: 250500 },
        { rate: 0.35, amount: 626350 },
        { rate: 0.37, amount: Infinity },
      ],
    };

    const deduction = standardDeductions[filingStatus] || 15750;
    const taxable = Math.max(0, income - deduction);

    let tax = 0;
    let rem = taxable;
    let prev = 0;
    for (const b of brackets[filingStatus] || brackets.single) {
      if (rem > 0) {
        const chunk = Math.min(rem, b.amount - prev);
        tax += chunk * b.rate;
        rem -= chunk;
        prev = b.amount;
      }
    }

    // 2025 child tax credit: up to $2,200 per qualifying child (income phase-outs not modelled).
    const credits = dependents * 2200;
    const finalTax = Math.max(0, tax - credits);
    const refund = withholding - finalTax;

    return {
      tax: Math.round(finalTax),
      refund: Math.round(refund),
      deduction,
      credits,
    };
  }, [income, filingStatus, withholding, dependents]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

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
              Your taxes, prepared and signed by a CPA who{" "}
              <em className="italic text-brass-dark">knows your file.</em>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
              Send your documents, talk to the person actually doing the work, and file knowing every line was
              checked. For individuals, families and small businesses in all 50 states.
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

          {/* Return summary sheet */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              <div className="flex gap-1 pl-4">
                {[
                  { id: "1040" as const, label: "Form 1040" },
                  { id: "business" as const, label: "Form 1120-S" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewTab(tab.id)}
                    className={cn(
                      "rounded-t-[4px] border border-b-0 px-4 py-2 font-mono text-[11.5px] transition-colors",
                      previewTab === tab.id
                        ? "border-paper-line bg-white text-ink"
                        : "border-transparent bg-paper-deep text-ink-muted hover:text-ink"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative rounded-[4px] border border-paper-line bg-white p-6 shadow-[0_1px_0_#DCD5C5,0_24px_48px_-24px_rgba(20,32,46,0.25)] sm:p-8">
                <div className="flex items-start justify-between border-b border-ink pb-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">Return summary</p>
                    <p className="mt-1 font-display text-xl text-ink">
                      {previewTab === "1040" ? "Individual · Tax year 2025" : "S-Corporation · Tax year 2025"}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-ink-muted">p. 1 of 1</span>
                </div>

                <table className="mt-4 w-full font-mono text-[13px]">
                  <caption className="sr-only">Sample return lines</caption>
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">Line</th>
                      <th scope="col">Description</th>
                      <th scope="col">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-paper-line">
                    {(previewTab === "1040"
                      ? [
                          ["1z", "Wages, salaries, tips", "125,000"],
                          ["12", "Standard deduction", "(15,750)"],
                          ["19", "Child tax credit", "(2,200)"],
                          ["25d", "Federal tax withheld", "24,000"],
                        ]
                      : [
                          ["1a", "Gross receipts", "4,200,000"],
                          ["—", "R&D wage credit (§41)", "68,000"],
                          ["—", "PTET state deduction", "48,500"],
                          ["K-1", "Shareholder allocations", "reconciled"],
                        ]
                    ).map(([line, label, amount]) => (
                      <tr key={label}>
                        <td className="w-10 py-2.5 text-ink-muted">{line}</td>
                        <td className="py-2.5 font-ui text-[13.5px] text-ink-soft">{label}</td>
                        <td className="py-2.5 text-right text-ink">{amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 flex items-end justify-between border-t-2 border-double border-ink pt-4">
                  <div>
                    <p className="text-[13px] text-ink-muted">
                      {previewTab === "1040" ? "Refund to direct deposit" : "Tax saved this year"}
                    </p>
                    <p className="mt-0.5 font-display text-[40px] leading-none text-ink">
                      {previewTab === "1040" ? "$7,133" : "$184,500"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg italic text-ink">R. Sterling</p>
                    <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-muted">Preparer, CPA</p>
                  </div>
                </div>

                {/* Review stamp */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-3 -top-12 hidden sm:flex bg-white/70 backdrop-blur-[1px] h-[92px] w-[92px] rotate-[-12deg] flex-col items-center justify-center rounded-full border-2 border-brass/70 text-center text-brass-dark/90 sm:-right-6"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em]">Polaris</span>
                  <span className="font-display text-[17px] font-semibold uppercase leading-tight tracking-wide">Reviewed</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em]">CPA · 2025</span>
                </div>
              </div>
              <p className="mt-3 pl-1 text-[12.5px] text-ink-muted">Sample figures for illustration.</p>
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
            <p className="eyebrow lg:col-span-3 lg:pt-3">How it works</p>
            <h2 className="font-display text-[36px] leading-[1.1] text-ink sm:text-[46px] lg:col-span-9">
              Three steps, and no software asking you questions you can&apos;t answer.
            </h2>
          </div>

          <ol className="mt-14 grid gap-px overflow-hidden border border-paper-line bg-paper-line md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="bg-paper p-8 lg:p-10">
                <span className="font-display text-[56px] leading-none text-brass">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-8 text-xl font-semibold text-ink">{step.title}</h3>
                <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

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

      {/* Estimator */}
      <section id="estimator" className="scroll-mt-28 border-b border-paper-line bg-paper-deep/60">
        <span id="calculator" className="sr-only" aria-hidden />
        <div className="site-container py-20 lg:py-28">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">Quick estimate</p>
              <h2 className="mt-5 font-display text-[36px] leading-[1.1] text-ink sm:text-[42px]">
                Roughly where will you land this year?
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-ink-soft">
                A back-of-the-envelope number for your 2025 return (the one you file in 2026), using IRS brackets
                and standard deductions for tax year 2025. Your actual return will depend on the details, which is
                what we&apos;re for.
              </p>
            </div>

            <div className="inline-flex self-start rounded-[3px] border border-paper-line bg-paper p-1 md:self-auto">
              {[
                { id: "individual" as const, label: "Individual" },
                { id: "corporate" as const, label: "Business" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCalcMode(m.id)}
                  className={cn(
                    "rounded-[2px] px-5 py-2 text-sm font-medium transition-colors",
                    calcMode === m.id ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 grid overflow-hidden rounded-[4px] border border-paper-line bg-white lg:grid-cols-12">
            {/* Inputs */}
            <div className="p-6 sm:p-10 lg:col-span-7">
              {calcMode === "individual" ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="est-income" className="field-label">Total income</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted">$</span>
                      <input
                        id="est-income"
                        type="number"
                        value={income}
                        onChange={(e) => setIncome(Number(e.target.value))}
                        className="field pl-7 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="est-withheld" className="field-label">Federal tax already withheld</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted">$</span>
                      <input
                        id="est-withheld"
                        type="number"
                        value={withholding}
                        onChange={(e) => setWithholding(Number(e.target.value))}
                        className="field pl-7 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="est-status" className="field-label">Filing status</label>
                    <select
                      id="est-status"
                      value={filingStatus}
                      onChange={(e) => setFilingStatus(e.target.value as any)}
                      className="field"
                    >
                      <option value="single">Single</option>
                      <option value="married">Married filing jointly</option>
                      <option value="hoh">Head of household</option>
                    </select>
                  </div>
                  <div>
                    <span className="field-label">Qualifying children</span>
                    <div className="flex h-11 items-center rounded-[3px] border border-paper-line">
                      <button
                        type="button"
                        aria-label="Fewer children"
                        onClick={() => setDependents(Math.max(0, dependents - 1))}
                        className="flex h-full w-11 items-center justify-center text-ink-soft hover:bg-paper"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="flex-1 text-center font-mono text-[15px] text-ink">{dependents}</span>
                      <button
                        type="button"
                        aria-label="More children"
                        onClick={() => setDependents(dependents + 1)}
                        className="flex h-full w-11 items-center justify-center text-ink-soft hover:bg-paper"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-ink-muted sm:col-span-2">
                    Uses the {formatCurrency(individualEstimate.deduction)} standard deduction and{" "}
                    {formatCurrency(individualEstimate.credits)} in child tax credit ($2,200 per child for 2025).
                    Doesn&apos;t include state tax, self-employment tax, credit phase-outs or itemized deductions.
                  </p>
                </div>
              ) : (
                <div className="space-y-9">
                  <div>
                    <div className="mb-3 flex items-baseline justify-between">
                      <label htmlFor="revRange" className="field-label mb-0">Annual revenue</label>
                      <span className="font-mono text-[15px] text-ink">{formatCurrency(revenue)}</span>
                    </div>
                    <input
                      id="revRange"
                      type="range"
                      min="2000000"
                      max="50000000"
                      step="500000"
                      value={revenue}
                      onChange={(e) => setRevenue(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-paper-line accent-[#A97C32]"
                    />
                    <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-muted">
                      <span>$2M</span>
                      <span>$25M</span>
                      <span>$50M</span>
                    </div>
                  </div>

                  <div>
                    <span className="field-label">Entity type</span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { id: "c-corp", label: "C-Corp" },
                        { id: "s-corp", label: "S-Corp" },
                        { id: "partnership", label: "Partnership" },
                        { id: "multi-holdco", label: "Holding group" },
                      ].map((ent) => (
                        <button
                          key={ent.id}
                          type="button"
                          onClick={() => setEntityType(ent.id as any)}
                          className={cn(
                            "rounded-[3px] border px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                            entityType === ent.id
                              ? "border-ink bg-ink text-paper"
                              : "border-paper-line text-ink-soft hover:border-ink/40"
                          )}
                        >
                          {ent.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-baseline justify-between">
                      <label htmlFor="rdRange" className="field-label mb-0">US engineering &amp; R&amp;D spend</label>
                      <span className="font-mono text-[15px] text-ink">{formatCurrency(rdSpend)}</span>
                    </div>
                    <input
                      id="rdRange"
                      type="range"
                      min="200000"
                      max="15000000"
                      step="100000"
                      value={rdSpend}
                      onChange={(e) => setRdSpend(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-paper-line accent-[#A97C32]"
                    />
                    <p className="mt-3 text-[13.5px] text-ink-muted">
                      Qualifying spend can offset payroll tax (up to $500K a year) or federal income tax under §41.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Result */}
            <div className="flex flex-col justify-between border-t border-paper-line bg-paper/60 p-6 sm:p-10 lg:col-span-5 lg:border-l lg:border-t-0">
              {calcMode === "individual" ? (
                <div>
                  <p className="text-sm text-ink-muted">
                    {individualEstimate.refund >= 0 ? "Estimated federal refund" : "Estimated amount you'd owe"}
                  </p>
                  <p
                    className={cn(
                      "mt-2 font-display text-[56px] leading-none",
                      individualEstimate.refund >= 0 ? "text-ink" : "text-brass-dark"
                    )}
                  >
                    {formatCurrency(Math.abs(individualEstimate.refund))}
                  </p>
                  <dl className="mt-8 divide-y divide-dashed divide-paper-line border-y border-paper-line font-mono text-[13.5px]">
                    <div className="flex justify-between py-3">
                      <dt className="font-ui text-ink-soft">Federal tax</dt>
                      <dd className="text-ink">{formatCurrency(individualEstimate.tax)}</dd>
                    </div>
                    <div className="flex justify-between py-3">
                      <dt className="font-ui text-ink-soft">Already withheld</dt>
                      <dd className="text-ink">{formatCurrency(withholding)}</dd>
                    </div>
                    <div className="flex justify-between py-3">
                      <dt className="font-ui text-ink-soft">Standard deduction</dt>
                      <dd className="text-ink">{formatCurrency(individualEstimate.deduction)}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-ink-muted">Estimated annual tax savings</p>
                  <p className="mt-2 font-display text-[56px] leading-none text-ink">
                    {formatCurrency(corporateSavings.totalShield)}
                  </p>
                  <dl className="mt-8 divide-y divide-dashed divide-paper-line border-y border-paper-line font-mono text-[13.5px]">
                    <div className="flex justify-between py-3">
                      <dt className="font-ui text-ink-soft">R&amp;D credit (§41)</dt>
                      <dd className="text-ink">{formatCurrency(corporateSavings.rdCredit)}</dd>
                    </div>
                    <div className="flex justify-between py-3">
                      <dt className="font-ui text-ink-soft">State apportionment &amp; PTET</dt>
                      <dd className="text-ink">{formatCurrency(corporateSavings.ptet)}</dd>
                    </div>
                    <div className="flex justify-between py-3">
                      <dt className="font-ui text-ink-soft">Depreciation (§179 / bonus)</dt>
                      <dd className="text-ink">{formatCurrency(corporateSavings.depreciation)}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <div className="mt-8">
                <Link
                  href={calcMode === "individual" ? primaryHref : "#book-consultation"}
                  className="btn-ink w-full"
                >
                  {calcMode === "individual" ? "Get the real number" : "Discuss this with a partner"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-3 text-center text-[12.5px] text-ink-muted">An estimate only, not tax advice.</p>
              </div>
            </div>
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
                    ? "border-ink bg-ink text-paper lg:-my-4 lg:rounded-[4px] lg:py-14"
                    : "border-paper-line bg-white",
                  i === 0 && "lg:border-r-0",
                  i === 2 && "lg:border-l-0"
                )}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-[26px]">{tier.name}</h3>
                  {tier.featured && (
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brass-light">Most chosen</span>
                  )}
                </div>
                <p className={cn("mt-1 text-[14px]", tier.featured ? "text-paper/60" : "text-ink-muted")}>{tier.for}</p>

                <div className={cn("mt-8 border-t pt-6", tier.featured ? "border-paper/15" : "border-paper-line")}>
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-[52px] leading-none">{tier.price}</span>
                    <span className={cn("whitespace-nowrap text-sm", tier.featured ? "text-paper/60" : "text-ink-muted")}>{tier.unit}</span>
                  </p>
                  <p className={cn("mt-2 font-mono text-[11.5px]", tier.featured ? "text-paper/50" : "text-ink-muted")}>{tier.note}</p>
                </div>

                <ul className="mt-8 flex-1 space-y-3 text-[14.5px]">
                  {tier.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className={cn("mt-[9px] h-px w-3 shrink-0", tier.featured ? "bg-brass-light" : "bg-brass")} />
                      <span className={tier.featured ? "text-paper/85" : "text-ink-soft"}>{item}</span>
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

      {/* Clients */}
      <section className="border-b border-paper-line bg-paper-deep/60">
        <div className="site-container py-20 lg:py-28">
          <p className="eyebrow">From our clients</p>
          <div className="mt-10 grid gap-14 lg:grid-cols-12">
            <figure className="lg:col-span-7">
              <blockquote className="font-display text-[28px] leading-[1.3] text-ink sm:text-[34px]">
                &ldquo;I used to dread filing with a W-2 and a side LLC. My CPA walked me through every deduction and
                found $3,800 I&apos;d missed two years running.&rdquo;
              </blockquote>
              <figcaption className="mt-8 text-[15px]">
                <span className="font-semibold text-ink">Marcus Lin</span>
                <span className="text-ink-muted"> · Engineer and consultant, Austin</span>
              </figcaption>
            </figure>

            <div className="space-y-10 border-t border-paper-line pt-10 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
              <figure>
                <blockquote className="text-[16.5px] leading-relaxed text-ink-soft">
                  &ldquo;The R&amp;D credit work paid for the advisory retainer several times over, and they answer the
                  phone.&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-[14px]">
                  <span className="font-semibold text-ink">Sonia Kapoor</span>
                  <span className="text-ink-muted"> · CFO, Algomap</span>
                </figcaption>
              </figure>
              <figure className="border-t border-paper-line pt-10">
                <blockquote className="text-[16.5px] leading-relaxed text-ink-soft">
                  &ldquo;When we sold the company, their QSBS planning saved our family more than $1.2M in capital
                  gains tax.&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-[14px]">
                  <span className="font-semibold text-ink">David Reynolds</span>
                  <span className="text-ink-muted"> · Founder, Payshift</span>
                </figcaption>
              </figure>
            </div>
          </div>
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

      <ClosingCta
        title="Filing season is easier when it starts early."
        body="Open an account in two minutes and upload documents as they arrive. We'll start on your return as soon as we have what we need."
        primary={{ href: primaryHref, label: primaryLabel }}
        secondary={{ href: "/book-appointment", label: "Talk to a CPA first" }}
      />
    </PublicLayout>
  );
}
