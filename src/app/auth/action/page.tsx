"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailAuthApi } from "@/lib/auth-email";

/**
 * Landing page for the links in Firebase's emails.
 * Set it as the custom action URL in Firebase Console:
 *   Authentication -> Templates -> (pencil) -> Customize action URL -> https://<site>/auth/action
 */
function ActionContent() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode") || "";

  const [status, setStatus] = useState<"working" | "form" | "done" | "error">("working");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!oobCode || (mode !== "verifyEmail" && mode !== "resetPassword")) {
      setStatus("error");
      setMessage("This link is incomplete. Please use the link from your most recent email.");
      return;
    }

    if (mode === "verifyEmail") {
      emailAuthApi("verify-email", { oobCode })
        .then(() => {
          setStatus("done");
          setMessage("Your email address is verified. You can sign in now.");
        })
        .catch((err) => {
          setStatus("error");
          setMessage(err.message);
        });
    } else {
      emailAuthApi<{ email: string }>("check-reset", { oobCode })
        .then((r) => {
          setEmail(r.email);
          setStatus("form");
        })
        .catch((err) => {
          setStatus("error");
          setMessage(err.message);
        });
    }
  }, [mode, oobCode]);

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await emailAuthApi("reset-password", { oobCode, password });
      setStatus("done");
      setMessage("Your password has been changed. Sign in with your new password.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const title = status === "error"
    ? "Link problem"
    : mode === "resetPassword"
      ? status === "done" ? "Password updated" : "Choose a new password"
      : status === "done" ? "Email verified" : "Verifying your email";

  return (
    <PublicLayout>
      <div className="site-container flex min-h-[75vh] items-center justify-center py-14 md:py-20">
        <Card className="w-full max-w-md rounded-[4px] border-paper-line bg-white shadow-none">
          <CardHeader className="space-y-1 text-center">
            <h1 className="font-display text-[34px] font-normal leading-none text-ink">{title}</h1>
            {status === "form" && email && <CardDescription>For {email}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "working" && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {status === "form" && (
              <form onSubmit={submitReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input id="new-password" type="password" required minLength={8} autoComplete="new-password"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm new password</Label>
                  <Input id="confirm-new-password" type="password" required minLength={8} autoComplete="new-password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
                {message && <p className="text-sm text-destructive">{message}</p>}
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save new password
                </Button>
              </form>
            )}

            {(status === "done" || status === "error") && (
              <div className="space-y-4 text-center">
                {status === "done" ? (
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                ) : (
                  <XCircle className="mx-auto h-10 w-10 text-destructive" />
                )}
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button asChild className="w-full">
                  <Link href="/login">Go to sign in</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <ActionContent />
    </Suspense>
  );
}
