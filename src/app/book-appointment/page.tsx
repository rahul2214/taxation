
"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, doc, setDoc, writeBatch } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { useState } from "react";

export default function BookAppointmentPage() {
  const { toast } = useToast();
  const { firestore, auth, user } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !auth) return;
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const appointmentData = {
      fullName: formData.get("fullName") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      notes: formData.get("notes") as string,
      status: "Pending" as const,
      requestDate: serverTimestamp(),
    };

    try {
      let userId = user?.uid;
      let isAnonymous = user?.isAnonymous || false;

      // If user is not logged in, sign them in anonymously.
      if (!user) {
        const userCredential = await signInAnonymously(auth);
        userId = userCredential.user.uid;
        isAnonymous = true;
        
        // Create a customer document for the anonymous user
        const customerDocRef = doc(firestore, `customers/${userId}`);
        await setDoc(customerDocRef, {
            email: appointmentData.email,
            firstName: appointmentData.fullName.split(' ')[0] || 'Anonymous',
            lastName: appointmentData.fullName.split(' ').slice(1).join(' ') || 'User',
            signupDate: serverTimestamp(),
            isAnonymous: true,
        });
      }
      
      if (!userId) {
          throw new Error("Could not determine user ID.");
      }

      const batch = writeBatch(firestore);

      // 1. Write to the customer's subcollection
      const customerAppointmentRef = doc(collection(firestore, `customers/${userId}/appointments`));
      batch.set(customerAppointmentRef, { ...appointmentData, customerId: userId });

      // 2. Write to the top-level admin collection for easy querying
      const adminAppointmentRef = doc(collection(firestore, 'admin-appointments'));
      batch.set(adminAppointmentRef, { 
        ...appointmentData, 
        customerId: userId,
        customerAppointmentId: customerAppointmentRef.id, // Link to the original doc
        isAnonymous,
      });

      await batch.commit();

      toast({
        title: "Appointment Requested",
        description: "Thank you! We've received your request and will contact you shortly to confirm.",
      });
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-20">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Book An Appointment</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get in touch to schedule your consultation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(123) 456-7890"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">
                  Preferred Date & Time (Optional)
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Let us know what times work best for you..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Submitting..." : "Request Appointment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
