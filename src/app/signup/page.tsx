"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Gift, CheckCircle2, ArrowRight } from "lucide-react";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import {
  upsertCustomer,
  getCustomer,
  generateReferralCode,
  getCustomerByReferralCode,
  processReferralReward,
  getReferralRewardAmount,
  CustomerRecord,
} from "@/lib/supabase/services";
import { getCachedAuth, getUserRedirectPath, setCachedAuth } from "@/lib/cache/auth-cache";

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

  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [createdCouponCode, setCreatedCouponCode] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<number>(25.0);

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
    if (showWelcomeDialog) return;

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

    setIsSigningUp(true);
    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanReferral = signupReferralCode.trim();

    // 1. Generate unique branded coupon code
    const userReferralCode = generateReferralCode(signupFirstName, cleanEmail);
    setCreatedCouponCode(userReferralCode);

    try {
      // 2. Check if a valid referral / coupon code is provided
      let referrerMatch: CustomerRecord | null = null;
      let referredById: string | null = null;

      if (cleanReferral) {
        try {
          referrerMatch = await getCustomerByReferralCode(cleanReferral);
          if (referrerMatch && referrerMatch.email?.toLowerCase() !== cleanEmail) {
            // Store the referrer's int8 userid value in referred_by
            referredById = referrerMatch.userid != null ? String(referrerMatch.userid) : (referrerMatch.id || null);
          }
        } catch (findErr) {
          console.warn("Notice checking referral code:", findErr);
        }
      }

      // 3. Register user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: signupPassword,
        options: {
          data: {
            first_name: signupFirstName.trim(),
            last_name: signupLastName.trim(),
            phone: signupPhone.trim(),
            referral_code: userReferralCode,
          },
        },
      });

      if (error) throw error;

      const newUserId = data.user?.id;
      if (newUserId) {
        // 4. Save Customer profile with coupon code & starting wallet balance at 0.00
        try {
          await upsertCustomer({
            id: newUserId,
            first_name: signupFirstName.trim(),
            last_name: signupLastName.trim(),
            email: cleanEmail,
            phone: signupPhone.trim(),
            role: "customer",
            referral_code: userReferralCode,
            wallet_balance: 0.0,
            referred_by: referredById || undefined,
          });
        } catch (profileErr) {
          console.warn("Profile upsert notice:", profileErr);
        }

        // 5. If referred, reward both users with the exact same reward amount!
        if (referrerMatch && referrerMatch.email?.toLowerCase() !== cleanEmail) {
          try {
            await processReferralReward({
              referrer: referrerMatch,
              newUserId,
              newUserName: `${signupFirstName} ${signupLastName}`.trim() || cleanEmail,
              newUserEmail: cleanEmail,
              referralCodeUsed: cleanReferral.toUpperCase(),
              rewardAmount: rewardAmount,
            });
          } catch (rewardErr) {
            console.warn("Referral reward process notice:", rewardErr);
          }
        }
      }

      // 6. Build informative welcome message
      let msg = data.session
        ? "Your account has been successfully created. You can now access your client dashboard."
        : `Your account has been created! A verification email was sent to ${cleanEmail}.`;

      if (referrerMatch) {
        msg += `\n\n🎉 Welcome Bonus: $${rewardAmount.toFixed(2)} has been credited to your Polaris Wallet!`;
      }

      msg += `\n\n💳 Your Personal Referral Coupon: ${userReferralCode}\nShare this with friends to earn $${rewardAmount.toFixed(2)} every time someone files!`;

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
        userFriendlyMessage = `An account with "${cleanEmail}" already exists. Please sign in instead, or use a different email address.`;
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
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/signup`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
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
      <div className="container flex min-h-[80vh] items-center justify-center px-4 py-12 md:px-6">
        <Card className="w-full max-w-lg shadow-lg border-primary/20">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Create Client Account</CardTitle>
            <CardDescription>
              Sign up to securely upload tax documents and track your returns with Polaris.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {refParam && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
               
                <div>
                  <span className="font-semibold">Referral Bonus Applied!</span>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Code <strong className="font-mono text-foreground font-bold">{refParam}</strong> is active. You and your friend will each receive a <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">${rewardAmount.toFixed(2)} wallet credit</strong> upon registration!
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
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
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
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t bg-muted/20 px-6 py-4 text-center">
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
              <CheckCircle2 className="h-5 w-5 text-blue-600" /> Welcome to Polaris Tax Services!
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line text-sm text-foreground/90 mt-2 leading-relaxed">
              {welcomeMessage}
            </DialogDescription>
          </DialogHeader>

          {createdCouponCode && (
            <div className="p-3 bg-muted/60 rounded-lg border border-dashed border-primary/40 text-center space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Your Referral Coupon Code</span>
              <p className="text-xl font-mono font-bold text-primary tracking-wider select-all">{createdCouponCode}</p>
              <p className="text-[11px] text-muted-foreground">Share this with friends to earn ${rewardAmount.toFixed(2)} for every referral!</p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              className="w-full"
              onClick={() => {
                setShowWelcomeDialog(false);
                if (user) {
                  checkRoleAndRedirect(user);
                } else {
                  router.push("/dashboard");
                }
              }}
            >
              Go to Dashboard
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
