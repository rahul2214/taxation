"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  Loader2,
  Gift,
  Coins,
  DollarSign,
  Save,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, setDoc } from "firebase/firestore";
import {
  getReferrals,
  updateReferralStatus,
  getReferralRewardAmount,
  updateSiteSettings,
  getSiteSettings,
} from "@/lib/supabase/services";

type ReferralStatus = "Completed" | "Pending" | "Expired";

type Referral = {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  referredEmail: string;
  referralCode?: string;
  rewardAmount?: number;
  referralDate: { seconds: number; nanoseconds: number } | Date;
  status: ReferralStatus;
  referrerId?: string;
};

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
  Completed: "default",
  Pending: "secondary",
  Expired: "destructive",
};

export default function ReferralsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const referralsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, "referrals") : null),
    [firestore]
  );
  const { data: fsReferrals, isLoading: isFsLoading } =
    useCollection<Omit<Referral, "id">>(referralsCollection);

  const [supabaseReferrals, setSupabaseReferrals] = useState<Referral[]>([]);
  const [isSbLoading, setIsSbLoading] = useState(true);

  // Dynamic Reward Configuration State
  const [rewardAmount, setRewardAmount] = useState<number>(25.0);
  const [rewardInput, setRewardInput] = useState<string>("25.00");
  const [isSavingReward, setIsSavingReward] = useState(false);
  const [isRewardLoading, setIsRewardLoading] = useState(true);

  // Load active reward configuration
  const loadRewardSettings = async () => {
    setIsRewardLoading(true);
    try {
      const amt = await getReferralRewardAmount();
      setRewardAmount(amt);
      setRewardInput(amt.toFixed(2));
    } catch (err) {
      console.warn("Failed to load reward settings:", err);
    } finally {
      setIsRewardLoading(false);
    }
  };

  const fetchSupabaseReferrals = async () => {
    try {
      const records = await getReferrals();
      const mapped: Referral[] = records.map((rec) => {
        let normalizedStatus: ReferralStatus = "Pending";
        const s = (rec.status || "").toLowerCase();
        if (s === "completed" || s === "rewarded") normalizedStatus = "Completed";
        else if (s === "expired") normalizedStatus = "Expired";

        return {
          id: rec.id || "",
          referrerName: rec.referrer_name || "Unknown",
          referrerEmail: rec.referrer_email || "",
          referredName: rec.referred_name || "Friend",
          referredEmail: rec.referred_email,
          referralCode: rec.referral_code,
          rewardAmount: rec.reward_amount || rewardAmount,
          referralDate: new Date(rec.referral_date || Date.now()),
          status: normalizedStatus,
          referrerId: rec.referrer_id || undefined,
        };
      });
      setSupabaseReferrals(mapped);
    } catch (err) {
      console.error("Failed to load referrals from Supabase:", err);
    } finally {
      setIsSbLoading(false);
    }
  };

  useEffect(() => {
    loadRewardSettings();
    fetchSupabaseReferrals();
  }, []);

  const combinedMap = new Map<string, Referral>();
  if (fsReferrals) {
    fsReferrals.forEach((ref) => combinedMap.set(ref.id, ref));
  }
  supabaseReferrals.forEach((ref) => combinedMap.set(ref.id, ref));
  const referrals = Array.from(combinedMap.values()).sort((a, b) => {
    const timeA =
      a.referralDate instanceof Date
        ? a.referralDate.getTime()
        : (a.referralDate?.seconds ?? 0) * 1000;
    const timeB =
      b.referralDate instanceof Date
        ? b.referralDate.getTime()
        : (b.referralDate?.seconds ?? 0) * 1000;
    return timeB - timeA;
  });

  const isLoading = isFsLoading && firestore && isSbLoading;

  const handleSaveReward = async () => {
    const parsed = parseFloat(rewardInput);
    if (isNaN(parsed) || parsed < 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid positive dollar amount.",
      });
      return;
    }

    setIsSavingReward(true);
    try {
      // 1. Update in Supabase site_settings
      await updateSiteSettings({ referral_reward_amount: parsed });

      // 2. Update in Firestore if configured
      if (firestore) {
        try {
          const docRef = doc(firestore, "siteSettings", "referralSettings");
          await setDoc(docRef, { referralRewardAmount: parsed }, { merge: true });
        } catch (fsErr) {
          console.warn("Firestore referralSettings sync notice:", fsErr);
        }
      }

      setRewardAmount(parsed);
      setRewardInput(parsed.toFixed(2));
      toast({
        title: "Reward Settings Saved",
        description: `Referral reward is now dynamically set to $${parsed.toFixed(2)} for both referrer and new customer.`,
      });
      fetchSupabaseReferrals();
    } catch (err: any) {
      console.error("Failed to save referral reward amount:", err);
      toast({
        variant: "destructive",
        title: "Save Notice",
        description:
          err.message ||
          "Could not update site settings. If the column 'referral_reward_amount' is missing in Supabase, run the migration script.",
      });
    } finally {
      setIsSavingReward(false);
    }
  };

  const handleStatusChange = async (referral: Referral, newStatus: ReferralStatus) => {
    let updated = false;

    // 1. Try Supabase
    try {
      await updateReferralStatus(referral.id, newStatus.toLowerCase());
      updated = true;
      fetchSupabaseReferrals();
    } catch (sbErr) {
      // might be firestore record
    }

    // 2. Try Firestore
    if (firestore) {
      try {
        const referralDocRef = doc(firestore, "referrals", referral.id);
        await updateDoc(referralDocRef, { status: newStatus });
        updated = true;
      } catch (fsErr) {
        // might be supabase record
      }
    }

    if (updated) {
      toast({
        title: "Status Updated",
        description: `Referral from ${referral.referrerName} has been marked as ${newStatus}.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the referral status.",
      });
    }
  };

  const formatDate = (date: { seconds: number; nanoseconds: number } | Date) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    if (date && date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    return "N/A";
  };

  // Metrics
  const completedCount = referrals.filter((r) => r.status === "Completed").length;
  const totalRewarded = completedCount * rewardAmount;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Gift className="h-8 w-8 text-primary" /> Referrals Management
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Control referral reward payouts dynamically and track client invitations.
        </p>
      </div>

      {/* Dynamic Reward Money Management Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-500" />
                Referral Reward Configuration
              </CardTitle>
              <CardDescription className="mt-1">
                Set the bonus amount credited to Polaris Wallets for every referral.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-muted-foreground font-medium">Active Reward:</span>
              <Badge className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-600 text-white px-3 py-1">
                ${rewardAmount.toFixed(2)} USD
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="rewardAmountInput" className="text-sm font-medium">
                Reward Amount per Successful Referral ($ USD)
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="rewardAmountInput"
                  type="number"
                  step="1.00"
                  min="0"
                  className="pl-9 font-semibold text-lg max-w-xs"
                  value={rewardInput}
                  onChange={(e) => setRewardInput(e.target.value)}
                  placeholder="25.00"
                  disabled={isSavingReward || isRewardLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Both the referrer and the new client will receive this exact credit upon registration.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Quick Presets
              </Label>
              <div className="flex flex-wrap gap-2">
                {[10, 15, 25, 50, 75, 100].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={rewardInput === preset.toFixed(2) ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    onClick={() => setRewardInput(preset.toFixed(2))}
                    disabled={isSavingReward}
                  >
                    ${preset}.00
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 border border-border p-3.5 flex items-start gap-3 text-xs text-muted-foreground">
            
            <div>
              <strong className="text-foreground font-semibold">Instant Platform-wide Sync:</strong>{" "}
              Updating this value updates the welcome credits, customer invite links, WhatsApp sharing text, and referral coupon banners across the entire website and client dashboard.
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/20 px-6 py-3 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Changes take effect immediately on new registrations.
          </span>
          <Button
            onClick={handleSaveReward}
            disabled={isSavingReward || isRewardLoading}
            className="flex items-center gap-2"
          >
            {isSavingReward ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Reward Setting
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Active Reward
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  ${rewardAmount.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Per verified signup</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                <Coins className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Completed Referrals
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">{completedCount}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Total rewarded accounts</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
                <UsersRound className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Rewards Paid
                </p>
                <p className="text-2xl font-bold text-primary mt-1">${totalRewarded.toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Deposited to wallets</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Activity Log</CardTitle>
          <CardDescription>
            All client invitations and coupon redemption records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Referred Client</TableHead>
                <TableHead>Coupon Code</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground mt-2">Loading referrals...</p>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                referrals &&
                referrals.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{ref.referrerName}</div>
                      <div className="text-xs text-muted-foreground">{ref.referrerEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{ref.referredName}</div>
                      <div className="text-xs text-muted-foreground">{ref.referredEmail}</div>
                    </TableCell>
                    <TableCell>
                      {ref.referralCode ? (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted border">
                          {ref.referralCode}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ${Number(ref.rewardAmount || rewardAmount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(ref.referralDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[ref.status] || "default"}>{ref.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(ref, "Completed")}
                            disabled={ref.status === "Completed"}
                          >
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(ref, "Pending")}
                            disabled={ref.status === "Pending"}
                          >
                            Mark as Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(ref, "Expired")}
                            disabled={ref.status === "Expired"}
                            className="text-destructive"
                          >
                            Mark as Expired
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && (!referrals || referrals.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No referrals found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
