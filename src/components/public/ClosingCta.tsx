import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ClosingCtaProps = {
  title?: string;
  body?: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
};

/** Dark closing band used at the bottom of public pages. */
export function ClosingCta({
  title = "Talk it through with a CPA first.",
  body = "A free 15-minute call. Tell us what you're dealing with, and we'll tell you what it takes and what it costs before you commit to anything.",
  primary = { href: "/book-appointment", label: "Book a consultation" },
  secondary = { href: "/signup", label: "Create an account" },
}: ClosingCtaProps) {
  return (
    <section className="bg-ink text-paper">
      <div className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <h2 className="font-display text-[34px] leading-[1.1] sm:text-[44px]">{title}</h2>
          <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-paper/70">{body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:justify-end">
          <Link href={primary.href} className="btn-brass">
            {primary.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={secondary.href}
            className="inline-flex items-center justify-center rounded-[3px] border border-paper/25 px-5 py-3 text-sm font-semibold text-paper transition-colors hover:border-paper/60"
          >
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
