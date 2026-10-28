"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  UploadCloud,
  FolderLock,
  Gift,
  User,
  LogOut,
  CalendarCheck,
  Globe,
} from "lucide-react";
import { useFirebase } from "@/firebase";
import { DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { getReferralRewardAmount, apiCache } from "@/lib/supabase/services";
import { clearCachedAuth } from "@/lib/cache/auth-cache";
import { PortalSidebar, PortalNavGroup } from "@/components/portal/PortalSidebar";

export function CustomerSidebar({ userData }: { userData: DocumentData | null }) {
  const { user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [rewardAmount, setRewardAmount] = useState<number>(25);

  useEffect(() => {
    getReferralRewardAmount().then(setRewardAmount).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      clearCachedAuth();
      apiCache.clear();
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "See you next time.",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout Error:", error);
      toast({
        variant: "destructive",
        title: "Couldn't sign out",
        description: "Please try again.",
      });
    }
  };

  const firstName = userData?.firstName || userData?.first_name || "";
  const lastName = userData?.lastName || userData?.last_name || "";
  const displayName = `${firstName} ${lastName}`.trim() || user?.displayName || "Polaris client";
  const email = userData?.email || user?.email || "";
  const walletBalance = Number(userData?.wallet_balance || 0);

  const groups: PortalNavGroup[] = [
    {
      label: "Your return",
      items: [
        { href: "/dashboard/upload", label: "Upload documents", icon: UploadCloud },
        { href: "/dashboard/documents", label: "My documents", icon: FolderLock },
        { href: "/dashboard/tax-info", label: "Tax forms", icon: FileText },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/dashboard/book-appointment", label: "Book a call", icon: CalendarCheck },
        { href: "/dashboard/refer", label: "Refer a friend", icon: Gift, badge: `+$${rewardAmount.toFixed(0)}` },
        { href: "/dashboard/account", label: "Profile", icon: User },
      ],
    },
  ];

  return (
    <PortalSidebar
      homeHref="/dashboard/account"
      area="Client portal"
      groups={groups}
      identity={
        <div className="rounded-[4px] border border-sidebar-border bg-white/60 px-3 py-2.5">
          <p className="truncate text-[14px] font-semibold text-ink">{displayName}</p>
          {email && <p className="truncate text-[12.5px] text-ink-muted">{email}</p>}
          {walletBalance > 0 && (
            <p className="mt-1.5 font-mono text-[11.5px] text-brass-dark">Credit ${walletBalance.toFixed(2)}</p>
          )}
        </div>
      }
      footerItems={[
        { label: "Back to website", icon: Globe, href: "/" },
        { label: "Sign out", icon: LogOut, onClick: handleLogout, tone: "danger" },
      ]}
    />
  );
}
