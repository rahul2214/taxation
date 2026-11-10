import type { Metadata } from "next";
import { buildMetadata, breadcrumbSchema, SITE } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageFaq } from "@/components/public/PageFaq";
import { PAGE_FAQS } from "@/data/faqs";
import { PageIntro } from "@/components/public/PageIntro";
import { ContactForm } from "@/components/public/ContactForm";

export const metadata: Metadata = buildMetadata({
  title: "Contact Polaris Tax Services",
  description: "Call (212) 847-1920, email plrstaxservices@gmail.com or send a message online. A CPA replies within four business hours, Mon–Fri.",
  path: "/contact",
  keywords: ["contact CPA", "contact tax accountant", "online CPA", "tax preparer phone number"],
});

const emails = [["New clients, portal help and IRS letters", SITE.email]];

export default function ContactPage() {
  return (
    <PublicLayout>
      <JsonLd data={[breadcrumbSchema([{ name: "Contact", path: "/contact" }]), { "@context": "https://schema.org", "@type": "ContactPage", name: "Contact Polaris Tax Services", url: `${SITE.url}/contact`, about: { "@id": `${SITE.url}/#organization` } }]} />
      <PageIntro
        eyebrow="Contact"
        title="Call, email, or send us a message."
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
            <p className="eyebrow">How we work</p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-soft">
              We work remotely. Consultations happen by phone, and documents are shared securely through the
              client portal.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-[4px] border border-paper-line bg-white p-6 sm:p-10">
            <h2 className="font-display text-[30px] leading-tight text-ink">Send a message</h2>
            <p className="mt-2 text-[15px] text-ink-muted">
              Questions about services, pricing or a letter you received. After you send it, you can pick a time for
              a call.
            </p>

            <ContactForm />
          </div>
        </div>
      </div>
      <PageFaq items={PAGE_FAQS.contact} />
    </PublicLayout>
  );
}
