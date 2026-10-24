import Link from "next/link";
import { Facebook, Twitter, Linkedin, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-14 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Credentials */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block hover:opacity-95 transition-opacity">
              <PolarisLogo className="h-9 w-auto brightness-200 contrast-125" />
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Polaris Tax Services provides institutional-grade tax preparation, IRS representation, and proactive tax advisory. Led by licensed CPAs and IRS Enrolled Agents.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                IRS Authorized e-File Provider
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Lock className="h-3.5 w-3.5 text-blue-400" />
                256-Bit TLS Bank Encryption
              </span>
            </div>
          </div>

          {/* Column 1: Services */}
          <div>
            <h3 className="font-semibold text-sm text-white tracking-wide uppercase mb-4">Tax Services</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/services" className="text-slate-400 hover:text-white transition-colors">Individual Form 1040</Link></li>
              <li><Link href="/services" className="text-slate-400 hover:text-white transition-colors">Small Business & LLC</Link></li>
              <li><Link href="/services" className="text-slate-400 hover:text-white transition-colors">Corporate Returns (1120-S)</Link></li>
              <li><Link href="/services" className="text-slate-400 hover:text-white transition-colors">IRS Audit Defense</Link></li>
              <li><Link href="/services" className="text-slate-400 hover:text-white transition-colors">Year-Round Bookkeeping</Link></li>
            </ul>
          </div>

          {/* Column 2: Firm & Trust */}
          <div>
            <h3 className="font-semibold text-sm text-white tracking-wide uppercase mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="text-slate-400 hover:text-white transition-colors">About Our Team</Link></li>
              <li><Link href="/guarantee" className="text-slate-400 hover:text-white transition-colors">Accuracy Guarantee</Link></li>
              <li><Link href="/blogs" className="text-slate-400 hover:text-white transition-colors">Tax News &amp; Guides</Link></li>
              <li><Link href="/faq" className="text-slate-400 hover:text-white transition-colors">Frequently Asked (FAQ)</Link></li>
              <li><Link href="/contact" className="text-slate-400 hover:text-white transition-colors">Contact Practice</Link></li>
              <li><Link href="/book-appointment" className="text-slate-400 hover:text-white transition-colors">Schedule Consultation</Link></li>
            </ul>
          </div>

          {/* Column 3: Client Portal */}
          <div>
            <h3 className="font-semibold text-sm text-white tracking-wide uppercase mb-4">Client Portal</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/login" className="text-slate-400 hover:text-white transition-colors">Secure Sign In</Link></li>
              <li><Link href="/signup" className="text-slate-400 hover:text-white transition-colors">Register Account</Link></li>
              <li><Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">Document Upload Vault</Link></li>
              <li><Link href="/dashboard/appointments" className="text-slate-400 hover:text-white transition-colors">Manage Appointments</Link></li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Link href="#" aria-label="Facebook" className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-slate-700 transition-colors">
                <Facebook className="h-4 w-4" />
              </Link>
              <Link href="#" aria-label="Twitter" className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-slate-700 transition-colors">
                <Twitter className="h-4 w-4" />
              </Link>
              <Link href="#" aria-label="LinkedIn" className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-slate-700 transition-colors">
                <Linkedin className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Regulatory & Circular 230 Notice */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 text-xs text-slate-500 space-y-3 leading-relaxed">
          <p>
            <strong className="text-slate-400">IRS Circular 230 Disclosure:</strong> Pursuant to U.S. Treasury regulations, any federal tax advice contained in this communication (including any attachments) is not intended or written to be used, and cannot be used, for the purpose of (i) avoiding penalties under the Internal Revenue Code or (ii) promoting, marketing, or recommending to another party any transaction or tax-related matter.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-900 text-slate-500">
            <p>© {new Date().getFullYear()} Polaris Tax Services Inc. All rights reserved. Licensed CPA &amp; IRS Enrolled Agent Practice.</p>
            <div className="flex flex-wrap items-center gap-6">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
              <Link href="/security" className="hover:text-slate-300 transition-colors">Security Architecture</Link>
              <Link href="/disclaimer" className="hover:text-slate-300 transition-colors">Circular 230 Disclosure</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
