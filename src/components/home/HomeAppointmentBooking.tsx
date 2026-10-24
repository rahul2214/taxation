"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Award,
  Sparkles,
  Loader2,
  CalendarCheck,
  ArrowRight,
  Headphones,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { createAppointment, getCustomer, CustomerRecord } from "@/lib/supabase/services";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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

export function HomeAppointmentBooking() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(CONSULTATION_SERVICES[0]);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState(TIME_WINDOWS[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    email: string;
    service: string;
    date: string;
    time: string;
  } | null>(null);

  // Set min date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  // Auto-fill from user profile if logged in
  useEffect(() => {
    async function prefillUser() {
      if (!user) return;

      try {
        const custData = await getCustomer(user.uid);
        if (custData) {
          setCustomer(custData);
          const first = custData.first_name || "";
          const last = custData.last_name || "";
          const combined = `${first} ${last}`.trim();
          if (combined) setFullName(combined);
          if (custData.email) setEmail(custData.email);
          if (custData.phone) setPhone(custData.phone);
        } else {
          if (user.displayName) setFullName(user.displayName);
          if (user.email) setEmail(user.email);
        }
      } catch (e) {
        if (user.displayName) setFullName(user.displayName);
        if (user.email) setEmail(user.email);
      }
    }

    prefillUser();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim() || !preferredDate) {
      toast({
        variant: "destructive",
        title: "Required Information Missing",
        description: "Please enter your name, email, phone number, and preferred date.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const combinedNotes = [
        preferredTime ? `Preferred Window: ${preferredTime}` : "",
        notes.trim() ? `Client Notes: ${notes.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      // Save to Supabase
      await createAppointment({
        customer_id: user?.uid || null,
        customer_userid: customer?.userid || null,
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        service,
        appointment_date: new Date(preferredDate).toISOString(),
        notes: combinedNotes,
        status: "Pending",
      });

      // Optionally mirror to Firestore if configured
      if (firestore) {
        try {
          const appointmentsCol = collection(firestore, "appointments");
          await addDoc(appointmentsCol, {
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            service,
            preferredTime,
            notes: combinedNotes,
            status: "Pending",
            requestDate: serverTimestamp(),
            customerId: user?.uid || null,
          });
        } catch (fsErr) {
          console.warn("Firestore mirror notice:", fsErr);
        }
      }

      setSubmittedData({
        name: fullName.trim(),
        email: email.trim(),
        service,
        date: preferredDate,
        time: preferredTime,
      });
      setIsSubmitted(true);

      toast({
        title: "Appointment Requested!",
        description: "We've received your request. A tax specialist will confirm your session shortly.",
      });
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      toast({
        variant: "destructive",
        title: "Booking Request Failed",
        description: err?.message || "Unable to submit your appointment request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubmittedData(null);
    setNotes("");
    setPreferredDate("");
  };

  return (
    <section id="book-appointment" className="py-16 md:py-24 bg-card border-y border-border/60 scroll-mt-16">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 font-semibold px-3 py-1 text-xs mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Free 15-Minute Tax Strategy Session
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-foreground tracking-tight">
            Book an Appointment with a Certified Tax Pro
          </h2>
          <p className="mt-3 text-muted-foreground text-base md:text-lg">
            Whether you need individual filing, small business optimization, or IRS notice assistance, our licensed CPAs are ready to help. Choose your preferred time below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
          {/* Left Column: Key Guarantees & Consultant Info */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-border bg-background shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Award className="h-5 w-5 text-accent" /> Why Schedule With Us?
                </CardTitle>
                <CardDescription>
                  Direct access to licensed tax professionals committed to maximizing your return.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Personalized Deduction Analysis</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      We examine your specific income streams, deductions, and state tax credits to guarantee top accuracy.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">100% Confidential & Secure</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Protected under IRS IRC Section 7216 privacy guidelines and 256-bit bank-grade encryption.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Flexible Phone or Video Meetings</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Receive consultation via phone call or secure Google Meet video link from the comfort of your home.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Headphones className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Year-Round Tax Advisory</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      We support you through all 12 months, not just during April filing season.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Contact & Hours Card */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-5 text-sm space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <CalendarCheck className="h-4 w-4" />
                <span>Consultation Hours</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Monday – Friday: <strong className="text-foreground">8:00 AM – 8:00 PM EST</strong>
                <br />
                Saturday: <strong className="text-foreground">9:00 AM – 5:00 PM EST</strong>
                <br />
                Sunday: Emergency IRS Notice & By Request
              </p>
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Need urgent help?</span>
                <Link href="/about" className="text-primary font-medium hover:underline flex items-center gap-1">
                  Learn about our CPAs <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Booking Form / Confirmation Card */}
          <div className="lg:col-span-7">
            {isSubmitted && submittedData ? (
              <Card className="border-border bg-background shadow-xl text-center p-6 md:p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Appointment Request Received!
                </CardTitle>
                <CardDescription className="text-sm mt-2 max-w-md mx-auto">
                  Thank you, <strong>{submittedData.name}</strong>. Our senior tax advisor has received your consultation request and will reach out to confirm your slot.
                </CardDescription>

                <div className="my-6 p-4 rounded-lg bg-card border border-border text-left max-w-md mx-auto space-y-2.5 text-xs md:text-sm">
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-semibold text-foreground text-right">{submittedData.service}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Preferred Date:</span>
                    <span className="font-semibold text-foreground">
                      {new Date(submittedData.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Time Window:</span>
                    <span className="font-semibold text-foreground">{submittedData.time}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Confirmation Email:</span>
                    <span className="font-semibold text-foreground">{submittedData.email}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
                    Book Another Consultation
                  </Button>
                  {user ? (
                    <Button asChild className="w-full sm:w-auto">
                      <Link href="/dashboard/book-appointment">View In Client Dashboard</Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full sm:w-auto">
                      <Link href="/signup">Create Free Account to Track</Link>
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="border-border bg-background shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5 text-primary" /> Request Your Consultation
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Select a convenient date and let our tax team know what return or guidance you need.
                      </CardDescription>
                    </div>
                    {user && (
                      <Badge variant="outline" className="bg-primary/5 text-primary text-[11px] shrink-0">
                        Profile Connected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="home-fullName" className="text-xs font-semibold">
                        Full Name *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="home-fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Jane Miller"
                          className="pl-9 h-10 text-sm"
                          required
                        />
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="home-email" className="text-xs font-semibold">
                          Email Address *
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="home-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jane@example.com"
                            className="pl-9 h-10 text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="home-phone" className="text-xs font-semibold">
                          Phone Number *
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="home-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(555) 123-4567"
                            className="pl-9 h-10 text-sm"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service Selection */}
                    <div className="space-y-1.5">
                      <Label htmlFor="home-service" className="text-xs font-semibold">
                        Tax Service / Consultation Type *
                      </Label>
                      <select
                        id="home-service"
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {CONSULTATION_SERVICES.map((srv) => (
                          <option key={srv} value={srv}>
                            {srv}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preferred Date & Time Slot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="home-date" className="text-xs font-semibold">
                          Preferred Date *
                        </Label>
                        <div className="relative">
                          <Input
                            id="home-date"
                            type="date"
                            min={minDateStr}
                            value={preferredDate}
                            onChange={(e) => setPreferredDate(e.target.value)}
                            className="h-10 text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="home-time" className="text-xs font-semibold">
                          Preferred Time Window
                        </Label>
                        <select
                          id="home-time"
                          value={preferredTime}
                          onChange={(e) => setPreferredTime(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {TIME_WINDOWS.map((tw) => (
                            <option key={tw} value={tw}>
                              {tw}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Notes / Tax Situation (Optional) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="home-notes" className="text-xs font-semibold flex items-center justify-between">
                        <span>Notes & Tax Situation Details</span>
                        <span className="text-[11px] font-normal text-muted-foreground">Optional</span>
                      </Label>
                      <Textarea
                        id="home-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. W-2 with stock sales, newly formed single-member LLC, received IRS CP2000 notice..."
                        rows={3}
                        className="text-sm resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md mt-2 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Scheduling Your Appointment...</span>
                        </>
                      ) : (
                        <>
                          <CalendarCheck className="h-4 w-4" />
                          <span>Confirm & Book Appointment</span>
                        </>
                      )}
                    </Button>

                    <p className="text-[11px] text-center text-muted-foreground pt-1">
                      No payment or commitment required. We will confirm your appointment time by email or phone.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
