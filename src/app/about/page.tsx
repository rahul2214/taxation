import Image from "next/image";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Target, Eye, Handshake } from "lucide-react";

const teamImage = PlaceHolderImages.find(p => p.id === 'about-team');
const teamMembers = [
  { name: "Sarah Chen", role: "Founder & CEO", avatar: PlaceHolderImages.find(p => p.id === 'team-member-1'), fallback: "SC" },
  { name: "Michael Rodriguez", role: "Head of Tax Strategy", avatar: PlaceHolderImages.find(p => p.id === 'team-member-2'), fallback: "MR" },
  { name: "Jessica Lee", role: "Lead CPA", avatar: PlaceHolderImages.find(p => p.id === 'team-member-3'), fallback: "JL" },
  { name: "David Kim", role: "Client Relations Manager", avatar: PlaceHolderImages.find(p => p.id === 'team-member-4'), fallback: "DK" },
];

const values = [
  { icon: <Target className="h-10 w-10 text-accent" />, title: "Our Mission", description: "To demystify the tax process, making it accessible, affordable, and stress-free for everyone, from individuals to businesses." },
  { icon: <Eye className="h-10 w-10 text-accent" />, title: "Our Vision", description: "To be the most trusted and user-friendly online tax service, empowering our clients to achieve financial clarity and peace of mind." },
  { icon: <Handshake className="h-10 w-10 text-accent" />, title: "Our Values", description: "We operate with integrity, professionalism, and a client-first mindset. Your financial well-being is our top priority." },
];

export default function AboutUsPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-20">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">About TaxEase</h1>
          <p className="mt-4 text-lg text-muted-foreground">Your trusted partner in navigating the complexities of taxation.</p>
        </header>

        <section className="mb-16">
          <Card className="overflow-hidden">
            {teamImage && (
              <Image
                src={teamImage.imageUrl}
                alt={teamImage.description}
                width={1200}
                height={800}
                className="w-full h-64 object-cover"
                data-ai-hint={teamImage.imageHint}
              />
            )}
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                {values.map((value) => (
                  <div key={value.title} className="flex flex-col items-center text-center">
                    {value.icon}
                    <h3 className="mt-4 text-xl font-semibold">{value.title}</h3>
                    <p className="mt-2 text-muted-foreground">{value.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">Meet Our Experts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <Card key={member.name} className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow">
                <Avatar className="mx-auto h-24 w-24 mb-4">
                  {member.avatar && <AvatarImage src={member.avatar.imageUrl} alt={member.name} />}
                  <AvatarFallback>{member.fallback}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold text-primary">{member.name}</h3>
                <p className="text-accent font-medium">{member.role}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
