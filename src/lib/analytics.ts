/**
 * Thin wrapper around GA4's gtag. Everything is a no-op unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 *
 * Never pass names, emails, phone numbers, tax details or free-text form fields here:
 * only non-identifying labels such as where on the site a form was submitted.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

type GtagParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (command: "event", action: string, params?: GtagParams) => void;
  }
}

export function trackEvent(action: string, params: GtagParams = {}) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", action, params);
}

/** A consultation request was saved. Mark `generate_lead` as a key event in GA4 to count it as a conversion. */
export function trackLead(formLocation: "home" | "book-appointment") {
  trackEvent("generate_lead", { form_location: formLocation });
}
