"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gift,
  Mail,
  Users,
  Copy,
  Check,
  Loader2,
  Share2,
  Sparkles,
} from "lucide-react";
import { useFirebase } from "@/firebase";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  createReferral,
  getReferrals,
  ReferralRecord,
} from "@/lib/supabase/services";

export default function CustomerReferPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states
  const [friendName, setFriendName] = useState("");
  const [friendEmail, setFriendEmail] = useState("");

  const referrerName =
    user?.displayName ||
    (user as any)?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Polaris Client";
  const referrerEmail = user?.email || "";

  // Personal referral link
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const referralLink = referrerEmail
    ? `${origin || "https://www.plrstax.com"}/login?ref=${encodeURIComponent(referrerEmail)}`
    : "";

  const loadUserReferrals = async () => {
    if (!user) return;
    setIsLoadingReferrals(true);
    try {
      const data = await getReferrals(user.uid);
      setReferrals(data);
    } catch (err) {
      console.error("Error loading referrals:", err);
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserReferrals();
    }
  }, [user]);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Your personal referral link is copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName || !friendEmail) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both your friend's name and email address.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create referral in Supabase
      await createReferral({
        referrer_id: user?.uid || null,
        referrer_name: referrerName,
        referrer_email: referrerEmail,
        referred_name: friendName.trim(),
        referred_email: friendEmail.trim().toLowerCase(),
        status: "Pending",
        referral_date: new Date().toISOString(),
      });

      // 2. Also persist to Firestore if available
      if (firestore && user) {
        try {
          const referralsCol = collection(firestore, "referrals");
          await addDoc(referralsCol, {
            referrerId: user.uid,
            referrerName,
            referrerEmail,
            referredName: friendName.trim(),
            referredEmail: friendEmail.trim().toLowerCase(),
            status: "Pending",
            referralDate: serverTimestamp(),
          });
        } catch (fsErr) {
          console.warn("Firestore sync warning:", fsErr);
        }
      }

      toast({
        title: "Referral Sent!",
        description: `We have recorded your referral for ${friendName}. Thank you!`,
      });

      setFriendName("");
      setFriendEmail("");
      await loadUserReferrals();
    } catch (err: any) {
      console.error("Error submitting referral:", err);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: err.message || "Could not record referral. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Gift className="h-8 w-8 text-primary" /> Refer a Friend & Earn
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Share Polaris Tax Services with your friends, family, or colleagues. When they file, you both receive a discount!
        </p>
      </div>

      {/* Share Link Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/40 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Your Personal Referral Link
              </span>
              <p className="text-sm text-muted-foreground">
                Anyone who signs up using your link or enters your email will be credited to you.
              </p>
              <p className="text-xs font-mono bg-white dark:bg-slate-950 px-3 py-1.5 rounded border border-input select-all break-all text-foreground mt-2">
                {referralLink || "Loading referral link..."}
              </p>
            </div>
            <Button
              onClick={handleCopyLink}
              variant="default"
              className="flex-shrink-0 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy Link
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Section: How It Works & Form */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left: How It Works */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-4 rounded-lg bg-card border">
              <div className="flex-shrink-0 bg-primary/10 text-primary p-2.5 rounded-full mt-0.5">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">1. Send an Invite</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Share your link or enter your friend's details in the form to register your referral.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-lg bg-card border">
              <div className="flex-shrink-0 bg-primary/10 text-primary p-2.5 rounded-full mt-0.5">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">2. Friend Signs Up</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your friend creates an account with Polaris Tax Services and files their return.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-lg bg-card border">
              <div className="flex-shrink-0 bg-primary/10 text-primary p-2.5 rounded-full mt-0.5">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">3. Receive Special Rewards</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Both you and your referred friend receive an exclusive discount applied to your tax service!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Referral Form */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Invite a Friend</CardTitle>
            <CardDescription className="text-xs">
              Directly submit a friend's details to register your referral.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="friend-name" className="text-xs">Friend's Full Name *</Label>
                <Input
                  id="friend-name"
                  placeholder="e.g. Jane Smith"
                  required
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="friend-email" className="text-xs">Friend's Email Address *</Label>
                <Input
                  id="friend-email"
                  type="email"
                  placeholder="jane.smith@example.com"
                  required
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Invite...
                    </>
                  ) : (
                    "Send Referral Invite"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Referrals</CardTitle>
          <CardDescription className="text-xs">
            Track the status of friends you have invited to Polaris Tax Services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReferrals ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              You haven't referred any friends yet. Use the form above to invite someone!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Friend's Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date Sent</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r, i) => (
                  <TableRow key={r.id || i}>
                    <TableCell className="font-medium text-sm">
                      {r.referred_name || "Friend"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {r.referred_email}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.referral_date ? new Date(r.referral_date).toLocaleDateString() : "Recent"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          r.status?.toLowerCase() === "rewarded"
                            ? "default"
                            : r.status?.toLowerCase() === "accepted"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {r.status || "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
