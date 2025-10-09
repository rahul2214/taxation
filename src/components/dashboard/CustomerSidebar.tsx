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
import { ShieldCheck, User, Info, Upload, FileDown, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebase } from "@/firebase";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";

const menuItems = [
  { href: "/dashboard/account", label: "My Account", icon: <User /> },
  { href: "/dashboard/tax-info", label: "Tax Info", icon: <Info /> },
  { href: "/dashboard/upload", label: "Upload Documents", icon: <Upload /> },
  { href: "/dashboard/final-documents", label: "Final Documents", icon: <FileDown /> },
];

export function CustomerSidebar() {
  const pathname = usePathname();
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const userName = user?.displayName || user?.email || "User";
  const userFallback = userName.split(' ').map(n => n[0]).join('');
  const { isMobile } = useSidebar();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };


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
                <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/user-avatar/100/100"} />
                <AvatarFallback>{userFallback}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sidebar-foreground">{userName}</p>
        </div>

        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              icon={item.icon}
              tooltip={item.label}
              className={cn(isMobile && "justify-start h-10 p-2")}
            >
              <Link href={item.href}>{item.label}</Link>
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
