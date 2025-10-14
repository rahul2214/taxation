
"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc, collection, query, where } from "firebase/firestore";
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

  const pendingAppointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appointments'), where('status', '==', 'Pending'));
  }, [firestore]);

  const pendingReferralsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'referrals'), where('status', '==', 'Pending'));
  }, [firestore]);

  const { data: pendingAppointments, isLoading: appointmentsLoading } = useCollection(pendingAppointmentsQuery);
  const { data: pendingReferrals, isLoading: referralsLoading } = useCollection(pendingReferralsQuery);

  const isLoading = isUserLoading || isUserDataLoading || appointmentsLoading || referralsLoading;
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (isUserLoading || isUserDataLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user && userData && !isAdmin) {
      router.push('/dashboard');
    }

  }, [isUserLoading, isUserDataLoading, user, userData, isAdmin, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <AdminSidebar 
        pendingAppointmentsCount={pendingAppointments?.length || 0}
        pendingReferralsCount={pendingReferrals?.length || 0}
      />
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
