
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
import { ShieldCheck, User, Info, Upload, FileDown, LogOut, Settings, Files } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebase } from "@/firebase";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { href: "/dashboard/account", label: "My Account", icon: <User /> },
  { href: "/dashboard/documents", label: "All Documents", icon: <Files /> },
  { href: "/dashboard/upload", label: "Upload Documents", icon: <Upload /> },
  { href: "/dashboard/tax-info", label: "Tax Forms", icon: <Info /> },
];

export function CustomerSidebar({ userData }: { userData: DocumentData | null }) {
  const pathname = usePathname();
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const { isMobile } = useSidebar();
  
  const handleLogout = async () => {
    if(!auth) return;
    try {
      await signOut(auth);
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
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <ShieldCheck className="w-7 h-7 text-sidebar-primary" />
            <span className="text-sidebar-foreground min-w-max font-headline">Polaris Tax Services</span>
          </Link>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      
      {userData && (
        <div className="p-4">
            <div className={cn("text-center", isMobile && "text-left")}>
                <p className="text-sm font-semibold text-sidebar-foreground">
                    {userData.firstName} {userData.lastName}
                </p>
            </div>
        </div>
      )}

      <SidebarMenu className="flex-1">
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
