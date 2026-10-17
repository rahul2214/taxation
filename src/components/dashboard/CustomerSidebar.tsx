
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
import { User, Info, Upload, LogOut, Settings, Files, Gift } from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebase } from "@/firebase";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { href: "/dashboard/account", label: "My Account", icon: <User /> },
  { href: "/dashboard/tax-info", label: "Tax Forms", icon: <Info /> },
  { href: "/dashboard/upload", label: "Upload Documents", icon: <Upload /> },
  { href: "/dashboard/documents", label: "My Documents", icon: <Files /> },
  { href: "/dashboard/refer", label: "Refer a Friend", icon: <Gift /> },
];

import { supabase } from "@/lib/supabase/client";

export function CustomerSidebar({ userData }: { userData: DocumentData | null }) {
  const pathname = usePathname();
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const { isMobile } = useSidebar();
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      if(auth) {
        try {
          await signOut(auth);
        } catch (e) {}
      }
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
              tooltip={item.label}
              className={cn(isMobile && "justify-start h-10 p-2")}
            >
              <Link href={item.href}>
                {item.icon}
                <span>{item.label}</span>
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

    