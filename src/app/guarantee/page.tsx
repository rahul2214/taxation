import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Award, RefreshCw } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const guaranteeSeal = PlaceHolderImages.find(p => p.id === 'guarantee-seal');

const guarantees = [
  {
    icon: <Award className="h-8 w-8 text-accent" />,
    title: "100% Accuracy Guarantee",
    description: "We guarantee our calculations are 100% accurate. If we make an error in our calculations, we will reimburse you for any resulting IRS penalties plus interest."
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-accent" />,
    title: "Maximum Refund Guarantee",
    description: "We're confident you'll get your maximum refund. If you find a larger refund or smaller tax due from another tax preparer, we'll refund your TaxEase fees."
  },
  {
    icon: <RefreshCw className="h-8 w-8 text-accent" />,
    title: "Satisfaction Guarantee",
    description: "If you are not completely satisfied with our service for any reason before you file, you can choose not to file with us and your fees will be refunded."
  }
];

export default function GuaranteePage() {
  return (
    <PublicLayout>
      <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Our Ironclad Guarantee</h1>
          <p className="mt-4 text-lg text-muted-foreground">File with confidence. We stand behind our service.</p>
        </header>

        <section className="flex flex-col md:flex-row items-center gap-8 mb-16">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Your Peace of Mind is Our Priority</h2>
            <p className="text-muted-foreground mb-4">
              At TaxEase, we are committed to providing you with the most accurate and reliable tax preparation service. Our guarantees are a testament to our confidence in our platform and our team of experts. We want you to feel secure and supported every step of the way.
            </p>
            <p className="text-muted-foreground">
              Below are the details of our promises to you.
            </p>
          </div>
          {guaranteeSeal && (
            <div className="flex-shrink-0">
              <Image 
                src={guaranteeSeal.imageUrl} 
                alt={guaranteeSeal.description}
                width={200} 
                height={200}
                className="rounded-full shadow-lg"
                data-ai-hint={guaranteeSeal.imageHint}
              />
            </div>
          )}
        </section>

        <section className="grid md:grid-cols-1 gap-8">
          {guarantees.map((guarantee) => (
            <Card key={guarantee.title} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4">
                {guarantee.icon}
                <CardTitle>{guarantee.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{guarantee.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-16 text-center">
            <h3 className="text-xl font-semibold mb-4">Terms and Conditions</h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Guarantees are subject to specific terms, conditions, and limitations. For the 100% Accuracy Guarantee, the error must not be due to incorrect information provided by the user. For the Maximum Refund Guarantee, the comparison must be with a tax return of identical data. Please see our full terms of service for complete details.
            </p>
        </section>
      </div>
    </PublicLayout>
  );
}
