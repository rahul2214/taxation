import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { LegalDocument } from "@/components/public/LegalDocument";

export const metadata: Metadata = buildMetadata({
  title: "Service Delivery Policy",
  description:
    "How Polaris Tax Services delivers tax preparation after you purchase a plan: digital delivery through the client portal, typical timelines and what we need from you.",
  path: "/service-delivery",
  keywords: ["tax preparation turnaround time", "service delivery policy"],
});

export default function ServiceDeliveryPage() {
  return (
    <LegalDocument
      title="Service Delivery Policy"
      path="/service-delivery"
      breadcrumb="Service delivery"
      lastRevised="November 2026"
      summary={
        <p>
          <strong>No physical shipping.</strong> Polaris sells professional tax services, not physical products. Everything
          is delivered digitally through your secure client portal and by email or phone with your preparer.
        </p>
      }
    >
      <section>
        <h2>1. What you receive</h2>
        <p>
          Each plan on our <Link href="/pricing" className="text-brass-dark hover:underline">pricing page</Link> lists what
          is included. Depending on the plan, delivery includes a prepared federal and state tax return for your review,
          electronic filing after your approval, copies of filed returns and IRS/state acceptance confirmations, and access
          to your preparer for questions.
        </p>
      </section>

      <section>
        <h2>2. How delivery works</h2>
        <ul>
          <li><strong>Order confirmation:</strong> after payment, your order shows as Paid in the client portal, and PayPal emails you a payment receipt.</li>
          <li><strong>Documents:</strong> you upload your tax documents (W-2s, 1099s, receipts) securely in the portal.</li>
          <li><strong>Preparation:</strong> a CPA or Enrolled Agent prepares your return and may contact you with questions.</li>
          <li><strong>Review:</strong> the draft return is posted in your portal for review before anything is filed.</li>
          <li><strong>Filing:</strong> after you sign IRS Form 8879, we e-file and post the filed return and acceptance in your portal.</li>
        </ul>
      </section>

      <section>
        <h2>3. Typical timelines</h2>
        <ul>
          <li>Simple individual returns: usually ready for review within 2–3 business days of receiving all documents.</li>
          <li>Small business returns (Schedule C, LLC, S-Corp): usually 4–7 business days after receiving all documents.</li>
          <li>Complex situations (multiple states, rentals, foreign income) may take longer; we tell you the expected timeline up front.</li>
        </ul>
        <p>
          Timelines start once we have all required documents, and can be longer close to filing deadlines. If we cannot
          start or finish the work, you are entitled to a refund as described in our{" "}
          <Link href="/refund-policy" className="text-brass-dark hover:underline">Refund &amp; Cancellation Policy</Link>.
        </p>
      </section>

      <section>
        <h2>4. Service area</h2>
        <p>
          We prepare U.S. federal returns and state returns for clients in all 50 states, working remotely through the
          client portal, phone and video calls. In-person meetings are available at our New York office by appointment.
        </p>
      </section>
    </LegalDocument>
  );
}
