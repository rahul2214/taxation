"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Award,
  Lock,
  ArrowRight,
  Calculator,
  Check,
  Building2,
  TrendingDown,
  Briefcase,
  Layers,
  ChevronRight,
  Clock,
  Globe,
  FileCheck2,
  Sliders,
  DollarSign,
  UserCheck,
  Minus,
  Plus,
  FileText,
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
  Users,
  Receipt,
  Star,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import { BLOG_POSTS } from "@/data/blogs";
import { HomeAppointmentBooking } from "@/components/home/HomeAppointmentBooking";
import { useFirebase } from "@/firebase";
import { getCachedAuth } from "@/lib/cache/auth-cache";

// Institutional client badges (monochrome, executive)
const CLIENT_LOGOS = [
  { name: "Apex Ventures", tag: "Venture Capital" },
  { name: "Meridian Bio", tag: "Life Sciences" },
  { name: "Kestrel Logistics", tag: "Supply Chain" },
  { name: "Horizon AI", tag: "Enterprise SaaS" },
  { name: "Vesper Capital", tag: "Private Equity" },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { user } = useFirebase();
  const cached = mounted ? getCachedAuth() : { user: null, role: null, isAdmin: false };
  const activeUser = mounted ? user || cached.user : null;
  const isAdmin = cached.isAdmin || activeUser?.role === "admin" || activeUser?.role === "superadmin";
  const primaryHref = activeUser ? (isAdmin ? "/admin" : "/dashboard") : "/signup";
  const primaryLabel = activeUser ? "Go to Dashboard" : "Start Filing Online";

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

  // Hero Preview Card State (interactive preview)
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
    const standardDeductions: Record<string, number> = {
      single: 14600,
      married: 29200,
      hoh: 21900,
    };

    const brackets: Record<string, { rate: number; amount: number }[]> = {
      single: [
        { rate: 0.1, amount: 11600 },
        { rate: 0.12, amount: 47150 },
        { rate: 0.22, amount: 100500 },
        { rate: 0.24, amount: 191950 },
        { rate: 0.32, amount: 243700 },
        { rate: 0.35, amount: 609350 },
        { rate: 0.37, amount: Infinity },
      ],
      married: [
        { rate: 0.1, amount: 23200 },
        { rate: 0.12, amount: 94300 },
        { rate: 0.22, amount: 201050 },
        { rate: 0.24, amount: 383900 },
        { rate: 0.32, amount: 487450 },
        { rate: 0.35, amount: 731200 },
        { rate: 0.37, amount: Infinity },
      ],
      hoh: [
        { rate: 0.1, amount: 16550 },
        { rate: 0.12, amount: 63100 },
        { rate: 0.22, amount: 100500 },
        { rate: 0.24, amount: 191950 },
        { rate: 0.32, amount: 243700 },
        { rate: 0.35, amount: 609350 },
        { rate: 0.37, amount: Infinity },
      ],
    };

    const deduction = standardDeductions[filingStatus] || 14600;
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

    const credits = dependents * 2000;
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

  return (
    <PublicLayout>
      <div className="bg-white text-slate-900 selection:bg-blue-100 selection:text-slate-900">
        {/* ========================================================= */}
        {/* SECTION 1: SPLIT HERO SECTION                             */}
        {/* High-converting 2-column layout with live interactive card */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 pt-10 pb-16 lg:pt-16 lg:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Core Positioning & CTAs */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                {/* Eyebrow Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 tracking-wide mb-6 w-fit">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>IRS AUTHORIZED e-FILE PROVIDER • LICENSED CPAs &amp; ENROLLED AGENTS</span>
                </div>

                {/* Primary Headline */}
                <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-6">
                  Tax Strategy &amp; Precision e-Filing Built for Modern High-Earners, Founders &amp; Businesses.
                </h1>

                {/* Subheadline */}
                <p className="font-body text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mb-8">
                  Maximize your deductions, eliminate audit exposure, and file with 100% CPA accuracy. We combine institutional-grade tax strategy with secure online e-filing for individuals and companies across all 50 states.
                </p>

                {/* Dual Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-10">
                  <Link
                    href={primaryHref}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold text-sm px-7 py-3.5 rounded-md hover:bg-blue-700 transition-colors shadow-sm text-center"
                  >
                    <span>{primaryLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#book-consultation"
                    className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold text-sm px-6 py-3.5 rounded-md border border-slate-300 hover:bg-slate-50 transition-colors text-center shadow-xs"
                  >
                    <span>Book CPA Consultation</span>
                  </a>
                </div>

                {/* Micro-Trust Checks */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>IRS Authorized Direct e-File</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>100% CPA Accuracy Guarantee</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>256-Bit Bank-Grade Vault</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive CPA Return Preview Card */}
              <div className="lg:col-span-5">
                <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 sm:p-7 shadow-xl">
                  {/* Card Header & Tab Switcher */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                        Live Filing Snapshot
                      </span>
                    </div>
                    <div className="inline-flex p-0.5 bg-slate-800 rounded-md border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPreviewTab("1040")}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded transition-colors ${
                          previewTab === "1040"
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Form 1040
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab("business")}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded transition-colors ${
                          previewTab === "business"
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Form 1120-S
                      </button>
                    </div>
                  </div>

                  {previewTab === "1040" ? (
                    <>
                      {/* Return Meta */}
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                        <span>Tax Year 2025 • Individual Filer</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
                          <Check className="h-3 w-3" /> Ready for IRS e-File
                        </span>
                      </div>

                      {/* Main Metric: Refund Display */}
                      <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/60 mb-5">
                        <span className="text-xs text-slate-400 block font-medium">Estimated Direct Deposit Refund</span>
                        <div className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-headline tracking-tight mt-1">
                          $4,320.00
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Calculated with full standard deduction ($14,600) + child tax credit + student interest.
                        </p>
                      </div>

                      {/* Line Items Breakdown */}
                      <div className="space-y-2.5 text-xs text-slate-300 mb-5">
                        <div className="flex justify-between items-center py-1 border-b border-slate-800">
                          <span className="text-slate-400">Total Adjusted Gross Income (AGI)</span>
                          <span className="font-semibold text-white">$125,000</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800">
                          <span className="text-slate-400">Captured Deductions &amp; Credits</span>
                          <span className="font-semibold text-emerald-400">-$16,600</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800">
                          <span className="text-slate-400">Federal Taxes Already Remitted</span>
                          <span className="font-semibold text-white">$24,000</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400">IRS Form 1040 Audit Risk Score</span>
                          <span className="font-semibold text-blue-400">0.02% (Lowest Tier)</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Return Meta Business */}
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                        <span>Tax Year 2025 • S-Corporation / LLC</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-800/60">
                          <Check className="h-3 w-3" /> Audit-Defended
                        </span>
                      </div>

                      {/* Main Metric: Tax Shield Display */}
                      <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/60 mb-5">
                        <span className="text-xs text-slate-400 block font-medium">Captured Annual Corporate Shield</span>
                        <div className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-headline tracking-tight mt-1">
                          $184,500.00
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          IRC § 41 R&amp;D credit + Pass-Through Entity Tax (PTET) + Section 179 depreciation.
                        </p>
                      </div>

                      {/* Line Items Breakdown Business */}
                      <div className="space-y-2.5 text-xs text-slate-300 mb-5">
                        <div className="flex justify-between items-center py-1 border-b border-slate-800">
                          <span className="text-slate-400">Annual Business Gross Revenue</span>
                          <span className="font-semibold text-white">$4,200,000</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800">
                          <span className="text-slate-400">IRC § 41 R&amp;D Wage Capture</span>
                          <span className="font-semibold text-emerald-400">+$68,000</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800">
                          <span className="text-slate-400">PTET State Income Tax Deduction</span>
                          <span className="font-semibold text-emerald-400">+$48,500</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400">Schedule K-1 Partner Allocation</span>
                          <span className="font-semibold text-blue-400">Reconciled ✓</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* CPA Verification Seal & CTA */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 text-xs font-bold">
                        CPA
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Robert Sterling, CPA</p>
                        <p className="text-[10px] text-slate-400">Lead Tax Partner • AICPA #NY-084210</p>
                      </div>
                    </div>
                    <Link
                      href={primaryHref}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <span>Get Started</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: PERFORMANCE METRICS & CLIENT CREDIBILITY STRIP */}
        {/* ========================================================= */}
        <section className="bg-slate-50 py-12 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            {/* 4 Stat Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 pb-10 border-b border-slate-200">
              <div className="flex flex-col">
                <span className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  99.9%
                </span>
                <span className="text-xs font-bold text-slate-900 mt-1">First-Time IRS Acceptance</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Zero-defect electronic filing pipeline</span>
              </div>

              <div className="flex flex-col">
                <span className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  $4,280+
                </span>
                <span className="text-xs font-bold text-slate-900 mt-1">Avg Additional Deductions</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Identified through CPA review vs self-prep</span>
              </div>

              <div className="flex flex-col">
                <span className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  10,000+
                </span>
                <span className="text-xs font-bold text-slate-900 mt-1">Returns Successfully Filed</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Covering all 50 states &amp; international</span>
              </div>

              <div className="flex flex-col">
                <span className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  4.9 / 5.0
                </span>
                <span className="text-xs font-bold text-slate-900 mt-1">Verified Client Trust Score</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Rated by founders &amp; professionals</span>
              </div>
            </div>

            {/* Client Strip */}
            <div className="pt-8">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest text-center mb-6">
                Trusted by founders, professionals, and enterprise finance teams nationwide
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-between gap-6 opacity-75">
                {CLIENT_LOGOS.map((client) => (
                  <div key={client.name} className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>{client.name}</span>
                    <span className="text-[10px] font-normal text-slate-400">({client.tag})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: THE 3-STEP FILING FLOW ("HOW IT WORKS")        */}
        {/* ========================================================= */}
        <section className="py-20 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">
                THE POLARIS WORKFLOW
              </span>
              <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                How Modern Tax Filing Should Work
              </h2>
              <p className="font-body text-slate-600 text-sm sm:text-base mt-3">
                No endless paperwork, no confusing software questions, and no fear of IRS audit notices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                      Step 01
                    </span>
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="font-headline text-xl font-bold text-slate-900 mb-3">
                    Secure Document Vault
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Drag and drop your W-2s, 1099s, K-1s, or financial reports directly into your private 256-bit encrypted portal. We ingest and organize everything automatically.
                  </p>
                </div>
                <div className="text-xs font-medium text-slate-500 border-t border-slate-200 pt-4 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-blue-600" />
                  <span>IRC § 7216 strict privacy guaranteed</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                      Step 02
                    </span>
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="font-headline text-xl font-bold text-slate-900 mb-3">
                    Licensed CPA Optimization
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    A dedicated licensed CPA reviews your data, identifies every available credit (R&amp;D, QBI, PTET, childcare), models filing scenarios, and prepares your full return.
                  </p>
                </div>
                <div className="text-xs font-medium text-slate-500 border-t border-slate-200 pt-4 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-blue-600" />
                  <span>Every return signed by a licensed CPA</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                      Step 03
                    </span>
                    <FileCheck2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="font-headline text-xl font-bold text-slate-900 mb-3">
                    One-Click Review &amp; e-File
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Review your clean tax summary, electronically sign Form 8879 from your phone or desktop, and submit directly to the IRS and State departments with tracking.
                  </p>
                </div>
                <div className="text-xs font-medium text-slate-500 border-t border-slate-200 pt-4 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-blue-600" />
                  <span>Real-time direct deposit refund tracking</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: INTERACTIVE DIAGNOSTIC TAX ESTIMATOR (BENTO)   */}
        {/* ========================================================= */}
        <section id="calculator" className="bg-slate-50 py-20 border-b border-slate-200 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span>Diagnostic Modeling Engine</span>
                </div>
                <h2 className="font-headline text-3xl font-extrabold text-slate-900 tracking-tight">
                  Instant Tax Exposure &amp; Refund Estimator
                </h2>
                <p className="font-body text-slate-600 text-sm sm:text-base mt-2">
                  Simulate your Form 1040 refund or corporate tax shield across federal and multi-state jurisdictions.
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="inline-flex p-1 bg-slate-200 rounded-lg border border-slate-300 shrink-0 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setCalcMode("individual")}
                  className={`text-xs font-semibold px-4 py-2 rounded-md transition-all ${
                    calcMode === "individual"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Individual &amp; Family (Form 1040)
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode("corporate")}
                  className={`text-xs font-semibold px-4 py-2 rounded-md transition-all ${
                    calcMode === "corporate"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Corporate &amp; Enterprise
                </button>
              </div>
            </div>

            {/* Estimator Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Controls Column */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs">
                {calcMode === "individual" ? (
                  /* Individual Form 1040 Controls */
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                          Annual Adjusted Gross Income ($)
                        </label>
                        <input
                          type="number"
                          value={income}
                          onChange={(e) => setIncome(Number(e.target.value))}
                          className="w-full h-11 px-3.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                          Federal Taxes Already Withheld ($)
                        </label>
                        <input
                          type="number"
                          value={withholding}
                          onChange={(e) => setWithholding(Number(e.target.value))}
                          className="w-full h-11 px-3.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                          Tax Filing Status
                        </label>
                        <select
                          value={filingStatus}
                          onChange={(e) => setFilingStatus(e.target.value as any)}
                          className="w-full h-11 px-3.5 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="single">Single Filer</option>
                          <option value="married">Married Filing Jointly</option>
                          <option value="hoh">Head of Household</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                          Eligible Child / Family Dependents
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDependents(Math.max(0, dependents - 1))}
                            className="h-11 w-11 rounded-md border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <div className="flex-1 text-center font-bold text-base">{dependents}</div>
                          <button
                            type="button"
                            onClick={() => setDependents(dependents + 1)}
                            className="h-11 w-11 rounded-md border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-600 leading-relaxed border border-slate-200">
                      Standard deduction applied: <strong className="text-slate-900">{formatCurrency(individualEstimate.deduction)}</strong>. Child Tax Credit applied: <strong className="text-slate-900">{formatCurrency(individualEstimate.credits)}</strong>. All calculations reflect 2025/2026 IRS progressive brackets.
                    </div>
                  </div>
                ) : (
                  /* Corporate Mode Controls */
                  <>
                    {/* Revenue Slider */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="revRange" className="font-headline text-sm font-semibold text-slate-900">
                          Annual Gross Revenue
                        </label>
                        <span className="font-headline text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded border border-blue-200">
                          {formatCurrency(revenue)}
                        </span>
                      </div>
                      <input
                        id="revRange"
                        type="range"
                        min="2000000"
                        max="50000000"
                        step="500000"
                        value={revenue}
                        onChange={(e) => setRevenue(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                        <span>$2M (Seed / Series A)</span>
                        <span>$25M (Mid-Market)</span>
                        <span>$50M+ (Enterprise)</span>
                      </div>
                    </div>

                    {/* Entity Structure Buttons */}
                    <div className="mb-8">
                      <label className="block font-headline text-sm font-semibold text-slate-900 mb-2">
                        Current Entity Architecture
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: "c-corp", label: "C-Corporation" },
                          { id: "s-corp", label: "S-Corporation" },
                          { id: "partnership", label: "Partnership" },
                          { id: "multi-holdco", label: "Multi-Entity HoldCo" },
                        ].map((ent) => (
                          <button
                            key={ent.id}
                            type="button"
                            onClick={() => setEntityType(ent.id as any)}
                            className={`text-xs py-2.5 px-3 rounded-md text-center transition-colors border font-semibold ${
                              entityType === ent.id
                                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {ent.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* R&D Spend Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="rdRange" className="font-headline text-sm font-semibold text-slate-900">
                          Annual US Software, Engineering &amp; R&amp;D Outlay
                        </label>
                        <span className="font-headline text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded border border-blue-200">
                          {formatCurrency(rdSpend)}
                        </span>
                      </div>
                      <input
                        id="rdRange"
                        type="range"
                        min="200000"
                        max="15000000"
                        step="100000"
                        value={rdSpend}
                        onChange={(e) => setRdSpend(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <p className="text-[12px] text-slate-500 mt-2">
                        Qualifies for IRC § 41 credits against payroll tax (up to $500K/yr) or federal corporate income tax.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Right Real-Time Results Column */}
              <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                      {calcMode === "individual" ? "Projected 1040 Settlement" : "Modeled Tax Shield"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Live Calculation
                    </span>
                  </div>

                  {calcMode === "individual" ? (
                    <>
                      {/* Individual Main Metric */}
                      <div className="mb-6">
                        <span className="text-xs font-medium text-slate-500">
                          {individualEstimate.refund >= 0 ? "Projected Federal Refund" : "Projected Tax Due"}
                        </span>
                        <div
                          className={`font-headline text-4xl sm:text-5xl font-black tracking-tight mt-1 ${
                            individualEstimate.refund >= 0 ? "text-blue-600" : "text-amber-600"
                          }`}
                        >
                          {formatCurrency(Math.abs(individualEstimate.refund))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Direct deposit to your verified bank account upon IRS filing.
                        </p>
                      </div>

                      <div className="space-y-3.5 border-t border-slate-100 pt-5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">Calculated Federal Tax Liability:</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(individualEstimate.tax)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">Withholding Already Remitted:</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(withholding)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">Captured Standard Deduction:</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(individualEstimate.deduction)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Corporate Main Metric */}
                      <div className="mb-6">
                        <span className="text-xs font-medium text-slate-500">Estimated Annual Tax Shield</span>
                        <div className="font-headline text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mt-1">
                          {formatCurrency(corporateSavings.totalShield)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Direct reduction in federal and state liabilities.</p>
                      </div>

                      {/* Corporate Breakdown */}
                      <div className="space-y-3.5 border-t border-slate-100 pt-5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-slate-400" />
                            IRC § 41 R&amp;D Credit
                          </span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(corporateSavings.rdCredit)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            State Apportionment &amp; PTET
                          </span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(corporateSavings.ptet)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <Sliders className="h-4 w-4 text-slate-400" />
                            Depreciation &amp; § 179 / Bonus
                          </span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(corporateSavings.depreciation)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Trigger */}
                <div className="pt-6 border-t border-slate-100 mt-6">
                  <Link
                    href={primaryHref}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold text-sm py-3.5 px-4 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <span>{calcMode === "individual" ? "Claim This Refund Online" : "Schedule Corporate Consultation"}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <span className="block text-center text-[11px] text-slate-400 mt-2">
                    Conducted under strict mutual Non-Disclosure Agreement (NDA).
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 5: CORE TAX PRACTICE AREAS (SERVICES GRID)       */}
        {/* ========================================================= */}
        <section id="services" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-16 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-slate-200 gap-6">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">
                PRACTICE AREAS
              </span>
              <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Comprehensive Tax Solutions for Every Stage
              </h2>
            </div>
            <p className="font-body text-slate-600 text-sm max-w-md">
              From personal Form 1040 e-filing to complex cross-border corporate restructurings, our licensed CPAs provide end-to-end tax leadership.
            </p>
          </div>

          {/* 4-Pillar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Service 1: Individual & Form 1040 */}
            <div className="bg-white p-7 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-400 transition-colors shadow-xs">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-5 border border-blue-100">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-headline text-lg font-bold text-slate-900 mb-2">
                  Individual Form 1040 e-Filing
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                  Full federal and multi-state filing for professionals, W-2 employees, tech stock options (ISO/RSU/NSO), crypto transactions, and real estate investments.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 mb-6">
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>Itemized vs Standard deduction audit</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>Alternative Minimum Tax (AMT) defense</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>Multi-state residency allocation</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">From $59 base</span>
                <Link href={primaryHref} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Start Online <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Service 2: Small Business & Pass-Throughs */}
            <div className="bg-white p-7 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-400 transition-colors shadow-xs">
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center mb-5 border border-slate-200">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="font-headline text-lg font-bold text-slate-900 mb-2">
                  Small Business &amp; S-Corps
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                  LLC, S-Corporation (1120-S), and Partnership (1065) preparation with Schedule K-1 allocations, reasonable compensation studies, and PTET elections.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 mb-6">
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>Section 199A QBI 20% deductions</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>State Pass-Through Entity Tax (PTET)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>Quarterly estimated tax modeling</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">From $199 base</span>
                <Link href="#pricing" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View Tiers <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Service 3: Corporate & R&D Credits */}
            <div className="bg-white p-7 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-400 transition-colors shadow-xs">
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center mb-5 border border-slate-200">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="font-headline text-lg font-bold text-slate-900 mb-2">
                  Corporate &amp; R&amp;D Credits
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                  Full corporate Form 1120 filing, IRC § 41 R&amp;D payroll tax credits, Section 1202 QSBS optimization, and multi-state economic nexus defense.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 mb-6">
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>IRC § 41 R&amp;D credit wage studies</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>QSBS $10M+ capital gain exclusion</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>Section 382 NOL ownership tracking</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Corporate Retainer</span>
                <a href="#book-consultation" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Consult Partner <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Service 4: IRS Audit & Notice Defense */}
            <div className="bg-white p-7 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-400 transition-colors shadow-xs">
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center mb-5 border border-slate-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-headline text-lg font-bold text-slate-900 mb-2">
                  IRS Notice &amp; Audit Defense
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                  Full Power of Attorney (Form 2848) representation before the IRS and state authorities. We handle CP2000 notices, audits, penalty abatements, and appeals.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 mb-6">
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>Direct CPA representation before IRS</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>First-time penalty abatement defense</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>Zero direct IRS contact required by you</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Immediate Response</span>
                <a href="#book-consultation" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Open Case <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 6: TRANSPARENT PRICING & RETAINER TIERS           */}
        {/* ========================================================= */}
        <section id="pricing" className="bg-slate-50 py-24 border-b border-slate-200 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">
                CLEAR &amp; PREDICTABLE
              </span>
              <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Transparent Pricing, Zero Hidden Fees
              </h2>
              <p className="font-body text-slate-600 text-sm sm:text-base mt-3">
                No billable surprises. Every package includes direct licensed CPA oversight, audit defense coverage, and fast electronic filing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              {/* Tier 1: Simple Individual Return */}
              <div className="bg-white p-8 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="mb-4">
                    <h3 className="font-headline text-lg font-bold text-slate-900">Individual &amp; Family</h3>
                    <p className="text-xs text-slate-500 mt-1">Form 1040 for W-2 earners, investments, and home owners</p>
                  </div>
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline">
                      <span className="font-headline text-4xl font-extrabold text-slate-900">$59</span>
                      <span className="text-slate-500 text-xs font-medium ml-1.5">base / simple return</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">Itemized / Schedule A: $129 • Extra State: $39</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-700 mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Federal Form 1040 &amp; Primary State Return</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Standard &amp; Itemized Deduction Optimization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Child Tax Credit &amp; Education Credit Capture</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Licensed CPA Pre-Filing Review</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Direct Deposit IRS e-File Tracking</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href={primaryHref}
                  className="w-full text-center py-3 px-4 rounded-md border border-slate-300 font-semibold text-xs text-slate-800 hover:bg-slate-50 transition-colors block shadow-xs"
                >
                  Start My Individual Return
                </Link>
              </div>

              {/* Tier 2: Small Business & Freelancer (Featured) */}
              <div className="bg-white p-8 rounded-xl border-2 border-slate-900 shadow-md flex flex-col justify-between relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
                  Most Popular
                </div>
                <div>
                  <div className="mb-4">
                    <h3 className="font-headline text-lg font-bold text-slate-900">Business &amp; Pass-Through</h3>
                    <p className="text-xs text-slate-500 mt-1">For LLCs, 1099 contractors, and S-Corporation entities</p>
                  </div>
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline">
                      <span className="font-headline text-4xl font-extrabold text-slate-900">$199</span>
                      <span className="text-slate-500 text-xs font-medium ml-1.5">base / Schedule C</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">Form 1120-S / 1065 from $499 flat</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-700 mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-900">Dedicated Senior CPA Tax Manager</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Schedule C / Form 1120-S + K-1 Filings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Section 199A 20% QBI Deduction Calculation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Quarterly Estimated Tax Calculation Vouchers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Full Year-Round Audit Defense Protection</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href={primaryHref}
                  className="w-full text-center py-3 px-4 rounded-md bg-blue-600 font-semibold text-xs text-white hover:bg-blue-700 transition-colors shadow-xs block"
                >
                  File Business Return
                </Link>
              </div>

              {/* Tier 3: Corporate Advisory Retainer */}
              <div className="bg-white p-8 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="mb-4">
                    <h3 className="font-headline text-lg font-bold text-slate-900">Corporate &amp; Advisory</h3>
                    <p className="text-xs text-slate-500 mt-1">High-growth enterprises, multi-state footprints &amp; holding cos</p>
                  </div>
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline">
                      <span className="font-headline text-3xl font-extrabold text-slate-900">$2,500</span>
                      <span className="text-slate-500 text-xs font-medium ml-1.5">/ month retainer</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">Includes all entity returns &amp; strategy</span>
                  </div>
                  <ul className="space-y-3 text-xs text-slate-700 mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Big-Four Veteran Partner Lead Desk</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>IRC § 41 R&amp;D Credit Study &amp; Payroll Offset</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Multi-State Nexus &amp; Apportionment Defense</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Section 1202 QSBS Capital Gain Planning</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Priority 4-Hour Partner Response SLA</span>
                    </li>
                  </ul>
                </div>
                <a
                  href="#book-consultation"
                  className="w-full text-center py-3 px-4 rounded-md border border-slate-300 font-semibold text-xs text-slate-800 hover:bg-slate-50 transition-colors block shadow-xs"
                >
                  Schedule Corporate Consultation
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 7: CLIENT TESTIMONIALS & TRUSTED REVIEWS          */}
        {/* ========================================================= */}
        <section className="max-w-7xl mx-auto px-6 py-24 border-b border-slate-200">
          <div className="max-w-2xl mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">
              CLIENT TESTIMONIALS
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Backed by High-Performing Clients
            </h2>
            <p className="font-body text-slate-600 text-sm sm:text-base mt-2">
              Here is what founders, engineers, and financial executives say about partnering with Polaris.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  &ldquo;Filing both my W-2 and my Schedule C LLC used to be a nightmare of confusing online forms. Polaris had a licensed CPA walk me through every deduction. They found $3,800 in deductions I had overlooked for two years.&rdquo;
                </p>
              </div>
              <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  ML
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Marcus Lin</h4>
                  <p className="text-[11px] text-slate-500">Staff Engineer &amp; Consultant, Austin TX</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  &ldquo;The Section 41 R&amp;D credit defense alone paid for our annual advisory retainer five times over. Polaris delivers Big-Four caliber analysis with the agility and responsiveness of a modern software partner.&rdquo;
                </p>
              </div>
              <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  SK
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Sonia Kapoor</h4>
                  <p className="text-[11px] text-slate-500">Chief Financial Officer, Algomap</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  &ldquo;When I sold my company, the QSBS stacking strategy executed by the Polaris partners saved our founding family over $1.2M in capital gains taxes. Their mastery of the tax code is extraordinary.&rdquo;
                </p>
              </div>
              <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                  DR
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">David Reynolds</h4>
                  <p className="text-[11px] text-slate-500">Founder &amp; Former CEO, Payshift</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 8: SEAMLESS CONSULTATION SCHEDULER                */}
        {/* ========================================================= */}
        <HomeAppointmentBooking />

        {/* ========================================================= */}
        {/* SECTION 9: TAX ARTICLES & RESEARCH GUIDES                 */}
        {/* ========================================================= */}
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">
                  RESEARCH &amp; REGULATORY BRIEFINGS
                </span>
                <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-950">
                  Verified Tax Insights by Licensed CPAs
                </h2>
              </div>
              <Button asChild variant="outline" className="border-slate-300 text-slate-800 text-xs font-semibold shrink-0">
                <Link href="/blogs" className="flex items-center gap-1.5">
                  <span>Browse Research Library</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {BLOG_POSTS.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>

                    <Link href={`/blogs/${post.slug}`}>
                      <h3 className="font-headline font-bold text-base text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">{post.author.name}</span>
                    <Link
                      href={`/blogs/${post.slug}`}
                      className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      Read Briefing <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 10: EXECUTIVE BOTTOM CALL-TO-ACTION               */}
        {/* ========================================================= */}
        <section className="bg-slate-900 text-white py-20 border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400 block mb-3">
              IRS AUTHORIZED E-FILE • DEDICATED CPA OVERSIGHT
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              File Your 2025 Return with 100% CPA Confidence.
            </h2>
            <p className="font-body text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of professionals, high-earners, and growing businesses who trust Polaris for zero-defect tax compliance and maximum legal refund optimization.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link
                href={primaryHref}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold text-sm px-8 py-4 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span>{primaryLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#book-consultation"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 text-white font-semibold text-sm px-7 py-4 rounded-md border border-slate-700 hover:bg-slate-700 transition-colors shadow-xs"
              >
                <span>Book Partner Consultation</span>
              </a>
            </div>

            {/* Bottom Security Seals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span>IRS Authorized e-File Provider</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-blue-400" />
                <span>256-Bit Bank-Grade Vault</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-blue-400" />
                <span>AICPA Peer-Reviewed Firm</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* INSTITUTIONAL SECURITY CREDENTIALS STRIP                 */}
        {/* ========================================================= */}
        <section className="py-10 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center md:justify-between gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-700" />
                <span>AICPA Registered Firm ID #9842104</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-700" />
                <span>SOC 2 Type II Certified Ingestion Pipeline</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-slate-700" />
                <span>IRS IRC § 7216 Strict Confidentiality Standard</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-700" />
                <span>256-Bit TLS Vault Data Encryption</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
