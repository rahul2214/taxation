import Link from "next/link";
import { faqSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqList } from "@/components/public/FaqList";
import { cn } from "@/lib/utils";

type PageFaqProps = {
  items: { question: string; answer: string }[];
  title?: string;
  className?: string;
};

/** Page-specific FAQ band shown near the bottom of public pages, with matching FAQPage structured data. */
export function PageFaq({ items, title = "Common questions", className }: PageFaqProps) {
  return (
    <section className={cn("border-t border-paper-line", className)} aria-labelledby="page-faq-title">
      <JsonLd data={faqSchema(items)} />
      <div className="site-container grid gap-10 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <p className="eyebrow">FAQ</p>
          <h2 id="page-faq-title" className="mt-5 font-display text-[32px] leading-[1.1] text-ink sm:text-[38px]">
            {title}
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
            More answers on our{" "}
            <Link href="/faq" className="link-under">
              FAQ page
            </Link>
            , or call (212) 847-1920.
          </p>
        </div>
        <div className="lg:col-span-8">
          <FaqList items={items} />
        </div>
      </div>
    </section>
  );
}
