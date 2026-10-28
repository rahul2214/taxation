import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageIntro } from "@/components/public/PageIntro";
import { ClosingCta } from "@/components/public/ClosingCta";

const principles = [
  {
    title: "Someone checks every number",
    description:
      "Every return is reviewed line by line by a licensed CPA before it's filed. Not sampled. Every one.",
  },
  {
    title: "You'll understand your return",
    description:
      "We explain what changed from last year and why, in plain language. If a decision is yours to make, we'll lay out the options and let you make it.",
  },
  {
    title: "Your information stays with us",
    description:
      "Tax return information is protected by federal law under IRC §7216. We don't sell it, share it, or use it for anything except your return.",
  },
];

const credentials = [
  ["Licensed CPAs and Enrolled Agents", "Active state board licenses and full practice rights before the IRS under Circular 230."],
  ["IRS authorized e-file provider", "Returns go directly to the IRS and state agencies, with acceptance confirmation."],
  ["Encrypted document portal", "Uploads are encrypted in transit and at rest, and only your preparer can open them."],
  ["Representation if the IRS writes", "If a return we prepared gets a notice, we handle the response with you."],
];

export default function AboutUsPage() {
  return (
    <PublicLayout>
      <PageIntro
        eyebrow="About the firm"
        title="A small practice that still answers the phone."
        lede="Polaris started because tax software couldn't answer real questions, and big firms weren't interested in returns under a certain size. We wanted something in between."
      />

      <section className="border-b border-paper-line">
        <div className="site-container grid gap-12 py-16 lg:grid-cols-12 lg:py-24">
          <div className="space-y-5 text-[17px] leading-relaxed text-ink-soft lg:col-span-7">
            <p>
              Most of our clients come to us after a bad year: a notice from the IRS, a refund that was smaller than
              expected, or an LLC that grew faster than the paperwork behind it. They want someone who will look at
              the whole picture and explain it.
            </p>
            <p>
              So that&apos;s how we work. You get one preparer who owns your file. You send documents through a secure
              portal instead of a shoebox. Your preparer finds what applies to you, asks when something needs a
              decision, and signs the return.
            </p>
            <p>
              We work with employees juggling RSUs and a rental unit, freelancers in their first year on a 1099, and
              owners of companies with several entities and a payroll in three states. The approach is the same.
            </p>
          </div>
          <aside className="lg:col-span-5 lg:border-l lg:border-paper-line lg:pl-12">
            <p className="font-display text-[28px] italic leading-snug text-ink">
              &ldquo;Good tax work is mostly paying attention. We try to pay a lot of it.&rdquo;
            </p>
            <p className="mt-5 text-sm text-ink-muted">Polaris Tax Services, New York</p>
          </aside>
        </div>
      </section>

      <section className="border-b border-paper-line bg-paper-deep/60">
        <div className="site-container py-16 lg:py-24">
          <p className="eyebrow">How we work</p>
          <ol className="mt-10 grid gap-px overflow-hidden border border-paper-line bg-paper-line md:grid-cols-3">
            {principles.map((p, i) => (
              <li key={p.title} className="bg-paper p-8 lg:p-10">
                <span className="font-display text-[44px] leading-none text-brass">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-6 text-lg font-semibold text-ink">{p.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{p.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-paper-line">
        <div className="site-container grid gap-10 py-16 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-4">
            <p className="eyebrow">Credentials</p>
            <h2 className="mt-5 font-display text-[34px] leading-[1.1] text-ink">What stands behind the work.</h2>
          </div>
          <dl className="border-t border-ink lg:col-span-8">
            {credentials.map(([title, body]) => (
              <div key={title} className="grid gap-2 border-b border-paper-line py-6 sm:grid-cols-[minmax(0,240px)_1fr] sm:gap-8">
                <dt className="font-semibold text-ink">{title}</dt>
                <dd className="text-[15px] leading-relaxed text-ink-soft">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ClosingCta />
    </PublicLayout>
  );
}
