import { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ShieldCheck, Lock, Server, Key, FileCheck2, UserCheck, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Security Architecture & Tax Data Protection | Polaris Tax Services",
  description: "Explore the 256-bit AES encryption, IRS Publication 4557 compliance, and SOC 2 Type II controls that protect your financial documents.",
};

const securityPillars = [
  {
    icon: <Lock className="h-6 w-6 text-blue-600" />,
    title: "Bank-Grade Cryptography",
    description: "All client sessions and file uploads are secured with TLS 1.3 in-transit and AES-256 encryption at rest. Keys are managed through dedicated hardware security modules (HSM).",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-blue-600" />,
    title: "IRS Pub 4557 & NIST Aligned",
    description: "Our security controls strictly adhere to IRS Publication 4557 ('Safeguarding Taxpayer Data') and NIST SP 800-53 cybersecurity framework guidelines.",
  },
  {
    icon: <UserCheck className="h-6 w-6 text-blue-600" />,
    title: "Strict Role-Based Access (RBAC)",
    description: "Taxpayer documents are access-restricted. Only the certified CPA and licensed tax professional assigned directly to your return can view unmasked tax records.",
  },
  {
    icon: <Server className="h-6 w-6 text-blue-600" />,
    title: "SOC 2 Type II Hosting",
    description: "Our cloud infrastructure operates within SOC 2 Type II and ISO 27001 certified data centers with 99.99% availability and redundant offsite snapshots.",
  },
];

export default function SecurityPage() {
  return (
    <PublicLayout>
      <div className="bg-slate-50 min-h-screen py-12 md:py-20 text-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <header className="mb-12 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>INSTITUTIONAL CYBERSECURITY STANDARDS</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-headline font-bold text-slate-950 tracking-tight">
              Security Architecture &amp; Data Safeguards
            </h1>
            <p className="mt-3 text-base text-slate-600 max-w-2xl">
              We treat tax identity security with the same rigorous engineering standards as institutional banking treasuries.
            </p>
          </header>

          {/* 4 Pillars Grid */}
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {securityPillars.map((pillar, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
                <div className="p-2.5 rounded-lg bg-blue-50 w-fit">{pillar.icon}</div>
                <h3 className="font-bold text-slate-900 text-base">{pillar.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>

          {/* Detailed Specifications */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 md:p-12 shadow-xs space-y-10 text-xs md:text-sm text-slate-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-slate-950">
                1. Written Information Security Plan (WISP)
              </h2>
              <p>
                As required by the Federal Trade Commission (FTC) Safeguards Rule and IRS guidelines, Polaris maintains and enforces a comprehensive Written Information Security Plan (WISP). Our WISP outlines strict protocols regarding employee credentialing, background checks, laptop device encryption, zero-trust network segregation, and incident response drill schedules.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-slate-950">
                2. Document Ingestion &amp; Vault Sanitation
              </h2>
              <p>
                Every tax document uploaded to the Polaris client vault undergoes automated security inspection prior to storage:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li><strong className="text-slate-900">Automated Antivirus Scanning:</strong> Uploaded PDFs and images are quarantined and scanned against heuristic malware engines.</li>
                <li><strong className="text-slate-900">MIME-Type &amp; Header Validation:</strong> Prevents executable file masquerading or malicious payload execution.</li>
                <li><strong className="text-slate-900">Ephemeral Processing Containers:</strong> Document analysis and data extraction occur inside isolated, ephemeral execution containers that terminate upon job completion.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-slate-950">
                3. Authentication &amp; Access Controls
              </h2>
              <p>
                We enforce multi-factor authentication (MFA) across all client portal accounts and internal CPA workstations:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Encrypted authentication tokens with strict 15-minute inactivity timeouts.</li>
                <li>Biometric and hardware security key (FIDO2 / WebAuthn) compatibility.</li>
                <li>Immediate session revocation upon password rotation or suspicious IP location anomalies.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-slate-950">
                4. Reporting Security Vulnerabilities
              </h2>
              <p>
                Polaris welcomes responsible vulnerability disclosures from security researchers. If you identify a potential security vulnerability within our web application or client portal, please contact our security team immediately at:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1 text-xs">
                <p><strong className="text-slate-900">Polaris Security &amp; Engineering Operations</strong></p>
                <p>Email: <a href="mailto:security@polaristax.com" className="text-blue-600 hover:underline">security@polaristax.com</a></p>
                <p>PGP Fingerprint: Available upon request via security desk.</p>
              </div>
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
              <Link href="/guarantee" className="hover:text-slate-900 transition-colors">Accuracy Guarantee</Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
