"use client";

import React, { useState, useEffect } from "react";
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
  FileText,
  UploadCloud,
  FolderLock,
  Gift,
  User,
  LogOut,
  Wallet,
  Copy,
  Check,
  CalendarCheck,
} from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFirebase } from "@/firebase";
import { cn } from "@/lib/utils";
import { DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { getReferralRewardAmount, apiCache } from "@/lib/supabase/services";
import { clearCachedAuth } from "@/lib/cache/auth-cache";

export function CustomerSidebar({ userData }: { userData: DocumentData | null }) {
  const pathname = usePathname();
  const { user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const { state } = useSidebar();
  const [rewardAmount, setRewardAmount] = useState<number>(25);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    getReferralRewardAmount().then(setRewardAmount).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      clearCachedAuth();
      apiCache.clear();
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully signed out.",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout Error:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an error while logging out.",
      });
    }
  };

  const handleCopyReferralCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userData?.referral_code) return;
    navigator.clipboard.writeText(userData.referral_code);
    setCopiedCode(true);
    toast({
      title: "Coupon Code Copied!",
      description: `Referral code "${userData.referral_code}" copied to clipboard.`,
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // User display helpers
  const firstName = userData?.firstName || userData?.first_name || "";
  const lastName = userData?.lastName || userData?.last_name || "";
  const displayName = `${firstName} ${lastName}`.trim() || user?.displayName || "Polaris Client";
  const userInitials =
    ((firstName ? firstName[0] : "") + (lastName ? lastName[0] : "")) ||
    displayName.slice(0, 2).toUpperCase();
  const walletBalance = Number(userData?.wallet_balance || 0);

  const mainNavItems = [
    {
      href: "/dashboard/tax-info",
      label: "Tax Forms & Info",
      icon: FileText,
    },
    {
      href: "/dashboard/upload",
      label: "Upload Documents",
      icon: UploadCloud,
    },
    {
      href: "/dashboard/documents",
      label: "My Documents",
      icon: FolderLock,
    },
  ];

  const rewardNavItems = [
    {
      href: "/dashboard/refer",
      label: "Refer & Earn",
      icon: Gift,
      badge: `+$${rewardAmount.toFixed(0)}`,
    },
  ];

  const accountNavItems = [
    {
      href: "/dashboard/account",
      label: "My Profile",
      icon: User,
    },
    {
      href: "/dashboard/book-appointment",
      label: "Book Appointment",
      icon: CalendarCheck,
    },
  ];

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar select-none">
      {/* 1. Header with Brand Logo & Collapse Trigger */}
      <SidebarHeader className="p-3 border-b border-sidebar-border/70">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/dashboard/account"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity overflow-hidden"
          >
            <PolarisLogo className="h-8 w-auto max-w-[155px]" />
          </Link>
          <SidebarTrigger className="h-8 w-8 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0" />
        </div>
      </SidebarHeader>

      {/* 2. Scrollable Navigation Content */}
      <SidebarContent className="px-2 py-3 space-y-4">
        

        {/* Group 1: Tax Services */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Tax Portal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainNavItems.map((item) => {
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
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group 2: Benefits & Referral Rewards */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Rewards & Credits
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {rewardNavItems.map((item) => {
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
                              isActive ? "text-primary-foreground" : "text-emerald-500"
                            )}
                          />
                          <span className="truncate text-sm">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 tracking-wide",
                              isActive
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
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

        {/* Group 3: Account & Support */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Account & Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {accountNavItems.map((item) => {
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

      {/* 3. Footer with Quick Sign Out */}
      <SidebarFooter className="p-3 border-t border-sidebar-border/70 space-y-1">
        <SidebarMenu>
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