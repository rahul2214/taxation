
"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Mail, Users, Loader2 } from "lucide-react";
import { useFirebase } from "@/firebase";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ReferPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore) return;
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const referralData = {
      referrerName: formData.get("your-name") as string,
      referrerEmail: formData.get("your-email") as string,
      referredName: formData.get("friend-name") as string,
      referredEmail: formData.get("friend-email") as string,
      referralDate: serverTimestamp(),
      status: "Pending" as const,
      referrerId: user?.uid || null, // Attach referrerId if user is logged in
    };

    try {
      const referralsCollection = collection(firestore, 'referrals');
      await addDoc(referralsCollection, referralData);

      toast({
        title: "Invite Sent!",
        description: `Your referral to ${referralData.referredName} has been sent. Thank you!`,
      });
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error sending referral:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error sending the referral. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Refer a Friend, Get Rewarded</h1>
          <p className="mt-4 text-lg text-muted-foreground">Share the ease of Polaris Tax Services and we'll thank you for it.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 bg-accent/10 text-accent p-3 rounded-full">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">1. Invite Your Friends</h3>
                  <p className="text-muted-foreground">Enter your friend's email address in the form, and we'll send them a unique invitation link.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 bg-accent/10 text-accent p-3 rounded-full">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">2. They Sign Up & File</h3>
                  <p className="text-muted-foreground">Your friend creates an account using your link and successfully files their taxes with us.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 bg-accent/10 text-accent p-3 rounded-full">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">3. You Both Get a Reward</h3>
                  <p className="text-muted-foreground">As a thank you, both you and your friend will receive a discount on your next Polaris Tax Services service.</p>
                </div>
              </li>
            </ul>
          </div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Invite a Friend</CardTitle>
              <CardDescription>Enter your friend's email to send them an invite.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="your-name">Your Name</Label>
                  <Input id="your-name" name="your-name" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="your-email">Your Email</Label>
                  <Input id="your-email" name="your-email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="friend-name">Friend's Name</Label>
                    <Input id="friend-name" name="friend-name" placeholder="Jane Smith" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="friend-email">Friend's Email</Label>
                    <Input id="friend-email" name="friend-email" type="email" placeholder="friend@example.com" required />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? "Sending..." : "Send Invite"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
