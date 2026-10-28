import { ChevronDown } from "lucide-react";

type FaqItem = { question: string; answer: string };

/**
 * Question-and-answer list built on native <details>, so every answer is in the server HTML
 * (search engines and the FAQPage structured data see the same text) and works without JavaScript.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="border-t border-ink">
      {items.map((item) => (
        <details key={item.question} className="group border-b border-paper-line">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
          </summary>
          <p className="max-w-3xl pb-6 text-[15.5px] leading-relaxed text-ink-soft">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
