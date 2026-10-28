import { cn } from "@/lib/utils";

type PageHeadingProps = {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

/** Title block at the top of every client-dashboard and admin page. */
export function PageHeading({ title, description, actions, className }: PageHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-[30px] font-normal leading-tight text-foreground sm:text-[36px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
