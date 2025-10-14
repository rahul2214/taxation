
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
    // Wait until all loading is complete before making any decisions
    if (isLoading) return;

    // If there's no user, they should be at the login page.
    if (!user) {
      router.push('/login');
      return;
    }

    // If we have a user and their data, but they aren't an admin, redirect.
    if (user && userData && !isAdmin) {
      router.push('/dashboard');
    }

  }, [isLoading, user, userData, isAdmin, router]);

  // Show a loading screen while we verify the user's identity and role.
  // This prevents rendering the admin layout for non-admins or before auth state is confirmed.
  if (isLoading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Only render the layout if the user is an authenticated admin.
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
