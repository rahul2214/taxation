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
  getAppointments,
  getReferrals,
  getTaxDocuments,
  getPlanPurchases,
  getContacts,
  getFeedback,
} from "@/lib/supabase/services";
import { getAdminSession } from "@/lib/admin/api";
import { clearCachedAuth, getCachedAuth } from "@/lib/cache/auth-cache";

const ADMIN_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/appointments": "Appointments",
  "/admin/contacts": "Contact messages",
  "/admin/feedback": "Feedback",
  "/admin/tax-documents": "Client documents",
  "/admin/referrals": "Referrals",
  "/admin/orders": "Plan orders",
  "/admin/plans": "Plans & pricing",
  "/admin/master-data": "Master data",
  "/admin/customers": "Clients",
  "/admin/documents": "Site tax forms",
  "/admin/basic-info": "Basic information",
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
  const [sbCounts, setSbCounts] = useState({ apts: 0, refs: 0, docs: 0, orders: 0, contacts: 0, feedback: 0 });

  useEffect(() => {
    if (isLoginPage) return;
    async function checkAdminAndCounts() {
      if (!user) return;
      try {
        // Admin status comes from the server-checked admin session cookie (set at /admin/login).
        const isAdm = Boolean(await getAdminSession());
        setIsSupabaseAdmin(isAdm);
        if (!isAdm) {
          if (getCachedAuth().isAdmin) {
            // Cookie expired or missing: drop the stale local admin session and sign in again.
            clearCachedAuth();
            router.replace("/admin/login");
          }
          return;
        }

        const [apts, refs, docs, orders, contacts, feedback] = await Promise.all([
          getAppointments(),
          getReferrals(),
          getTaxDocuments(),
          getPlanPurchases().catch(() => []),
          getContacts().catch(() => []),
          getFeedback().catch(() => []),
        ]);
        setSbCounts({
          apts: apts.filter((a) => a.status?.toLowerCase() === "pending").length,
          refs: refs.filter((r) => r.status?.toLowerCase() === "pending").length,
          docs: docs.filter((d) => d.status?.toLowerCase() === "pending").length,
          orders: orders.filter((o) => o.status === "pending").length,
          contacts: contacts.filter((c) => (c.status || "new") === "new").length,
          feedback: feedback.filter((f) => (f.status || "new") === "new").length,
        });
      } catch (err) {
        console.error("Error in Supabase admin verification/counts:", err);
        setIsSupabaseAdmin(false);
      }
    }
    if (user) {
      checkAdminAndCounts();
    }
  }, [isLoginPage, user, router]);

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
        pendingOrdersCount={sbCounts.orders}
        newContactsCount={sbCounts.contacts}
        newFeedbackCount={sbCounts.feedback}
      />
      <PortalShell area="Admin" areaHref="/admin" titles={ADMIN_TITLES}>
        {children}
      </PortalShell>
    </SidebarProvider>
  );
}
