"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, MessageSquareHeart, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { createFeedback, FeedbackSource } from "@/lib/supabase/services";

export const FEEDBACK_CATEGORIES = [
  { value: "general", label: "General feedback" },
  { value: "service", label: "Our tax service" },
  { value: "bug", label: "Something isn't working" },
  { value: "feature", label: "Feature request" },
  { value: "other", label: "Other" },
];

function detectDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "mobile";
  return "desktop";
}

type FeedbackWidgetProps = {
  source?: FeedbackSource;
};

/** Floating "Feedback" button that opens a short form and saves to the feedback table. */
export function FeedbackWidget({ source = "website" }: FeedbackWidgetProps) {
  const { toast } = useToast();
  const { user } = useFirebase();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsSent(false);
      setRating(0);
      setHover(0);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) || "").trim();
    const message = get("message");
    if (!message) return;

    setIsSubmitting(true);
    try {
      await createFeedback({
        customer_id: user?.uid || null,
        name: get("name") || user?.displayName || null,
        email: get("email") || user?.email || null,
        rating: rating || null,
        category: get("category") || "general",
        message,
        source,
        platform: "web",
        device: detectDevice(),
        page: pathname || null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
      });
      setIsSent(true);
    } catch (error: any) {
      console.error("Error sending feedback:", error?.message || error);
      toast({
        variant: "destructive",
        title: "Feedback not sent",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const shown = hover || rating;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-paper shadow-lg transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
        aria-label="Send feedback"
      >
        <MessageSquareHeart className="h-4 w-4" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {isSent ? (
            <>
              <DialogHeader>
                <DialogTitle>Thank you for your feedback</DialogTitle>
                <DialogDescription>Our team reads every message and uses it to improve Polaris Tax.</DialogDescription>
              </DialogHeader>
              <div className="flex justify-end pt-2">
                <button type="button" className="btn-ink px-6" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Share your feedback</DialogTitle>
                <DialogDescription>Tell us what's working and what we could do better.</DialogDescription>
              </DialogHeader>
              <form className="grid gap-4 pt-1" onSubmit={handleSubmit}>
                <div>
                  <span className="field-label">How would you rate your experience?</span>
                  <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={rating === n}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        onClick={() => setRating(n === rating ? 0 : n)}
                        onMouseEnter={() => setHover(n)}
                        className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                      >
                        <Star
                          className={`h-7 w-7 ${n <= shown ? "fill-brass text-brass" : "text-ink-muted/40"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="feedback-category" className="field-label">Topic</label>
                  <select id="feedback-category" name="category" className="field" defaultValue="general">
                    {FEEDBACK_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="feedback-message" className="field-label">Your feedback</label>
                  <textarea
                    id="feedback-message"
                    name="message"
                    rows={4}
                    required
                    maxLength={2000}
                    className="field h-auto resize-none py-3"
                  />
                </div>
                {!user && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="feedback-name" className="field-label">Name (optional)</label>
                      <input id="feedback-name" name="name" autoComplete="name" className="field" />
                    </div>
                    <div>
                      <label htmlFor="feedback-email" className="field-label">Email (optional)</label>
                      <input id="feedback-email" name="email" type="email" autoComplete="email" className="field" />
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <button type="submit" className="btn-ink px-6" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      "Send feedback"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
