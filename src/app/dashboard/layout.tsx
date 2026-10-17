
"use client";

import { CustomerSidebar } from "@/components/dashboard/CustomerSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { doc } from "firebase/firestore";
import { getCustomer } from "@/lib/supabase/services";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const [supabaseUserData, setSupabaseUserData] = useState<any>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `customers/${user.uid}`);
  }, [user, firestore]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    async function loadCustomer() {
      if (!user) return;
      try {
        const c = await getCustomer(user.uid);
        if (c) setSupabaseUserData(c);
      } catch (e) {
        console.error("Error loading customer in dashboard layout:", e);
      }
    }
    loadCustomer();
  }, [user]);

  useEffect(() => {
    // If auth state is resolved and there is no user, redirect to login.
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Determine the combined loading state
  const isLoading = isUserLoading || (firestore ? isUserDataLoading : false);

  // If we are loading or there's no user yet, show a full-screen loader.
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <CustomerSidebar userData={userData || supabaseUserData} />
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
