"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, KeyRound, Lock, Mail, ArrowRight } from "lucide-react";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { getCustomer } from "@/lib/supabase/services";
import { getCachedAuth, getUserRedirectPath, setCachedAuth } from "@/lib/cache/auth-cache";
import { startGoogleAuth } from "@/lib/supabase/google-auth";
import { emailAuthApi } from "@/lib/auth-email";

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 76.2C313.6 113.4 283.5 96 248 96c-88.8 0-160.1 71.9-160.1 160.1s71.3 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
  </svg>
);

function LoginContent() {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Email verification (sent by Firebase)
  const searchParams = useSearchParams();
  const loginGateRef = useRef(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  const resendVerification = async () => {
    setIsResending(true);
    try {
      const r = await emailAuthApi<{ alreadyVerified?: boolean }>("send-verification", { email: unverifiedEmail });
      toast(
        r.alreadyVerified
          ? { title: "Already verified", description: "Your email is verified. Please sign in again." }
          : { title: "Verification email sent", description: `We sent a new link to ${unverifiedEmail}.` }
      );
      if (r.alreadyVerified) setUnverifiedEmail("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not send email", description: err.message });
    } finally {
      setIsResending(false);
    }
  };

  const checkRoleAndRedirect = async (userData?: any) => {
    setIsRedirecting(true);
    try {
      const cached = getCachedAuth();
      if (cached.isAdmin) {
        router.replace("/admin");
        return;
      }
      if (cached.user && !cached.isAdmin) {
        router.replace("/dashboard");
        return;
      }

      const uid = userData?.uid || userData?.id || user?.uid;
      if (uid) {
        const supabaseUser = await getCustomer(uid);
        if (
          supabaseUser?.role === "admin" ||
          supabaseUser?.role === "superadmin" ||
          supabaseUser?.role_id === 1 ||
          supabaseUser?.role_id === 3
        ) {
          if (supabaseUser) setCachedAuth(supabaseUser as any, "admin");
          router.replace("/admin");
          return;
        }
        if (supabaseUser) setCachedAuth(supabaseUser as any, "customer");
      }
      router.replace("/dashboard");
    } catch (error) {
      console.error("Error checking user role:", error);
      router.replace("/dashboard");
    }
  };

  // Firebase's own pages send people back here after verifying / resetting.
  useEffect(() => {
    if (searchParams.get("verified")) {
      toast({ title: "Email verified", description: "Thanks! You can sign in now." });
    } else if (searchParams.get("reset")) {
      toast({ title: "Password changed", description: "Sign in with your new password." });
    }
  }, [searchParams]);

  useEffect(() => {
    // While handleLogin is checking email verification, don't auto-redirect the new session.
    if (loginGateRef.current) return;
    const cachedTarget = getUserRedirectPath();
    if (cachedTarget && !isRedirecting) {
      setIsRedirecting(true);
      router.replace(cachedTarget);
      return;
    }

    if (!isUserLoading && user && !isRedirecting) {
      checkRoleAndRedirect(user);
    }
  }, [user, isUserLoading, router, isRedirecting]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setUnverifiedEmail("");
    loginGateRef.current = true;
    const cleanEmail = loginEmail.trim().toLowerCase();

    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: loginPassword,
      });

      if (error?.message?.toLowerCase().includes("invalid login credentials")) {
        // The password may have been reset on Firebase's page; copy it to Supabase and retry.
        try {
          const r = await emailAuthApi<{ synced: boolean }>("login-check", { email: cleanEmail, password: loginPassword });
          if (r.synced) {
            ({ data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: loginPassword }));
          }
        } catch {
          // Email service not configured: fall through to the normal error.
        }
      }

      if (error) {
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          setUnverifiedEmail(cleanEmail);
          throw new Error("Please verify your email address first. Check your inbox for the link we sent you.");
        }
        if (error.message?.toLowerCase().includes("invalid login credentials")) {
          throw new Error('Incorrect email or password. If you created your account with Google, use "Continue with Google" below.');
        }
        throw error;
      }

      // Email/password accounts must verify their address (Firebase sends the link).
      if (data?.user && data.user.app_metadata?.provider === "email") {
        const customer = await getCustomer(data.user.id, { forceRefresh: true });
        if (customer && (customer as any).email_verified === false) {
          let verified = false;
          try {
            verified = (await emailAuthApi<{ verified: boolean }>("login-check", { email: cleanEmail })).verified;
          } catch {
            // Email service unavailable: don't lock customers out because of it.
            verified = true;
          }
          if (!verified) {
            await supabase.auth.signOut();
            setUnverifiedEmail(cleanEmail);
            throw new Error("Please verify your email address first. Check your inbox for the link we sent you.");
          }
        }
      }

      loginGateRef.current = false;
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting you to your dashboard...",
      });

      if (data?.user) {
        await checkRoleAndRedirect({ uid: data.user.id, email: data.user.email });
      }
    } catch (error: any) {
      loginGateRef.current = false;
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Could not log you in. Please check your credentials.",
      });
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // New Google users get their customers row created on return (see ensureCustomerProfile).
      await startGoogleAuth({ returnPath: "/login" });
    } catch (error: any) {
      console.warn("Google Sign-In notice:", error?.message || error);
      toast({
        variant: "destructive",
        title: "Sign-In Failed",
        description: error.message || "Could not sign you in with Google.",
      });
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your account email address." });
      return;
    }
    setIsResetting(true);
    try {
      // Firebase sends the reset email; the link opens /auth/action, which updates the Supabase password.
      await emailAuthApi("forgot-password", { email: resetEmail.trim().toLowerCase() });

      toast({
        title: "Reset Email Sent",
        description: `If an account exists for ${resetEmail}, a password reset link has been sent.`,
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: err.message || "Could not send password reset email.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isUserLoading || user || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PublicLayout>
      <div className="site-container flex min-h-[75vh] items-center justify-center py-14 md:py-20">
        <Card className="w-full max-w-md rounded-[4px] border-paper-line bg-white shadow-none">
          <CardHeader className="space-y-1 text-center">
            <h1 className="font-display text-[34px] font-normal leading-none text-ink">Sign in</h1>
            <CardDescription>
              Your documents, returns and messages, in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {unverifiedEmail && (
                <div role="status" className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900">
                  <p className="flex items-center gap-2 font-semibold">
                    <Mail className="h-4 w-4" /> Verify your email to continue
                  </p>
                  <p className="text-xs">
                    We sent a verification link to <strong>{unverifiedEmail}</strong>. Click it, then sign in again. Check your spam folder if you can&apos;t find it.
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={resendVerification} disabled={isResending}>
                    {isResending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Resend verification email
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="login-email">Email Address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(loginEmail);
                      setShowForgotPassword(true);
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoggingIn || isGoogleLoading}>
                {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoggingIn ? "Signing In..." : "Sign In"}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn || isGoogleLoading}
              >
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-paper-line bg-paper/60 px-6 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account yet?{" "}
              <Link href="/signup" className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5">
                Create Account <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Reset Your Password
            </DialogTitle>
            <DialogDescription>
              Enter the email address associated with your account and we will send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                required
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)} disabled={isResetting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isResetting}>
                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
