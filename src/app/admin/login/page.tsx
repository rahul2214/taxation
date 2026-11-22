"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { adminLogin, getAdminSession } from "@/lib/admin/api";
import { getCachedAuth } from "@/lib/cache/auth-cache";

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
          // Admin status is decided by the server (httpOnly admin session cookie).
          if (await getAdminSession()) {
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
      // The server checks the password (admins table, or the Supabase Auth password for
      // admin accounts) and sets an httpOnly session cookie that every admin request needs.
      const admin = await adminLogin(cleanEmail, password);
      const adminSessionData = {
        id: admin.id,
        email: admin.email,
        name: admin.name || "Administrator",
        role: admin.role || "admin",
        role_id: admin.role_id,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("polaris_admin_session", JSON.stringify(adminSessionData));
        window.dispatchEvent(new Event("polaris_admin_auth_changed"));
      }
      toast({
        title: "Admin Verified",
        description: `Welcome to the Admin Console, ${admin.name || "Administrator"}!`,
      });
      router.push("/admin");
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
