
"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Separator } from "@/components/ui/separator";

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 76.2C313.6 113.4 283.5 96 248 96c-88.8 0-160.1 71.9-160.1 160.1s71.3 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
    </svg>
);


export default function LoginPage() {
  const { auth, firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupReferralEmail, setSignupReferralEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);


  const checkRoleAndRedirect = async (user: any) => {
    if (!firestore) return;
    setIsRedirecting(true);
    const userDocRef = doc(firestore, "customers", user.uid);
    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data()?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error fetching user role, redirecting to default dashboard:", error);
      router.push('/dashboard');
    }
  };

  useEffect(() => {
    if (!isUserLoading && user && !showWelcomeDialog) {
        if(!isRedirecting) {
            checkRoleAndRedirect(user);
        }
    }
  }, [user, isUserLoading, router, firestore, showWelcomeDialog, isRedirecting]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoggingIn(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting you to your dashboard...",
      });
      // The useEffect will handle the redirection
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Could not log you in. Please check your credentials.",
      });
      setIsLoggingIn(false);
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please make sure your passwords match.",
      });
      return;
    }
    if (!auth || !firestore) return;
    setIsSigningUp(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const newUser = userCredential.user;
      
      await setDoc(doc(firestore, "customers", newUser.uid), {
        firstName: signupFirstName,
        lastName: signupLastName,
        email: newUser.email,
        phone: signupPhone,
        signupDate: serverTimestamp(),
        role: "user", // Assign 'user' role by default
      });
      
      if (signupReferralEmail) {
        // You can add referral logic here if needed in the future
      }
      
      setShowWelcomeDialog(true);
      // Let the welcome dialog handle redirection
    } catch (error: any) {
      console.error("Signup Error:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "There was a problem with your request.",
      });
    } finally {
      setIsSigningUp(false);
    }
  }

   const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setIsGoogleLoading(true);

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);

      if (additionalUserInfo?.isNewUser) {
        const nameParts = user.displayName?.split(" ") || [];
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        await setDoc(doc(firestore, "customers", user.uid), {
          firstName,
          lastName,
          email: user.email,
          phone: user.phoneNumber,
          signupDate: serverTimestamp(),
          role: "user",
        });
        
        setShowWelcomeDialog(true);
      } else {
        toast({
            title: "Login Successful",
            description: "Welcome back! Redirecting you to your dashboard...",
        });
      }
      // The useEffect will handle redirection for existing users if toast is shown.
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({
        variant: "destructive",
        title: "Sign-In Failed",
        description: error.message || "Could not sign you in with Google.",
      });
    } finally {
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
        <Tabs defaultValue="login" className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <ShieldCheck className="h-12 w-12 text-accent" />
          </div>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="m@example.com" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoggingIn || isGoogleLoading}>
                    {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoggingIn ? 'Logging in...' : 'Login'}
                  </Button>
                   <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                   <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoggingIn || isGoogleLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                     Sign in with Google
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Create an Account</CardTitle>
                <CardDescription>Get started with Polaris Tax Services in just a few steps.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-first-name">First Name</Label>
                      <Input id="signup-first-name" type="text" placeholder="John" required value={signupFirstName} onChange={(e) => setSignupFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-last-name">Last Name</Label>
                      <Input id="signup-last-name" type="text" placeholder="Doe" required value={signupLastName} onChange={(e) => setSignupLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input id="signup-phone" type="tel" placeholder="(123) 456-7890" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="m@example.com" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-referral-email">Referral Email (Optional)</Label>
                    <Input id="signup-referral-email" type="email" placeholder="friend@example.com" value={signupReferralEmail} onChange={(e) => setSignupReferralEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input id="signup-confirm-password" type="password" required value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)}/>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSigningUp || isGoogleLoading}>
                    {isSigningUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSigningUp ? 'Signing Up...' : 'Sign Up'}
                  </Button>
                   <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSigningUp || isGoogleLoading}>
                     {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                     Sign up with Google
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

       <Dialog open={showWelcomeDialog} onOpenChange={(open) => { if(!open) setShowWelcomeDialog(false)}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Welcome to Polaris Tax Services!</DialogTitle>
                <DialogDescription>
                    Your account has been successfully created. You can now access your dashboard.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button onClick={() => {
                    setShowWelcomeDialog(false);
                    if(user) checkRoleAndRedirect(user);
                }}>
                    Go to Dashboard
                </Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    </PublicLayout>
  );
}

