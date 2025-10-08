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
import { ShieldCheck, User, Info, Upload, FileDown, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  { href: "/dashboard/account", label: "My Account", icon: <User /> },
  { href: "/dashboard/tax-info", label: "Tax Info", icon: <Info /> },
  { href: "/dashboard/upload", label: "Upload Documents", icon: <Upload /> },
  { href: "/dashboard/final-documents", label: "Final Documents", icon: <FileDown /> },
];

export function CustomerSidebar() {
  const pathname = usePathname();
  const userName = "Jane Doe";

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <ShieldCheck className="w-7 h-7 text-sidebar-primary" />
            <span className="text-sidebar-foreground min-w-max font-headline">Polaris Tax Services</span>
          </Link>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>

      <SidebarMenu className="flex-1">
        <div className="p-2 flex flex-col items-center group-data-[collapsible=icon]:hidden">
            <Avatar className="h-20 w-20 mb-2">
                <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" />
                <AvatarFallback>{userName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sidebar-foreground">{userName}</p>
        </div>

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
