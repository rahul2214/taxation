"use client";

import Image from "next/image";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle,
  CheckCircle2,
  Zap,
  Users,
  Check,
  ShieldCheck,
  Briefcase,
  Building2,
  Globe,
  Calculator,
  Minus,
  Plus,
  ArrowRight,
  Clock,
  Eye,
  Award,
  Lock,
  FileText,
  Headphones,
} from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Autoplay from "embla-carousel-autoplay";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS } from "@/data/blogs";
import { HomeAppointmentBooking } from "@/components/home/HomeAppointmentBooking";
import { useFirebase } from "@/firebase";
import { getCachedAuth } from "@/lib/cache/auth-cache";

const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
const serviceImages = {
  personal: PlaceHolderImages.find(p => p.id === 'service-personal-tax'),
  business: PlaceHolderImages.find(p => p.id === 'service-business-tax'),
  audit: PlaceHolderImages.find(p => p.id === 'service-audit-support'),
};

const trustPillars = [
  {
    icon: <Award className="h-6 w-6 text-blue-600" />,
    title: "100% Accuracy Guarantee",
    description: "Calculations backed by certified CPA verification. Any IRS calculation penalty is reimbursed in full.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-blue-600" />,
    title: "Maximum Legal Refund",
    description: "Every eligible deduction and tax credit is scanned across federal, state, and local schedules.",
  },
  {
    icon: <Lock className="h-6 w-6 text-blue-600" />,
    title: "IRC § 7216 Data Protection",
    description: "Your financial records are guarded by strict federal privacy standards and 256-bit TLS bank encryption.",
  },
  {
    icon: <Headphones className="h-6 w-6 text-blue-600" />,
    title: "Year-Round CPA Advisory",
    description: "Direct consultation with licensed professionals available 12 months a year, not just in April.",
  },
];

const testimonials = [
  {
    name: "David Vance",
    role: "Founder, Apex Logistics LLC",
    text: "Switching from standard retail tax software to Polaris saved our LLC over $7,400 in overlooked depreciation credits. Their CPA reviewed our books and filed within 72 hours.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
    fallback: "DV",
  },
  {
    name: "Sarah Jenkins",
    role: "Senior Engineering Manager",
    text: "With multi-state income, RSUs, and rental property, tax season used to be a nightmare. Polaris made the upload effortless and provided clear tax projection for the upcoming year.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120",
    fallback: "SJ",
  },
  {
    name: "Michael Chen",
    role: "Independent Consultant",
    text: "Accurate, responsive, and completely professional. When the IRS sent an automated inquiry, Polaris handled the correspondence and resolved it completely without penalties.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120",
    fallback: "MC",
  },
];

const plans = [
  {
    id: "personal",
    title: "Individual & Family",
    badge: "Most Common",
    description: "Full federal & state preparation for W-2 earners, families, and retirement income.",
    price: "$59",
    pricePeriod: "base filing fee",
    features: [
      "Federal Form 1040 & State Return",
      "W-2, 1099-INT, & 1099-DIV Filing",
      "Child Tax Credit & EITC Optimization",
      "Direct Deposit Rapid Refund Tracking",
      "Free IRS e-File Confirmation",
    ],
    buttonText: "Start Individual Return",
  },
  {
    id: "business",
    title: "Small Business & LLC",
    badge: "Recommended",
    description: "Comprehensive tax returns for sole proprietors, freelancers, LLCs, and 1099 contractors.",
    price: "$199",
    pricePeriod: "starts at",
    features: [
      "Schedule C & 1099-NEC Expense Structuring",
      "Single & Multi-Member LLC Schedules",
      "Home Office & Vehicle Deduction Scans",
      "Quarterly Estimated Tax Projections",
      "Direct CPA Return Review & Sign-Off",
    ],
    buttonText: "Start Business Return",
  },
  {
    id: "bookkeeping",
    title: "Corporate & Advisory",
    badge: "Enterprise",
    description: "End-to-end tax preparation, S-Corp compliance, and year-round bookkeeping.",
    price: "$250",
    pricePeriod: "/month",
    features: [
      "Form 1120, 1120-S & 1065 Preparation",
      "K-1 Shareholder Distribution Statements",
      "Monthly Financial Reconciliation",
      "Full IRS Notice & Audit Defense",
      "Dedicated Senior CPA Account Manager",
    ],
    buttonText: "Schedule Consultation",
  },
];

