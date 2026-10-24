"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Award,
  Loader2,
  CalendarCheck,
  Lock,
  ArrowRight,
  Briefcase,
  FileText,
} from "lucide-react";
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
  "Executive & Private Wealth Advisory (QSBS / Trust)",
  "Small Business & Corporate Tax (LLC / 1120-S)",
  "Individual & Family Form 1040 Preparation",
  "IRS Notice, CP2000 & Audit Defense",
  "Cross-Border, GILTI & Foreign Asset Reporting",
  "R&D Tax Credit & Capital Expenditure Scans",
  "Year-Round Bookkeeping & Strategic Advisory",
];

const TIME_WINDOWS = [
  "Thu • 10:00 AM EDT",
  "Thu • 2:30 PM EDT",
  "Fri • 11:30 AM EDT",
  "Fri • 3:00 PM EDT",
  "Mon • 1:00 PM EDT",
  "Custom Window",
];

export function HomeAppointmentBooking() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [service, setService] = useState(CONSULTATION_SERVICES[0]);
  const [preferredDate, setPreferredDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_WINDOWS[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [minDateStr, setMinDateStr] = useState("");
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    email: string;
    service: string;
    date: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    setMinDateStr(dateStr);
    setPreferredDate(dateStr);
  }, []);

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
        console.warn("Failed to fetch customer profile for pre-fill:", e);
      }
    }

    prefillUser();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Please provide your full name, email address, and phone number.",
      });
      return;
    }

    setIsSubmitting(true);

    const combinedNotes = [
      company.trim() ? `Entity / Company: ${company.trim()}` : "",
      selectedTimeSlot ? `Requested Slot: ${selectedTimeSlot}` : "",
      notes.trim() ? `Objective: ${notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      // 1. Supabase insert
      await createAppointment({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        service,
        appointment_date: preferredDate || minDateStr,
        notes: combinedNotes,
        status: "pending",
        customer_id: user?.uid || null,
      });

      // 2. Optional Firestore sync
      if (firestore) {
        try {
          await addDoc(collection(firestore, "appointments"), {
            name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            service,
            appointmentDate: preferredDate || minDateStr,
            timeWindow: selectedTimeSlot,
            notes: combinedNotes,
            status: "pending",
            requestDate: serverTimestamp(),
            customerId: user?.uid || null,
          });
        } catch (fsErr) {
          console.warn("Firestore sync optional warning:", fsErr);
        }
      }

      setSubmittedData({
        name: fullName.trim(),
        email: email.trim(),
        service,
        date: preferredDate || minDateStr,
        time: selectedTimeSlot,
      });

      setIsSubmitted(true);

      toast({
        title: "Consultation Request Registered",
        description: "Your session request has been confirmed. A licensed CPA will follow up with formal calendar coordinates.",
      });
    } catch (err: any) {
      console.error("Booking submission error:", err);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: err?.message || "Could not register your consultation. Please try again or call our partner desk.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubmittedData(null);
    setNotes("");
    setCompany("");
  };

  return (
    <section id="book-consultation" className="bg-slate-900 text-white py-20 lg:py-24 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Info Panel */}
            <div className="lg:col-span-5 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-700 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-300 bg-slate-700/60 px-3 py-1 rounded mb-6">
                  <Lock className="h-3 w-3 text-white" />
                  <span>Confidential Engagement</span>
                </div>

                <h3 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-white">
                  Schedule a 30-Minute Partner Consultation
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed mb-8">
                  Direct evaluation with a licensed CPA and Big-Four alumni partner. We will examine your entity architecture, state nexus footprints, and tax leakage exposures.
                </p>

                <div className="space-y-4 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-semibold">Mutual Non-Disclosure Agreement (NDA)</strong>
                      All financial disclosures protected under strict CPA-client statutory privilege.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-semibold">Preliminary Tax Leakage Diagnostic</strong>
                      Instant identification of unclaimed R&amp;D credits, multi-state leakage, and QSBS status.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-semibold">Custom Advisory Scope &amp; Fixed Pricing</strong>
                      Clear transparent engagement roadmaps with zero billable hourly surprises.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-slate-700/80 text-[11px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>
                  Direct Inquiries: <strong className="text-slate-200">advisory@polaristax.com</strong>
                </span>
                <span className="text-slate-400">(212) 847-1920</span>
              </div>
            </div>

            {/* Right Interactive Form / Confirmation Panel */}
            <div className="lg:col-span-7 p-8 lg:p-12 bg-slate-800/40">
              {isSubmitted && submittedData ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h4 className="text-2xl font-bold text-white">Consultation Request Confirmed</h4>
                  <p className="text-slate-300 text-sm max-w-md leading-relaxed">
                    Thank you, <strong className="text-white">{submittedData.name}</strong>. A Polaris Senior Partner will contact you at <strong className="text-white">{submittedData.email}</strong> to deliver your calendar invitation.
                  </p>

                  <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-lg p-4 text-left text-xs text-slate-300 space-y-2 my-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Practice Area:</span>
                      <span className="text-white font-medium text-right max-w-[200px] truncate">{submittedData.service}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Date:</span>
                      <span className="text-white font-medium">{submittedData.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Preferred Window:</span>
                      <span className="text-emerald-400 font-semibold">{submittedData.time}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="border-slate-600 text-slate-200 hover:bg-slate-700 text-xs"
                    >
                      Book Another Session
                    </Button>
                    <Button asChild className="bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs">
                      <Link href="/dashboard">Access Client Portal</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Partner Session Reservation
                    </span>
                    {mounted && user && (
                      <span className="text-[11px] text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-800">
                        Client Profile Connected
                      </span>
                    )}
                  </div>

                  {/* Name & Work Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="sched-name" className="text-xs text-slate-300">
                        First &amp; Last Name *
                      </Label>
                      <Input
                        id="sched-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alexander Vance"
                        required
                        className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 h-9 text-xs focus-visible:ring-slate-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sched-email" className="text-xs text-slate-300">
                        Work Email *
                      </Label>
                      <Input
                        id="sched-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="avance@company.com"
                        required
                        className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 h-9 text-xs focus-visible:ring-slate-400"
                      />
                    </div>
                  </div>

                  {/* Phone & Company Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="sched-phone" className="text-xs text-slate-300">
                        Phone Number *
                      </Label>
                      <Input
                        id="sched-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(212) 555-0198"
                        required
                        className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 h-9 text-xs focus-visible:ring-slate-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sched-company" className="text-xs text-slate-300">
                        Entity / Company Name
                      </Label>
                      <Input
                        id="sched-company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Vance Tech Holdings Inc."
                        className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 h-9 text-xs focus-visible:ring-slate-400"
                      />
                    </div>
                  </div>

                  {/* Practice Area Selection */}
                  <div className="space-y-1">
                    <Label htmlFor="sched-service" className="text-xs text-slate-300">
                      Primary Advisory Scope *
                    </Label>
                    <select
                      id="sched-service"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-400"
                    >
                      {CONSULTATION_SERVICES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Slot Pill Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs text-slate-300">
                      Select Preferred Consultation Window
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TIME_WINDOWS.map((tw) => (
                        <button
                          key={tw}
                          type="button"
                          onClick={() => setSelectedTimeSlot(tw)}
                          className={`text-xs py-2 px-2 rounded border text-center transition-all ${
                            selectedTimeSlot === tw
                              ? "bg-slate-700 border-white text-white font-semibold shadow-xs"
                              : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          {tw}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-1 pt-1">
                    <Label htmlFor="sched-date" className="text-xs text-slate-300">
                      Earliest Date Available
                    </Label>
                    <Input
                      id="sched-date"
                      type="date"
                      min={minDateStr}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white h-9 text-xs focus-visible:ring-slate-400"
                    />
                  </div>

                  {/* Notes / Tax Situation */}
                  <div className="space-y-1 pt-1">
                    <Label htmlFor="sched-notes" className="text-xs text-slate-300 flex justify-between">
                      <span>Primary Objective &amp; Notes</span>
                      <span className="text-slate-500 font-normal">Optional</span>
                    </Label>
                    <Textarea
                      id="sched-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. QSBS qualification for upcoming liquidity event, M&A due diligence, multi-state payroll nexus audit..."
                      rows={2}
                      className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 text-xs resize-none focus-visible:ring-slate-400"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs h-11 shadow-lg flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                          <span>Registering Consultation...</span>
                        </>
                      ) : (
                        <>
                          <CalendarCheck className="h-4 w-4 text-slate-900" />
                          <span>Confirm Consultation Request</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
