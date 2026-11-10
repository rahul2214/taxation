"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  MASTER_CATEGORIES,
  MasterCategory,
  MasterDataRecord,
  getAllMasterData,
  createMasterData,
  updateMasterData,
  deleteMasterData,
} from "@/lib/supabase/master-data";

type FormState = { id?: number; label: string; sort_order: string; is_active: boolean };

const emptyForm: FormState = { label: "", sort_order: "", is_active: true };

export default function AdminMasterDataPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<MasterDataRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [category, setCategory] = useState<MasterCategory>("appointment_service");

  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MasterDataRecord | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      setRows(await getAllMasterData({ forceRefresh }));
      setLoadError(null);
    } catch (err: any) {
      const missing = err?.code === "PGRST205" || err?.code === "42P01";
      setLoadError(
        missing
          ? "The master_data table doesn't exist yet. Run supabase/master_data_migration.sql in the Supabase SQL Editor."
          : err?.message || "Couldn't load master data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const meta = MASTER_CATEGORIES.find((c) => c.key === category)!;
  const visible = useMemo(() => rows.filter((r) => r.category === category), [rows, category]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.category] = (c[r.category] || 0) + 1;
    return c;
  }, [rows]);

  const openCreate = () => {
    const nextOrder = visible.reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0) + 10;
    setForm({ ...emptyForm, sort_order: String(nextOrder) });
  };

  const openEdit = (r: MasterDataRecord) =>
    setForm({ id: r.id, label: r.label, sort_order: String(r.sort_order ?? 0), is_active: r.is_active !== false });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const label = form.label.trim();
    if (!label) {
      toast({ variant: "destructive", title: "Label is required" });
      return;
    }
    const sort_order = Number.parseInt(form.sort_order, 10) || 0;

    setIsSaving(true);
    try {
      if (form.id != null) {
        await updateMasterData(form.id, { label, sort_order, is_active: form.is_active });
        toast({ title: "Value updated", description: label });
      } else {
        await createMasterData({ category, label, sort_order, is_active: form.is_active });
        toast({ title: "Value added", description: label });
      }
      setForm(null);
      await load(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't save", description: err?.message });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (r: MasterDataRecord, isActive: boolean) => {
    if (r.id == null) return;
    setBusyId(r.id);
    try {
      await updateMasterData(r.id, { is_active: isActive });
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: isActive } : x)));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't update", description: err?.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setBusyId(target.id!);
    try {
      await deleteMasterData(target.id!);
      setRows((prev) => prev.filter((x) => x.id !== target.id));
      toast({ title: "Value deleted", description: target.label });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't delete", description: err?.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Master data"
        description="The options shown in the booking and contact form dropdowns. Changes appear on the website right away."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={category} onValueChange={(v) => setCategory(v as MasterCategory)}>
          <TabsList className="h-auto flex-wrap">
            {MASTER_CATEGORIES.map((c) => (
              <TabsTrigger key={c.key} value={c.key}>
                {c.title} ({counts[c.key] ?? 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => load(true)} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={openCreate} disabled={!!loadError}>
            <Plus className="mr-2 h-4 w-4" /> Add value
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{meta.title}</CardTitle>
          <CardDescription>{meta.usedIn}. Inactive values are hidden from the forms but kept on old records.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="w-24">Order</TableHead>
                  <TableHead className="w-32">Active</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  visible.map((r) => (
                    <TableRow key={r.id} className={r.is_active === false ? "text-muted-foreground" : ""}>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell>{r.sort_order ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={r.is_active !== false}
                            disabled={busyId === r.id}
                            onCheckedChange={(v) => toggleActive(r, v)}
                            aria-label={`Toggle ${r.label}`}
                          />
                          {r.is_active === false && <Badge variant="outline">Hidden</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label={`Edit ${r.label}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={busyId === r.id}
                          onClick={() => setDeleteTarget(r)}
                          aria-label={`Delete ${r.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading && visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No values yet. The forms use their built-in list until you add one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{form?.id != null ? "Edit value" : "Add value"}</DialogTitle>
              <DialogDescription>{meta.title}</DialogDescription>
            </DialogHeader>
            {form && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="md-label">Label</Label>
                  <Input
                    id="md-label"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    maxLength={120}
                    required
                    autoFocus
                  />
                  {form.id != null && (
                    <p className="text-xs text-muted-foreground">
                      Renaming changes it for new requests. Existing records keep the text they were saved with.
                    </p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="md-order">Display order</Label>
                  <Input
                    id="md-order"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="md-active">Show in forms</Label>
                  <Switch
                    id="md-active"
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.label}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              It will disappear from the forms. Appointments and messages that used it keep the text but lose the link
              to this value. This can&apos;t be undone. To hide it but keep the link, turn off &ldquo;Active&rdquo;
              instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
