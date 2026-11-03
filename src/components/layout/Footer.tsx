import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";

const columns = [
  {
    title: "Services",
    links: [
      { href: "/services/individual-tax-preparation", label: "Individual tax returns" },
      { href: "/services/small-business-tax-preparation", label: "Small business & LLC taxes" },
      { href: "/services/tax-planning", label: "Tax planning" },
      { href: "/services/irs-notice-audit-help", label: "IRS notice & audit help" },
      { href: "/services/bookkeeping", label: "Bookkeeping" },
      { href: "/services/payroll", label: "Payroll" },
      { href: "/services/business-formation", label: "Business formation" },
      { href: "/services/mnc-tax-filing", label: "MNC tax filing" },
    ],
  },
  {
    title: "Firm",
    links: [
      { href: "/about", label: "About us" },
      { href: "/guarantee", label: "Our guarantee" },
      { href: "/security", label: "How we protect your data" },
      { href: "/resources", label: "Tools & resources" },
      { href: "/blogs", label: "Tax articles" },
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

const socials = [
  {
    href: "https://www.instagram.com/polaristaxservices",
    label: "Instagram",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z",
  },
  {
    href: "https://www.threads.com/@polaristaxservices",
    label: "Threads",
    path: "M17.69 11.13c-.1-.05-.21-.1-.32-.14-.18-3.4-2.04-5.35-5.16-5.37h-.04c-1.87 0-3.42.8-4.38 2.24l1.72 1.18c.72-1.09 1.84-1.32 2.66-1.32h.03c1.03.01 1.8.3 2.31.89.37.43.61 1.02.73 1.77-.9-.15-1.88-.2-2.92-.14-2.93.17-4.82 1.88-4.69 4.26.06 1.2.66 2.24 1.69 2.92.87.58 1.99.86 3.16.8 1.54-.08 2.75-.67 3.59-1.74.64-.82 1.05-1.87 1.23-3.2.73.44 1.28 1.03 1.58 1.73.51 1.2.54 3.17-1.07 4.78-1.41 1.41-3.11 2.02-5.67 2.04-2.84-.02-4.99-.93-6.39-2.71-1.31-1.67-1.99-4.07-2.01-7.15.02-3.08.7-5.48 2.01-7.15 1.4-1.78 3.55-2.69 6.39-2.71 2.86.02 5.05.94 6.5 2.72.71.88 1.25 1.98 1.6 3.27l2.01-.54c-.43-1.58-1.1-2.95-2.02-4.08C18.39 1.11 15.69.02 12.2 0h-.01C8.71.02 6.04 1.12 4.25 3.39 2.66 5.4 1.84 8.2 1.81 11.71v.02c.03 3.51.85 6.31 2.44 8.32 1.79 2.27 4.46 3.43 7.94 3.45h.01c3.09-.02 5.27-.83 7.07-2.63 2.35-2.35 2.28-5.3 1.5-7.11-.56-1.3-1.62-2.35-3.08-3.05v-.01Zm-5.34 5.02c-1.29.07-2.63-.51-2.7-1.75-.05-.92.65-1.95 2.78-2.07.24-.01.48-.02.72-.02.77 0 1.5.07 2.15.22-.25 3.06-1.69 3.55-2.95 3.62Z",
  },
  {
    href: "https://www.facebook.com/share/19qUcAJoKB/",
    label: "Facebook",
    path: "M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07Z",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-paper-line bg-paper-deep/50 text-ink-muted">
      <div className="site-container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <PolarisLogo theme="light" className="h-9 w-auto" />
            <p className="mt-6 max-w-sm font-display text-[26px] leading-[1.25] text-ink">
              Have a question about your return? Call us. A person will pick up.
            </p>
            <div className="mt-6 space-y-1.5 text-[15px]">
              <a href="tel:+12128471920" className="block font-medium text-ink hover:text-brass-dark">
                (212) 847-1920
              </a>
              <a href="mailto:plrstaxservices@gmail.com" className="block text-ink-soft hover:text-ink">
                plrstaxservices@gmail.com
              </a>
              <p className="pt-2 text-sm text-ink-muted">
                440 Park Avenue South, 12th Floor
                <br />
                New York, NY 10016
              </p>
            </div>
            <ul className="mt-7 flex gap-3">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Polaris Tax on ${social.label}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-paper-line bg-white text-ink-soft transition-colors hover:border-brass hover:text-brass-dark"
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden>
                      <path d={social.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-brass-dark">{col.title}</h3>
                <ul className="mt-5 space-y-3 text-[14.5px]">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-ink-soft transition-colors hover:text-ink">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-paper-line pt-8 text-[12.5px] leading-relaxed text-ink-muted">
          <p className="max-w-4xl">
            <span className="font-medium text-ink">Circular 230 notice.</span> Any federal tax advice on this site is not
            intended or written to be used, and cannot be used, to avoid penalties under the Internal Revenue Code or
            to promote, market, or recommend any transaction to another party.{" "}
            <Link href="/disclaimer" className="inline-flex items-center gap-0.5 text-ink underline-offset-4 hover:underline">
              Full disclosure <ArrowUpRight className="h-3 w-3" />
            </Link>
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Polaris Tax Services Inc.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/privacy" className="hover:text-ink">Privacy</Link>
              <Link href="/terms" className="hover:text-ink">Terms</Link>
              <Link href="/security" className="hover:text-ink">Security</Link>
              <Link href="/disclaimer" className="hover:text-ink">Disclosures</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
