import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { buildMetadata, SITE } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: `CPA Tax Preparation in New York | ${SITE.name}`,
  absoluteTitle: true,
  description: SITE.description,
  path: "/",
  keywords: [
    "tax preparation New York",
    "CPA for individuals",
    "small business CPA",
    "tax return from $59",
    "free tax consultation",
    "tax refund estimator",
  ],
});

export default function Page() {
  return <HomePage />;
}
