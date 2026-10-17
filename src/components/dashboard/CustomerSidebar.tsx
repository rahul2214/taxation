
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { User, Info, Upload, LogOut, Settings, Files, Gift, Wallet } from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebase } from "@/firebase";
import { cn } from "@/lib/utils";
import { DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { href: "/dashboard/tax-info", label: "Tax Forms", icon: <Info /> },
  { href: "/dashboard/upload", label: "Upload Documents", icon: <Upload /> },
  { href: "/dashboard/documents", label: "My Documents", icon: <Files /> },
  { href: "/dashboard/refer", label: "Refer a Friend", icon: <Gift />, badge: "$25" },
  { href: "/dashboard/account", label: "My Account", icon: <User /> },
];

import { supabase } from "@/lib/supabase/client";
import { getReferralRewardAmount, apiCache } from "@/lib/supabase/services";
import { useState, useEffect } from "react";

export function CustomerSidebar({ userData }: { userData: DocumentData | null }) {
  const pathname = usePathname();
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const { isMobile } = useSidebar();
  const [rewardAmount, setRewardAmount] = useState<number>(25);

  useEffect(() => {
    getReferralRewardAmount().then(setRewardAmount).catch(() => {});
  }, []);
  
  const handleLogout = async () => {
    try {
      apiCache.clear();
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully signed out.",
      });
      router.push('/');
    } catch (error) {
      console.error("Logout Error:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an error while logging out.",
      });
    }
  };


  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity py-1">
            <PolarisLogo className="h-8 w-auto max-w-[170px]" />
          </Link>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      
      {userData && (
        <div className="px-4 py-3 border-b border-sidebar-border/60">
          <div className={cn("text-left")}>
            <div className="flex items-center justify-between gap-1">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {userData.firstName || userData.first_name || "Polaris Client"} {userData.lastName || userData.last_name || ""}
              </p>
              {userData.userid && (
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                  #{userData.userid}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                <Wallet className="h-3 w-3" />
                <span>${Number(userData.wallet_balance || 0).toFixed(2)}</span>
              </span>
              {userData.referral_code && (
                <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded border">
                  {userData.referral_code}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <SidebarMenu className="flex-1">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={item.label}
              className={cn(isMobile && "justify-start h-10 p-2")}
            >
              <Link href={item.href} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {item.href === "/dashboard/refer" ? `$${rewardAmount.toFixed(0)}` : item.badge}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" className={cn(isMobile && "justify-start h-10 p-2")}>
              <Link href="#">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout" className={cn(isMobile && "justify-start h-10 p-2")}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

    