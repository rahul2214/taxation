"use client";

import Image from "next/image";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Zap, Users } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Autoplay from "embla-carousel-autoplay";
import React from "react";

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
];

const testimonials = [
  { name: "Jane Doe", role: "Freelancer", text: "Polaris Tax Services made my tax season stress-free. The platform is intuitive and their experts were incredibly helpful!", avatar: "https://picsum.photos/seed/t1/40/40", fallback: "JD" },
  { name: "John Smith", role: "Small Business Owner", text: "I've been using Polaris Tax Services for my business for three years now. Impeccable service and they always find deductions I missed.", avatar: "https://picsum.photos/seed/t2/40/40", fallback: "JS" },
  { name: "Emily White", role: "Investor", text: "Complex investments are no problem for the Polaris Tax Services team. Highly recommend for anyone with a complicated tax situation.", avatar: "https://picsum.photos/seed/t3/40/40", fallback: "EW" },
];

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
                <Link href="/services">Get Started Today</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-background/20 text-white border-white hover:bg-background/30">
                <Link href="/services">Book Appointment</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
              Why Choose Polaris Tax Services?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
