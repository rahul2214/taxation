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
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    // If loading is complete, and we don't have a user, redirect to login.
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    // If loading is complete, we have a user, but they are not an admin, redirect to user dashboard.
    if (!isLoading && user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isLoading, user, isAdmin, router]);

  // If still loading, or if the user is not an admin, show a loading screen.
  // This prevents rendering the admin layout for non-admins and avoids flashes of content.
  if (isLoading || !isAdmin) {
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
