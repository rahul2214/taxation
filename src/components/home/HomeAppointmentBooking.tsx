"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackLead } from "@/lib/analytics";
import { useFirebase } from "@/firebase";
import { createAppointment, getCustomer, CustomerRecord } from "@/lib/supabase/services";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const CONSULTATION_SERVICES = [
  "Individual or family return (Form 1040)",
  "Self-employed or single-member LLC",
  "S-Corp, partnership or C-Corp return",
  "IRS notice or audit",
  "Tax planning for a business",
  "Equity, QSBS or a business sale",
  "Bookkeeping",
  "Something else",
];

const TIME_WINDOWS = [
  "Morning (9am–12pm ET)",
  "Midday (12–3pm ET)",
  "Afternoon (3–6pm ET)",
  "Evening (6–8pm ET)",
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
        title: "A few details are missing",
        description: "Please add your name, email and phone number.",
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
      trackLead("home");

      toast({
        title: "Request received",
        description: "We'll email you within one business day to confirm a time.",
      });
    } catch (err: any) {
      console.error("Booking submission error:", err);
      toast({
        variant: "destructive",
        title: "That didn't go through",
        description: err?.message || "Please try again, or call us at (212) 847-1920.",
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
    <section id="book-consultation" className="scroll-mt-28 border-b border-paper-line">
      <div className="site-container grid gap-14 py-20 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-5">
          <p className="eyebrow">Free consultation</p>
          <h2 className="mt-5 font-display text-[36px] leading-[1.1] text-ink sm:text-[44px]">
            Start with a 15-minute call.
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-soft">
            Tell us what&apos;s going on. A CPA will look at it, tell you what they&apos;d do, and quote a fixed
            price. There&apos;s no obligation to go further.
          </p>

          <ul className="mt-10 space-y-6 border-t border-paper-line pt-8">
            {[
              ["Everything stays confidential", "What you share is protected by CPA-client confidentiality and IRC §7216."],
              ["You talk to a preparer, not a salesperson", "The person on the call is the person who would do the work."],
              ["A fixed quote before any work", "No hourly billing and no surprise invoices."],
            ].map(([title, body]) => (
              <li key={title} className="grid grid-cols-[14px_1fr] gap-4">
                <span className="mt-[10px] h-px w-3.5 bg-brass" />
                <div>
                  <p className="font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-ink-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-[14.5px] text-ink-muted">
            Prefer to call?{" "}
            <a href="tel:+12128471920" className="link-under">
              (212) 847-1920
            </a>
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-[4px] border border-paper-line bg-white p-6 sm:p-10">
            {isSubmitted && submittedData ? (
              <div className="py-6">
                <p className="eyebrow">Request received</p>
                <h3 className="mt-4 font-display text-[32px] leading-tight text-ink">
                  Thanks, {submittedData.name.split(" ")[0]}.
                </h3>
                <p className="mt-3 max-w-md text-[15.5px] leading-relaxed text-ink-soft">
                  We&apos;ll email <span className="font-semibold text-ink">{submittedData.email}</span> within one
                  business day to confirm a time.
                </p>

                <dl className="mt-8 divide-y divide-paper-line border-y border-paper-line text-[14.5px]">
                  <div className="flex justify-between gap-6 py-3">
                    <dt className="text-ink-muted">Topic</dt>
                    <dd className="text-right text-ink">{submittedData.service}</dd>
                  </div>
                  <div className="flex justify-between gap-6 py-3">
                    <dt className="text-ink-muted">Earliest date</dt>
                    <dd className="font-mono text-ink">{submittedData.date}</dd>
                  </div>
                  <div className="flex justify-between gap-6 py-3">
                    <dt className="text-ink-muted">Preferred time</dt>
                    <dd className="text-ink">{submittedData.time}</dd>
                  </div>
                </dl>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/dashboard" className="btn-ink">
                    Go to the client portal
                  </Link>
                  <button type="button" onClick={handleReset} className="btn-line">
                    Send another request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                {mounted && user && (
                  <p className="font-mono text-[11.5px] text-ink-muted sm:col-span-2">
                    Signed in · we&apos;ve filled in your details
                  </p>
                )}

                <div>
                  <label htmlFor="sched-name" className="field-label">Full name</label>
                  <input
                    id="sched-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="sched-email" className="field-label">Email</label>
                  <input
                    id="sched-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="sched-phone" className="field-label">Phone</label>
                  <input
                    id="sched-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="sched-company" className="field-label">
                    Business name <span className="font-normal text-ink-muted">(optional)</span>
                  </label>
                  <input
                    id="sched-company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    autoComplete="organization"
                    className="field"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="sched-service" className="field-label">What do you need help with?</label>
                  <select
                    id="sched-service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="field"
                  >
                    {CONSULTATION_SERVICES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sched-date" className="field-label">Earliest date</label>
                  <input
                    id="sched-date"
                    type="date"
                    min={minDateStr}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="field font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="sched-time" className="field-label">Best time</label>
                  <select
                    id="sched-time"
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="field"
                  >
                    {TIME_WINDOWS.map((tw) => (
                      <option key={tw} value={tw}>
                        {tw}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="sched-notes" className="field-label">
                    Anything we should know? <span className="font-normal text-ink-muted">(optional)</span>
                  </label>
                  <textarea
                    id="sched-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. I got a CP2000 letter, or I'm thinking about switching my LLC to an S-Corp."
                    className="field h-auto resize-none py-3"
                  />
                </div>

                <div className="flex flex-col gap-4 pt-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] text-ink-muted">We reply within one business day.</p>
                  <button type="submit" disabled={isSubmitting} className="btn-ink px-6">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending
                      </>
                    ) : (
                      <>
                        Request a call
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

