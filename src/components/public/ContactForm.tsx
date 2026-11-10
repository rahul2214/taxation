"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createContact } from "@/lib/supabase/services";
import { trackLead } from "@/lib/analytics";
import { useMasterOptions, optionValue, resolveOption } from "@/hooks/use-master-options";

export function ContactForm() {
  const { toast } = useToast();
  const { options: topics } = useMasterOptions("contact_topic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const get = (k: string) => String(fd.get(k) || "").trim();

    const topic = resolveOption(topics, get("subject"));

    setIsSubmitting(true);
    try {
      await createContact({
        name: get("name"),
        email: get("email"),
        phone: get("phone") || null,
        topic_id: topic.id,
        subject: topic.label || null,
        message: get("message"),
      });
      trackLead("contact");
      form.reset();
      setIsSent(true);
      toast({
        title: "Message sent",
        description: "A CPA will reply within four business hours on weekdays.",
      });
    } catch (error: any) {
      console.error("Error sending contact message:", error?.message || error);
      toast({
        variant: "destructive",
        title: "Message not sent",
        description: "Something went wrong. Please try again or call (212) 847-1920.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <div className="mt-8 border-t border-paper-line pt-8">
        <p className="eyebrow">Message sent</p>
        <p className="mt-3 font-display text-[26px] leading-tight text-ink">Thank you. We&apos;ll be in touch.</p>
        <p className="mt-2 text-[15px] text-ink-muted">
          A CPA reads every message and replies within four business hours on weekdays. If you&apos;d like, pick a time
          for a call now.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/book-appointment" className="btn-ink px-6">
            Choose a time <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <button type="button" onClick={() => setIsSent(false)} className="link-under text-[14.5px]">
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="contact-name" className="field-label">Full name</label>
        <input id="contact-name" name="name" autoComplete="name" required className="field" />
      </div>
      <div>
        <label htmlFor="contact-email" className="field-label">Email</label>
        <input id="contact-email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <div>
        <label htmlFor="contact-phone" className="field-label">Phone number</label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          pattern="[0-9+\-\(\)\.\s]{7,20}"
          title="Enter a valid phone number"
          required
          className="field"
        />
      </div>
      <div>
        <label htmlFor="contact-subject" className="field-label">Topic</label>
        <select id="contact-subject" name="subject" className="field">
          {topics.map((t) => (
            <option key={optionValue(t)} value={optionValue(t)}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="contact-message" className="field-label">Message</label>
        <textarea id="contact-message" name="message" rows={5} required className="field h-auto resize-none py-3" />
      </div>
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-ink-muted">Kept confidential. Never shared.</p>
        <button type="submit" className="btn-ink px-6" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            "Send message"
          )}
        </button>
      </div>
    </form>
  );
}
