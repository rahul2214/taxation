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
import { Calendar, Loader2, CalendarCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createAppointment } from "@/lib/supabase/services";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { getCachedAuth } from "@/lib/cache/auth-cache";

const CONSULTATION_SERVICES = [
  "Individual & Family Tax Return (Form 1040)",
  "Small Business & Self-Employed (Schedule C / LLC)",
  "Corporate Tax Preparation (1120 / 1120-S / 1065)",
  "Tax Planning & Deduction Strategy",
  "Prior Year Returns & Amendments",
  "IRS Notice & Audit Assistance",
  "Bookkeeping & Payroll Advisory",
  "General Tax Consultation",
];

const TIME_WINDOWS = [
  "Morning (9:00 AM - 12:00 PM EST)",
  "Afternoon (12:00 PM - 3:00 PM EST)",
  "Late Afternoon (3:00 PM - 6:00 PM EST)",
  "Evening (6:00 PM - 8:00 PM EST)",
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user, isUserLoading } = useFirebase();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [service, setService] = useState(CONSULTATION_SERVICES[0]);
  const [preferredTime, setPreferredTime] = useState(TIME_WINDOWS[0]);
  const [preferredDate, setPreferredDate] = useState("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  const cached = getCachedAuth();
  const hasUser = Boolean(user || cached.user);

  useEffect(() => {
    if (hasUser) {
      router.replace("/dashboard/book-appointment");
    }
  }, [hasUser, router]);

  // If user is logged in, show loader while redirecting to dashboard version
  if (hasUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const notes = (formData.get("notes") as string) || "";

    const combinedNotes = [
      preferredTime ? `Preferred Window: ${preferredTime}` : "",
      notes.trim() ? `Client Notes: ${notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      // Save directly to Supabase DB
      await createAppointment({
        name: fullName,
        phone,
        email,
        service,
        notes: combinedNotes,
        status: "Pending",
        appointment_date: preferredDate
          ? new Date(preferredDate).toISOString()
          : new Date().toISOString(),
        customer_id: user?.uid || null,
      });

      // Also persist to Firestore if available
      if (firestore) {
        try {
          const appointmentsCollection = collection(firestore, "appointments");
          await addDoc(appointmentsCollection, {
            fullName,
            phone,
            email,
            service,
            preferredTime,
            notes: combinedNotes,
            status: "Pending" as const,
            requestDate: serverTimestamp(),
            customerId: user?.uid || null,
          });
        } catch (fsErr) {
          console.warn("Firestore sync optional warning:", fsErr);
        }
      }

      setIsSuccess(true);
      toast({
        title: "Appointment Requested",
        description: "Thank you! We've received your request and will contact you shortly to confirm.",
      });
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error?.message || "There was an error submitting your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="bg-slate-50 min-h-screen py-12 md:py-20">
        <div className="container mx-auto max-w-2xl px-4 md:px-6">
          <Card className="shadow-xs border border-slate-200 bg-white rounded-xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold font-headline text-slate-950">Book A Tax Consultation</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Fill out the form below and a licensed tax professional will reach out to confirm your session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Appointment Request Received!</h3>
                  <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                    Thank you for scheduling with Polaris Tax Services. One of our CPAs will review your request and get in touch within 24 hours.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button variant="outline" className="border-slate-300 text-slate-800 text-xs font-semibold" onClick={() => setIsSuccess(false)}>
                      Book Another
                    </Button>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                      <Link href="/">Back to Home</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Jane Miller"
                      required
                      className="h-10 text-sm border-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="(555) 000-0000"
                        required
                        className="h-10 text-sm border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="jane@example.com"
                        required
                        className="h-10 text-sm border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="service" className="text-xs font-semibold text-slate-700">
                      Consultation Service *
                    </Label>
                    <select
                      id="service"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {CONSULTATION_SERVICES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="preferredDate" className="text-xs font-semibold text-slate-700">
                        Preferred Date *
                      </Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        min={minDateStr}
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        required
                        className="h-10 text-sm border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="preferredTime" className="text-xs font-semibold text-slate-700">
                        Time Window
                      </Label>
                      <select
                        id="preferredTime"
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {TIME_WINDOWS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Tax Situation & Notes</span>
                      <span className="text-[11px] font-normal text-slate-500">Optional</span>
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Briefly describe your tax situation or questions..."
                      rows={3}
                      className="text-sm resize-none border-slate-200"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-11 shadow-xs mt-2" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
                    {isSubmitting ? "Submitting Request..." : "Confirm & Request Appointment"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
