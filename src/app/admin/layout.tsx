"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PortalShell } from "@/components/portal/PortalShell";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { doc, collection, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  getCustomer,
  getAppointments,
  getReferrals,
  getTaxDocuments,
  getAdminById,
  getAdminByEmail,
} from "@/lib/supabase/services";
import { getCachedAuth } from "@/lib/cache/auth-cache";

const ADMIN_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/appointments": "Appointments",
  "/admin/tax-documents": "Client documents",
  "/admin/referrals": "Referrals",
  "/admin/customers": "Clients",
  "/admin/documents": "Site tax forms",
  "/admin/admins": "Admin users",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();

  const isLoginPage = pathname === "/admin/login";

  // All hooks called unconditionally in every render
  const userDocRef = useMemoFirebase(() => {
    if (isLoginPage || !user || !firestore) return null;
    return doc(firestore, `customers/${user.uid}`);
  }, [isLoginPage, user, firestore]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);
  const [isSupabaseAdmin, setIsSupabaseAdmin] = useState<boolean | null>(null);
  const [sbCounts, setSbCounts] = useState({ apts: 0, refs: 0, docs: 0 });

  useEffect(() => {
    if (isLoginPage) return;
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
        if (!isAdm && typeof window !== "undefined") {
          const stored = localStorage.getItem("polaris_admin_session");
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
          if (c?.role === "admin" || c?.role === "superadmin" || c?.role_id === 1 || c?.role_id === 3) isAdm = true;
        }

        setIsSupabaseAdmin(isAdm);

        const [apts, refs, docs] = await Promise.all([
          getAppointments(),
          getReferrals(),
          getTaxDocuments(),
        ]);
        setSbCounts({
          apts: apts.filter((a) => a.status?.toLowerCase() === "pending").length,
          refs: refs.filter((r) => r.status?.toLowerCase() === "pending").length,
          docs: docs.filter((d) => d.status?.toLowerCase() === "pending").length,
        });
      } catch (err) {
        console.error("Error in Supabase admin verification/counts:", err);
        setIsSupabaseAdmin(false);
      }
    }
    if (user) {
      checkAdminAndCounts();
    }
  }, [isLoginPage, user]);

  const pendingAppointmentsQuery = useMemoFirebase(() => {
    if (isLoginPage || !firestore) return null;
    return query(collection(firestore, "appointments"), where("status", "==", "Pending"));
  }, [isLoginPage, firestore]);

  const pendingReferralsQuery = useMemoFirebase(() => {
    if (isLoginPage || !firestore) return null;
    return query(collection(firestore, "referrals"), where("status", "==", "Pending"));
  }, [isLoginPage, firestore]);

  const { data: pendingAppointments, isLoading: appointmentsLoading } = useCollection(pendingAppointmentsQuery);
  const { data: pendingReferrals, isLoading: referralsLoading } = useCollection(pendingReferralsQuery);

  const [pendingDocumentsCount, setPendingDocumentsCount] = useState(0);
  const [documentsCountLoading, setDocumentsCountLoading] = useState(false);

  useEffect(() => {
    if (isLoginPage) return;
    const fetchPendingDocuments = async () => {
      if (!firestore) return;
      setDocumentsCountLoading(true);
      try {
        const customersSnapshot = await getDocs(
          query(collection(firestore, "customers"), where("role", "!=", "admin"))
        );
        let count = 0;
        for (const customerDoc of customersSnapshot.docs) {
          const docsQuery = query(
            collection(firestore, "customers", customerDoc.id, "taxDocuments"),
            where("status", "==", "Pending")
          );
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
  }, [isLoginPage, firestore]);

  const isAdmin = userData?.role === "admin" || isSupabaseAdmin === true;
  const isCheckingAdmin = isUserLoading || (isUserDataLoading && isSupabaseAdmin === null);

  useEffect(() => {
    if (isLoginPage) return;

    const cached = getCachedAuth();
    if (cached.user && !cached.isAdmin && isSupabaseAdmin === false) {
      router.replace("/dashboard");
      return;
    }

    if (isCheckingAdmin) return;

    if (!user && !cached.user) {
      router.replace("/admin/login");
      return;
    }

    if (user && isSupabaseAdmin !== null && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isLoginPage, isCheckingAdmin, user, isAdmin, isSupabaseAdmin, router]);

  // If navigating to admin login page, render children without sidebar shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading indicator while verifying admin permissions
  if (isCheckingAdmin || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      <PortalShell area="Admin" areaHref="/admin" titles={ADMIN_TITLES}>
        {children}
      </PortalShell>
    </SidebarProvider>
  );
}
