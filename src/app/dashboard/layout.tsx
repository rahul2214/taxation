
"use client";

import { CustomerSidebar } from "@/components/dashboard/CustomerSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PortalShell } from "@/components/portal/PortalShell";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { doc } from "firebase/firestore";
import { getCustomer } from "@/lib/supabase/services";
import { getCachedAuth } from "@/lib/cache/auth-cache";
import { HeardAboutPrompt } from "@/components/dashboard/HeardAboutPrompt";
import { ensureCustomerProfile, takeOAuthWelcome } from "@/lib/supabase/google-auth";
import { useToast } from "@/hooks/use-toast";

const DASHBOARD_TITLES: Record<string, string> = {
  "/dashboard/upload": "Upload documents",
  "/dashboard/documents": "My documents",
  "/dashboard/final-documents": "Final documents",
  "/dashboard/tax-info": "Tax forms",
  "/dashboard/book-appointment": "Book a call",
  "/dashboard/plans": "Plans & pricing",
  "/dashboard/refer": "Refer a friend",
  "/dashboard/account": "Profile",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [supabaseUserData, setSupabaseUserData] = useState<any>(null);
  // The cached session lives in localStorage, which the server can't see. Read it only after mount
  // so the first client render matches the server HTML.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `customers/${user.uid}`);
  }, [user, firestore]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    async function loadCustomer() {
      if (!user) return;
      try {
        // A first-time Google user may not have a customers row yet; ensureCustomerProfile creates it.
        const c = (await ensureCustomerProfile()) || (await getCustomer(user.uid));
        if (c) setSupabaseUserData(c);
        const welcome = takeOAuthWelcome();
        if (welcome) {
          toast({
            title: "Welcome to Polaris Tax Services!",
            description:
              (welcome.bonus ? `$${welcome.bonus.toFixed(2)} has been credited to your wallet. ` : "") +
              (welcome.referralCode ? `Your referral code is ${welcome.referralCode}.` : "Your account is ready."),
          });
        }
      } catch (e) {
        console.error("Error loading customer in dashboard layout:", e);
      }
    }
    loadCustomer();
  }, [user]);

  useEffect(() => {
    // If auth state is resolved and there is no user, redirect to login.
    const cached = getCachedAuth();
    if (!isUserLoading && !user && !cached.user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const cached = mounted ? getCachedAuth() : { user: null };
  const activeUser = user || cached.user;

  // Determine the combined loading state
  const isLoading = (isUserLoading && !activeUser) || (firestore ? isUserDataLoading : false);

  // If we are loading or there's no user yet, show a full-screen loader.
  if (!mounted || isLoading || !activeUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <CustomerSidebar userData={{ ...(userData || {}), ...(supabaseUserData || {}) }} />
      <PortalShell area="Client portal" areaHref="/dashboard/account" titles={DASHBOARD_TITLES}>
        {children}
      </PortalShell>
      <HeardAboutPrompt customer={supabaseUserData} />
    </SidebarProvider>
  );
}
