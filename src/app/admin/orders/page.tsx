"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { PageHeading } from "@/components/portal/PageHeading";
import {
  getPlanPurchases,
  getAllCustomers,
  markPlanPurchasePaid,
  cancelPlanPurchase,
  CustomerRecord,
  PlanPurchaseRecord,
  PlanPurchaseStatus,
} from "@/lib/supabase/services";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  paid: "default",
  pending: "secondary",
  cancelled: "outline",
};

const money = (n: number) => `$${n.toFixed(2)}`;

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<PlanPurchaseRecord[]>([]);
  const [customers, setCustomers] = useState<Map<string, CustomerRecord>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<PlanPurchaseStatus | "all">("pending");

  const [payTarget, setPayTarget] = useState<PlanPurchaseRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const [rows, allCustomers] = await Promise.all([
        getPlanPurchases(undefined, { forceRefresh }),
        getAllCustomers({ forceRefresh }),
      ]);
      setPurchases(rows);
      setCustomers(new Map(allCustomers.map((c) => [c.id, c])));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't load orders", description: err?.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(
    () => (filter === "all" ? purchases : purchases.filter((p) => p.status === filter)),
    [purchases, filter]
  );

  const totals = useMemo(() => {
    const paid = purchases.filter((p) => p.status === "paid");
    return {
      pending: purchases.filter((p) => p.status === "pending").length,
      revenue: paid.reduce((s, p) => s + p.amount_due, 0),
      creditUsed: paid.reduce((s, p) => s + p.wallet_applied, 0),
    };
  }, [purchases]);

  const customerLabel = (id: string) => {
    const c = customers.get(id);
    if (!c) return { name: "Unknown client", email: "" };
    return { name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email, email: c.email };
  };

  const handleMarkPaid = async () => {
    if (!payTarget) return;
    setBusyId(payTarget.id);
    try {
      await markPlanPurchasePaid(payTarget.id, paymentMethod, paymentReference);
      const referred = customers.get(payTarget.customer_id);
      toast({
        title: "Payment confirmed",
        description: referred?.referred_by
          ? "Order marked paid. The referrer's locked bonus has been released."
          : "Order marked paid.",
      });
      setPayTarget(null);
      await load(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't mark as paid", description: err?.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (p: PlanPurchaseRecord) => {
    setBusyId(p.id);
    try {
      await cancelPlanPurchase(p.id);
      toast({
        title: "Order cancelled",
        description: p.wallet_applied > 0 ? `${money(p.wallet_applied)} credit refunded to the client.` : undefined,
      });
      await load(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't cancel", description: err?.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Plan orders"
        description="Confirm payments for plan orders. Confirming a referred client's payment unlocks their referrer's bonus."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Awaiting payment</p>
            <p className="text-2xl font-bold mt-1">{totals.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collected (paid orders)</p>
            <p className="text-2xl font-bold mt-1">{money(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Wallet credit redeemed</p>
            <p className="text-2xl font-bold mt-1 text-brass-dark">{money(totals.creditUsed)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Amount due is what the client still owes after wallet credit.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["pending", "paid", "cancelled", "all"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                className="capitalize h-8 text-xs"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Amount due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && purchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No {filter === "all" ? "" : filter} orders.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((p) => {
                const c = customerLabel(p.customer_id);
                const isReferred = !!customers.get(p.customer_id)?.referred_by;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-1.5">
                        {c.name}
                        {isReferred && <Badge variant="outline" className="text-[10px]">Referred</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </TableCell>
                    <TableCell>{p.plan_name}</TableCell>
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
                      {p.status === "paid" && p.payment_method && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">{p.payment_method}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {p.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="h-8"
                            disabled={busyId === p.id}
                            onClick={() => {
                              setPaymentMethod("");
                              setPaymentReference("");
                              setPayTarget(p);
                            }}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark paid
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-destructive"
                            disabled={busyId === p.id}
                            onClick={() => handleCancel(p)}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!payTarget} onOpenChange={(open) => !open && !busyId && setPayTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm payment</DialogTitle>
            <DialogDescription>
              {payTarget && (
                <>
                  {customerLabel(payTarget.customer_id).name} · {payTarget.plan_name} · amount due{" "}
                  <strong>{money(payTarget.amount_due)}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pay-method">Payment method</Label>
              <Input
                id="pay-method"
                placeholder="e.g. Zelle, card, cash, check"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-ref">Reference / note (optional)</Label>
              <Input
                id="pay-ref"
                placeholder="Transaction ID, check number..."
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)} disabled={!!busyId}>
              Back
            </Button>
            <Button onClick={handleMarkPaid} disabled={!!busyId}>
              {busyId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
