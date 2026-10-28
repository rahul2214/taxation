import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const links = [
  { href: "/services", label: "Our services and prices" },
  { href: "/blogs", label: "Tax articles" },
  { href: "/faq", label: "Frequently asked questions" },
  { href: "/contact", label: "Contact the office" },
];

export default function NotFound() {
  return (
    <PublicLayout>
      <section className="site-container py-20 md:py-28">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-5 max-w-2xl font-display text-[40px] leading-[1.08] text-ink sm:text-[56px]">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">
          It may have moved, or the link may be mistyped. These are good places to start:
        </p>
        <ul className="mt-8 max-w-md border-t border-ink">
          {links.map((link) => (
            <li key={link.href} className="border-b border-paper-line">
              <Link href={link.href} className="block py-4 font-display text-[22px] text-ink hover:text-brass-dark">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/" className="btn-ink mt-10">
          Back to the homepage
        </Link>
      </section>
    </PublicLayout>
  );
}
