import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

const services = [
  {
    id: "personal",
    title: "Personal Tax Filing",
    description: "For individuals and families. We'll help you navigate deductions and credits to maximize your refund.",
    image: PlaceHolderImages.find(p => p.id === 'service-personal-tax'),
    features: ["W-2 and 1099 income", "Itemized deductions", "Student loan interest", "Free e-filing"],
    price: "$59",
    pricePeriod: "starts at",
  },
  {
    id: "business",
    title: "Business Tax Services",
    description: "Tailored solutions for small businesses, freelancers, and corporations.",
    image: PlaceHolderImages.find(p => p.id === 'service-business-tax'),
    features: ["Sole proprietorship, LLC, S-Corp", "Expense tracking", "Quarterly estimates", "Year-end filing"],
    price: "$199",
    pricePeriod: "starts at",
  },
  {
    id: "audit",
    title: "IRS Audit Support",
    description: "Expert representation and guidance if you're facing an IRS audit.",
    image: PlaceHolderImages.find(p => p.id === 'service-audit-support'),
    features: ["Correspondence handling", "Audit representation", "Resolution strategies", "Peace of mind"],
    price: "Custom",
    pricePeriod: "pricing",
  },
  {
    id: "bookkeeping",
    title: "Bookkeeping",
    description: "Keep your finances in order year-round with our professional bookkeeping services.",
    image: PlaceHolderImages.find(p => p.id === 'service-bookkeeping'),
    features: ["Monthly reconciliation", "Financial statements", "Payroll integration", "Tax-ready books"],
    price: "$250",
    pricePeriod: "/month",
  },
  {
    id: "consulting",
    title: "Tax Consulting",
    description: "Proactive tax planning and advisory to optimize your financial future.",
    image: PlaceHolderImages.find(p => p.id === 'service-consulting'),
    features: ["Tax reduction strategies", "Business structuring", "Investment implications", "Personalized advice"],
    price: "Inquire",
    pricePeriod: "for rates",
  },
   {
    id: "retirement",
    title: "Retirement Planning",
    description: "Plan for a secure retirement with tax-efficient strategies.",
    image: PlaceHolderImages.find(p => p.id === 'service-retirement'),
    features: ["401(k) & IRA guidance", "Roth conversions", "Social Security analysis", "Withdrawal strategies"],
    price: "Custom",
    pricePeriod: "planning",
  }
];

export default function ServicesPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Our Services</h1>
          <p className="mt-4 text-lg text-muted-foreground">Comprehensive tax solutions tailored to your needs.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <Card key={service.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              {service.image && (
                <Image
                  src={service.image.imageUrl}
                  alt={service.image.description}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                  data-ai-hint={service.image.imageHint}
                />
              )}
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground mb-4">{service.description}</p>
                <ul className="space-y-2 text-sm">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-accent" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col items-start bg-secondary/50 p-6 mt-4">
                <div className="mb-4">
                  <span className="text-3xl font-bold">{service.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">{service.pricePeriod}</span>
                </div>
                <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/login">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
