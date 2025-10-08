"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ShieldCheck, CalendarCheck, UsersRound, Users, FileText, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/admin/appointments", label: "Appointments", icon: <CalendarCheck /> },
  { href: "/admin/referrals", label: "Referrals", icon: <UsersRound /> },
  { href: "/admin/customers", label: "Customers", icon: <Users /> },
  { href: "/admin/documents", label: "Tax Documents", icon: <FileText /> },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
                <ShieldCheck className="w-7 h-7 text-sidebar-primary" />
                <span className="text-sidebar-foreground min-w-max font-headline">Polaris Tax Services Admin</span>
            </Link>
            <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      <SidebarMenu className="flex-1">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                isActive={pathname.startsWith(item.href)}
                icon={item.icon}
                tooltip={item.label}
              >
                {item.label}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="#" legacyBehavior passHref>
              <SidebarMenuButton icon={<Settings />} tooltip="Settings">Settings</SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/" legacyBehavior passHref>
                <SidebarMenuButton icon={<LogOut />} tooltip="Logout">Logout</SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
