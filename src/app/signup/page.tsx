"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Gift, CheckCircle2, ArrowRight, MailCheck } from "lucide-react";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  getCustomer,
  generateReferralCode,
  getReferralRewardAmount,
} from "@/lib/supabase/services";
import { getCachedAuth, getUserRedirectPath, setCachedAuth } from "@/lib/cache/auth-cache";
import { startGoogleAuth } from "@/lib/supabase/google-auth";
import { emailAuthApi } from "@/lib/auth-email";
import { HEARD_ABOUT_OPTIONS, heardAboutValue as toHeardAboutValue } from "@/data/heard-about";

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 76.2C313.6 113.4 283.5 96 248 96c-88.8 0-160.1 71.9-160.1 160.1s71.3 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
  </svg>
);

function SignupContent() {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const refParam = searchParams.get("ref") || "";

  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupReferralCode, setSignupReferralCode] = useState(refParam);
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [heardAbout, setHeardAbout] = useState("");
  const [heardAboutOther, setHeardAboutOther] = useState("");

  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [createdCouponCode, setCreatedCouponCode] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<number>(25.0);
  const [needsVerification, setNeedsVerification] = useState(false);
  const signupGateRef = useRef(false);

  // Load dynamic reward amount from site settings
  useEffect(() => {
    async function loadReward() {
      try {
        const amt = await getReferralRewardAmount();
        setRewardAmount(amt);
      } catch (err) {
        console.warn("Could not load referral reward amount:", err);
      }
    }
    loadReward();
  }, []);

  // Sync referral parameter if URL changes
  useEffect(() => {
    if (refParam && !signupReferralCode) {
      setSignupReferralCode(refParam);
    }
  }, [refParam]);

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

  useEffect(() => {
    // While handleSignup runs, the new session must not auto-redirect (it may be signed out for verification).
    if (showWelcomeDialog || signupGateRef.current) return;

    const cachedTarget = getUserRedirectPath();
    if (cachedTarget && !isRedirecting) {
      setIsRedirecting(true);
      router.replace(cachedTarget);
      return;
    }

    if (!isUserLoading && user && !isRedirecting) {
      checkRoleAndRedirect(user);
    }
  }, [user, isUserLoading, router, showWelcomeDialog, isRedirecting]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Do Not Match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    if (!heardAbout || (heardAbout === "Other" && !heardAboutOther.trim())) {
      toast({
        variant: "destructive",
        title: "One More Question",
        description: "Please tell us how you heard about Polaris Tax Services.",
      });
      return;
    }

    setIsSigningUp(true);
    signupGateRef.current = true;
    setNeedsVerification(false);
    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanReferral = signupReferralCode.trim();
    const heardAboutValue = toHeardAboutValue(heardAbout, heardAboutOther);

    // 1. Generate unique branded coupon code
    const userReferralCode = generateReferralCode(signupFirstName, cleanEmail);
    setCreatedCouponCode(userReferralCode);

    try {
      // 2. The server creates the login, UNCONFIRMED in Supabase, writes the customer profile,
      //    applies the referral code (new user's credit usable now, referrer's locked until this
      //    user pays for a plan) and emails the verification link (Resend). No session is opened:
      //    Supabase refuses the password until the link is clicked.
      const created = await emailAuthApi<{ userId: string; sent: boolean; welcomeBonus?: number }>("signup", {
        email: cleanEmail,
        password: signupPassword,
        referredByCode: cleanReferral || undefined,
        metadata: {
          first_name: signupFirstName.trim(),
          last_name: signupLastName.trim(),
          phone: signupPhone.trim(),
          referral_code: userReferralCode,
          heard_about: heardAboutValue,
        },
      });

      // 3. The verification email went out with the account (step 2).
      const verificationSent = Boolean(created.sent);
      setNeedsVerification(true);

      // 7. Build the dialog message: verifying is the only thing the user needs to do now;
      //    referral details live on the dashboard's Refer page.
      const msg = verificationSent
        ? `We've sent a verification link to ${cleanEmail}.\n\nOpen the email and click the link to verify your address, then sign in. If you don't see it in a few minutes, check your spam folder.`
        : `Your account has been created, but we couldn't send the verification email to ${cleanEmail} just now.\n\nGo to Sign In, enter your email and password, and use "Resend verification email".`;

      setWelcomeMessage(msg);
      setShowWelcomeDialog(true);
    } catch (error: any) {
      console.warn("Signup Notice:", error?.message || error);
      let userFriendlyMessage = error.message || "There was a problem creating your account.";
      const errorMsgLower = (error.message || "").toLowerCase();
      const errorCode = error.code || "";
      const isAlreadyRegistered =
        errorCode === "user_already_exists" ||
        errorMsgLower.includes("already registered") ||
        errorMsgLower.includes("already exists");

      if (isAlreadyRegistered) {
        userFriendlyMessage = `An account with "${cleanEmail}" already exists. Please sign in instead (use "Continue with Google" if you signed up with Google), or use a different email address.`;
      } else if (
        errorCode === "over_email_send_rate_limit" ||
        errorMsgLower.includes("rate limit") ||
        error.status === 429
      ) {
        userFriendlyMessage =
          "Email verification rate limit reached. Tip: In your Supabase Dashboard under Authentication -> Providers -> Email, disable 'Confirm email' for instant signups without email limits.";
      } else if (
        errorMsgLower.includes("invalid") ||
        errorCode === "email_address_invalid" ||
        errorCode === "email_address_not_authorized"
      ) {
        userFriendlyMessage =
          `Supabase could not verify "${cleanEmail}". In Supabase Dashboard -> Authentication -> Providers -> Email, turn OFF "Confirm email" for instant account creation, or configure a custom SMTP provider (e.g. Resend).`;
      }

      toast({
        variant: "destructive",
        title: isAlreadyRegistered ? "Account Already Exists" : "Signup Failed",
        description: userFriendlyMessage,
      });
    } finally {
      signupGateRef.current = false;
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // Carry the referral code and "heard about" answer through the Google redirect;
      // ensureCustomerProfile applies them when the account is created.
      await startGoogleAuth({
        returnPath: "/signup",
        referralCode: signupReferralCode,
        heardAbout:
          heardAbout && (heardAbout !== "Other" || heardAboutOther.trim())
            ? toHeardAboutValue(heardAbout, heardAboutOther)
            : undefined,
      });
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

  if (isUserLoading || (user && !showWelcomeDialog) || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PublicLayout>
      <div className="site-container flex min-h-[75vh] items-center justify-center py-14 md:py-20">
        <Card className="w-full max-w-lg rounded-[4px] border-paper-line bg-white shadow-none">
          <CardHeader className="space-y-1 text-center">
            <h1 className="font-display text-[34px] font-normal leading-none text-ink">Create your account</h1>
            <CardDescription>
              Sign up to securely upload tax documents and track your returns with Polaris.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {refParam && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs">
               
                <div>
                  <span className="font-semibold">Referral Bonus Applied!</span>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Code <strong className="font-mono text-foreground font-bold">{refParam}</strong> is active. You'll receive a <strong className="text-emerald-700 font-semibold">${rewardAmount.toFixed(2)} wallet credit</strong> as soon as you register.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    placeholder="John"
                    required
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                  <Input
                    id="last-name"
                    placeholder="Doe"
                    value={signupLastName}
                    onChange={(e) => setSignupLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email Address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(123) 456-7890"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heard-about">How did you hear about us?</Label>
                <Select value={heardAbout} onValueChange={setHeardAbout}>
                  <SelectTrigger id="heard-about" aria-required="true">
                    <SelectValue placeholder="Select one" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEARD_ABOUT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {heardAbout === "Other" && (
                  <Input
                    id="heard-about-other"
                    aria-label="Where did you hear about us?"
                    placeholder="Please tell us where"
                    required
                    maxLength={120}
                    value={heardAboutOther}
                    onChange={(e) => setHeardAboutOther(e.target.value)}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signup-referral-code">Referral or Coupon Code (Optional)</Label>
                  <span className="text-[11px] font-medium text-emerald-700">
                    🎁 Get ${rewardAmount.toFixed(2)} Credit
                  </span>
                </div>
                <Input
                  id="signup-referral-code"
                  placeholder="e.g. POLARIS-7B4K or friend's email"
                  value={signupReferralCode}
                  onChange={(e) => setSignupReferralCode(e.target.value.toUpperCase())}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSigningUp || isGoogleLoading}>
                {isSigningUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSigningUp ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isSigningUp || isGoogleLoading}
              >
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Sign up with Google
              </Button>

              <p className="text-[11px] text-center text-muted-foreground mt-3 leading-relaxed">
                By registering, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
              </p>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-paper-line bg-paper/60 px-6 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5">
                Log In <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Welcome Dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={(open) => { if (!open) setShowWelcomeDialog(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {needsVerification ? (
                <><MailCheck className="h-5 w-5 text-blue-600" /> Verify your email</>
              ) : (
                <><CheckCircle2 className="h-5 w-5 text-blue-600" /> Welcome to Polaris Tax Services!</>
              )}
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line text-sm text-foreground/90 mt-2 leading-relaxed">
              {welcomeMessage}
            </DialogDescription>
          </DialogHeader>

          {/* The referral coupon is shown on the dashboard's Refer page, not right after signup. */}

          <DialogFooter className="pt-2">
            <Button
              className="w-full"
              onClick={() => {
                setShowWelcomeDialog(false);
                if (needsVerification) {
                  router.push("/login");
                } else if (user) {
                  checkRoleAndRedirect(user);
                } else {
                  router.push("/dashboard");
                }
              }}
            >
              {needsVerification ? "Go to Sign In" : "Go to Dashboard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
