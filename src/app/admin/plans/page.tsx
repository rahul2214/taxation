"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PageHeading } from "@/components/portal/PageHeading";
import { getPlans, savePlan, deletePlan, PlanRecord, PlanBillingPeriod } from "@/lib/supabase/services";

type PlanForm = {
  id?: string;
  name: string;
  description: string;
  price: string;
  billing_period: PlanBillingPeriod;
  featuresText: string;
  is_active: boolean;
  is_popular: boolean;
  sort_order: string;
};

const EMPTY_FORM: PlanForm = {
  name: "",
  description: "",
  price: "",
  billing_period: "one_time",
  featuresText: "",
  is_active: true,
  is_popular: false,
  sort_order: "0",
};

const PERIOD_LABEL: Record<PlanBillingPeriod, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  yearly: "Yearly",
};

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<PlanForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlanRecord | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      setPlans(await getPlans({ includeInactive: true }, { forceRefresh }));
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Couldn't load plans",
        description: err?.message || "Run supabase/plans_and_referral_rewards_migration.sql if the plans table is missing.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (plan?: PlanRecord) => {
    if (!plan) {
      setForm({ ...EMPTY_FORM, sort_order: String(plans.length + 1) });
      return;
    }
    setForm({
      id: plan.id,
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toFixed(2),
      billing_period: plan.billing_period,
      featuresText: plan.features.join("\n"),
      is_active: plan.is_active,
      is_popular: plan.is_popular,
      sort_order: String(plan.sort_order),
    });
  };

  const handleSave = async () => {
    if (!form) return;
    const price = parseFloat(form.price);
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "Name is required" });
      return;
    }
    if (isNaN(price) || price < 0) {
      toast({ variant: "destructive", title: "Enter a valid price" });
      return;
    }
    setIsSaving(true);
    try {
      await savePlan({
        id: form.id,
        name: form.name,
        description: form.description,
        price,
        billing_period: form.billing_period,
        features: form.featuresText.split("\n"),
        is_active: form.is_active,
        is_popular: form.is_popular,
        sort_order: parseInt(form.sort_order, 10) || 0,
      });
      toast({ title: form.id ? "Plan updated" : "Plan created", description: form.name });
      setForm(null);
      await load(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't save plan", description: err?.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (plan: PlanRecord) => {
    setTogglingId(plan.id || null);
    try {
      await savePlan({ ...plan, is_active: !plan.is_active });
      await load(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't update plan", description: err?.message });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deletePlan(deleteTarget.id);
      toast({ title: "Plan deleted", description: deleteTarget.name });
      setDeleteTarget(null);
      await load(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't delete plan", description: err?.message });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Plans & pricing"
        description="Create and edit the plans clients can purchase. Inactive plans are hidden from clients."
        actions={
          <Button onClick={() => openEdit()}>
            <Plus className="mr-2 h-4 w-4" /> New plan
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All plans</CardTitle>
          <CardDescription>
            Price changes apply to new orders only. Existing orders keep the price they were placed at.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Active</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No plans yet. Create your first plan.
                  </TableCell>
                </TableRow>
              )}
              {plans.map((plan) => (
                <TableRow key={plan.id} className={plan.is_active ? "" : "opacity-60"}>
                  <TableCell className="font-mono text-xs">{plan.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {plan.name}
                      {plan.is_popular && <Badge variant="secondary">Popular</Badge>}
                    </div>
                    {plan.description && (
                      <div className="max-w-xs truncate text-xs text-muted-foreground">{plan.description}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">${plan.price.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{PERIOD_LABEL[plan.billing_period] || plan.billing_period}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{plan.features.length} items</TableCell>
                  <TableCell>
                    <Switch
                      checked={plan.is_active}
                      disabled={togglingId === plan.id}
                      onCheckedChange={() => handleToggleActive(plan)}
                      aria-label={`Toggle ${plan.name} active`}
                    />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(plan)} aria-label={`Edit ${plan.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDeleteTarget(plan)}
                      aria-label={`Delete ${plan.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!form} onOpenChange={(open) => !open && !isSaving && setForm(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit plan" : "New plan"}</DialogTitle>
            <DialogDescription>Clients see the name, price, description and features.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan-name">Name *</Label>
                <Input id="plan-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-desc">Description</Label>
                <Input
                  id="plan-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="plan-price">Price (USD) *</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-period">Billing</Label>
                  <select
                    id="plan-period"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.billing_period}
                    onChange={(e) => setForm({ ...form, billing_period: e.target.value as PlanBillingPeriod })}
                  >
                    <option value="one_time">One-time</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-sort">Display order</Label>
                  <Input
                    id="plan-sort"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-features">Features (one per line)</Label>
                <Textarea
                  id="plan-features"
                  rows={6}
                  value={form.featuresText}
                  onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  Active (visible to clients)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.is_popular} onCheckedChange={(v) => setForm({ ...form, is_popular: v })} />
                  Highlight as popular
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The plan is removed permanently. Existing orders keep their plan name and price. To hide it temporarily,
              switch it to inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
