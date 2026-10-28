"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { cn } from "@/lib/utils";

export type PortalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number | null;
  /** Match only the exact path (for index routes like /admin). */
  exact?: boolean;
};

export type PortalNavGroup = { label: string; items: PortalNavItem[] };

type PortalSidebarProps = {
  homeHref: string;
  /** Small label under the logo, e.g. "Client portal". */
  area: string;
  groups: PortalNavGroup[];
  /** Optional block above the footer actions (e.g. the signed-in person). */
  identity?: React.ReactNode;
  footerItems: { label: string; icon: LucideIcon; href?: string; onClick?: () => void; tone?: "danger" }[];
};

/** Sidebar shared by the client dashboard and the admin console. */
export function PortalSidebar({ homeHref, area, groups, identity, footerItems }: PortalSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (item: PortalNavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Sidebar collapsible="icon" className="select-none border-r border-sidebar-border font-ui">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:px-2">
        <Link href={homeHref} className="flex flex-col gap-1.5 overflow-hidden">
          {collapsed ? (
            <PolarisLogo variant="icon" size={28} />
          ) : (
            <>
              <PolarisLogo theme="light" className="h-8 w-auto max-w-[150px]" />
              
            </>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 py-3">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="px-1 py-2">
            <SidebarGroupLabel className="h-7 px-2 font-mono text-[10.5px] font-normal uppercase tracking-[0.12em] text-ink-muted">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          "relative h-9 rounded-[4px] px-2.5 text-[14px] transition-colors",
                          active
                            ? "bg-white font-semibold text-ink shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-white data-[active=true]:bg-white"
                            : "text-ink-soft hover:bg-sidebar-accent hover:text-ink"
                        )}
                      >
                        <Link href={item.href}>
                          {active && (
                            <span className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-brass group-data-[collapsible=icon]:hidden" />
                          )}
                          <Icon className={cn("h-4 w-4 shrink-0", active ? "text-ink" : "text-ink-muted")} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge != null && item.badge !== "" && (
                            <span className="ml-auto rounded-[3px] bg-brass/15 px-1.5 py-px font-mono text-[11px] font-medium text-brass-dark group-data-[collapsible=icon]:hidden">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border p-3">
        {identity && !collapsed && <div className="px-1 pb-1">{identity}</div>}
        <SidebarMenu className="gap-0.5">
          {footerItems.map((item) => {
            const Icon = item.icon;
            const className = cn(
              "h-9 rounded-[4px] px-2.5 text-[14px] text-ink-soft hover:bg-sidebar-accent hover:text-ink",
              item.tone === "danger" && "hover:bg-destructive/10 hover:text-destructive"
            );
            return (
              <SidebarMenuItem key={item.label}>
                {item.href ? (
                  <SidebarMenuButton asChild tooltip={item.label} className={className}>
                    <Link href={item.href}>
                      <Icon className="h-4 w-4 shrink-0 text-ink-muted" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton onClick={item.onClick} tooltip={item.label} className={className}>
                    <Icon className="h-4 w-4 shrink-0 text-ink-muted" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
