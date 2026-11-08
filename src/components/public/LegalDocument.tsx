import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { SITE_LEGAL } from "@/components/public/legal";

type LegalDocumentProps = {
  title: string;
  path: string;
  breadcrumb: string;
  lastRevised: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
};

/** Shared layout for policy pages (refunds, delivery, etc.), matching the Terms and Privacy pages. */
export function LegalDocument({ title, path, breadcrumb, lastRevised, summary, children }: LegalDocumentProps) {
  return (
    <PublicLayout>
      <JsonLd data={breadcrumbSchema([{ name: breadcrumb, path }])} />
      <div className="py-14 md:py-20">
        <div className="site-container max-w-[920px]">
          <header className="mb-12 border-b border-paper-line pb-10">
            <p className="eyebrow mb-5">Legal</p>
            <h1 className="font-display text-[38px] font-normal leading-[1.1] text-ink md:text-[52px]">{title}</h1>
            <p className="mt-3 text-sm md:text-base text-ink-soft">
              Last Revised: {lastRevised} • {SITE_LEGAL.legalName}
            </p>
          </header>

          {summary && (
            <div className="bg-white border border-paper-line rounded-[4px] p-6 md:p-8 mb-10 text-[15.5px] text-ink-soft leading-relaxed">
              {summary}
            </div>
          )}

          <div className="bg-white border border-paper-line rounded-[4px] p-8 md:p-12 space-y-10 text-[15.5px] text-ink-soft leading-relaxed [&_h2]:font-display [&_h2]:text-[26px] [&_h2]:font-normal [&_h2]:text-ink [&_section]:space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-ink">
            {children}

            <section className="border-t border-paper-line pt-6">
              <h2>Contact us</h2>
              <p>Questions about this policy, an order or a payment can be sent to:</p>
              <div className="bg-paper border border-paper-line rounded-[3px] p-4 space-y-1 text-xs">
                <p>
                  <strong>{SITE_LEGAL.legalName}</strong>
                </p>
                <p>
                  Email:{" "}
                  <a href={`mailto:${SITE_LEGAL.email}`} className="text-brass-dark hover:underline">
                    {SITE_LEGAL.email}
                  </a>
                </p>
                <p>Phone: {SITE_LEGAL.phone}</p>
                <p>Address: {SITE_LEGAL.address}</p>
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
            <Link href="/" className="hover:text-ink transition-colors">
              ← Return to Home
            </Link>
            <div className="flex flex-wrap gap-4">
              <Link href="/pricing" className="hover:text-ink transition-colors">Pricing</Link>
              <Link href="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
              <Link href="/refund-policy" className="hover:text-ink transition-colors">Refund Policy</Link>
              <Link href="/service-delivery" className="hover:text-ink transition-colors">Service Delivery</Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
