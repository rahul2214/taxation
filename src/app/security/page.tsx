import { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageIntro } from "@/components/public/PageIntro";

export const metadata: Metadata = {
  title: "Security & Data Protection",
  description: "How Polaris protects your tax documents: encryption, IRS Publication 4557 safeguards, access controls and responsible disclosure.",
};

const pillars = [
  {
    title: "Encryption",
    description:
      "Connections use TLS 1.3 and stored documents are encrypted with AES-256. Encryption keys are held in dedicated hardware security modules.",
  },
  {
    title: "IRS and NIST safeguards",
    description:
      "Our controls follow IRS Publication 4557, Safeguarding Taxpayer Data, and the NIST SP 800-53 framework.",
  },
  {
    title: "Need-to-know access",
    description:
      "Only the CPA or preparer assigned to your return can open your unmasked documents. Access is logged.",
  },
  {
    title: "Hosting",
    description:
      "Infrastructure runs in SOC 2 Type II and ISO 27001 certified data centers, with redundant off-site backups.",
  },
];

const details = [
  {
    heading: "Written Information Security Plan",
    body: [
      "As required by the FTC Safeguards Rule and IRS guidance, we maintain a Written Information Security Plan. It covers staff background checks, encrypted devices, network segmentation and regular incident-response drills.",
    ],
  },
  {
    heading: "What happens to an uploaded file",
    list: [
      ["Malware scanning", "Files are held and scanned before they're stored."],
      ["File-type checks", "We check that a file is what it claims to be, so executables can't be disguised as PDFs."],
      ["Isolated processing", "Documents are processed in short-lived, isolated containers that are destroyed afterwards."],
    ],
  },
  {
    heading: "Signing in",
    list: [
      ["Multi-factor authentication", "Required for client accounts and for every staff workstation."],
      ["Session timeouts", "Sessions end after 15 minutes of inactivity."],
      ["Security keys", "FIDO2 and WebAuthn keys and biometrics are supported."],
      ["Automatic sign-out", "All sessions end if your password changes or a sign-in looks unusual."],
    ],
  },
];

export default function SecurityPage() {
  return (
    <PublicLayout>
      <PageIntro
        eyebrow="Security"
        title="How we look after your documents."
        lede="Tax files hold the most sensitive information most people have. Here's what we do to protect it, in plain terms."
      />

      <section className="border-b border-paper-line">
        <div className="site-container py-16 lg:py-20">
          <div className="grid gap-px overflow-hidden border border-paper-line bg-paper-line sm:grid-cols-2">
            {pillars.map((p) => (
              <div key={p.title} className="bg-paper p-8 lg:p-10">
                <h2 className="font-display text-[26px] text-ink">{p.title}</h2>
                <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="site-container py-16 lg:py-20">
        {details.map((d) => (
          <section key={d.heading} className="grid gap-6 border-b border-paper-line py-10 first:pt-0 lg:grid-cols-12">
            <h2 className="font-display text-[26px] leading-tight text-ink lg:col-span-4">{d.heading}</h2>
            <div className="lg:col-span-8">
              {d.body?.map((para) => (
                <p key={para} className="text-[16px] leading-relaxed text-ink-soft">
                  {para}
                </p>
              ))}
              {d.list && (
                <dl className="divide-y divide-paper-line border-y border-paper-line">
                  {d.list.map(([term, desc]) => (
                    <div key={term} className="grid gap-1 py-4 sm:grid-cols-[200px_1fr] sm:gap-6">
                      <dt className="font-semibold text-ink">{term}</dt>
                      <dd className="text-[15px] leading-relaxed text-ink-soft">{desc}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        ))}

        <section className="grid gap-6 pt-10 lg:grid-cols-12">
          <h2 className="font-display text-[26px] leading-tight text-ink lg:col-span-4">Reporting a vulnerability</h2>
          <div className="text-[16px] leading-relaxed text-ink-soft lg:col-span-8">
            <p>
              If you&apos;re a security researcher and believe you&apos;ve found an issue in our website or client portal,
              please tell us. We&apos;ll acknowledge your report and keep you updated.
            </p>
            <p className="mt-4">
              Email{" "}
              <a href="mailto:security@polaristax.com" className="link-under">
                security@polaristax.com
              </a>
              . Our PGP key is available on request.
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
