import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import Link from "next/link";
import { Check, ShieldCheck, ArrowRight, CalendarCheck } from "lucide-react";

const services = [
  {
    id: "personal",
    title: "Individual Tax Filing",
    badge: "Form 1040",
    description: "For individuals, families, and high earners. We scan every schedule to maximize your refund.",
    image: PlaceHolderImages.find((p) => p.id === "service-personal-tax"),
    features: [
      "W-2, 1099-NEC, 1099-MISC & 1099-K",
      "Itemized vs. standard deduction optimization",
      "Child tax credits, EITC, & education benefits",
      "Rapid direct deposit e-filing setup",
    ],
    price: "$59",
    pricePeriod: "base return fee",
  },
  {
    id: "business",
    title: "Business Tax Services",
    badge: "LLC & S-Corp",
    description: "Tailored tax preparation and compliance for small business owners, partnerships, and freelancers.",
    image: PlaceHolderImages.find((p) => p.id === "service-business-tax"),
    features: [
      "Schedule C, Form 1065 & Form 1120-S",
      "Section 179 asset depreciation tracking",
      "Quarterly estimated tax vouchers",
      "Dedicated CPA return review and sign-off",
    ],
    price: "$199",
    pricePeriod: "starts at",
  },
  {
    id: "audit",
    title: "IRS Audit & Notice Defense",
    badge: "Representation",
    description: "Expert representation and formal correspondence if you receive an IRS or state tax inquiry.",
    image: PlaceHolderImages.find((p) => p.id === "service-audit-support"),
    features: [
      "CP2000, CP504 & math error responses",
      "Direct IRS representation by Enrolled Agents",
      "Penalty abatement petition preparation",
      "Installment agreement negotiations",
    ],
    price: "Custom",
    pricePeriod: "per case scope",
  },
  {
    id: "bookkeeping",
    title: "Year-Round Bookkeeping",
    badge: "Monthly Advisory",
    description: "Keep your books audit-ready year-round with professional reconciliation and financial statements.",
    image: PlaceHolderImages.find((p) => p.id === "service-bookkeeping"),
    features: [
      "Monthly bank & credit card reconciliation",
      "Income statement (P&L) & balance sheets",
      "Payroll integration & 1099 vendor filing",
      "Tax-ready books delivered every quarter",
    ],
    price: "$250",
    pricePeriod: "/month",
  },
  {
    id: "consulting",
    title: "Tax Planning & Strategy",
    badge: "Proactive",
    description: "Proactive strategic planning to optimize your entity structure and minimize multi-year tax liabilities.",
    image: PlaceHolderImages.find((p) => p.id === "service-consulting"),
    features: [
      "Entity structuring (LLC vs. S-Corp evaluation)",
      "Multi-state nexus & remote worker compliance",
      "Capital gains & real estate 1031 exchanges",
      "Executive compensation & RSU strategy",
    ],
    price: "Inquire",
    pricePeriod: "custom roadmap",
  },
  {
    id: "retirement",
    title: "Retirement & Estate Strategy",
    badge: "Wealth Protection",
    description: "Structure retirement distributions and estate transfers for maximum tax efficiency and generational protection.",
    image: PlaceHolderImages.find((p) => p.id === "service-retirement"),
    features: [
      "Traditional IRA to Roth conversion planning",
      "Required Minimum Distribution (RMD) rules",
      "Social Security tax impact analysis",
      "Generational wealth transfer guidance",
    ],
    price: "Custom",
    pricePeriod: "advisory scope",
  },
];

export default function ServicesPage() {
  return (
    <PublicLayout>
      <div className="bg-slate-50 min-h-screen py-12 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          {/* Header */}
          <header className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              Licensed CPAs & IRS Enrolled Agents
            </div>
            <h1 className="text-3xl md:text-5xl font-headline font-bold text-slate-950 tracking-tight">
              Professional Tax & Accounting Services
            </h1>
            <p className="mt-3 text-base md:text-lg text-slate-600">
              Institutional accuracy, maximum deductions, and personal CPA advisory designed to safeguard your wealth.
            </p>
          </header>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card
                key={service.id}
                className="flex flex-col overflow-hidden bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all duration-200 rounded-xl"
              >
                {service.image && (
                  <Image
                    src={service.image.imageUrl}
                    alt={service.image.description}
                    width={600}
                    height={340}
                    className="w-full h-44 object-cover"
                  />
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {service.badge}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">{service.title}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pt-0">
                  <ul className="space-y-2 text-xs text-slate-700">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col items-start bg-slate-50 border-t border-slate-100 p-5 mt-auto">
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-950">{service.price}</span>
                    <span className="text-xs text-slate-500 ml-1.5">{service.pricePeriod}</span>
                  </div>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 shadow-xs">
                    <Link href="/signup">Get Started Online</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Bottom Consultation Banner */}
          <div className="mt-16 bg-slate-900 rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-headline font-bold">Unsure which service matches your tax situation?</h3>
              <p className="text-sm text-slate-400 max-w-xl">
                Speak directly with an IRS Enrolled Agent or CPA for a complimentary 15-minute consultation.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6">
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
