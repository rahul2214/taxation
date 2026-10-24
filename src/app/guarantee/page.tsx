import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Award, RefreshCw, ShieldCheck, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const guaranteeSeal = PlaceHolderImages.find((p) => p.id === "guarantee-seal");

const guarantees = [
  {
    icon: <Award className="h-6 w-6 text-blue-600" />,
    title: "100% Accuracy & Penalty Reimbursement",
    description:
      "We guarantee our calculations are 100% accurate under current IRS tax code regulations. If any calculation error is made by our system or CPAs, Polaris will reimburse you for 100% of resulting IRS or state penalties plus applicable interest charges.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6 text-blue-600" />,
    title: "Maximum Legal Refund Guarantee",
    description:
      "We scan every permissible schedule, credit, and deduction. If you receive a larger refund or smaller tax liability on another identical tax preparation platform using identical data, we will refund your Polaris preparation fee in full.",
  },
  {
    icon: <RefreshCw className="h-6 w-6 text-blue-600" />,
    title: "Satisfaction Prior to Filing",
    description:
      "Review your completed return, review your estimated refund, and examine our CPA deduction notes. If you are not completely satisfied with our service prior to authorizing e-file transmission, you pay nothing.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-blue-600" />,
    title: "Year-Round Audit Defense Included",
    description:
      "Should the IRS or your state department of revenue send an inquiry or notice regarding a return filed through Polaris, our Enrolled Agents and CPAs assist in formulating your response and documentation at no additional cost.",
  },
];

export default function GuaranteePage() {
  return (
    <PublicLayout>
      <div className="bg-slate-50 min-h-screen py-12 md:py-20">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          {/* Header */}
          <header className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              The Polaris Commitment
            </div>
            <h1 className="text-3xl md:text-5xl font-headline font-bold text-slate-950 tracking-tight">
              Our Ironclad Guarantee
            </h1>
            <p className="mt-3 text-base md:text-lg text-slate-600">
              Complete accuracy, maximum legal refund, and full audit protection. We stand behind every return we file.
            </p>
          </header>

          {/* Intro Card */}
          <section className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-xs mb-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Your Financial Security is Our Utmost Priority</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                At Polaris Tax Services, our guarantees are not marketing slogans—they are legal assurances backed by certified public accountants. We recognize that tax filings carry legal weight, and we assume full professional accountability for the accuracy of our filings.
              </p>
              <div className="flex items-center gap-4 pt-2 text-xs text-slate-700 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  IRS Circular 230 Compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Licensed CPA Oversight
                </span>
              </div>
            </div>
            {guaranteeSeal && (
              <div className="shrink-0">
                <Image
                  src={guaranteeSeal.imageUrl}
                  alt={guaranteeSeal.description}
                  width={160}
                  height={160}
                  className="rounded-full border-4 border-slate-100 shadow-md"
                />
              </div>
            )}
          </section>

          {/* Guarantees List */}
          <section className="space-y-5 mb-14">
            {guarantees.map((guarantee) => (
              <Card key={guarantee.title} className="border border-slate-200 bg-white shadow-xs p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-blue-50 shrink-0 mt-0.5">
                    {guarantee.icon}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900">{guarantee.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{guarantee.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          {/* Terms & Conditions */}
          <section className="bg-slate-100/80 border border-slate-200 rounded-xl p-6 text-xs text-slate-500 leading-relaxed space-y-2 mb-12">
            <h4 className="font-semibold text-slate-700 text-sm">Guarantee Terms & Limitations</h4>
            <p>
              Accuracy Guarantee applies strictly to calculations made by Polaris Tax Services based upon accurate information provided by the taxpayer. Penalties resulting from omitted income, falsified documentation, or changes in retroactive tax legislation after return submission are excluded. Maximum refund comparisons must be made against another professional preparer or commercial software using identical source tax documentation.
            </p>
          </section>

          {/* Bottom CTA */}
          <div className="text-center space-y-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-12 shadow-xs">
              <Link href="/signup">File with Confidence Today</Link>
            </Button>
            <p className="text-xs text-slate-500">
              Have questions regarding our guarantees? <Link href="/book-appointment" className="text-blue-600 hover:underline">Speak with a CPA</Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
