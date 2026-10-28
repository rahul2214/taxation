"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { apiCache } from "@/lib/supabase/services";
import { clearCachedAuth } from "@/lib/cache/auth-cache";
import { PortalSidebar, PortalNavGroup } from "@/components/portal/PortalSidebar";

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
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      clearCachedAuth();
      apiCache.clear();
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out of the admin console.",
      });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout Error:", error);
      toast({
        variant: "destructive",
        title: "Couldn't sign out",
        description: "Please try again.",
      });
    }
  };

  const countOrNull = (n: number) => (n > 0 ? n : null);

  const groups: PortalNavGroup[] = [
    {
      label: "Overview",
      items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
    },
    {
      label: "Work queue",
      items: [
        { href: "/admin/appointments", label: "Appointments", icon: CalendarCheck, badge: countOrNull(pendingAppointmentsCount) },
        { href: "/admin/tax-documents", label: "Client documents", icon: FileText, badge: countOrNull(pendingDocumentsCount) },
        { href: "/admin/referrals", label: "Referrals", icon: UsersRound, badge: countOrNull(pendingReferralsCount) },
      ],
    },
    {
      label: "Manage",
      items: [
        { href: "/admin/customers", label: "Clients", icon: Users },
        { href: "/admin/documents", label: "Site tax forms", icon: FileUp },
        { href: "/admin/admins", label: "Admin users", icon: ShieldCheck },
      ],
    },
  ];

  return (
    <PortalSidebar
      homeHref="/admin"
      area="Admin console"
      groups={groups}
      footerItems={[
        { label: "Client portal", icon: ExternalLink, href: "/dashboard" },
        { label: "Sign out", icon: LogOut, onClick: handleLogout, tone: "danger" },
      ]}
    />
  );
}
