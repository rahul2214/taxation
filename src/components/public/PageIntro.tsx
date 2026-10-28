import { cn } from "@/lib/utils";

type PageIntroProps = {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
};

/** Opening block for inner public pages: small label, serif headline, short lede. */
export function PageIntro({ eyebrow, title, lede, aside, className }: PageIntroProps) {
  return (
    <section className={cn("border-b border-paper-line", className)}>
      <div className="site-container grid gap-10 pb-14 pt-14 md:pb-20 md:pt-20 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-5 font-display text-[40px] font-normal leading-[1.08] tracking-[-0.01em] text-ink sm:text-[54px] lg:text-[64px]">
            {title}
          </h1>
          {lede && <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-soft sm:text-lg">{lede}</p>}
        </div>
        {aside && <div className="lg:col-span-4 lg:self-end">{aside}</div>}
      </div>
    </section>
  );
}
