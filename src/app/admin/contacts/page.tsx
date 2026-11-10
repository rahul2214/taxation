"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, MoreHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PageHeading } from "@/components/portal/PageHeading";
import { getContacts, updateContactStatus, ContactRecord, ContactStatus } from "@/lib/supabase/services";

const STATUSES: ContactStatus[] = ["new", "read", "replied", "archived"];

const STATUS_VARIANT: Record<ContactStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  read: "secondary",
  replied: "outline",
  archived: "outline",
};

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";

export default function AdminContactsPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ContactStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactRecord | null>(null);

  const load = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      setContacts(await getContacts({ forceRefresh }));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't load messages", description: err?.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: contacts.length };
    for (const s of STATUSES) c[s] = contacts.filter((x) => (x.status || "new") === s).length;
    return c;
  }, [contacts]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filter !== "all" && (c.status || "new") !== filter) return false;
      if (!q) return true;
      return [c.name, c.email, c.phone, c.subject, c.message].some((v) => v?.toLowerCase().includes(q));
    });
  }, [contacts, filter, search]);

  const setStatus = async (contact: ContactRecord, status: ContactStatus, silent = false) => {
    if (!contact.id || contact.status === status) return;
    try {
      await updateContactStatus(contact.id, status);
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, status } : c)));
      setSelected((prev) => (prev && prev.id === contact.id ? { ...prev, status } : prev));
      if (!silent) toast({ title: "Status updated", description: `Message from ${contact.name} marked as ${label(status)}.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err?.message });
    }
  };

  const openMessage = (contact: ContactRecord) => {
    setSelected(contact);
    if ((contact.status || "new") === "new") setStatus(contact, "read", true);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Contact messages"
        description="Messages sent from the website contact page. Open one to read it, then mark it replied or archive it."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {label(f)} ({counts[f] ?? 0})
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <Button variant="outline" size="icon" onClick={() => load(true)} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="hidden md:table-cell">Topic</TableHead>
                <TableHead className="hidden md:table-cell">Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                visible.map((c) => {
                  const status = (c.status || "new") as ContactStatus;
                  return (
                    <TableRow
                      key={c.id}
                      className={`cursor-pointer ${status === "new" ? "font-semibold" : ""}`}
                      onClick={() => openMessage(c)}
                    >
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.phone || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.subject || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDateTime(c.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[status]}>{label(status)}</Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openMessage(c)}>View message</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {STATUSES.map((s) => (
                              <DropdownMenuItem key={s} disabled={status === s} onClick={() => setStatus(c, s)}>
                                Mark as {label(s)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {!isLoading && visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No messages found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Message from {selected?.name}</DialogTitle>
            <DialogDescription>Received {formatDateTime(selected?.created_at)}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="grid grid-cols-4 gap-4">
                <span className="text-muted-foreground">Email</span>
                <a href={`mailto:${selected.email}`} className="col-span-3 break-all underline">
                  {selected.email}
                </a>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <span className="text-muted-foreground">Phone</span>
                {selected.phone ? (
                  <a href={`tel:${selected.phone}`} className="col-span-3 underline">
                    {selected.phone}
                  </a>
                ) : (
                  <span className="col-span-3">N/A</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4">
                <span className="text-muted-foreground">Topic</span>
                <span className="col-span-3">{selected.subject || "N/A"}</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <span className="text-muted-foreground">Status</span>
                <span className="col-span-3">
                  <Badge variant={STATUS_VARIANT[(selected.status || "new") as ContactStatus]}>
                    {label(selected.status || "new")}
                  </Badge>
                </span>
              </div>
              <div className="mt-2 whitespace-pre-wrap rounded-md border bg-muted/40 p-3">{selected.message}</div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {selected && selected.status !== "replied" && (
              <Button variant="outline" onClick={() => setStatus(selected, "replied")}>
                Mark as replied
              </Button>
            )}
            {selected && selected.status !== "archived" && (
              <Button variant="outline" onClick={() => setStatus(selected, "archived")}>
                Archive
              </Button>
            )}
            <Button onClick={() => setSelected(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
