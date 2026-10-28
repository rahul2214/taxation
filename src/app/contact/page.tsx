import type { Metadata } from "next";
import { buildMetadata, breadcrumbSchema, SITE } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageIntro } from "@/components/public/PageIntro";

export const metadata: Metadata = buildMetadata({
  title: "Contact Our New York CPA Office",
  description: "Call (212) 847-1920, email advisory@polaristax.com or visit us at 440 Park Avenue South, New York. A CPA replies within four business hours, Mon–Fri.",
  path: "/contact",
  keywords: ["contact CPA New York", "tax accountant Manhattan", "Park Avenue South CPA", "tax preparer phone number"],
});

const emails = [
  ["New clients & questions", "advisory@polaristax.com"],
  ["Help with the client portal", "support@polaristax.com"],
  ["IRS or state letters", "notices@polaristax.com"],
];

export default function ContactPage() {
  return (
    <PublicLayout>
      <JsonLd data={[breadcrumbSchema([{ name: "Contact", path: "/contact" }]), { "@context": "https://schema.org", "@type": "ContactPage", name: "Contact Polaris Tax Services", url: `${SITE.url}/contact`, about: { "@id": `${SITE.url}/#organization` } }]} />
      <PageIntro
        eyebrow="Contact"
        title="Call, write, or come by the office."
        lede="Weekdays, a CPA reads every message and replies within four business hours. For anything urgent, the phone is fastest."
      />

      <div className="site-container grid gap-14 py-16 lg:grid-cols-12 lg:py-20">
        <div className="space-y-10 lg:col-span-5">
          <div>
            <p className="eyebrow">Phone</p>
            <a href="tel:+12128471920" className="mt-3 block font-display text-[36px] leading-none text-ink hover:text-brass-dark">
              (212) 847-1920
            </a>
            <p className="mt-2 text-[14.5px] text-ink-muted">Monday to Friday, 8am to 8pm Eastern</p>
          </div>

          <div className="border-t border-paper-line pt-8">
            <p className="eyebrow">Email</p>
            <dl className="mt-4 space-y-4 text-[15px]">
              {emails.map(([label, address]) => (
                <div key={address}>
                  <dt className="text-ink-muted">{label}</dt>
                  <dd>
                    <a href={`mailto:${address}`} className="link-under">
                      {address}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="border-t border-paper-line pt-8">
            <p className="eyebrow">Office</p>
            <address className="mt-4 text-[15.5px] not-italic leading-relaxed text-ink-soft">
              Polaris Tax Services Inc.
              <br />
              440 Park Avenue South, 12th Floor
              <br />
              New York, NY 10016
            </address>
            <p className="mt-3 text-[14px] text-ink-muted">In-person meetings by appointment.</p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-[4px] border border-paper-line bg-white p-6 sm:p-10">
            <h2 className="font-display text-[30px] leading-tight text-ink">Send a message</h2>
            <p className="mt-2 text-[15px] text-ink-muted">
              Questions about services, pricing or a letter you received. After you send it, you can pick a time for
              a call.
            </p>

            <form className="mt-8 grid gap-5 sm:grid-cols-2" action="/book-appointment" method="GET">
              <div>
                <label htmlFor="contact-name" className="field-label">Full name</label>
                <input id="contact-name" name="name" autoComplete="name" required className="field" />
              </div>
              <div>
                <label htmlFor="contact-email" className="field-label">Email</label>
                <input id="contact-email" name="email" type="email" autoComplete="email" required className="field" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-subject" className="field-label">Topic</label>
                <select id="contact-subject" name="subject" className="field">
                  <option>Preparing a tax return</option>
                  <option>Small business or LLC taxes</option>
                  <option>I received an IRS or state letter</option>
                  <option>Client portal or documents</option>
                  <option>Something else</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-message" className="field-label">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  required
                  className="field h-auto resize-none py-3"
                />
              </div>
              <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-ink-muted">Kept confidential. Never shared.</p>
                <button type="submit" className="btn-ink px-6">
                  Send and choose a time
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
