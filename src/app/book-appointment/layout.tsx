import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free 15-Minute CPA Consultation",
  description: "Book a free 15-minute call with a licensed CPA about your tax return, business taxes or an IRS letter. Get a fixed-price quote within one business day.",
  path: "/book-appointment",
  keywords: ["free tax consultation", "book a CPA appointment", "talk to a tax accountant", "tax consultation New York"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
