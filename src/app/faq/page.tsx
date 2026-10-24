import { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, ShieldCheck, ArrowRight, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | Polaris Tax Services",
  description: "Find clear answers about Polaris CPA tax preparation, document upload vault, turnaround times, IRS e-file confirmation, and refund tracking.",
};

const FAQ_SECTIONS = [
  {
    category: "Filing Process & Turnaround",
    items: [
      {
        question: "How does tax filing work with Polaris Tax Services?",
        answer:
          "Our process is streamlined and digital-first: (1) Register your secure client account, (2) Upload your tax documents (W-2s, 1099s, K-1s, receipts) to your encrypted vault, (3) A licensed CPA or Enrolled Agent reviews your file, conducts multi-point deduction scans, and drafts your returns, (4) You review your return and sign IRS Form 8879 electronically, and (5) We transmit directly to the IRS and state agencies via authorized e-file.",
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
    category: "Guarantees & Calculations",
    items: [
      {
        question: "How does the 100% Calculation Accuracy Guarantee work?",
        answer:
          "Every return undergoes CPA multi-tier verification. If Polaris makes an arithmetic calculation error or misinterprets an active tax table resulting in IRS or state penalties plus interest, we reimburse 100% of the penalty and interest assessed by the taxing authority.",
      },
      {
        question: "How do you ensure I receive the maximum legal refund?",
        answer:
          "Our CPAs perform comprehensive credit and deduction cross-checks across all applicable federal and state schedules. If you discover a larger refund or lower tax liability on an identical return with identical data through another preparer prior to filing, we refund your Polaris preparation fee in full.",
      },
      {
        question: "When will I receive my IRS tax refund?",
        answer:
          "Once we e-file your return and the IRS sends electronic acceptance, direct deposit refunds are typically disbursed by the IRS within 21 days for clean electronic returns. You can track your refund in real time directly from your Polaris dashboard.",
      },
    ],
  },
  {
    category: "Data Privacy & Bank-Level Security",
    items: [
      {
        question: "Is my personal and tax information secure?",
        answer:
          "Yes. All files in transit are protected by TLS 1.3 with 256-bit encryption, and stored documents in your vault are encrypted with AES-256. We operate under strict IRS Publication 4557 standards and SOC 2 Type II certified cloud infrastructure.",
      },
      {
        question: "Do you sell or share my tax information?",
        answer:
          "Never. Under Federal Internal Revenue Code (IRC) Section 7216, it is a criminal violation for tax preparers to sell, disclose, or use tax return information for any purpose other than preparing your return. We have zero third-party data monetization.",
      },
    ],
  },
  {
    category: "Business, LLCs & IRS Notices",
    items: [
      {
        question: "Do you prepare business returns (LLCs, S-Corps, Partnerships)?",
        answer:
          "Yes. Our corporate advisory practice handles Form 1065 (Partnerships), Form 1120-S (S-Corporations), and Form 1120 (C-Corporations), including K-1 generation for shareholders, multi-state payroll nexus analysis, and Section 179 depreciation.",
      },
      {
        question: "What happens if I receive a notice or letter from the IRS?",
        answer:
          "Every return filed with Polaris includes complimentary notice review. If the IRS sends a CP2000, CP504, or math verification inquiry regarding a return we prepared, simply upload the letter to your portal and our Enrolled Agents will formulate the response.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <PublicLayout>
      <div className="bg-slate-50 min-h-screen py-12 md:py-20 text-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <header className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
              <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-headline font-bold text-slate-950 tracking-tight">
              Everything You Need to Know
            </h1>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Clear answers regarding our CPA preparation workflows, guarantees, security standards, and refund timelines.
            </p>
          </header>

          {/* FAQ Sections */}
          <div className="space-y-10">
            {FAQ_SECTIONS.map((sec, secIdx) => (
              <div key={secIdx} className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-slate-950 pb-2 border-b border-slate-100">
                  {sec.category}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {sec.items.map((item, itemIdx) => (
                    <AccordionItem key={itemIdx} value={`item-${secIdx}-${itemIdx}`} className="border-slate-100">
                      <AccordionTrigger className="text-left text-sm md:text-base font-semibold text-slate-900 hover:text-blue-600 hover:no-underline py-4">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-xs md:text-sm text-slate-600 leading-relaxed pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Bottom Help Banner */}
          <div className="mt-14 bg-slate-900 rounded-2xl p-8 md:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="text-xl font-bold">Have a specific question about your tax situation?</h3>
              <p className="text-xs md:text-sm text-slate-400 max-w-lg">
                Speak directly with an IRS Enrolled Agent or licensed CPA for personalized guidance.
              </p>
            </div>
            <Button asChild className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 h-11">
              <Link href="/book-appointment" className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                <span>Book Free Consultation</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
