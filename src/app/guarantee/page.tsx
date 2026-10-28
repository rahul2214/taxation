import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageIntro } from "@/components/public/PageIntro";
import { ClosingCta } from "@/components/public/ClosingCta";

const guarantees = [
  {
    title: "Accuracy",
    description:
      "If we make a calculation error on your return, we pay any IRS or state penalty and interest that results from it. You shouldn't pay for our mistake.",
  },
  {
    title: "Maximum refund",
    description:
      "If another preparer or commercial software gets a larger refund, or a lower tax bill, from the same documents before you file, we refund our preparation fee in full.",
  },
  {
    title: "Satisfaction before filing",
    description:
      "You see the finished return, the refund figure and your preparer's notes before anything is filed. If you aren't happy at that point, you don't pay.",
  },
  {
    title: "Notice and audit support",
    description:
      "If the IRS or your state writes to you about a return we prepared, we help you respond and prepare the documentation at no extra charge.",
  },
];

export default function GuaranteePage() {
  return (
    <PublicLayout>
      <PageIntro
        eyebrow="Our guarantee"
        title="We stand behind the returns we sign."
        lede="Four promises, written down. They're backed by licensed CPAs who carry professional responsibility for every return we file."
      />

      <section className="border-b border-paper-line">
        <div className="site-container py-16 lg:py-20">
          <ol className="border-t border-ink">
            {guarantees.map((g, i) => (
              <li key={g.title} className="grid gap-4 border-b border-paper-line py-10 lg:grid-cols-12 lg:gap-8">
                <span className="font-display text-[44px] leading-none text-brass lg:col-span-1">{i + 1}.</span>
                <h2 className="font-display text-[30px] leading-tight text-ink lg:col-span-4">{g.title}</h2>
                <p className="text-[16.5px] leading-relaxed text-ink-soft lg:col-span-7">{g.description}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-6 lg:grid-cols-12">
            <h3 className="eyebrow lg:col-span-3">The fine print</h3>
            <p className="text-[14.5px] leading-relaxed text-ink-muted lg:col-span-9">
              The accuracy guarantee covers calculations made by Polaris Tax Services using accurate information you
              provide. It doesn&apos;t cover penalties caused by income left out, incorrect or falsified documents, or
              tax law changes made after your return was filed. Maximum refund comparisons must use the same source
              documents with another professional preparer or commercial software. Questions?{" "}
              <Link href="/contact" className="link-under">
                Ask us
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <ClosingCta
        title="File knowing someone has your back."
        primary={{ href: "/signup", label: "Start your return" }}
        secondary={{ href: "/book-appointment", label: "Speak with a CPA" }}
      />
    </PublicLayout>
  );
}
