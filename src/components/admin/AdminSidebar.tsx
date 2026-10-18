"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  CalendarCheck,
  UsersRound,
  Users,
  FileText,
  FileUp,
  ShieldCheck,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { apiCache } from "@/lib/supabase/services";

type AdminSidebarProps = {
  pendingAppointmentsCount: number;
  pendingReferralsCount: number;
  pendingDocumentsCount: number;
};

export function AdminSidebar({
  pendingAppointmentsCount,
  pendingReferralsCount,
  pendingDocumentsCount,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      apiCache.clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem("polaris_admin_session");
        window.dispatchEvent(new Event("polaris_admin_auth_changed"));
      }
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully signed out.",
      });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout Error:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an error while logging out.",
      });
    }
  };

  const overviewItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
      badgeColor: "",
    },
  ];

  const operationItems = [
    {
      href: "/admin/appointments",
      label: "Appointments",
      icon: CalendarCheck,
      badge: pendingAppointmentsCount > 0 ? pendingAppointmentsCount : null,
      badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
    },
    {
      href: "/admin/tax-documents",
      label: "Tax Documents",
      icon: FileText,
      badge: pendingDocumentsCount > 0 ? pendingDocumentsCount : null,
      badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
    },
    {
      href: "/admin/referrals",
      label: "Referrals & Rewards",
      icon: UsersRound,
      badge: pendingReferralsCount > 0 ? pendingReferralsCount : null,
      badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
    },
  ];

  const managementItems = [
    {
      href: "/admin/customers",
      label: "Client Directory",
      icon: Users,
      badge: null,
      badgeColor: "",
    },
    {
      href: "/admin/documents",
      label: "Site Tax Forms",
      icon: FileUp,
      badge: null,
      badgeColor: "",
    },
    {
      href: "/admin/admins",
      label: "Admin Users",
      icon: ShieldCheck,
      badge: null,
      badgeColor: "",
    },
  ];

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar select-none">
      {/* 1. Header with Logo & Status Indicator */}
      <SidebarHeader className="p-3 border-b border-sidebar-border/70 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity overflow-hidden"
          >
            <PolarisLogo className="h-8 w-auto max-w-[155px]" />
          </Link>
          <SidebarTrigger className="h-8 w-8 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0" />
        </div>

        {/* Live Admin Badge */}
        {state !== "collapsed" && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-[11px] font-bold tracking-wider uppercase text-primary">
              Admin Console
            </span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">Secure</span>
            </div>
          </div>
        )}
      </SidebarHeader>

      {/* 2. Scrollable Navigation Content */}
      <SidebarContent className="px-2 py-3 space-y-4">
        {/* Group 1: Core Overview */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {overviewItems.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-10 px-3 rounded-xl font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Link href={item.href} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 truncate">
                          <IconComponent
                            className={cn(
                              "h-4.5 w-4.5 shrink-0",
                              isActive ? "text-primary-foreground" : "text-primary"
                            )}
                          />
                          <span className="truncate text-sm">{item.label}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group 2: Operations & Queues */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Operations & Queues
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {operationItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-10 px-3 rounded-xl font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Link href={item.href} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 truncate">
                          <IconComponent
                            className={cn(
                              "h-4.5 w-4.5 shrink-0",
                              isActive ? "text-primary-foreground" : "text-primary"
                            )}
                          />
                          <span className="truncate text-sm">{item.label}</span>
                        </div>
                        {item.badge != null && (
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums",
                              isActive
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : item.badgeColor
                            )}
                          >
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

        {/* Group 3: Directory & Content */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Directory & Content
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {managementItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-10 px-3 rounded-xl font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Link href={item.href} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 truncate">
                          <IconComponent
                            className={cn(
                              "h-4.5 w-4.5 shrink-0",
                              isActive ? "text-primary-foreground" : "text-muted-foreground"
                            )}
                          />
                          <span className="truncate text-sm">{item.label}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 3. Footer with Client Portal Switcher & Sign Out */}
      <SidebarFooter className="p-3 border-t border-sidebar-border/70 space-y-1">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="View Client Portal"
              className="h-10 px-3 rounded-xl font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-150"
            >
              <Link href="/dashboard" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3 truncate">
                  <ExternalLink className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">Client Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sign Out"
              className="h-10 px-3 rounded-xl font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full justify-start gap-3"
            >
              <LogOut className="h-4.5 w-4.5 shrink-0" />
              <span className="text-sm">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
