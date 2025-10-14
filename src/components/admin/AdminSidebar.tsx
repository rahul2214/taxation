
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
import { ShieldCheck, CalendarCheck, UsersRound, Users, FileText, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/firebase";
import { signOut } from "firebase/auth";

type AdminSidebarProps = {
  pendingAppointmentsCount: number;
  pendingReferralsCount: number;
};

export function AdminSidebar({ pendingAppointmentsCount, pendingReferralsCount }: AdminSidebarProps) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const { auth } = useFirebase();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      if(auth) {
        await signOut(auth);
      }
      router.push('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/admin/appointments", label: "Appointments", icon: <CalendarCheck />, badge: pendingAppointmentsCount },
    { href: "/admin/referrals", label: "Referrals", icon: <UsersRound />, badge: pendingReferralsCount },
    { href: "/admin/customers", label: "Customers", icon: <Users /> },
    { href: "/admin/documents", label: "Tax Documents", icon: <FileText /> },
  ];


  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Link href="/admin" className="flex flex-col items-center w-full gap-1 font-bold text-lg">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-7 h-7 text-sidebar-primary" />
                    <span className="text-sidebar-foreground min-w-max font-headline">Polaris Tax Services</span>
                </div>
                <span className="text-sm font-bold text-sidebar-primary">Admin</span>
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
              icon={item.icon}
              tooltip={item.label}
              className={cn(isMobile && "justify-start h-10 p-2")}
            >
              <Link href={item.href}>
                {item.label}
                {item.badge > 0 && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild icon={<Settings />} tooltip="Settings" className={cn(isMobile && "justify-start h-10 p-2")}>
              <Link href="#">Settings</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} icon={<LogOut />} tooltip="Logout" className={cn(isMobile && "justify-start h-10 p-2")}>
              Logout
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