function TaxEstimator() {
  const [income, setIncome] = useState(65000);
  const [filingStatus, setFilingStatus] = useState("single");
  const [dependents, setDependents] = useState(0);
  const [withholding, setWithholding] = useState(7200);

  const estimatedTax = useMemo(() => {
    const standardDeductions: { [key: string]: number } = {
      single: 14600,
      married: 29200,
      hoh: 21900,
    };

    const taxBrackets: { [key: string]: { rate: number; amount: number }[] } = {
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

    const deduction = standardDeductions[filingStatus] || 0;
    const childCredit = dependents * 2000;

    let taxableIncome = income - deduction;
    if (taxableIncome < 0) taxableIncome = 0;

    let tax = 0;
    let remainingIncome = taxableIncome;
    let previousLimit = 0;
    const brackets = taxBrackets[filingStatus] || taxBrackets.single;

    for (const bracket of brackets) {
      if (remainingIncome > 0) {
        const taxableInBracket = Math.min(remainingIncome, bracket.amount - previousLimit);
        tax += taxableInBracket * bracket.rate;
        remainingIncome -= taxableInBracket;
        previousLimit = bracket.amount;
      }
    }

    let refund = withholding - (tax - childCredit);
    return { refund: Math.round(refund) };
  }, [income, filingStatus, dependents, withholding]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card id="calculator" className="w-full max-w-4xl mx-auto border border-slate-200 bg-white shadow-sm scroll-mt-20">
      <CardHeader className="text-center pb-2">
        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-blue-50 text-blue-600 mx-auto mb-3">
          <Calculator className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl md:text-3xl font-headline font-bold text-slate-900">
          Interactive Federal Tax Estimator
        </CardTitle>
        <CardDescription className="text-slate-500 text-sm max-w-lg mx-auto">
          Calculate your projected refund or liability using current IRS tax brackets and standard deductions.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="income" className="text-xs font-semibold text-slate-700">
                Annual Gross Income ($)
              </Label>
              <Input
                id="income"
                type="number"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                placeholder="65000"
                className="h-10 text-sm border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="withholding" className="text-xs font-semibold text-slate-700">
                Federal Tax Withheld ($)
              </Label>
              <Input
                id="withholding"
                type="number"
                value={withholding}
                onChange={(e) => setWithholding(Number(e.target.value))}
                placeholder="7200"
                className="h-10 text-sm border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filing-status" className="text-xs font-semibold text-slate-700">
                Filing Status
              </Label>
              <Select value={filingStatus} onValueChange={setFilingStatus}>
                <SelectTrigger id="filing-status" className="h-10 text-sm border-slate-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married Filing Jointly</SelectItem>
                  <SelectItem value="hoh">Head of Household</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dependents" className="text-xs font-semibold text-slate-700">
                Eligible Dependents
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 border-slate-200"
                  onClick={() => setDependents(Math.max(0, dependents - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="dependents"
                  type="number"
                  value={dependents}
                  onChange={(e) => setDependents(Math.max(0, Number(e.target.value)))}
                  className="h-10 text-center text-sm border-slate-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 border-slate-200"
                  onClick={() => setDependents(dependents + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {estimatedTax.refund >= 0 ? "Projected Federal Refund" : "Projected Tax Due"}
              </span>
              <div
                className={`text-4xl lg:text-5xl font-bold tracking-tight ${
                  estimatedTax.refund >= 0 ? "text-blue-600" : "text-amber-600"
                }`}
              >
                {formatCurrency(Math.abs(estimatedTax.refund))}
              </div>
              <p className="text-[11px] text-slate-500 leading-normal pt-2">
                Estimator incorporates standard deduction & child credits. Actual return amounts may be optimized further by our CPAs through itemized schedule scans.
              </p>
              <div className="pt-2">
                <Button asChild size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs">
                  <a href="#book-appointment">Verify with a CPA</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const AnimatedCounter = ({
  target,
  duration = 2000,
  prefix = "",
  suffix = "",
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const startTime = Date.now();
          const animate = () => {
            const currentTime = Date.now();
            const progress = currentTime - startTime;
            const currentCount = Math.min(Math.floor((progress / duration) * target), target);
            setCount(currentCount);

            if (currentCount < target) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => {
      if (countRef.current) {
        observer.unobserve(countRef.current);
      }
    };
  }, [target, duration]);

  const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num);

  return (
    <span ref={countRef}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
};

export default function Home() {
  const plugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

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
  const bottomLabel = activeUser ? "Go to Dashboard" : "Create Client Account";

  return (
    <PublicLayout>
      <div className="flex flex-col bg-slate-50 min-h-screen text-slate-900">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>IRS Authorized e-File Provider & Licensed CPAs</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-slate-950 tracking-tight leading-[1.12]">
                Institutional-Grade Tax Preparation & Strategic Advisory
              </h1>

              {/* Subheadline */}
              <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed">
                Maximize your federal & state return with dedicated CPAs and IRS Enrolled Agents. Accurate, audit-defended, and delivered with total transparency.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Button asChild size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-12 shadow-xs">
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold px-8 h-12">
                  <a href="#book-appointment">Book CPA Consultation</a>
                </Button>
              </div>

              {/* Trust Indicators Bar */}
              <div className="pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>100% Calculation Guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Maximum Legal Refund</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Bank-Grade 256-Bit TLS</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Year-Round Audit Defense</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Firm Credibility & Metric Strip */}
        <section className="py-14 bg-slate-900 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              <div className="pt-4 lg:pt-0">
                <div className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                  <AnimatedCounter target={99.9} suffix="%" />
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-medium">Calculation Accuracy Rate</p>
              </div>
              <div className="pt-4 lg:pt-0">
                <div className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                  <AnimatedCounter target={10000} suffix="+" />
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-medium">Federal & State Returns</p>
              </div>
              <div className="pt-4 lg:pt-0">
                <div className="text-3xl md:text-4xl font-bold tracking-tight text-blue-400">
                  <AnimatedCounter target={4280} prefix="$" suffix="+" />
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-medium">Avg. Deductions Uncovered</p>
              </div>
              <div className="pt-4 lg:pt-0">
                <div className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                  365 Days
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-medium">Year-Round CPA Advisory</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Trust Pillars */}
        <section className="py-16 md:py-20 bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-950">
                Why Discerning Taxpayers Choose Polaris
              </h2>
              <p className="mt-2 text-slate-600 text-sm md:text-base">
                We combine modern digital workflows with the rigorous oversight of certified public accountants.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustPillars.map((pillar, idx) => (
                <div key={idx} className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 w-fit">
                    {pillar.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base">{pillar.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tax Estimator Section */}
        <section className="py-16 md:py-20 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <TaxEstimator />
          </div>
        </section>

        {/* Core Services Section */}
        <section className="py-16 md:py-20 bg-white border-y border-slate-200">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-950">
                Comprehensive Tax & Advisory Services
              </h2>
              <p className="mt-2 text-slate-600 text-sm md:text-base">
                End-to-end filing for individuals, growing businesses, and complex asset portfolios.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Service 1 */}
              <Card className="border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  {serviceImages.personal && (
                    <Image
                      src={serviceImages.personal.imageUrl}
                      alt="Individual Tax Filing"
                      width={600}
                      height={320}
                      className="w-full h-44 object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold text-slate-900">Individual & Family Returns</CardTitle>
                    <CardDescription className="text-xs">
                      Form 1040, multi-state income, RSUs, crypto, and rental real estate.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Itemized and standard deduction comparison</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Capital gains and investment schedule optimization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Free direct e-filing with IRS confirmation</span>
                    </div>
                  </CardContent>
                </div>
                <CardFooter className="pt-4 border-t border-slate-100">
                  <Button asChild variant="outline" className="w-full border-slate-300 text-slate-800 text-xs font-semibold">
                    <Link href="/services">Explore Individual Services</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Service 2 */}
              <Card className="border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  {serviceImages.business && (
                    <Image
                      src={serviceImages.business.imageUrl}
                      alt="Small Business Tax Services"
                      width={600}
                      height={320}
                      className="w-full h-44 object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold text-slate-900">Small Business & LLCs</CardTitle>
                    <CardDescription className="text-xs">
                      Schedule C, Single-Member & Multi-Member LLCs, S-Corp elections.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Section 179 equipment depreciation & vehicle deductions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Quarterly estimated tax calculations & voucher generation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Self-employment tax reduction strategies</span>
                    </div>
                  </CardContent>
                </div>
                <CardFooter className="pt-4 border-t border-slate-100">
                  <Button asChild variant="outline" className="w-full border-slate-300 text-slate-800 text-xs font-semibold">
                    <Link href="/services">Explore Business Services</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Service 3 */}
              <Card className="border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  {serviceImages.audit && (
                    <Image
                      src={serviceImages.audit.imageUrl}
                      alt="IRS Audit Support"
                      width={600}
                      height={320}
                      className="w-full h-44 object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold text-slate-900">IRS Audit & Notice Defense</CardTitle>
                    <CardDescription className="text-xs">
                      Representation and penalty abatement by licensed IRS Enrolled Agents.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>CP2000 & CP504 notice analysis and defense</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Formal correspondence and documentation packages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Offer in compromise and installment agreement filings</span>
                    </div>
                  </CardContent>
                </div>
                <CardFooter className="pt-4 border-t border-slate-100">
                  <Button asChild variant="outline" className="w-full border-slate-300 text-slate-800 text-xs font-semibold">
                    <Link href="/services">Explore Audit Representation</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Appointment Booking Section */}
        <HomeAppointmentBooking />

        {/* Transparent Filing Plans Section */}
        <section className="py-16 md:py-20 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-950">
                Transparent, Upfront Pricing
              </h2>
              <p className="mt-2 text-slate-600 text-sm md:text-base">
                No hidden state add-on surprises. Every package includes direct CPA review before IRS submission.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`flex flex-col bg-white border ${
                    plan.badge === "Recommended"
                      ? "border-blue-600 ring-1 ring-blue-600 shadow-md relative"
                      : "border-slate-200 shadow-xs"
                  }`}
                >
                  {plan.badge === "Recommended" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-xl font-bold text-slate-900">{plan.title}</CardTitle>
                    <p className="text-xs text-slate-500 pt-1 leading-relaxed">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="flex-grow p-6 pt-0">
                    <div className="mb-6 pb-4 border-b border-slate-100">
                      <span className="text-4xl font-bold text-slate-950">{plan.price}</span>
                      <span className="text-xs text-slate-500 ml-1.5">{plan.pricePeriod}</span>
                    </div>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button
                      asChild
                      className={`w-full font-semibold text-xs h-10 ${
                        plan.badge === "Recommended"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      <Link href="/signup">{plan.buttonText}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Client Testimonials */}
        <section className="py-16 md:py-20 bg-white border-t border-slate-200">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-950">
                Verified Client Experiences
              </h2>
              <p className="mt-2 text-slate-600 text-sm md:text-base">
                Read how our CPAs deliver measurable tax reductions and complete peace of mind.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t, index) => (
                <Card key={index} className="border border-slate-200 bg-slate-50/40 p-6 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-1 text-blue-600 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-base">★</span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      "{t.text}"
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-200/60 mt-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-200">
                      <AvatarImage src={t.avatar} alt={t.name} />
                      <AvatarFallback>{t.fallback}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{t.name}</p>
                      <p className="text-[11px] text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tax Insights & Regulatory Articles */}
        <section className="py-16 md:py-20 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-950">
                  Latest Tax News, Insights & Guides
                </h2>
                <p className="mt-2 text-slate-600 max-w-2xl text-sm">
                  Verified tax planning tips, IRS regulation breakdowns, and deduction guides curated by our licensed CPAs.
                </p>
              </div>
              <Button asChild variant="outline" className="shrink-0 border-slate-300 text-slate-800 text-xs font-semibold">
                <Link href="/blogs" className="flex items-center gap-1.5">
                  <span>View All Articles</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {BLOG_POSTS.slice(0, 3).map((post) => (
                <Card
                  key={post.id}
                  className="group flex flex-col justify-between overflow-hidden border border-slate-200 bg-white hover:border-slate-300 shadow-xs transition-all duration-200 rounded-xl p-6"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200 font-semibold text-[11px]">
                        {post.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </div>
                    </div>

                    <Link href={`/blogs/${post.slug}`}>
                      <h3 className="font-headline font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{post.author.name}</span>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium text-xs flex items-center gap-1"
                    >
                      <Link href={`/blogs/${post.slug}`}>
                        Read Guide
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security & Bank-Grade Compliance */}
        <section className="py-14 bg-white border-t border-slate-200">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="mx-auto max-w-2xl space-y-3">
              <ShieldCheck className="h-10 w-10 text-blue-600 mx-auto" />
              <h2 className="text-2xl font-headline font-bold text-slate-950">
                Guarding Your Data with Institutional Security
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your financial records and tax identity are protected under IRS IRC § 7216 confidentiality rules and 256-bit TLS bank encryption. Data is never shared or sold without explicit written consent.
              </p>
            </div>
          </div>
        </section>

        {/* Executive Bottom CTA */}
        <section className="py-16 md:py-20 bg-slate-950 text-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">
              Ready to File with Complete Confidence?
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-slate-400">
              Join thousands of individuals and small businesses who trust Polaris Tax Services for their annual filings.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Button asChild size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-12 shadow-xs">
                <Link href={primaryHref}>{bottomLabel}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-slate-700 text-white hover:bg-slate-900 font-semibold px-8 h-12">
                <a href="#book-appointment">Schedule Strategy Session</a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
