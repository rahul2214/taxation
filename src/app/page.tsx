"use client";

import Image from "next/image";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Zap, Users, Check, Gift, LifeBuoy, ShieldCheck, Briefcase, Building2, Globe, Factory, Calculator, Minus, Plus } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Autoplay from "embla-carousel-autoplay";
import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
const serviceImages = {
  personal: PlaceHolderImages.find(p => p.id === 'service-personal-tax'),
  business: PlaceHolderImages.find(p => p.id === 'service-business-tax'),
  audit: PlaceHolderImages.find(p => p.id === 'service-audit-support'),
};

const features = [
  {
    icon: <Zap className="h-8 w-8 text-accent" />,
    title: "Fast & Easy Filing",
    description: "Our streamlined process makes tax filing quicker and more efficient than ever.",
  },
  {
    icon: <Users className="h-8 w-8 text-accent" />,
    title: "Expert Support",
    description: "Get access to our team of certified tax professionals for guidance and support.",
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-accent" />,
    title: "Maximum Refund",
    description: "We guarantee you'll get the maximum refund possible, or your money back.",
  },
  {
    icon: <LifeBuoy className="h-8 w-8 text-accent" />,
    title: "Free Live Support",
    description: "Our dedicated support team is here to help you every step of the way.",
  }
];

const testimonials = [
  { name: "Jane Doe", role: "Freelancer", text: "Polaris Tax Services made my tax season stress-free. The platform is intuitive and their experts were incredibly helpful!", avatar: "https://picsum.photos/seed/t1/40/40", fallback: "JD" },
  { name: "John Smith", role: "Small Business Owner", text: "I've been using Polaris Tax Services for my business for three years now. Impeccable service and they always find deductions I missed.", avatar: "https://picsum.photos/seed/t2/40/40", fallback: "JS" },
  { name: "Emily White", role: "Investor", text: "Complex investments are no problem for the Polaris Tax Services team. Highly recommend for anyone with a complicated tax situation.", avatar: "https://picsum.photos/seed/t3/40/40", fallback: "EW" },
];

const plans = [
    {
        id: "personal",
        title: "Personal",
        description: "Perfect for individuals and families looking for a stress-free tax season.",
        price: "$59",
        pricePeriod: "starts at",
        features: ["W-2 & 1099 Income", "Itemized Deductions", "Student Loan Interest", "Free E-filing"],
        buttonText: "Get Started"
    },
    {
        id: "business",
        title: "Business",
        description: "Tailored solutions for small businesses, freelancers, and S-Corps.",
        price: "$199",
        pricePeriod: "starts at",
        features: ["Sole Proprietorship, LLC, S-Corp", "Expense Tracking", "Quarterly Estimates", "Year-End Filing"],
        buttonText: "Get Started"
    },
    {
        id: "bookkeeping",
        title: "Bookkeeping",
        description: "Keep your finances in order year-round with our professional services.",
        price: "$250",
        pricePeriod: "/month",
        features: ["Monthly Reconciliation", "Financial Statements", "Payroll Integration", "Tax-Ready Books"],
        buttonText: "Learn More"
    }
];

const trustedByLogos = [
    { icon: <Briefcase className="h-10 w-10" /> },
    { icon: <Building2 className="h-10 w-10" /> },
    { icon: <Globe className="h-10 w-10" /> },
    { icon: <Factory className="h-10 w-10" /> },
];


