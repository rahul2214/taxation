"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PolarisLogo } from "@/components/common/PolarisLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { getCustomer } from "@/lib/supabase/services";
import { supabase } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const { auth, firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, check if user is admin and redirect to /admin
  useEffect(() => {
    const verifyExistingAdmin = async () => {
      if (!isUserLoading && user) {
        try {
          // Check Supabase first
          const sbCustomer = await getCustomer(user.uid);
          if (sbCustomer?.role === "admin") {
            router.push("/admin");
            return;
          }

          // Check Firestore
          if (firestore) {
            const userDocRef = doc(firestore, "customers", user.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists() && userSnap.data()?.role === "admin") {
              router.push("/admin");
              return;
            }
          }
        } catch (err) {
          console.error("Error verifying admin role:", err);
        }
      }
    };
    verifyExistingAdmin();
  }, [user, isUserLoading, firestore, router]);

  const verifyAdminAndProceed = async (uid: string) => {
    try {
      // Check Supabase first
      const sbCustomer = await getCustomer(uid);
      if (sbCustomer?.role === "admin") {
        toast({
          title: "Admin Verified",
          description: "Welcome to the Polaris Tax Admin Console.",
        });
        router.push("/admin");
        return;
      }

      // Check Firestore
      if (firestore) {
        const userDocRef = doc(firestore, "customers", uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists() && userSnap.data()?.role === "admin") {
          toast({
            title: "Admin Verified",
            description: "Welcome to the Polaris Tax Admin Console.",
          });
          router.push("/admin");
          return;
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
    }

    // If neither DB has role admin
    await supabase.auth.signOut();
    if (auth) {
      await signOut(auth);
    }
    toast({
      variant: "destructive",
      title: "Access Denied",
      description: "This account does not have administrator privileges.",
    });
  };

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Fallback to Firebase auth if available
        if (auth) {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await verifyAdminAndProceed(userCredential.user.uid);
            return;
          } catch (fbErr) {
            throw error;
          }
        }
        throw error;
      }

      await verifyAdminAndProceed(data.user.id);
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

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-slate-100">
      {/* Top Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold text-white hover:opacity-90 transition-opacity">
          <PolarisLogo size={32} className="h-8 w-8" />
          <span className="font-headline tracking-tight">Polaris Tax Services</span>
        </Link>
        <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
          <Link href="/" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Website
          </Link>
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl text-slate-100">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="flex justify-center">
              <div className="relative">
                <PolarisLogo size={56} className="h-14 w-14" />
                <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 text-slate-950 shadow-md">
                  <Lock className="h-3 w-3" />
                </div>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
                <ShieldAlert className="h-3.5 w-3.5" />
                Admin Portal
              </div>
              <CardTitle className="text-2xl font-bold font-headline text-white">Administrator Sign In</CardTitle>
              <CardDescription className="text-slate-400 text-sm mt-1">
                Restricted access for authorized Polaris administrators only.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAdminEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-slate-300 text-sm">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@polaris.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="admin-password" className="text-slate-300 text-sm">Password</Label>
                </div>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2.5 shadow-lg shadow-cyan-900/30 transition-all mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Credentials...
                  </>
                ) : (
                  "Sign In to Admin Console"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 border-t border-slate-800/80 pt-4 text-center text-xs text-slate-400">
            <p>
              Are you a client?{" "}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4">
                Go to Client Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-800/50">
        &copy; {new Date().getFullYear()} Polaris Tax Services. Secure Administrative System.
      </footer>
    </div>
  );
}
