"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `customers/${user.uid}`);
  }, [user, firestore]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    const isLoading = isUserLoading || isUserDataLoading;
    if (isLoading) {
      return; // Wait until we have user and role info
    }

    if (!user) {
      // Not logged in, redirect to home/login page
      router.push('/login');
      return;
    }

    if (userData?.role !== 'admin') {
      // Logged in, but not an admin, redirect to user dashboard
      router.push('/dashboard');
      return;
    }

  }, [user, userData, isUserLoading, isUserDataLoading, router]);

  const isLoading = isUserLoading || (user && isUserDataLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userData?.role !== 'admin') {
    // Render nothing while redirecting
    return null;
  }
  
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
