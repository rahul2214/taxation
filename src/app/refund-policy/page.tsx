import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { LegalDocument } from "@/components/public/LegalDocument";

export const metadata: Metadata = buildMetadata({
  title: "Refund & Cancellation Policy",
  description:
    "When you can cancel a Polaris Tax Services order, when fees are refunded, how refunds are paid back, and how wallet and referral credits are handled.",
  path: "/refund-policy",
  keywords: ["tax preparation refund policy", "cancellation policy"],
});

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      title="Refund & Cancellation Policy"
      path="/refund-policy"
      breadcrumb="Refund policy"
      lastRevised="November 2026"
      summary={
        <p>
          <strong>In short:</strong> you can cancel and get a full refund of your plan fee any time before you approve
          your return for filing (by signing IRS Form 8879). Once your return has been filed with the IRS or a state, the
          fee is non-refundable, except under our <Link href="/guarantee" className="text-brass-dark hover:underline">guarantees</Link>.
          Refunds go back to the original payment method.
        </p>
      }
    >
      <section>
        <h2>1. What this policy covers</h2>
        <p>
          This policy applies to plans and services purchased from {"Polaris Tax Services Inc."} (&ldquo;Polaris&rdquo;)
          through our website or client portal, including payments made with PayPal, debit or credit card, or wallet
          credit. Our services are professional tax preparation and advisory services delivered digitally. We do not
          sell or ship physical goods.
        </p>
      </section>

      <section>
        <h2>2. Cancelling an unpaid order</h2>
        <p>
          An order you have placed but not yet paid for shows as <strong>Pending</strong> under &ldquo;Your
          orders&rdquo; in the client portal. You can cancel it there at any time at no cost. Any wallet credit you
          applied to that order is returned to your wallet immediately.
        </p>
      </section>

      <section>
        <h2>3. Refunds on paid orders</h2>
        <ul>
          <li>
            <strong>Before work starts or before you approve your return:</strong> you may cancel for any reason and
            receive a full refund of the amount you paid, as long as you have not signed IRS Form 8879 (e-file
            authorization) or otherwise authorized us to file.
          </li>
          <li>
            <strong>After your return is filed:</strong> once a return has been electronically transmitted to and
            accepted by the IRS or a state tax authority, the fee for that return is non-refundable.
          </li>
          <li>
            <strong>Services other than return preparation</strong> (for example tax planning sessions, bookkeeping,
            payroll or business formation): fees for work already delivered are non-refundable; fees paid for work not
            yet started are refunded in full on cancellation.
          </li>
          <li>
            <strong>Guarantees:</strong> refunds under our Maximum Refund Guarantee and Accuracy Guarantee follow the
            conditions on our <Link href="/guarantee" className="text-brass-dark hover:underline">guarantee page</Link>.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. How to request a refund</h2>
        <p>
          Email us at the address below or call our office with your name, the email on your account and the plan you
          purchased. We confirm eligibility within 2 business days.
        </p>
      </section>

      <section>
        <h2>5. How refunds are paid</h2>
        <ul>
          <li>
            Approved refunds are issued to the <strong>original payment method</strong>. Payments made with PayPal are
            refunded to your PayPal account or the card used in PayPal checkout.
          </li>
          <li>We process approved refunds within 5 business days. Your bank or PayPal may take additional time to show the credit.</li>
          <li>Any portion of an order paid with wallet credit is returned to your wallet as credit, not as cash.</li>
          <li>All prices and refunds are in U.S. dollars (USD).</li>
        </ul>
      </section>

      <section>
        <h2>6. Wallet and referral credits</h2>
        <ul>
          <li>
            Wallet credits (welcome and referral credits) are promotional. They can be applied toward Polaris plans but
            have no cash value and cannot be withdrawn, transferred or exchanged for cash.
          </li>
          <li>
            A referral credit earned by a referrer stays locked until the referred client pays for a plan. If that
            payment is later refunded or reversed, Polaris may cancel the related referral credit.
          </li>
          <li>Credits obtained through fraud, self-referral or abuse may be cancelled.</li>
        </ul>
      </section>

      <section>
        <h2>7. Disputes and chargebacks</h2>
        <p>
          If you are unhappy with a charge, please contact us first so we can resolve it quickly. Opening a PayPal
          dispute or card chargeback remains available to you under PayPal&apos;s and your card issuer&apos;s rules.
        </p>
      </section>
    </LegalDocument>
  );
}
