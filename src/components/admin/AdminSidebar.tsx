
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
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { CalendarCheck, UsersRound, Users, FileText, LogOut, Settings, LayoutDashboard, FileUp, ShieldCheck } from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

type AdminSidebarProps = {
  pendingAppointmentsCount: number;
  pendingReferralsCount: number;
  pendingDocumentsCount: number;
};

import { supabase } from "@/lib/supabase/client";
import { apiCache } from "@/lib/supabase/services";

export function AdminSidebar({ pendingAppointmentsCount, pendingReferralsCount, pendingDocumentsCount }: AdminSidebarProps) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const { auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      apiCache.clear();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('polaris_admin_session');
        window.dispatchEvent(new Event('polaris_admin_auth_changed'));
      }
      await supabase.auth.signOut();
      toast({
          title: "Logged Out",
          description: "You have been successfully signed out.",
      });
      router.push('/admin/login');
    } catch (error) {
      console.error("Logout Error:", error);
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an error while logging out.",
      });
    }
  };

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/admin/appointments", label: "Appointments", icon: <CalendarCheck />, badge: pendingAppointmentsCount },
    { href: "/admin/referrals", label: "Referrals", icon: <UsersRound />, badge: pendingReferralsCount },
    { href: "/admin/customers", label: "Customers", icon: <Users /> },
    { href: "/admin/tax-documents", label: "Tax Documents", icon: <FileText />, badge: pendingDocumentsCount },
    { href: "/admin/documents", label: "Site Forms", icon: <FileUp /> },
    { href: "/admin/admins", label: "Admin Users", icon: <ShieldCheck /> },
  ];


  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Link href="/admin" className="flex flex-col items-center w-full gap-1 hover:opacity-90 transition-opacity py-1">
                <PolarisLogo className="h-8 w-auto max-w-[170px]" />
                <span className="text-xs font-bold text-sidebar-primary tracking-wider uppercase">Admin Console</span>
            </Link>
            <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      <SidebarMenu className="flex-1">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
              className={cn(isMobile && "justify-start h-10 p-2")}
            >
              <Link href={item.href}>
                {item.icon}
                <span>{item.label}</span>
                {item.badge != null && item.badge > 0 && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
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
