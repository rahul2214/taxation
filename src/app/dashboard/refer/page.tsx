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
  Wallet,
  ArrowUpRight,
  Ticket,
  Coins,
  MessageCircle,
} from "lucide-react";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  getReferrals,
  ReferralRecord,
  getCustomer,
  ensureCustomerReferralCode,
  getWalletBalance,
  getReferralRewardAmount,
} from "@/lib/supabase/services";

export default function CustomerReferPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0.0);
  const [couponCode, setCouponCode] = useState<string>("");
  const [customerUserid, setCustomerUserid] = useState<number | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number>(25.0);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Base URL
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Dedicated invite link strictly using unique coupon / referral code
  const referralLink = couponCode
    ? `${origin || "https://www.plrstax.com"}/signup?ref=${encodeURIComponent(couponCode)}`
    : "";

  const loadDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Get or generate user's coupon code
      const customer = await getCustomer(user.uid);
      if (customer?.userid) {
        setCustomerUserid(customer.userid);
      }

      const code = customer?.referral_code || await ensureCustomerReferralCode(
        user.uid,
        user.displayName || (user as any)?.user_metadata?.first_name,
        user.email || undefined
      );
      setCouponCode(code);

      // 2. Load wallet balance
      const balance = await getWalletBalance(user.uid);
      setWalletBalance(balance);

      // 3. Load referral records
      const refData = await getReferrals(user.uid);
      setReferrals(refData);

      // 4. Load dynamic referral reward amount
      const currentReward = await getReferralRewardAmount();
      setRewardAmount(currentReward);
    } catch (err) {
      console.error("Error loading referral & wallet data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast({
      title: "Invite Link Copied!",
      description: "Your personal referral invite link has been copied to your clipboard.",
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!couponCode) return;
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(true);
    toast({
      title: "Coupon Code Copied!",
      description: `Coupon code "${couponCode}" copied to clipboard.`,
    });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! File your US taxes with Polaris Tax Services. Use my exclusive coupon code ${couponCode} to get a $${rewardAmount.toFixed(2)} credit on your return: ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareEmail = () => {
    const subject = `Exclusive $${rewardAmount.toFixed(2)} Tax Filing Credit at Polaris Tax Services`;
    const body = `Hi,\n\nI recommend using Polaris Tax Services for your tax preparation and filing.\n\nUse my exclusive coupon code ${couponCode} when signing up to receive a $${rewardAmount.toFixed(2)} credit toward your tax preparation:\n${referralLink}\n\nBest regards!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Stats calculation
  const completedReferralsCount = referrals.filter(
    (r) => r.status?.toLowerCase() === "rewarded" || r.status?.toLowerCase() === "completed"
  ).length;
  const totalEarned = completedReferralsCount * rewardAmount;

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      {/* Page Header */}
      <div>
       
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Gift className="h-8 w-8 text-primary" /> Refer a Friend & Earn
        </h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
          Give <strong>${rewardAmount.toFixed(2)}</strong>, Get <strong>${rewardAmount.toFixed(2)}</strong>! Share your unique referral coupon code or invite link. When friends sign up and file their tax return, both of you get ${rewardAmount.toFixed(2)} credited directly to your Polaris Wallet.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Wallet Balance */}
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                Wallet Balance
              </span>
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                ${walletBalance.toFixed(2)}
              </span>
              
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Applicable toward tax prep & consulting fees
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Friends Rewarded */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Successful Referrals
              </span>
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {completedReferralsCount}
              </span>
              <span className="text-xs text-muted-foreground">clients referred</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {completedReferralsCount} joined with your coupon code
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Total Earned */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Referral Rewards
              </span>
              <div className="p-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Coins className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                ${totalEarned.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">earned to date</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              ${rewardAmount.toFixed(2)} bonus per completed filing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Share Section: Coupon Code & Invite Link Side by Side */}
      <div className="grid md:grid-cols-2 gap-6 items-stretch">
        {/* Left: Your Coupon Code Box */}
        <Card className="border-primary/30 relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Ticket className="h-4 w-4" /> Your Exclusive Coupon Code
              </span>
              <Badge className="bg-primary text-primary-foreground font-semibold text-[10px]">
                ${rewardAmount.toFixed(0)} DISCOUNT
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              Share this coupon code. Friends can type it during signup to get a ${rewardAmount.toFixed(2)} credit immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl border-2 border-dashed border-primary/40 bg-muted/40 text-center relative">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest block mb-1">
                Coupon / Promo Code
              </span>
              <p className="text-2xl sm:text-3xl font-mono font-extrabold text-primary tracking-wider select-all">
                {couponCode || "GENERATING..."}
              </p>
            </div>
            <Button
              onClick={handleCopyCode}
              variant="outline"
              className="w-full font-semibold border-primary/30 hover:bg-primary/10"
              disabled={!couponCode}
            >
              {copiedCode ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-emerald-600" /> Coupon Code Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" /> Copy Coupon Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Personal Invite Link */}
        <Card className="border-primary/30 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Share2 className="h-4 w-4" /> Personal Invite Link
              </span>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                One-Click Signup
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              Anyone clicking this link will have your coupon code automatically applied when registering.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg border bg-muted/40 text-xs font-mono select-all break-all text-muted-foreground line-clamp-2">
              {referralLink || "Loading invite link..."}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={handleCopyLink}
                variant="default"
                className="w-full text-xs"
                disabled={!referralLink}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-300" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                  </>
                )}
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                variant="outline"
                className="w-full text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                disabled={!referralLink}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
              </Button>
              <Button
                onClick={handleShareEmail}
                variant="outline"
                className="w-full text-xs"
                disabled={!referralLink}
              >
                <Mail className="h-3.5 w-3.5 mr-1" /> Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Section: How It Works & Direct Invite Form */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left: How It Works */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">How Referral Rewards Work</h2>
          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-card border shadow-sm">
              <div className="flex-shrink-0 bg-primary/10 text-primary p-2.5 rounded-full mt-0.5">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">1. Share Your Code or Link</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Send your coupon code or invite link to friends, family members, or business associates who need US tax preparation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-card border shadow-sm">
              <div className="flex-shrink-0 bg-primary/10 text-primary p-2.5 rounded-full mt-0.5">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">2. Friend Registers & Files</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  When your friend signs up with your coupon code, they immediately receive a <strong>${rewardAmount.toFixed(2)} welcome credit</strong> in their Polaris Wallet.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-card border shadow-sm">
              <div className="flex-shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-full mt-0.5">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">3. Both of You Get Rewarded</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  You automatically receive <strong>${rewardAmount.toFixed(2)}</strong> added to your Polaris Wallet. Use your wallet balance to pay for tax returns, bookkeeping, or advisory services!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Referral Program Guidelines */}
        <Card className="shadow-sm border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
            Referral Program Guidelines
            </CardTitle>
            <CardDescription className="text-xs">
              Simple, transparent rewards with no complicated forms or caps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-background/80 p-3.5 space-y-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 text-primary" /> Unique Coupon Code
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your coupon code <strong className="font-mono text-primary font-bold">{couponCode}</strong> is unique to your client profile. Share it anywhere — text messages, group chats, or social networks.
              </p>
            </div>

            <div className="rounded-lg border bg-background/80 p-3.5 space-y-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-600" /> Instant Wallet Credit
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When a new customer signs up using your coupon code, ${rewardAmount.toFixed(2)} is automatically credited to their wallet balance, and ${rewardAmount.toFixed(2)} is deposited into your wallet immediately.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleCopyCode} variant="default" className="w-1/2 text-xs">
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Code
              </Button>
              <Button onClick={handleCopyLink} variant="outline" className="w-1/2 text-xs">
                <Share2 className="h-3.5 w-3.5 mr-1.5" /> Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Activity: Referred Clients */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Rewards Activity</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Review all friends and clients who registered using your referral coupon code.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {referrals.length} {referrals.length === 1 ? "Client" : "Clients"} Referred
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Gift className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-foreground">No referrals yet</p>
              <p className="text-xs mt-1">
                Share your coupon code <strong className="font-mono text-primary">{couponCode}</strong> to start earning!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Coupon Code</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Bonus Status</TableHead>
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
                    <TableCell className="text-xs font-mono">
                      {r.referral_code || couponCode || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.referral_date ? new Date(r.referral_date).toLocaleDateString() : "Recent"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          r.status?.toLowerCase() === "rewarded" || r.status?.toLowerCase() === "completed"
                            ? "default"
                            : r.status?.toLowerCase() === "accepted"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {r.status?.toLowerCase() === "rewarded"
                          ? `Rewarded (+$${(r.reward_amount || rewardAmount).toFixed(0)})`
                          : (r.status || "Pending")}
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
