"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { getCustomer, getAdminById, getAdminByEmail, verifyAdminCredentials } from "@/lib/supabase/services";
import { supabase } from "@/lib/supabase/client";
import { getCachedAuth, setCachedAuth } from "@/lib/cache/auth-cache";

export default function AdminLoginPage() {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // If already logged in, check if user is admin and redirect to /admin or /dashboard
  useEffect(() => {
    const cached = getCachedAuth();
    if (cached.isAdmin) {
      setIsRedirecting(true);
      router.replace("/admin");
      return;
    }
    if (cached.user && !cached.isAdmin) {
      setIsRedirecting(true);
      router.replace("/dashboard");
      return;
    }

    const verifyExistingAdmin = async () => {
      if (!isUserLoading && user && !isRedirecting) {
        setIsRedirecting(true);
        try {
          // 1. Check admins table
          let isAdm = false;
          if (user.uid) {
            const adminById = await getAdminById(user.uid);
            if (adminById) isAdm = true;
          }
          if (!isAdm && user.email) {
            const adminByEmail = await getAdminByEmail(user.email);
            if (adminByEmail) isAdm = true;
          }
          if (!isAdm && typeof window !== 'undefined') {
            const stored = localStorage.getItem('polaris_admin_session');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed?.email === user.email || parsed?.id === user.uid) isAdm = true;
            }
          }
          // Fallback customers check
          if (!isAdm && user.uid) {
            const sbCustomer = await getCustomer(user.uid);
            if (sbCustomer?.role === "admin" || sbCustomer?.role === "superadmin" || sbCustomer?.role_id === 1 || sbCustomer?.role_id === 3) isAdm = true;
          }

          if (isAdm) {
            router.replace("/admin");
            return;
          }

          // If logged in as customer, redirect to customer dashboard
          router.replace("/dashboard");
        } catch (err) {
          console.error("Error verifying admin role:", err);
          router.replace("/dashboard");
        }
      }
    };
    verifyExistingAdmin();
  }, [user, isUserLoading, router, isRedirecting]);

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Check direct credentials in the admins table first
      const { admin, error: credError } = await verifyAdminCredentials(cleanEmail, password);

      if (admin && !credError) {
        // Admin found and password matched in the admins table
        const adminSessionData = {
          id: admin.id || `admin-${cleanEmail}`,
          email: admin.email,
          name: admin.name || "Administrator",
          role: admin.role || "admin",
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("polaris_admin_session", JSON.stringify(adminSessionData));
          window.dispatchEvent(new Event("polaris_admin_auth_changed"));
        }

        // Try syncing with Supabase Auth in background (optional)
        try {
          await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        } catch (_) {}

        toast({
          title: "Admin Verified",
          description: `Welcome to the Admin Console, ${admin.name || "Administrator"}!`,
        });
        router.push("/admin");
        return;
      }

      if (credError === "Incorrect admin password.") {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Incorrect administrator password.",
        });
        return;
      }

      // 2. Check via Supabase Auth
      const { data: authData, error: sbAuthError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!sbAuthError && authData.user) {
        // Check if this authenticated user exists in the admins table
        const adminRec =
          (await getAdminByEmail(authData.user.email || cleanEmail)) ||
          (await getAdminById(authData.user.id));
        const custRec = !adminRec ? await getCustomer(authData.user.id) : null;

        if (adminRec || custRec?.role === "admin" || custRec?.role === "superadmin" || custRec?.role_id === 1 || custRec?.role_id === 3) {
          const adminSessionData = {
            id: authData.user.id,
            email: authData.user.email || cleanEmail,
            name: adminRec?.name || authData.user.user_metadata?.first_name || "Admin",
            role: adminRec?.role || custRec?.role || (custRec?.role_id === 3 ? "superadmin" : "admin"),
            role_id: adminRec?.role_id || custRec?.role_id || (adminRec?.role === 'superadmin' ? 3 : 1),
          };

          if (typeof window !== "undefined") {
            localStorage.setItem("polaris_admin_session", JSON.stringify(adminSessionData));
            window.dispatchEvent(new Event("polaris_admin_auth_changed"));
          }

          toast({
            title: "Admin Verified",
            description: "Welcome to the Polaris Tax Admin Console.",
          });
          router.push("/admin");
          return;
        } else {
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "This account is not authorized as an administrator. It does not exist in the admins table.",
          });
          return;
        }
      }

      // If credentials failed all checks
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: credError || sbAuthError?.message || "Invalid administrator credentials.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid administrator credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper font-ui">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-ink-muted" />
        <p className="text-sm text-ink-muted">You're already signed in. Opening the console…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper font-ui text-ink">
      <header className="border-b border-paper-line">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
          <Link href="/" aria-label="Polaris Tax Services home">
            <PolarisLogo theme="light" className="h-8 w-auto" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back to website
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-14">
        <div className="w-full max-w-sm">
          <p className="eyebrow">Admin console</p>
          <h1 className="mt-4 font-display text-[38px] leading-tight text-ink">Staff sign in</h1>
          <p className="mt-2 text-[15px] text-ink-muted">For Polaris staff only. Clients should use the client portal.</p>

          <form onSubmit={handleAdminEmailLogin} className="mt-8 space-y-5 rounded-[4px] border border-paper-line bg-white p-6">
            <div>
              <label htmlFor="admin-email" className="field-label">Email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="field-label">Password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="field"
              />
            </div>
            <button type="submit" className="btn-ink w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Looking for your return?{" "}
            <Link href="/login" className="link-under">
              Client sign in
            </Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-paper-line py-5 text-center text-[12.5px] text-ink-muted">
        &copy; {new Date().getFullYear()} Polaris Tax Services Inc.
      </footer>
    </div>
  );
}
