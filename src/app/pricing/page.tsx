import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck, CreditCard, RotateCcw } from "lucide-react";
import { buildMetadata, breadcrumbSchema, SITE } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageIntro } from "@/components/public/PageIntro";
import { ClosingCta } from "@/components/public/ClosingCta";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { PlanRecord } from "@/lib/supabase/services";

// Plans are edited by admins; refresh the page at most every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Pricing: Tax Preparation Plans & Fees",
  description:
    "Fixed, published prices for CPA tax preparation. Pay securely online with PayPal or card. Full refund before you approve your return for filing.",
  path: "/pricing",
  keywords: ["tax preparation prices", "CPA tax return cost", "tax filing fees"],
});

const PERIOD_LABEL: Record<string, string> = {
  one_time: "one-time fee",
  monthly: "per month",
  yearly: "per year",
};

// Services priced per engagement (not sold as fixed online plans)
const QUOTED_SERVICES = [
  { name: "Advisory & tax planning", price: "from $2,500 / month", href: "/services/tax-planning" },
  { name: "Monthly bookkeeping", price: "from $250 / month", href: "/services/bookkeeping" },
  { name: "Payroll", price: "quoted monthly", href: "/services/payroll" },
  { name: "Business formation", price: "quoted one-time", href: "/services/business-formation" },
  { name: "IRS notices & audits", price: "quoted per case", href: "/services/irs-notice-audit-help" },
  { name: "MNC tax filing", price: "quoted per group", href: "/services/mnc-tax-filing" },
];

async function loadPlans(): Promise<PlanRecord[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("price", { ascending: true });
    if (error) return [];
    return (data || []).map((row: any) => ({
      ...row,
      price: Number(row.price || 0),
      features: Array.isArray(row.features) ? row.features.map(String) : [],
    }));
  } catch {
    return [];
  }
}

export default async function PricingPage() {
  const plans = await loadPlans();

  const offerCatalog = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Tax preparation plans",
    url: `${SITE.url}/pricing`,
    itemListElement: plans.map((p) => ({
      "@type": "Offer",
      name: p.name,
      description: p.description || p.features.join(". "),
      price: p.price.toFixed(2),
      priceCurrency: "USD",
      seller: { "@id": `${SITE.url}/#organization` },
    })),
  };

  return (
    <PublicLayout>
      <JsonLd data={breadcrumbSchema([{ name: "Pricing", path: "/pricing" }])} />
      {plans.length > 0 && <JsonLd data={offerCatalog} />}

      <PageIntro
        eyebrow="Pricing"
        title="Published prices. Agreed before we start."
        lede="Every plan includes CPA review and help with any IRS letter about a return we filed. All prices are in U.S. dollars. No hourly billing and no hidden fees."
      />

      <section className="border-b border-paper-line">
        <div className="site-container py-16 md:py-20">
          {plans.length === 0 ? (
            <div className="rounded-[4px] border border-paper-line bg-white p-8 text-center text-ink-soft">
              Our plans are being updated. Please{" "}
              <Link href="/contact" className="text-brass-dark hover:underline">contact us</Link> for a price.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-[4px] bg-white p-8 ${
                    plan.is_popular ? "border-2 border-brass shadow-md" : "border border-paper-line"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-display text-[24px] text-ink">{plan.name}</h2>
                    {plan.is_popular && (
                      <span className="shrink-0 rounded-[2px] border border-brass/25 bg-brass/10 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brass-dark">
                        Most chosen
                      </span>
                    )}
                  </div>
                  {plan.description && <p className="mt-1 text-[14px] text-ink-muted">{plan.description}</p>}
                  <p className="mt-6 flex flex-wrap items-baseline gap-x-2 border-t border-paper-line pt-6">
                    <span className="font-display text-[44px] leading-none text-ink">${plan.price.toFixed(2)}</span>
                    <span className="text-sm text-ink-muted">USD · {PERIOD_LABEL[plan.billing_period] || ""}</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-[14.5px]">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brass-dark" />
                        <span className="text-ink-soft">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className={`mt-8 w-full ${plan.is_popular ? "btn-brass" : "btn-line"}`}>
                    Get started
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="flex gap-3 rounded-[4px] border border-paper-line bg-white p-5">
              <CreditCard className="h-5 w-5 shrink-0 text-brass-dark" />
              <div>
                <p className="font-semibold text-ink text-[15px]">Secure online payment</p>
                <p className="mt-1 text-[13.5px] text-ink-soft">
                  Pay with PayPal or a debit/credit card through PayPal checkout. We never see or store your card number.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-[4px] border border-paper-line bg-white p-5">
              <RotateCcw className="h-5 w-5 shrink-0 text-brass-dark" />
              <div>
                <p className="font-semibold text-ink text-[15px]">Refund before you file</p>
                <p className="mt-1 text-[13.5px] text-ink-soft">
                  Full refund any time before you approve your return for filing.{" "}
                  <Link href="/refund-policy" className="text-brass-dark hover:underline">Refund policy</Link>
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-[4px] border border-paper-line bg-white p-5">
              <ShieldCheck className="h-5 w-5 shrink-0 text-brass-dark" />
              <div>
                <p className="font-semibold text-ink text-[15px]">Delivered digitally</p>
                <p className="mt-1 text-[13.5px] text-ink-soft">
                  Work is delivered through your secure client portal. Nothing is shipped.{" "}
                  <Link href="/service-delivery" className="text-brass-dark hover:underline">How delivery works</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-paper-line">
        <div className="site-container py-16 md:py-20">
          <h2 className="font-display text-[30px] text-ink sm:text-[38px]">Services priced per engagement</h2>
          <p className="mt-3 max-w-2xl text-[15.5px] text-ink-soft">
            These depend on the size of your business, so we agree a fixed price in writing before any work starts.
          </p>
          <div className="mt-8 divide-y divide-paper-line rounded-[4px] border border-paper-line bg-white">
            {QUOTED_SERVICES.map((s) => (
              <Link key={s.name} href={s.href} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-paper">
                <span className="text-ink">{s.name}</span>
                <span className="font-mono text-[13px] text-ink-muted">{s.price}</span>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-[13px] text-ink-muted">
            By purchasing you agree to our <Link href="/terms" className="underline">Terms of Service</Link>,{" "}
            <Link href="/refund-policy" className="underline">Refund &amp; Cancellation Policy</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </section>

      <ClosingCta />
    </PublicLayout>
  );
}
