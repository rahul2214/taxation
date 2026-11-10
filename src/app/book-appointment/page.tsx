"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageFaq } from "@/components/public/PageFaq";
import { PAGE_FAQS } from "@/data/faqs";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackLead } from "@/lib/analytics";
import { useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createAppointment } from "@/lib/supabase/services";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { getCachedAuth } from "@/lib/cache/auth-cache";

import { useMasterOptions, optionValue, currentValue, resolveOption } from "@/hooks/use-master-options";

export default function BookAppointmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user, isUserLoading } = useFirebase();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { options: services } = useMasterOptions("appointment_service");
  const { options: timeWindows } = useMasterOptions("appointment_time");
  const [serviceValue, setService] = useState("");
  const [timeValue, setPreferredTime] = useState("");
  const service = currentValue(services, serviceValue);
  const preferredTime = currentValue(timeWindows, timeValue);
  const [preferredDate, setPreferredDate] = useState("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  // localStorage is client-only; read the cached session after mount to keep hydration consistent.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const cached = mounted ? getCachedAuth() : { user: null };
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
        <Loader2 className="h-8 w-8 animate-spin text-ink-muted" />
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
    const svc = resolveOption(services, service);
    const slot = resolveOption(timeWindows, preferredTime);

    const combinedNotes = [
      slot.label ? `Preferred Window: ${slot.label}` : "",
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
        service: svc.label,
        service_id: svc.id,
        time_slot: slot.label,
        time_slot_id: slot.id,
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
            service: svc.label,
            preferredTime: slot.label,
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
      trackLead("book-appointment");
      toast({
        title: "Request received",
        description: "We'll be in touch within one business day to confirm a time.",
      });
    } catch (error: any) {
      console.error("Error booking appointment:", error?.message || error);
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
      <div className="site-container grid gap-14 py-14 md:py-20 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow">Book a consultation</p>
          <h1 className="mt-5 font-display text-[40px] leading-[1.08] text-ink sm:text-[54px]">
            Fifteen minutes with a CPA. Free.
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-soft">
            Choose a day and a rough time. We&apos;ll confirm by email, then call you at the number you give us.
          </p>

          <ol className="mt-10 space-y-5 border-t border-paper-line pt-8 text-[15px]">
            {[
              "You send this form.",
              "We confirm a time within one business day.",
              "A CPA calls, listens, and gives you a fixed quote.",
            ].map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="font-mono text-[13px] text-brass-dark">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-[4px] border border-paper-line bg-white p-6 sm:p-10">
            {isSuccess ? (
              <div className="py-6">
                <p className="eyebrow">Request received</p>
                <h2 className="mt-4 font-display text-[32px] leading-tight text-ink">Thank you. We&apos;ll be in touch.</h2>
                <p className="mt-3 max-w-md text-[15.5px] leading-relaxed text-ink-soft">
                  A CPA will review your request and contact you within one business day to confirm a time.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/" className="btn-ink">
                    Back to the homepage
                  </Link>
                  <button type="button" className="btn-line" onClick={() => setIsSuccess(false)}>
                    Send another request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="field-label">Full name</label>
                  <input id="fullName" name="fullName" autoComplete="name" required className="field" />
                </div>
                <div>
                  <label htmlFor="phone" className="field-label">Phone</label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" required className="field" />
                </div>
                <div>
                  <label htmlFor="email" className="field-label">Email</label>
                  <input id="email" name="email" type="email" autoComplete="email" required className="field" />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="service" className="field-label">What do you need help with?</label>
                  <select id="service" value={service} onChange={(e) => setService(e.target.value)} className="field">
                    {services.map((s) => (
                      <option key={optionValue(s)} value={optionValue(s)}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="preferredDate" className="field-label">Preferred date</label>
                  <input
                    id="preferredDate"
                    type="date"
                    min={minDateStr}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                    className="field font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="preferredTime" className="field-label">Best time</label>
                  <select
                    id="preferredTime"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="field"
                  >
                    {timeWindows.map((t) => (
                      <option key={optionValue(t)} value={optionValue(t)}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="field-label">
                    Your situation <span className="font-normal text-ink-muted">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    placeholder="A sentence or two is plenty."
                    className="field h-auto resize-none py-3"
                  />
                </div>

                <div className="flex flex-col gap-4 pt-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] text-ink-muted">Kept confidential. Never shared.</p>
                  <button type="submit" className="btn-ink px-6" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending
                      </>
                    ) : (
                      <>
                        Request a consultation
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
      <PageFaq items={PAGE_FAQS.booking} />
    </PublicLayout>
  );
}
