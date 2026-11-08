"use client";

import React, { useEffect, useState } from "react";
import { Check, Loader2, Lock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { PageHeading } from "@/components/portal/PageHeading";
import { PayPalCheckout, isPayPalEnabled } from "@/components/payments/PayPalCheckout";
import {
  getPlans,
  getCustomer,
  getPlanPurchases,
  createPlanPurchase,
  cancelPlanPurchase,
  PlanRecord,
  PlanPurchaseRecord,
} from "@/lib/supabase/services";

const PERIOD_LABEL: Record<string, string> = {
  one_time: "one-time",
  monthly: "/ month",
  yearly: "/ year",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  pending: "secondary",
  cancelled: "outline",
};

const money = (n: number) => `$${n.toFixed(2)}`;

export default function CustomerPlansPage() {
  const { user } = useFirebase();
  const { toast } = useToast();

  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [purchases, setPurchases] = useState<PlanPurchaseRecord[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null);
  const [useWallet, setUseWallet] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<PlanPurchaseRecord | null>(null);

  const load = async (forceRefresh = false) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [planRows, customer, purchaseRows] = await Promise.all([
        getPlans({}, { forceRefresh }),
        getCustomer(user.uid, { forceRefresh }),
        getPlanPurchases(user.uid, { forceRefresh }),
      ]);
      setPlans(planRows);
      setPurchases(purchaseRows);
      setWalletBalance(Number(customer?.wallet_balance || 0));
      setLockedBalance(Number(customer?.locked_wallet_balance || 0));
    } catch (err) {
      console.error("Failed to load plans:", err);
      toast({ variant: "destructive", title: "Couldn't load plans", description: "Please refresh and try again." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const walletToApply = selectedPlan && useWallet ? Math.min(walletBalance, selectedPlan.price) : 0;
  const amountDue = selectedPlan ? selectedPlan.price - walletToApply : 0;

  const handleConfirmPurchase = async () => {
    if (!user || !selectedPlan?.id) return;
    setIsSubmitting(true);
    try {
      const purchase = await createPlanPurchase(user.uid, selectedPlan.id, useWallet);
      setSelectedPlan(null);
      if (purchase?.status === "pending" && isPayPalEnabled) {
        // Go straight to PayPal for the remaining amount
        setPayTarget(purchase);
      } else {
        toast({
          title: purchase?.status === "paid" ? "Plan activated" : "Order placed",
          description:
            purchase?.status === "paid"
              ? `${selectedPlan.name} is fully covered by your wallet credit.`
              : `Our team will contact you to collect ${money(purchase?.amount_due ?? amountDue)} for ${selectedPlan.name}.`,
        });
      }
      await load(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't place order", description: err?.message || "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (purchase: PlanPurchaseRecord) => {
    setCancellingId(purchase.id);
    try {
      await cancelPlanPurchase(purchase.id);
      toast({
        title: "Order cancelled",
        description: purchase.wallet_applied > 0 ? `${money(purchase.wallet_applied)} was returned to your wallet.` : undefined,
      });
      await load(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't cancel order", description: err?.message || "Please try again." });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      <PageHeading
        title="Plans & pricing"
        description="Choose a filing plan. Your available wallet credit can be applied at checkout."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-brass/30 bg-brass/[0.06]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brass-dark uppercase tracking-wider">Available credit</span>
              <Wallet className="h-4 w-4 text-brass-dark" />
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-brass-dark">{money(walletBalance)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Can be applied to any plan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Locked referral credit</span>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{money(lockedBalance)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Unlocks when friends you referred purchase a plan</p>
          </CardContent>
        </Card>
      </div>

      {isLoading && plans.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No plans are available right now. Please check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {plans.map((plan) => (
            <Card key={plan.id} className={`flex flex-col ${plan.is_popular ? "border-primary shadow-md" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.is_popular && <Badge>Most popular</Badge>}
                </div>
                {plan.description && <CardDescription>{plan.description}</CardDescription>}
                <p className="pt-2">
                  <span className="text-3xl font-bold text-foreground">{money(plan.price)}</span>{" "}
                  <span className="text-xs text-muted-foreground">{PERIOD_LABEL[plan.billing_period] || ""}</span>
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.is_popular ? "default" : "outline"}
                  onClick={() => {
                    setUseWallet(walletBalance > 0);
                    setSelectedPlan(plan);
                  }}
                >
                  Choose {plan.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your orders</CardTitle>
          <CardDescription className="text-xs">Pending orders are confirmed once our team receives your payment.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {purchases.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">You haven't ordered a plan yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Credit used</TableHead>
                  <TableHead className="text-right">Amount due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.plan_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">{money(p.plan_price)}</TableCell>
                    <TableCell className="text-right text-brass-dark">
                      {p.wallet_applied > 0 ? `-${money(p.wallet_applied)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{money(p.amount_due)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status] || "outline"} className="capitalize">{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === "pending" && (
                        <div className="flex justify-end gap-1 whitespace-nowrap">
                          {isPayPalEnabled && p.amount_due > 0 && (
                            <Button size="sm" onClick={() => setPayTarget(p)}>
                              Pay now
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={cancellingId === p.id}
                            onClick={() => handleCancel(p)}
                          >
                            {cancellingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancel"}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && !isSubmitting && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              {isPayPalEnabled
                ? "Review your order. You'll pay any remaining balance securely with PayPal next."
                : "Review your order. We'll reach out to collect any remaining balance."}
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label htmlFor="use-wallet" className="font-medium">Apply wallet credit</Label>
                  <p className="text-xs text-muted-foreground">Available: {money(walletBalance)}</p>
                </div>
                <Switch
                  id="use-wallet"
                  checked={useWallet}
                  onCheckedChange={setUseWallet}
                  disabled={walletBalance <= 0}
                />
              </div>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Plan price</dt>
                  <dd>{money(selectedPlan.price)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Wallet credit</dt>
                  <dd className="text-brass-dark">-{money(walletToApply)}</dd>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <dt>Amount due</dt>
                  <dd>{money(amountDue)} USD</dd>
                </div>
              </dl>
              <p className="text-[11px] text-muted-foreground">
                By placing this order you agree to our{" "}
                <a href="/terms" target="_blank" className="underline">Terms</a> and{" "}
                <a href="/refund-policy" target="_blank" className="underline">Refund &amp; Cancellation Policy</a>.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlan(null)} disabled={isSubmitting}>
              Back
            </Button>
            <Button onClick={handleConfirmPurchase} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {amountDue === 0 ? "Activate with credit" : isPayPalEnabled ? "Continue to payment" : "Place order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payTarget} onOpenChange={(open) => !open && setPayTarget(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pay for {payTarget?.plan_name}</DialogTitle>
            <DialogDescription>
              Amount due: <strong className="text-foreground">{money(payTarget?.amount_due ?? 0)}</strong>
              {payTarget && payTarget.wallet_applied > 0 && <> (after {money(payTarget.wallet_applied)} wallet credit)</>}.
              Pay with your PayPal account or a debit/credit card.
            </DialogDescription>
          </DialogHeader>
          {payTarget && (
            <PayPalCheckout
              purchaseId={payTarget.id}
              onPaid={async () => {
                toast({ title: "Payment received", description: `${payTarget.plan_name} is now active. Thank you!` });
                setPayTarget(null);
                await load(true);
              }}
              onError={(message) => toast({ variant: "destructive", title: "Payment not completed", description: message })}
            />
          )}
          <p className="text-[11px] text-muted-foreground">
            Closing this window keeps your order pending. You can pay later from "Your orders".
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
