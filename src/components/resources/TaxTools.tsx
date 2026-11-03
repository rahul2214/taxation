"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TAX_YEAR,
  FILING_STATUSES,
  STANDARD_DEDUCTION,
  SOCIAL_SECURITY_WAGE_BASE,
  childTaxCredit,
  incomeTax,
  selfEmploymentTax,
  type FilingStatus,
} from "@/data/resources";

type Tool = "refund" | "self-employment";

const TOOLS: { value: Tool; label: string; hint: string }[] = [
  { value: "refund", label: "Refund estimator", hint: "Will you get money back or owe?" },
  { value: "self-employment", label: "Self-employment tax", hint: "What freelance income costs in SE tax" },
];

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => `${(n * 100).toFixed(1).replace(/\.0$/, "")}%`;
const toNumber = (value: string) => Math.max(0, Number(value.replace(/[^0-9.]/g, "")) || 0);

const fieldClass =
  "mt-1.5 h-11 w-full rounded-[3px] border border-paper-line bg-white px-3 text-[15px] text-ink transition-colors focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/20";

function MoneyField({ id, label, hint, value, onChange }: { id: string; label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="text-[14px] font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 mt-[3px] -translate-y-1/2 text-[15px] text-ink-muted">$</span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClass, "pl-7")}
        />
      </div>
      {hint && <p className="mt-1 text-[12.5px] text-ink-muted">{hint}</p>}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2.5 text-[14.5px]", strong ? "font-semibold text-ink" : "text-ink-soft")}>
      <dt>{label}</dt>
      <dd className="font-mono text-[14px]">{value}</dd>
    </div>
  );
}

