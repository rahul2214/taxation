import { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AlertCircle, ShieldCheck, FileText, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "IRS Circular 230 Notice & Regulatory Disclosures | Polaris Tax Services",
  description: "Official U.S. Treasury Circular 230 disclosure, CPA state licensing, and informational content terms of Polaris Tax Services.",
};

export default function DisclaimerPage() {
  return (
    <PublicLayout>
      <div className="bg-slate-50 min-h-screen py-12 md:py-20 text-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <header className="mb-12 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
              <Scale className="h-3.5 w-3.5 text-blue-600" />
              <span>REGULATORY &amp; TREASURY DISCLOSURES</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-headline font-bold text-slate-950 tracking-tight">
              IRS Circular 230 &amp; Regulatory Disclosures
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-600">
              Polaris Tax Services Inc. • Professional Standards &amp; Practice Disclosures
            </p>
          </header>

          <div className="bg-white border border-slate-200 rounded-xl p-8 md:p-12 shadow-xs space-y-10 text-xs md:text-sm text-slate-700 leading-relaxed">
            {/* Section 1: Circular 230 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-950 font-bold text-base">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                <span>Official IRS Circular 230 Notice</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 italic text-slate-700 text-xs leading-relaxed">
                Pursuant to Internal Revenue Service (IRS) regulations governing practice before the IRS (31 C.F.R. Part 10, commonly referred to as &ldquo;Circular 230&rdquo;), any federal tax advice contained on this website, in our published blog articles, or in general marketing communications (including attachments) is not intended or written to be used, and cannot be used, for the purpose of (i) avoiding penalties that may be imposed under the Internal Revenue Code or applicable state or local tax law, or (ii) promoting, marketing, or recommending to another party any transaction, entity structure, or tax-related matter.
              </div>
            </section>

            {/* Section 2: Informational Estimates Disclaimer */}
            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-slate-950">
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
              <h2 className="text-lg md:text-xl font-bold text-slate-950">
                2. Professional Accountancy Practice &amp; Licensing
              </h2>
              <p>
                Tax returns prepared and reviewed through Polaris Tax Services are supervised by Certified Public Accountants (CPAs) licensed by state boards of accountancy and Enrolled Agents (EAs) federally empowered by the U.S. Department of the Treasury.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li><strong className="text-slate-900">AICPA Member Firm:</strong> Polaris adheres to the AICPA Code of Professional Conduct and Statements on Standards for Tax Services (SSTS).</li>
                <li><strong className="text-slate-900">IRS Authorized e-File Provider:</strong> Electronic return originator (ERO) credentials registered under IRS e-Services.</li>
              </ul>
            </section>

            {/* Section 4: External Links */}
            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-slate-950">
                3. Third-Party Citations &amp; Statutory Changes
              </h2>
              <p>
                Tax legislation, IRS standard deduction adjustments, phase-out thresholds, and state apportionment rules change frequently. While Polaris strives to maintain up-to-date analysis, we make no representation that external links or archived publications reflect retroactive legislative amendments passed subsequent to original publication dates.
              </p>
            </section>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              ← Return to Home
            </Link>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
              <Link href="/security" className="hover:text-slate-900 transition-colors">Security Standards</Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
