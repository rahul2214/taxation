"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Situation = "individual" | "self" | "business" | "special";
type Goal = "file" | "estimate" | "consult" | "learn";

const SITUATIONS: { value: Situation; label: string; hint: string }[] = [
  { value: "individual", label: "Personal taxes", hint: "W-2, family, investments" },
  { value: "self", label: "Self-employed", hint: "Freelance, 1099, gig work" },
  { value: "business", label: "Business owner", hint: "LLC, company or MNC return" },
  { value: "special", label: "Specialized help", hint: "International, notice, past year" },
];

const GOALS: { value: Goal; label: string }[] = [
  { value: "file", label: "Prepare a return" },
  { value: "estimate", label: "Explore an estimate" },
  { value: "consult", label: "Talk to a professional" },
  { value: "learn", label: "Understand my options" },
];

const SERVICE_FOR: Record<Situation, { name: string; href: string }> = {
  individual: { name: "individual tax services", href: "/services/individual-tax-preparation" },
  self: { name: "self-employed tax services", href: "/services/small-business-tax-preparation" },
  business: { name: "business and MNC tax filing", href: "/services/mnc-tax-filing" },
  special: { name: "IRS notice and specialized help", href: "/services/irs-notice-audit-help" },
};

const PREPARE_TEXT: Record<Situation, string> = {
  individual: "Explore personal tax preparation and the documents that may be relevant to your return.",
  self: "See how Schedule C returns, quarterly estimates and business deductions are handled for freelancers.",
  business: "Review entity returns for LLCs, S-Corps and multinational groups, including international information forms.",
  special: "Learn how we help with IRS letters, prior-year returns and international situations.",
};

function recommend(situation: Situation, goal: Goal) {
  const service = SERVICE_FOR[situation];
  switch (goal) {
    case "estimate":
      return {
        title: "Compare published prices",
        text: `See fixed prices for ${service.name}. Your exact quote is agreed before any work starts.`,
        href: "/#pricing",
        cta: "View pricing",
      };
    case "consult":
      return {
        title: "Book a free 15-minute call",
        text: `Talk to a CPA about ${service.name} and get a straight answer on scope and cost.`,
        href: "/book-appointment",
        cta: "Book a consultation",
      };
    case "learn":
      return {
        title: "Start with our tax resources",
        text: "Read plain-English guides written by our CPAs, then ask a question when you're ready.",
        href: "/blogs",
        cta: "Browse tax resources",
      };
    default:
      return {
        title: `Start with ${service.name}`,
        text: PREPARE_TEXT[situation],
        href: service.href,
        cta: "See your next step",
      };
  }
}

function Choice({ pressed, onClick, label, hint }: { pressed: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-[3px] border px-4 py-3 text-left text-[14.5px] font-semibold transition-colors",
        pressed ? "border-brass bg-brass/10 text-ink" : "border-paper-line bg-white text-ink-soft hover:border-ink/40 hover:text-ink"
      )}
    >
      {label}
      {hint && <span className="mt-0.5 block text-[12.5px] font-normal text-ink-muted">{hint}</span>}
    </button>
  );
}

/** Two-question guide that points visitors to a starting service. Informational only; it calculates nothing. */
export function TaxCompass() {
  const [situation, setSituation] = useState<Situation>("individual");
  const [goal, setGoal] = useState<Goal>("file");
  const rec = recommend(situation, goal);

  return (
    <section id="tax-tools" className="scroll-mt-28 border-b border-paper-line">
      <div className="site-container grid gap-12 py-20 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-5">
          <p className="eyebrow">Tax tools · A Polaris original</p>
          <h2 className="mt-5 font-display text-[36px] leading-[1.1] text-ink sm:text-[46px]">Meet your Tax Compass.</h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-ink-soft">
            Not sure where to begin? Answer two simple questions and get a suggested place to start. No Social
            Security number, tax documents or sensitive financial information is needed for this guide.
          </p>
          <p className="mt-5 border-l-2 border-brass pl-4 text-[13px] leading-relaxed text-ink-muted">
            This guide is informational and does not determine eligibility or calculate your tax.
          </p>
        </div>

        <div className="rounded-[4px] border border-paper-line bg-paper-deep/40 p-6 sm:p-8 lg:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">Find your starting point</p>

          <p className="mt-6 text-[15px] font-semibold text-ink">1. Which best describes you?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SITUATIONS.map((s) => (
              <Choice key={s.value} pressed={situation === s.value} onClick={() => setSituation(s.value)} label={s.label} hint={s.hint} />
            ))}
          </div>

          <p className="mt-7 text-[15px] font-semibold text-ink">2. What would you like to do?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {GOALS.map((g) => (
              <Choice key={g.value} pressed={goal === g.value} onClick={() => setGoal(g.value)} label={g.label} />
            ))}
          </div>

          <div aria-live="polite" className="mt-7 border-t-2 border-double border-ink pt-6">
            <h3 className="font-display text-[24px] leading-snug text-ink">{rec.title}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{rec.text}</p>
            <Link href={rec.href} className="btn-ink mt-5 px-5">
              {rec.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