function RefundEstimator() {
  const [status, setStatus] = useState<FilingStatus>("single");
  const [income, setIncome] = useState("75,000");
  const [withheld, setWithheld] = useState("8,500");
  const [children, setChildren] = useState(0);
  const [itemized, setItemized] = useState("");

  const gross = toNumber(income);
  const standard = STANDARD_DEDUCTION[status];
  const deduction = Math.max(standard, toNumber(itemized));
  const taxable = Math.max(0, gross - deduction);
  const { tax, marginal } = incomeTax(taxable, status);
  const credit = Math.min(tax, childTaxCredit(children, gross, status));
  const totalTax = tax - credit;
  const balance = toNumber(withheld) - totalTax;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <div>
          <label htmlFor="refund-status" className="text-[14px] font-semibold text-ink">
            Filing status
          </label>
          <select id="refund-status" value={status} onChange={(e) => setStatus(e.target.value as FilingStatus)} className={fieldClass}>
            {FILING_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <MoneyField id="refund-income" label="Total income" hint="Wages, interest, dividends and other income for the year." value={income} onChange={setIncome} />
        <MoneyField id="refund-withheld" label="Federal tax withheld" hint="Box 2 of your W-2s, plus any estimated payments." value={withheld} onChange={setWithheld} />
        <div>
          <label htmlFor="refund-children" className="text-[14px] font-semibold text-ink">
            Children under 17
          </label>
          <select id="refund-children" value={children} onChange={(e) => setChildren(Number(e.target.value))} className={fieldClass}>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <MoneyField
          id="refund-itemized"
          label="Itemized deductions (optional)"
          hint={`We use the larger of this or the ${usd(standard)} standard deduction.`}
          value={itemized}
          onChange={setItemized}
        />
      </div>

      <div className="flex flex-col rounded-[4px] border border-paper-line bg-white p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">Your {TAX_YEAR} estimate</p>
        <div aria-live="polite" className="mt-4">
          <p className="text-[14px] text-ink-soft">{balance >= 0 ? "Estimated refund" : "Estimated amount you owe"}</p>
          <p className={cn("mt-1 font-display text-[48px] leading-none", balance >= 0 ? "text-ink" : "text-brass-dark")}>{usd(Math.abs(balance))}</p>
        </div>
        <dl className="mt-6 divide-y divide-paper-line border-y border-paper-line">
          <Row label={deduction > standard ? "Itemized deductions" : "Standard deduction"} value={usd(deduction)} />
          <Row label="Taxable income" value={usd(taxable)} />
          <Row label="Tax before credits" value={usd(tax)} />
          <Row label="Child tax credit" value={credit ? `−${usd(credit)}` : usd(0)} />
          <Row label="Estimated federal tax" value={usd(totalTax)} strong />
          <Row label="Marginal / effective rate" value={`${pct(marginal)} / ${pct(gross ? totalTax / gross : 0)}`} />
        </dl>
        <p className="mt-5 text-[12.5px] leading-relaxed text-ink-muted">
          A simplified federal estimate using {TAX_YEAR} brackets. It leaves out state tax, capital gains rates, self-employment tax and
          other credits, so your return may differ.
        </p>
        <Link href="/services/individual-tax-preparation" className="btn-ink mt-6 self-start px-5">
          Have a CPA prepare it
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function SelfEmploymentCalculator() {
  const [profit, setProfit] = useState("60,000");
  const [wages, setWages] = useState("");

  const se = selfEmploymentTax(toNumber(profit), toNumber(wages));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <MoneyField
          id="se-profit"
          label="Net self-employment profit"
          hint="Business income minus expenses, as on Schedule C or your K-1."
          value={profit}
          onChange={setProfit}
        />
        <MoneyField
          id="se-wages"
          label="W-2 wages from a job (optional)"
          hint={`Social Security tax stops at ${usd(SOCIAL_SECURITY_WAGE_BASE)} of combined earnings.`}
          value={wages}
          onChange={setWages}
        />
        <div className="border-l-2 border-brass pl-4 text-[13.5px] leading-relaxed text-ink-soft">
          Self-employment tax is the Social Security and Medicare tax an employer would normally split with you. You pay
          both halves, but deduct half of it when working out your income tax.
        </div>
      </div>

      <div className="flex flex-col rounded-[4px] border border-paper-line bg-white p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">Your {TAX_YEAR} estimate</p>
        <div aria-live="polite" className="mt-4">
          <p className="text-[14px] text-ink-soft">Self-employment tax</p>
          <p className="mt-1 font-display text-[48px] leading-none text-ink">{usd(se.total)}</p>
        </div>
        <dl className="mt-6 divide-y divide-paper-line border-y border-paper-line">
          <Row label="Earnings subject to SE tax (92.35%)" value={usd(se.base)} />
          <Row label="Social Security (12.4%)" value={usd(se.socialSecurity)} />
          <Row label="Medicare (2.9%)" value={usd(se.medicare)} />
          <Row label="Deductible half" value={usd(se.deductibleHalf)} />
          <Row label="Per quarter, before income tax" value={usd(se.total / 4)} strong />
        </dl>
        <p className="mt-5 text-[12.5px] leading-relaxed text-ink-muted">
          Income tax on the same profit is extra. High earners may also owe the 0.9% Additional Medicare Tax, which this
          estimate leaves out.
        </p>
        <Link href="/services/small-business-tax-preparation" className="btn-ink mt-6 self-start px-5">
          Plan your quarterly payments
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/** Federal estimators for the /resources hub. Nothing entered here is stored or sent anywhere. */
export function TaxTools() {
  const [tool, setTool] = useState<Tool>("refund");

  return (
    <div className="rounded-[4px] border border-paper-line bg-paper-deep/40 p-5 sm:p-8">
      <div role="tablist" aria-label="Tax calculators" className="grid gap-2 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            id={`tab-${t.value}`}
            aria-selected={tool === t.value}
            aria-controls={`panel-${t.value}`}
            onClick={() => setTool(t.value)}
            className={cn(
              "rounded-[3px] border px-4 py-3 text-left text-[15px] font-semibold transition-colors",
              tool === t.value ? "border-brass bg-brass/10 text-ink" : "border-paper-line bg-white text-ink-soft hover:border-ink/40 hover:text-ink"
            )}
          >
            {t.label}
            <span className="mt-0.5 block text-[12.5px] font-normal text-ink-muted">{t.hint}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tool}`} aria-labelledby={`tab-${tool}`} className="mt-8">
        {tool === "refund" ? <RefundEstimator /> : <SelfEmploymentCalculator />}
      </div>
    </div>
  );
}
