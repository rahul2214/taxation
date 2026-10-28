import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Create Your Client Account",
  description: "Open a secure Polaris client account to upload tax documents, track your return and message your CPA. Individual returns from $59.",
  path: "/signup",
  keywords: ["file taxes with a CPA online", "secure tax document upload"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
