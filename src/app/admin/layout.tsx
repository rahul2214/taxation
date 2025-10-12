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

  const isLoading = isUserLoading || isUserDataLoading;

  useEffect(() => {
    if (isUserLoading) return; // Wait until user auth state is determined
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Once we have a user, we can check their role data
    if (isUserDataLoading) return; // Wait for user data to load

    // After user data has loaded
    if (userData?.role !== 'admin') {
      router.push('/dashboard'); // Redirect non-admins
    }

  }, [user, isUserLoading, userData, isUserDataLoading, router]);

  if (isLoading || !user || !userData || userData.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Only render the layout if the user is an authenticated admin
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
