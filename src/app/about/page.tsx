import Image from "next/image";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Target, Eye, Handshake, ShieldCheck, Award, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const teamImage = PlaceHolderImages.find((p) => p.id === "about-team");

const values = [
  {
    icon: <Target className="h-6 w-6 text-blue-600" />,
    title: "Institutional Precision",
    description: "Every return is subjected to rigorous multi-point verification by licensed CPAs to ensure 100% calculation accuracy and total compliance.",
  },
  {
    icon: <Eye className="h-6 w-6 text-blue-600" />,
    title: "Transparent Advisory",
    description: "No hidden fees, no opaque algorithms. We walk you through every deduction, credit, and schedule so you have total financial clarity.",
  },
  {
    icon: <Handshake className="h-6 w-6 text-blue-600" />,
    title: "Fiduciary Standard",
    description: "We operate with uncompromised integrity. Your financial well-being and privacy are guarded by strict federal IRC § 7216 standards.",
  },
];

const credentials = [
  {
    title: "Licensed CPAs & IRS Enrolled Agents",
    description: "Our preparers hold active state board licenses and IRS Circular 230 federal practice privileges.",
  },
  {
    title: "IRS Authorized e-File Provider",
    description: "Direct, encrypted integration with IRS e-file systems for immediate confirmation and rapid refund routing.",
  },
  {
    title: "Bank-Grade 256-Bit TLS Encryption",
    description: "Sensitive tax documents and identity records are guarded by strict end-to-end encryption protocols.",
  },
  {
    title: "Full Audit Representation",
    description: "We stand behind every return we file. In the rare event of an IRS inquiry, our CPAs represent you directly.",
  },
];

export default function AboutUsPage() {
  return (
    <PublicLayout>
      <div className="bg-slate-50 min-h-screen py-12 md:py-20">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          {/* Header */}
          <header className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              About Polaris Tax Services
            </div>
            <h1 className="text-3xl md:text-5xl font-headline font-bold text-slate-950 tracking-tight">
              A Higher Standard in Tax Advisory
            </h1>
            <p className="mt-3 text-base md:text-lg text-slate-600">
              Founded on the principle that every taxpayer deserves institutional-grade expertise, transparent pricing, and unwavering audit defense.
            </p>
          </header>

          {/* Team Hero Card */}
          <section className="mb-14">
            <Card className="overflow-hidden border border-slate-200 bg-white shadow-xs rounded-xl">
              {teamImage && (
                <Image
                  src={teamImage.imageUrl}
                  alt={teamImage.description}
                  width={1200}
                  height={600}
                  className="w-full h-64 md:h-80 object-cover"
                />
              )}
              <CardContent className="p-8 md:p-10">
                <div className="max-w-3xl mx-auto space-y-4 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Bridging Sophisticated CPA Analysis with Digital Simplicity
                  </h2>
                  <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                    Polaris Tax Services was established to eliminate the frustration of automated tax software and the opacity of traditional accounting practices. By pairing modern digital document ingestion with hands-on licensed CPA oversight, we uncover deductions other filers miss while guaranteeing absolute IRS compliance.
                  </p>
                  <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                    Whether you are an employee managing RSUs and rental properties or an entrepreneur scaling an S-Corp, our firm serves as your trusted year-round financial partner.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Core Values */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Our Core Principles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {values.map((val) => (
                <Card key={val.title} className="p-6 border border-slate-200 bg-white shadow-xs rounded-xl space-y-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 w-fit">{val.icon}</div>
                  <h3 className="font-semibold text-slate-900 text-base">{val.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{val.description}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Institutional Standards */}
          <section className="mb-14">
            <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-10">
              <h2 className="text-xl md:text-2xl font-bold text-center mb-8">Firm Credentials & Security Standards</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {credentials.map((cred, idx) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="p-2 rounded-lg bg-slate-800 text-blue-400 shrink-0 mt-0.5">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-100">{cred.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cred.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Strip */}
          <section className="text-center bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
            <h3 className="text-xl font-bold text-slate-900">Experience the Polaris Difference</h3>
            <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto">
              Schedule a consultation with one of our licensed tax professionals or start filing online today.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6">
                <Link href="/book-appointment">Book Consultation</Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-300 text-slate-800 text-xs font-semibold px-6">
                <Link href="/signup">Create Free Account</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
