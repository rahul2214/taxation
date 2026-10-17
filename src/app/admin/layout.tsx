
"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { doc, collection, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { getCustomer, getAppointments, getReferrals, getTaxDocuments, getAdminById, getAdminByEmail } from "@/lib/supabase/services";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `customers/${user.uid}`);
  }, [user, firestore]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);
  const [isSupabaseAdmin, setIsSupabaseAdmin] = useState<boolean | null>(null);
  const [sbCounts, setSbCounts] = useState({ apts: 0, refs: 0, docs: 0 });

  useEffect(() => {
    async function checkAdminAndCounts() {
      if (!user) return;
      try {
        let isAdm = false;

        // 1. Check in admins table by uid
        if (user.uid) {
          const adminById = await getAdminById(user.uid);
          if (adminById) isAdm = true;
        }

        // 2. Check in admins table by email
        if (!isAdm && user.email) {
          const adminByEmail = await getAdminByEmail(user.email);
          if (adminByEmail) isAdm = true;
        }

        // 3. Check localStorage admin session
        if (!isAdm && typeof window !== 'undefined') {
          const stored = localStorage.getItem('polaris_admin_session');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed?.email === user.email || parsed?.id === user.uid) {
                isAdm = true;
              }
            } catch (e) {}
          }
        }

        // 4. Fallback: check customers table if role is admin
        if (!isAdm && user.uid) {
          const c = await getCustomer(user.uid);
          if (c?.role === 'admin') isAdm = true;
        }

        setIsSupabaseAdmin(isAdm);

        const [apts, refs, docs] = await Promise.all([
          getAppointments(),
          getReferrals(),
          getTaxDocuments(),
        ]);
        setSbCounts({
          apts: apts.filter(a => a.status?.toLowerCase() === 'pending').length,
          refs: refs.filter(r => r.status?.toLowerCase() === 'pending').length,
          docs: docs.filter(d => d.status?.toLowerCase() === 'pending').length,
        });
      } catch (err) {
        console.error("Error in Supabase admin verification/counts:", err);
        setIsSupabaseAdmin(false);
      }
    }
    if (user) {
      checkAdminAndCounts();
    }
  }, [user]);

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

  const [pendingDocumentsCount, setPendingDocumentsCount] = useState(0);
  const [documentsCountLoading, setDocumentsCountLoading] = useState(false);

  useEffect(() => {
    const fetchPendingDocuments = async () => {
      if (!firestore) return;
      setDocumentsCountLoading(true);
      try {
        const customersSnapshot = await getDocs(query(collection(firestore, 'customers'), where('role', '!=', 'admin')));
        let count = 0;
        for (const customerDoc of customersSnapshot.docs) {
          const docsQuery = query(collection(firestore, 'customers', customerDoc.id, 'taxDocuments'), where('status', '==', 'Pending'));
          const docsSnapshot = await getDocs(docsQuery);
          count += docsSnapshot.size;
        }
        setPendingDocumentsCount(count);
      } catch (error) {
        console.error("Error fetching pending documents count:", error);
      } finally {
        setDocumentsCountLoading(false);
      }
    };

    fetchPendingDocuments();
  }, [firestore]);

  const isAdmin = userData?.role === 'admin' || isSupabaseAdmin === true;
  const isCheckingAdmin = isUserLoading || (isUserDataLoading && isSupabaseAdmin === null);

  useEffect(() => {
    if (isCheckingAdmin) return;

    if (!user) {
      router.push('/admin/login');
      return;
    }

    if (user && isSupabaseAdmin !== null && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isCheckingAdmin, user, isAdmin, isSupabaseAdmin, router]);

  if (isCheckingAdmin || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <AdminSidebar 
        pendingAppointmentsCount={(pendingAppointments?.length || 0) + sbCounts.apts}
        pendingReferralsCount={(pendingReferrals?.length || 0) + sbCounts.refs}
        pendingDocumentsCount={pendingDocumentsCount + sbCounts.docs}
      />
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
