import type { Metadata } from "next";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy & IRC §7216 Notice",
  description: "How Polaris Tax Services collects, uses and protects your tax information under IRC Section 7216 and federal financial privacy rules. We never sell your data.",
  path: "/privacy",
  keywords: ["tax preparer privacy policy", "IRC 7216"],
});

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <JsonLd data={breadcrumbSchema([{ name: "Privacy policy", path: "/privacy" }])} />
      <div className="py-14 md:py-20">
        <div className="site-container max-w-[920px]">
          {/* Header */}
          <header className="mb-12 border-b border-paper-line pb-10">
            <p className="eyebrow mb-5">Legal</p>
            <h1 className="font-display text-[38px] font-normal leading-[1.1] text-ink md:text-[52px]">
              Taxpayer Privacy Policy &amp; IRC § 7216 Disclosures
            </h1>
            <p className="mt-3 text-sm md:text-base text-ink-soft">
              Effective Date: October 2026 • Polaris Tax Services Inc.
            </p>
          </header>

          {/* Quick Statutory Callout Box */}
          <div className="bg-white border border-paper-line rounded-[4px] p-6 md:p-8 mb-10 space-y-4">
            <div className="flex items-center gap-2.5 text-ink font-bold text-base">
              <Lock className="h-5 w-5 text-brass-dark shrink-0" />
              <span>The Polaris Fiduciary Privacy Guarantee</span>
            </div>
            <p className="text-[15.5px] text-ink-soft leading-relaxed">
              Federal law under <strong>Internal Revenue Code (IRC) Section 7216</strong> and Treasury Regulation § 301.7216 makes it a criminal misdemeanor for any tax preparer to knowingly or recklessly disclose or use your tax return information for any purpose other than preparing your return. Polaris Tax Services adheres to the highest statutory standard of confidentiality. We do not sell, rent, monetize, or disclose your financial records to any third party.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 pt-2 text-xs text-ink-soft font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brass-dark shrink-0" />
                <span>Zero Data Monetization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brass-dark shrink-0" />
                <span>256-Bit TLS &amp; AES Vault</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brass-dark shrink-0" />
                <span>IRC § 7216 Protected</span>
              </div>
            </div>
          </div>

          {/* Privacy Policy Content Sections */}
          <div className="bg-white border border-paper-line rounded-[4px] p-8 md:p-12 space-y-10 text-[15.5px] text-ink-soft leading-relaxed">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                1. Federal IRC § 7216 Tax Return Information Notice
              </h2>
              <p>
                Federal law requires this notice. When you engage Polaris Tax Services for tax return preparation, any information you provide (including names, Social Security Numbers, Employer Identification Numbers, financial statements, W-2s, and 1099s) is classified as &ldquo;tax return information&rdquo;.
              </p>
              <p>
                We are legally prohibited from disclosing or using this information for any purpose other than the direct preparation and filing of your tax returns, unless you have executed a formal, written consent form meeting the explicit requirements of Treasury Regulation § 301.7216-3.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                2. Categories of Information We Collect
              </h2>
              <p>In order to provide licensed CPA tax preparation and advisory services, we collect:</p>
              <ul className="list-disc pl-5 space-y-2 text-ink-soft">
                <li>
                  <strong className="text-ink">Personal Identifiers:</strong> Legal names, physical and mailing addresses, phone numbers, email addresses, Social Security Numbers (SSNs), Individual Taxpayer Identification Numbers (ITINs), and dates of birth.
                </li>
                <li>
                  <strong className="text-ink">Tax Source Records:</strong> Forms W-2, 1099 (NEC, MISC, INT, DIV, B, R), Schedules K-1, profit and loss statements, balance sheets, mortgage interest statements (Form 1098), and charitable deduction logs.
                </li>
                <li>
                  <strong className="text-ink">Banking &amp; Disbursement Data:</strong> Bank routing numbers and account numbers provided solely for direct IRS electronic refund deposit or authorized electronic tax payments.
                </li>
                <li>
                  <strong className="text-ink">Digital Portal Metadata:</strong> Timestamps of document uploads, IP addresses associated with electronic signature events (IRS Form 8879 compliance), and multi-factor authentication logs.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                3. Permitted Uses of Your Information
              </h2>
              <p>We use your information exclusively for legitimate professional services:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-ink-soft">
                <li>Drafting, verifying, and e-filing federal, state, and municipal tax returns.</li>
                <li>Conducting deduction scans, depreciation calculations, and tax credit assessments.</li>
                <li>Representing you in formal IRS or state tax correspondence and notice defense.</li>
                <li>Verifying your identity to prevent fraudulent tax filings and IRS identity theft.</li>
                <li>Maintaining your client portal vault for year-round document access.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                4. Data Security &amp; Encryption Architecture
              </h2>
              <p>
                Polaris employs institutional-grade technical, administrative, and physical safeguards conforming to IRS Publication 4557 (&ldquo;Safeguarding Taxpayer Data&rdquo;) and NIST guidelines:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-ink-soft">
                <li><strong className="text-ink">In-Transit Encryption:</strong> All client communications and file transfers are protected by TLS 1.3 with 256-bit encryption.</li>
                <li><strong className="text-ink">At-Rest Vault Storage:</strong> Stored documents and database records are encrypted with AES-256.</li>
                <li><strong className="text-ink">Access Controls:</strong> Only licensed CPAs and authorized tax professionals assigned to your return have access to unmasked tax records.</li>
                <li><strong className="text-ink">Multi-Factor Authentication (MFA):</strong> Mandatory multi-factor authentication for all portal accounts.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                5. Statutory Document Retention Rules
              </h2>
              <p>
                Under IRS guidelines and state board of accountancy regulations, tax practitioners are required to retain copies of completed returns and client source documentation for a minimum of <strong>seven (7) years</strong> to defend against audit assessments, statute of limitation inquiries, or amended return filings.
              </p>
              <p>
                After the mandatory retention window has elapsed, records are queued for certified electronic cryptographic erasure in compliance with DoD 5220.22-M standards.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                6. State-Specific Rights (CCPA / CPRA)
              </h2>
              <p>
                If you are a California resident or reside in a jurisdiction with comprehensive consumer privacy statutes, you maintain the right to know what personal information has been collected and to request correction of inaccurate records. Note that statutory tax retention obligations under federal tax law supersede consumer deletion requests for completed tax returns.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3 border-t border-paper-line pt-6">
              <h2 className="font-display text-[26px] font-normal text-ink">
                7. Contact Our Data Privacy Officer
              </h2>
              <p>
                For questions regarding this policy, to request a copy of your stored records, or to report a privacy concern, please contact our compliance office:
              </p>
              <div className="bg-paper border border-paper-line rounded-[3px] p-4 space-y-1 text-xs">
                <p><strong className="text-ink">Polaris Tax Services Inc. — Privacy &amp; Compliance Office</strong></p>
                <p>Email: <a href="mailto:privacy@polaristax.com" className="text-brass-dark hover:underline">privacy@polaristax.com</a></p>
                <p>Direct Compliance Line: (212) 847-1920</p>
                <p>Mailing Address: 440 Park Avenue South, 12th Floor, New York, NY 10016</p>
              </div>
            </section>
          </div>

          {/* Bottom Navigation Shortcut */}
          <div className="mt-8 flex items-center justify-between text-xs text-ink-muted">
            <Link href="/" className="hover:text-ink transition-colors flex items-center gap-1">
              ← Return to Home
            </Link>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
              <Link href="/security" className="hover:text-ink transition-colors">Security Architecture</Link>
              <Link href="/disclaimer" className="hover:text-ink transition-colors">Circular 230 Notice</Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
