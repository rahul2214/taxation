"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

type PortalShellProps = {
  /** Path prefix → section name shown in the top bar. Longest match wins. */
  titles: Record<string, string>;
  area: string;
  areaHref: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

/** Main column for the client dashboard and admin console: slim top bar plus a centred content area. */
export function PortalShell({ titles, area, areaHref, actions, children }: PortalShellProps) {
  const pathname = usePathname();
  const match = Object.keys(titles)
    .filter((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
    .sort((a, b) => b.length - a.length)[0];
  const title = match ? titles[match] : null;

  return (
    <SidebarInset className="min-w-0 bg-background font-ui text-foreground">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
        <SidebarTrigger className="-ml-1 h-8 w-8 text-ink-muted hover:bg-secondary hover:text-ink" />
        <span className="h-4 w-px bg-border" />
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[14px]">
          <Link href={areaHref} className="shrink-0 text-ink-muted hover:text-ink">
            {area}
          </Link>
          {title && (
            <>
              <span className="text-ink-muted/60">/</span>
              <span className="truncate font-semibold text-ink">{title}</span>
            </>
          )}
        </nav>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</div>
    </SidebarInset>
  );
}
