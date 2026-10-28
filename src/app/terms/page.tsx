import type { Metadata } from "next";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { FileText, ShieldCheck, Scale, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service & Client Engagement Terms",
  description: "The terms that apply when you use the Polaris Tax Services website and client portal, and when you engage us to prepare your tax returns.",
  path: "/terms",
  keywords: ["tax preparation engagement terms"],
});

export default function TermsPage() {
  return (
    <PublicLayout>
      <JsonLd data={breadcrumbSchema([{ name: "Terms of service", path: "/terms" }])} />
      <div className="py-14 md:py-20">
        <div className="site-container max-w-[920px]">
          {/* Header */}
          <header className="mb-12 border-b border-paper-line pb-10">
            <p className="eyebrow mb-5">Legal</p>
            <h1 className="font-display text-[38px] font-normal leading-[1.1] text-ink md:text-[52px]">
              Terms of Service &amp; Client Engagement Agreement
            </h1>
            <p className="mt-3 text-sm md:text-base text-ink-soft">
              Last Revised: October 2026 • Polaris Tax Services Inc.
            </p>
          </header>

          {/* Quick Notice Card */}
          <div className="bg-white border border-paper-line rounded-[4px] p-6 md:p-8 mb-10 space-y-3">
            <div className="flex items-center gap-2.5 text-ink font-bold text-base">
              <ShieldCheck className="h-5 w-5 text-brass-dark shrink-0" />
              <span>Professional Engagement Standard</span>
            </div>
            <p className="text-[15.5px] text-ink-soft leading-relaxed">
              By accessing the Polaris Tax Services platform, uploading tax documentation, or engaging our firm for advisory or tax preparation, you enter into a legally binding professional services agreement governed by the <strong>AICPA Statements on Standards for Tax Services (SSTS)</strong> and <strong>U.S. Treasury Circular 230</strong>.
            </p>
          </div>

          {/* Main Terms Content */}
          <div className="bg-white border border-paper-line rounded-[4px] p-8 md:p-12 space-y-10 text-[15.5px] text-ink-soft leading-relaxed">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                1. Scope of Tax Preparation &amp; Advisory Services
              </h2>
              <p>
                Polaris Tax Services Inc. (&ldquo;Polaris&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) provides licensed CPA and Enrolled Agent tax preparation, strategic consulting, quarterly estimated tax calculations, and IRS notice assistance as selected by the client (&ldquo;you&rdquo;, &ldquo;taxpayer&rdquo;).
              </p>
              <p>
                Our services are limited to the preparation of specified federal and state tax returns based strictly on information and source documents provided by you. We do not perform an audit or independent verification of your financial records unless explicitly contracted under a separate, formal attestation engagement.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                2. Taxpayer Responsibilities &amp; Factual Accuracy
              </h2>
              <p>
                Under the Internal Revenue Code, the legal responsibility for the factual accuracy of any tax return rests with the taxpayer. By utilizing our services, you affirm that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-ink-soft">
                <li>You have reported all worldwide income, including wages, capital gains, cryptocurrency transactions, foreign bank accounts, and self-employment earnings.</li>
                <li>You have maintained necessary contemporaneous receipts, mileage logs, and substantiating documentation required by the IRS to support all claimed deductions and tax credits.</li>
                <li>All social security numbers, dependent declarations, and entity ownership structures provided to Polaris are true, correct, and complete.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                3. Electronic Filing (IRS Form 8879 Authorization)
              </h2>
              <p>
                Federal law requires all professional tax preparers to electronically file eligible returns. Prior to electronic transmission to the IRS or state taxing authorities:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-ink-soft">
                <li>Polaris will deliver a completed draft of your return for your thorough review via your secure client portal.</li>
                <li>You must review the draft, confirm the refund or liability amount, and execute <strong>IRS Form 8879 (&ldquo;IRS e-file Signature Authorization&rdquo;)</strong> using legally compliant digital signature protocols.</li>
                <li>Polaris will not transmit any return to the IRS without receiving your executed Form 8879.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                4. Fees, Retainers &amp; Satisfaction Guarantee
              </h2>
              <p>
                Preparation fees are established upfront based on your filing complexity (e.g. Individual Form 1040, Schedule C, Corporate 1120-S, multi-state filings).
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-ink-soft">
                <li><strong className="text-ink">Pre-Filing Satisfaction Guarantee:</strong> If you are dissatisfied with our service for any reason prior to signing Form 8879 or authorizing transmission, you may cancel without filing, and preparation fees paid will be refunded.</li>
                <li><strong className="text-ink">Post-Transmission Finality:</strong> Once a return has been electronically transmitted and accepted by the IRS, preparation fees are non-refundable.</li>
                <li><strong className="text-ink">Unforeseen Complexity Adjustments:</strong> If during return review undeclared multi-state nexus, unorganized foreign assets (Form 5471), or complex K-1 allocations are discovered, Polaris will provide written notification of scope adjustments before proceeding.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                5. 100% Calculation Accuracy Guarantee Conditions
              </h2>
              <p>
                Polaris guarantees that all arithmetic calculations and tax table applications are 100% accurate under the tax code in effect at the time of filing.
              </p>
              <p>
                In the event that a mathematical or calculation error made directly by Polaris results in an IRS or state penalty and interest assessment:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-ink-soft">
                <li>Polaris will reimburse you for the actual penalty and interest assessed by the taxing authority.</li>
                <li>The underlying tax liability itself (taxes you legally owed) remains the legal responsibility of the taxpayer.</li>
                <li>This guarantee does not apply if penalties result from incorrect, late, or incomplete information provided by the taxpayer.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                6. IRS Notice Assistance &amp; Audit Scope
              </h2>
              <p>
                Every return prepared by Polaris includes basic IRS notice assistance. If you receive an IRS CP2000, CP504, or math verification inquiry regarding a return we filed, our CPAs will review the notice and advise on the appropriate response at no additional charge.
              </p>
              <p>
                Comprehensive on-site audit representation, formal tax court litigation, or extensive forensic appeals require a separate engagement agreement and execution of IRS Form 2848 (Power of Attorney).
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                7. Limitation of Liability &amp; Governing Law
              </h2>
              <p>
                To the maximum extent permitted by applicable law, Polaris&apos;s aggregate liability arising out of or related to this engagement, whether in contract, tort, or professional negligence, shall not exceed the total preparation fees paid by the client for the specific return in dispute.
              </p>
              <p>
                This agreement is governed by the laws of the State of New York, without regard to conflict of law principles. Any legal action or dispute shall be resolved through confidential binding arbitration in New York County, NY under the Commercial Arbitration Rules of the American Arbitration Association (AAA).
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-3 border-t border-paper-line pt-6">
              <h2 className="font-display text-[26px] font-normal text-ink">
                8. Contact &amp; Legal Notices
              </h2>
              <p>
                Formal legal notices, engagement questions, or service inquiries may be directed to:
              </p>
              <div className="bg-paper border border-paper-line rounded-[3px] p-4 space-y-1 text-xs">
                <p><strong className="text-ink">Polaris Tax Services Inc. — Legal &amp; Client Services</strong></p>
                <p>Email: <a href="mailto:legal@polaristax.com" className="text-brass-dark hover:underline">legal@polaristax.com</a></p>
                <p>Office: (212) 847-1920</p>
                <p>Address: 440 Park Avenue South, 12th Floor, New York, NY 10016</p>
              </div>
            </section>
          </div>

          {/* Bottom Navigation Shortcut */}
          <div className="mt-8 flex items-center justify-between text-xs text-ink-muted">
            <Link href="/" className="hover:text-ink transition-colors flex items-center gap-1">
              ← Return to Home
            </Link>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
              <Link href="/security" className="hover:text-ink transition-colors">Security Architecture</Link>
              <Link href="/guarantee" className="hover:text-ink transition-colors">Accuracy Guarantee</Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
