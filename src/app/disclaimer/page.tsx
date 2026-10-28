import { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AlertCircle, ShieldCheck, FileText, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "IRS Circular 230 Notice & Regulatory Disclosures",
  description: "Official U.S. Treasury Circular 230 disclosure, CPA state licensing, and informational content terms of Polaris Tax Services.",
};

export default function DisclaimerPage() {
  return (
    <PublicLayout>
      <div className="py-14 md:py-20">
        <div className="site-container max-w-[920px]">
          {/* Header */}
          <header className="mb-12 border-b border-paper-line pb-10">
            <p className="eyebrow mb-5">Legal</p>
            <h1 className="font-display text-[38px] font-normal leading-[1.1] text-ink md:text-[52px]">
              IRS Circular 230 &amp; Regulatory Disclosures
            </h1>
            <p className="mt-3 text-sm md:text-base text-ink-soft">
              Polaris Tax Services Inc. • Professional Standards &amp; Practice Disclosures
            </p>
          </header>

          <div className="bg-white border border-paper-line rounded-[4px] p-8 md:p-12 space-y-10 text-[15.5px] text-ink-soft leading-relaxed">
            {/* Section 1: Circular 230 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-ink font-bold text-base">
                <AlertCircle className="h-5 w-5 text-brass-dark shrink-0" />
                <span>Official IRS Circular 230 Notice</span>
              </div>
              <div className="bg-paper border border-paper-line rounded-[3px] p-5 italic text-ink-soft text-xs leading-relaxed">
                Pursuant to Internal Revenue Service (IRS) regulations governing practice before the IRS (31 C.F.R. Part 10, commonly referred to as &ldquo;Circular 230&rdquo;), any federal tax advice contained on this website, in our published blog articles, or in general marketing communications (including attachments) is not intended or written to be used, and cannot be used, for the purpose of (i) avoiding penalties that may be imposed under the Internal Revenue Code or applicable state or local tax law, or (ii) promoting, marketing, or recommending to another party any transaction, entity structure, or tax-related matter.
              </div>
            </section>

            {/* Section 2: Informational Estimates Disclaimer */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                1. Nature of Website Estimators &amp; Articles
              </h2>
              <p>
                All calculators, interactive tax estimators, tax bracket tables, and blog posts provided on this website are designed strictly for educational, informational, and preliminary diagnostic purposes. They do not constitute formal, individualized tax, legal, or investment advice.
              </p>
              <p>
                Actual tax liabilities, eligible deductions, and refund determinations require a comprehensive review of your official source documents (Forms W-2, 1099, K-1, P&amp;L records) and execution of a formal client engagement agreement. A CPA-client fiduciary relationship is only formed once you execute our engagement agreement and verify your identity.
              </p>
            </section>

            {/* Section 3: Professional Licensing */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                2. Professional Accountancy Practice &amp; Licensing
              </h2>
              <p>
                Tax returns prepared and reviewed through Polaris Tax Services are supervised by Certified Public Accountants (CPAs) licensed by state boards of accountancy and Enrolled Agents (EAs) federally empowered by the U.S. Department of the Treasury.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-ink-soft">
                <li><strong className="text-ink">AICPA Member Firm:</strong> Polaris adheres to the AICPA Code of Professional Conduct and Statements on Standards for Tax Services (SSTS).</li>
                <li><strong className="text-ink">IRS Authorized e-File Provider:</strong> Electronic return originator (ERO) credentials registered under IRS e-Services.</li>
              </ul>
            </section>

            {/* Section 4: External Links */}
            <section className="space-y-3">
              <h2 className="font-display text-[26px] font-normal text-ink">
                3. Third-Party Citations &amp; Statutory Changes
              </h2>
              <p>
                Tax legislation, IRS standard deduction adjustments, phase-out thresholds, and state apportionment rules change frequently. While Polaris strives to maintain up-to-date analysis, we make no representation that external links or archived publications reflect retroactive legislative amendments passed subsequent to original publication dates.
              </p>
            </section>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-8 flex items-center justify-between text-xs text-ink-muted">
            <Link href="/" className="hover:text-ink transition-colors flex items-center gap-1">
              ← Return to Home
            </Link>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
              <Link href="/security" className="hover:text-ink transition-colors">Security Standards</Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
