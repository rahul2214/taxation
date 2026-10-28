import type { Metadata } from "next";
import { buildMetadata, breadcrumbSchema, faqSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { FaqList } from "@/components/public/FaqList";
import { PageIntro } from "@/components/public/PageIntro";
import { ClosingCta } from "@/components/public/ClosingCta";

export const metadata: Metadata = buildMetadata({
  title: "Tax Preparation FAQ: Cost & Timing",
  description: "How CPA tax preparation works at Polaris: documents you need, how long it takes, when refunds arrive, our accuracy guarantee, data security and IRS notice help.",
  path: "/faq",
  keywords: ["tax preparation FAQ", "how long does tax preparation take", "documents needed for tax return", "when will I get my tax refund"],
});

const FAQ_SECTIONS = [
  {
    category: "Filing & turnaround",
    items: [
      {
        question: "How does tax filing work with Polaris Tax Services?",
        answer:
          "It works in five steps: (1) Register your secure client account, (2) Upload your tax documents (W-2s, 1099s, K-1s, receipts) to your encrypted vault, (3) A licensed CPA or Enrolled Agent reviews your file and prepares your returns, (4) You review your return and sign IRS Form 8879 electronically, and (5) We transmit directly to the IRS and state agencies via authorized e-file.",
      },
      {
        question: "How long does it take to prepare and file my tax return?",
        answer:
          "Simple individual returns (W-2s, standard deductions) are typically finalized and ready for review within 2 to 3 business days once all documents are received. Small business returns (Schedule C, LLCs, S-Corps) generally take 4 to 7 business days depending on the state apportionment complexity.",
      },
      {
        question: "What documents do I need to upload?",
        answer:
          "Depending on your tax situation: Government ID, Forms W-2, all 1099s (NEC, MISC, INT, DIV, B), 1098 mortgage interest, brokerage annual statements, business profit & loss statements, vehicle mileage logs, and childcare expense statements. Our portal provides a customized checklist once you create an account.",
      },
    ],
  },
  {
    category: "Guarantees & refunds",
    items: [
      {
        question: "How does the 100% Calculation Accuracy Guarantee work?",
        answer:
          "Every return is reviewed by a CPA before filing. If Polaris makes an arithmetic calculation error or misinterprets an active tax table resulting in IRS or state penalties plus interest, we reimburse 100% of the penalty and interest assessed by the taxing authority.",
      },
      {
        question: "How do you ensure I receive the maximum legal refund?",
        answer:
          "Your CPA checks every credit and deduction that could apply on your federal and state returns. If you discover a larger refund or lower tax liability on an identical return with identical data through another preparer prior to filing, we refund your Polaris preparation fee in full.",
      },
      {
        question: "When will I receive my IRS tax refund?",
        answer:
          "Once we e-file your return and the IRS sends electronic acceptance, direct deposit refunds are typically disbursed by the IRS within 21 days for clean electronic returns. You can track your refund in real time directly from your Polaris dashboard.",
      },
    ],
  },
  {
    category: "Privacy & security",
    items: [
      {
        question: "Is my personal and tax information secure?",
        answer:
          "Yes. All files in transit are protected by TLS 1.3 with 256-bit encryption, and stored documents in your vault are encrypted with AES-256. We operate under strict IRS Publication 4557 standards and SOC 2 Type II certified cloud infrastructure.",
      },
      {
        question: "Do you sell or share my tax information?",
        answer:
          "Never. Under Federal Internal Revenue Code (IRC) Section 7216, it is a criminal violation for tax preparers to sell, disclose, or use tax return information for any purpose other than preparing your return. We don't share your information with anyone outside the firm.",
      },
    ],
  },
  {
    category: "Businesses & IRS notices",
    items: [
      {
        question: "Do you prepare business returns (LLCs, S-Corps, Partnerships)?",
        answer:
          "Yes. We prepare Form 1065 (Partnerships), Form 1120-S (S-Corporations), and Form 1120 (C-Corporations), including K-1 generation for shareholders, multi-state payroll nexus analysis, and Section 179 depreciation.",
      },
      {
        question: "What happens if I receive a notice or letter from the IRS?",
        answer:
          "Every return filed with Polaris includes complimentary notice review. If the IRS sends a CP2000, CP504, or math verification inquiry regarding a return we prepared, simply upload the letter to your portal and an Enrolled Agent will draft the response with you.",
      },
    ],
  },
];

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function FaqPage() {
  return (
    <PublicLayout>
      <JsonLd data={[breadcrumbSchema([{ name: "FAQ", path: "/faq" }]), faqSchema(FAQ_SECTIONS.flatMap((sec) => sec.items))]} />
      <PageIntro
        eyebrow="Questions & answers"
        title="Things people usually ask us."
        lede="How the process works, what it costs, how long it takes, and how we look after your information. If yours isn't here, call or write and we'll answer it."
      />

      <div className="site-container grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <nav aria-label="FAQ topics" className="lg:col-span-3">
          <ul className="space-y-3 border-t border-ink pt-4 text-[14.5px] lg:sticky lg:top-32">
            {FAQ_SECTIONS.map((sec) => (
              <li key={sec.category}>
                <a href={`#${slug(sec.category)}`} className="text-ink-soft hover:text-ink">
                  {sec.category}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-16 lg:col-span-9">
          {FAQ_SECTIONS.map((sec) => (
            <section key={sec.category} id={slug(sec.category)} className="scroll-mt-32">
              <h2 className="font-display text-[30px] leading-tight text-ink">{sec.category}</h2>
              <div className="mt-6">
                <FaqList items={sec.items} />
              </div>
            </section>
          ))}
        </div>
      </div>

      <ClosingCta title="Still have a question?" body="Ask a CPA directly. The first 15 minutes are free, and you'll get a straight answer." />
    </PublicLayout>
  );
}