function TaxEstimator() {
  const [income, setIncome] = useState(50000);
  const [filingStatus, setFilingStatus] = useState("single");
  const [dependents, setDependents] = useState(0);

  const estimatedTax = useMemo(() => {
    // This is a highly simplified tax calculation for demonstration purposes.
    const standardDeductions: { [key: string]: number } = {
      single: 13850,
      married: 27700,
      hoh: 20800
    };

    const taxBrackets: { [key: string]: { rate: number, amount: number }[] } = {
      single: [
        { rate: 0.10, amount: 11000 },
        { rate: 0.12, amount: 44725 },
        { rate: 0.22, amount: 95375 },
        { rate: 0.24, amount: 182100 },
        { rate: 0.32, amount: 231250 },
        { rate: 0.35, amount: 578125 },
        { rate: 0.37, amount: Infinity },
      ],
      married: [
        { rate: 0.10, amount: 22000 },
        { rate: 0.12, amount: 89450 },
        { rate: 0.22, amount: 190750 },
        { rate: 0.24, amount: 364200 },
        { rate: 0.32, amount: 462500 },
        { rate: 0.35, amount: 693750 },
        { rate: 0.37, amount: Infinity },
      ],
      hoh: [
        { rate: 0.10, amount: 15700 },
        { rate: 0.12, amount: 59850 },
        { rate: 0.22, amount: 95350 },
        { rate: 0.24, amount: 182100 },
        { rate: 0.32, amount: 231250 },
        { rate: 0.35, amount: 578100 },
        { rate: 0.37, amount: Infinity },
      ]
    };

    const deduction = standardDeductions[filingStatus] || 0;
    const childCredit = dependents * 2000;
    
    let taxableIncome = income - deduction;
    if (taxableIncome < 0) taxableIncome = 0;

    let tax = 0;
    let remainingIncome = taxableIncome;
    let previousLimit = 0;
    const brackets = taxBrackets[filingStatus] || taxBrackets.single;

    for (const bracket of brackets) {
      if (remainingIncome > 0) {
        const taxableInBracket = Math.min(remainingIncome, bracket.amount - previousLimit);
        tax += taxableInBracket * bracket.rate;
        remainingIncome -= taxableInBracket;
        previousLimit = bracket.amount;
      }
    }
    
    // Assuming a flat 8% withholding for refund/due calculation
    const withholding = income * 0.08;
    let refund = withholding - (tax - childCredit);
    
    return { refund: Math.round(refund) };
  }, [income, filingStatus, dependents]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl">
      <CardHeader className="text-center">
        <Calculator className="mx-auto h-12 w-12 text-primary" />
        <CardTitle className="text-3xl font-bold">Initial Tax Estimation</CardTitle>
        <p className="text-muted-foreground">Get a quick idea of your potential refund or tax due.</p>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid md:grid-cols-3 gap-6 items-center">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="income">Annual Income</Label>
              <Input id="income" type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} placeholder="e.g., 50000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filing-status">Filing Status</Label>
              <Select value={filingStatus} onValueChange={setFilingStatus}>
                <SelectTrigger id="filing-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married Filing Jointly</SelectItem>
                  <SelectItem value="hoh">Head of Household</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependents">Dependents</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setDependents(Math.max(0, dependents - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input id="dependents" type="number" value={dependents} onChange={(e) => setDependents(Math.max(0, Number(e.target.value)))} className="text-center" />
                <Button variant="outline" size="icon" onClick={() => setDependents(dependents + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 flex items-center justify-center">
            <div className="text-center bg-primary/10 p-8 rounded-lg">
              <p className="text-lg font-medium text-muted-foreground">
                {estimatedTax.refund >= 0 ? "Estimated Refund" : "Estimated Tax Due"}
              </p>
              <p className={`text-5xl font-bold ${estimatedTax.refund >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatCurrency(Math.abs(estimatedTax.refund))}
              </p>
               <p className="text-xs text-muted-foreground mt-4 max-w-xs mx-auto">
                This is a simplified estimate. Actual refund or tax due may vary. This is not tax advice.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function Home() {
   const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  return (
    <PublicLayout>
      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] w-full flex items-center justify-center text-center text-white">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              priority
              data-ai-hint={heroImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-primary/70" />
          <div className="relative z-10 container mx-auto px-4 md:px-6">
            <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight">
              Simplify Your Taxes with Polaris Tax Services
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-primary-foreground/90">
              Professional, reliable, and straightforward tax services designed for you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/login">Get Started Today</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-background/20 text-white border-white hover:bg-background/30">
                <Link href="/book-appointment">Book Appointment</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why Polaris Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">Why Polaris Tax Services?</h2>
                <p className="text-muted-foreground mb-4">
                  Navigating the complexities of tax season can be daunting. At Polaris Tax Services, we provide a seamless, digital-first experience backed by a team of certified tax professionals. Our mission is to empower you with the tools and expertise needed to file your taxes with confidence and accuracy.
                </p>
                <p className="text-muted-foreground">
                  Whether you're an individual, a freelancer, or a small business owner, our platform is designed to handle your unique tax situation. We focus on maximizing your refund, ensuring compliance, and providing year-round support for your financial peace of mind.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                  <Card className="bg-card p-6 text-center">
                    <h3 className="text-3xl font-bold text-primary">99%</h3>
                    <p className="text-muted-foreground mt-1">Accuracy Rate</p>
                  </Card>
                   <Card className="bg-card p-6 text-center">
                    <h3 className="text-3xl font-bold text-primary">10,000+</h3>
                    <p className="text-muted-foreground mt-1">Happy Clients</p>
                  </Card>
                   <Card className="bg-card p-6 text-center">
                    <h3 className="text-3xl font-bold text-primary">$500+</h3>
                    <p className="text-muted-foreground mt-1">Avg. Extra Savings</p>
                  </Card>
                   <Card className="bg-card p-6 text-center">
                    <h3 className="text-3xl font-bold text-primary">24/7</h3>
                    <p className="text-muted-foreground mt-1">Support</p>
                  </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* Tax Estimator Section */}
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <TaxEstimator />
            </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
              Why Choose Polaris Tax Services?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center text-center p-6">
                  {feature.icon}
                  <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">Our Core Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                {serviceImages.personal && <Image src={serviceImages.personal.imageUrl} alt="Personal Tax Filing" width={600} height={400} className="w-full h-48 object-cover" data-ai-hint={serviceImages.personal.imageHint} />}
                <CardHeader>
                  <CardTitle>Personal Tax Filing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Comprehensive support for individuals and families. We ensure you get every deduction you deserve.</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                {serviceImages.business && <Image src={serviceImages.business.imageUrl} alt="Business Tax Services" width={600} height={400} className="w-full h-48 object-cover" data-ai-hint={serviceImages.business.imageHint} />}
                <CardHeader>
                  <CardTitle>Business Tax Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">From startups to established enterprises, we offer tailored tax solutions for your business.</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                {serviceImages.audit && <Image src={serviceImages.audit.imageUrl} alt="IRS Audit Support" width={600} height={400} className="w-full h-48 object-cover" data-ai-hint={serviceImages.audit.imageHint} />}
                <CardHeader>
                  <CardTitle>IRS Audit Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Facing an audit? Our experts will represent and guide you through the entire process.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
              What Our Clients Say
            </h2>
            <Carousel
              plugins={[plugin.current]}
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-4xl mx-auto"
            >
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2">
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex flex-col items-center text-center p-6 min-h-[300px] justify-center">
                          <Avatar className="mb-4 h-16 w-16">
                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                            <AvatarFallback>{testimonial.fallback}</AvatarFallback>
                          </Avatar>
                          <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                          <p className="mt-4 font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-xl font-semibold text-center text-muted-foreground uppercase tracking-wider mb-8">
                    Proudly Serving Leading Global Corporations
                </h2>
                <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8">
                    {trustedByLogos.map((logo, index) => (
                        <div key={index} className="text-muted-foreground/70 hover:text-foreground transition-colors">
                            {logo.icon}
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
                Find the Right Plan for You
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {plans.map((plan) => (
                    <Card key={plan.id} className="flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="p-6">
                        <CardTitle className="text-2xl">{plan.title}</CardTitle>
                        <p className="text-muted-foreground pt-2">{plan.description}</p>
                    </CardHeader>
                    <CardContent className="flex-grow p-6">
                        <div className="mb-6">
                            <span className="text-4xl font-bold">{plan.price}</span>
                            <span className="text-sm text-muted-foreground ml-1">{plan.pricePeriod}</span>
                        </div>
                        <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-accent" />
                            <span className="text-muted-foreground">{feature}</span>
                            </li>
                        ))}
                        </ul>
                    </CardContent>
                    <CardFooter className="p-6">
                        <Button asChild className="w-full">
                            <Link href="/login">{plan.buttonText}</Link>
                        </Button>
                    </CardFooter>
                    </Card>
                ))}
                </div>
            </div>
        </section>
        
        {/* Referral Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="bg-accent/10 p-8 rounded-lg text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
                Share the Love, Get Rewarded
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Love our service? Refer a friend to Polaris Tax Services and you'll both receive a special discount on your next service. It's our way of saying thank you!
              </p>
              <Button asChild size="lg" className="mt-8">
                <Link href="/refer">Refer a Friend Now</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <div className="mx-auto max-w-3xl">
                    <ShieldCheck className="h-12 w-12 text-accent mx-auto mb-4" />
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">
                        Protecting your privacy, securing your data, always.
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                        Your trust is our most important asset. We use bank-level security and encryption to keep your personal information safe and confidential. Your data is never shared without your consent.
                    </p>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              Ready to Take Control of Your Taxes?
            </h2>
            <p className="mt-4 max-w-xl mx-auto">
              Join thousands of satisfied clients and experience the Polaris Tax Services difference.
            </p>
            <Button asChild size="lg" className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/login">Sign Up for Free</Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
