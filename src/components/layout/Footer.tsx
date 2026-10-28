import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";

const columns = [
  {
    title: "Services",
    links: [
      { href: "/services", label: "Individual returns" },
      { href: "/services", label: "Small business & LLCs" },
      { href: "/services", label: "S-Corps & partnerships" },
      { href: "/services", label: "IRS notices & audits" },
      { href: "/services", label: "Bookkeeping" },
    ],
  },
  {
    title: "Firm",
    links: [
      { href: "/about", label: "About us" },
      { href: "/guarantee", label: "Our guarantee" },
      { href: "/security", label: "How we protect your data" },
      { href: "/blogs", label: "Articles" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Clients",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create an account" },
      { href: "/book-appointment", label: "Book a consultation" },
      { href: "/contact", label: "Contact the office" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink text-paper/80">
      <div className="site-container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <PolarisLogo theme="dark" className="h-9 w-auto" />
            <p className="mt-6 max-w-sm font-display text-[26px] leading-[1.25] text-paper">
              Have a question about your return? Call us. A person will pick up.
            </p>
            <div className="mt-6 space-y-1.5 text-[15px]">
              <a href="tel:+12128471920" className="block text-paper hover:text-brass-light">
                (212) 847-1920
              </a>
              <a href="mailto:advisory@polaristax.com" className="block hover:text-paper">
                advisory@polaristax.com
              </a>
              <p className="pt-2 text-sm text-paper/55">
                440 Park Avenue South, 12th Floor
                <br />
                New York, NY 10016
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-brass-light">{col.title}</h3>
                <ul className="mt-5 space-y-3 text-[14.5px]">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="transition-colors hover:text-paper">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-paper/10 pt-8 text-[12.5px] leading-relaxed text-paper/50">
          <p className="max-w-4xl">
            <span className="text-paper/70">Circular 230 notice.</span> Any federal tax advice on this site is not
            intended or written to be used, and cannot be used, to avoid penalties under the Internal Revenue Code or
            to promote, market, or recommend any transaction to another party.{" "}
            <Link href="/disclaimer" className="inline-flex items-center gap-0.5 text-paper/70 underline-offset-4 hover:underline">
              Full disclosure <ArrowUpRight className="h-3 w-3" />
            </Link>
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Polaris Tax Services Inc.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/privacy" className="hover:text-paper">Privacy</Link>
              <Link href="/terms" className="hover:text-paper">Terms</Link>
              <Link href="/security" className="hover:text-paper">Security</Link>
              <Link href="/disclaimer" className="hover:text-paper">Disclosures</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
