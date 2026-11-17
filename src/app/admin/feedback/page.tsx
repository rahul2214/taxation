"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, MoreHorizontal, RefreshCw, Star } from "lucide-react";
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
import { FEEDBACK_CATEGORIES } from "@/components/common/FeedbackWidget";
import { getFeedback, updateFeedbackStatus, FeedbackRecord, FeedbackStatus } from "@/lib/supabase/services";

const STATUSES: FeedbackStatus[] = ["new", "reviewed", "resolved", "archived"];

const STATUS_VARIANT: Record<FeedbackStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  reviewed: "secondary",
  resolved: "outline",
  archived: "outline",
};

const SOURCE_LABEL: Record<string, string> = {
  website: "Website",
  client_portal: "Client portal",
  mobile_app: "Mobile app",
};

const SOURCES = ["all", "website", "client_portal", "mobile_app"] as const;

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const categoryLabel = (c?: string | null) => FEEDBACK_CATEGORIES.find((x) => x.value === c)?.label || (c ? label(c) : "—");
const sourceLabel = (s?: string | null) => (s ? SOURCE_LABEL[s] || label(s) : "—");

const formatDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "N/A";

function Stars({ value }: { value?: number | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= value ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

export default function AdminFeedbackPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FeedbackStatus | "all">("all");
  const [source, setSource] = useState<(typeof SOURCES)[number]>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FeedbackRecord | null>(null);

  const load = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      setItems(await getFeedback({ forceRefresh }));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't load feedback", description: err?.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const s of STATUSES) c[s] = items.filter((x) => (x.status || "new") === s).length;
    return c;
  }, [items]);

  const averageRating = useMemo(() => {
    const rated = items.filter((x) => x.rating);
    if (!rated.length) return null;
    return rated.reduce((sum, x) => sum + (x.rating || 0), 0) / rated.length;
  }, [items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((f) => {
      if (filter !== "all" && (f.status || "new") !== filter) return false;
      if (source !== "all" && f.source !== source) return false;
      if (!q) return true;
      return [f.name, f.email, f.category, f.message, f.page].some((v) => v?.toLowerCase().includes(q));
    });
  }, [items, filter, source, search]);

  const setStatus = async (item: FeedbackRecord, status: FeedbackStatus, silent = false) => {
    if (!item.id || item.status === status) return;
    try {
      await updateFeedbackStatus(item.id, status);
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status } : x)));
      setSelected((prev) => (prev && prev.id === item.id ? { ...prev, status } : prev));
      if (!silent) toast({ title: "Status updated", description: `Feedback marked as ${label(status)}.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err?.message });
    }
  };

  const openItem = (item: FeedbackRecord) => {
    setSelected(item);
    if ((item.status || "new") === "new") setStatus(item, "reviewed", true);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Feedback"
        description="Feedback sent from the website, the client portal and the mobile app. Open one to read it, then resolve or archive it."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total feedback</p>
            <p className="text-2xl font-semibold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">New</p>
            <p className="text-2xl font-semibold">{counts.new ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Average rating</p>
            <p className="text-2xl font-semibold">{averageRating ? `${averageRating.toFixed(1)} / 5` : "—"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {label(f)} ({counts[f] ?? 0})
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as (typeof SOURCES)[number])}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by source"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All sources" : sourceLabel(s)}</option>
            ))}
          </select>
          <Input
            placeholder="Search name, email, message…"
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
                <TableHead>From</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="hidden md:table-cell">Topic</TableHead>
                <TableHead className="hidden lg:table-cell">Message</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
                <TableHead className="hidden md:table-cell">Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                visible.map((f) => {
                  const status = (f.status || "new") as FeedbackStatus;
                  return (
                    <TableRow
                      key={f.id}
                      className={`cursor-pointer ${status === "new" ? "font-semibold" : ""}`}
                      onClick={() => openItem(f)}
                    >
                      <TableCell>
                        <div>{f.name || "Anonymous"}</div>
                        {f.email && <div className="text-xs font-normal text-muted-foreground">{f.email}</div>}
                      </TableCell>
                      <TableCell><Stars value={f.rating} /></TableCell>
                      <TableCell className="hidden md:table-cell">{categoryLabel(f.category)}</TableCell>
                      <TableCell className="hidden max-w-[280px] truncate lg:table-cell">{f.message}</TableCell>
                      <TableCell className="hidden md:table-cell">{sourceLabel(f.source)}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDateTime(f.created_at)}</TableCell>
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
                            <DropdownMenuItem onClick={() => openItem(f)}>View feedback</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {STATUSES.map((s) => (
                              <DropdownMenuItem key={s} disabled={status === s} onClick={() => setStatus(f, s)}>
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No feedback found.
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
            <DialogTitle>Feedback from {selected?.name || "Anonymous"}</DialogTitle>
            <DialogDescription>Received {formatDateTime(selected?.created_at)}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid gap-3 py-2 text-sm">
              {[
                ["Email", selected.email ? (
                  <a href={`mailto:${selected.email}`} className="break-all underline">{selected.email}</a>
                ) : "N/A"],
                ["Rating", <Stars key="r" value={selected.rating} />],
                ["Topic", categoryLabel(selected.category)],
                ["Source", sourceLabel(selected.source)],
                ["Device", [selected.platform, selected.device].filter(Boolean).join(" · ") || "N/A"],
                ["Page", selected.page || "N/A"],
                ...(selected.app_version ? [["App version", selected.app_version]] : []),
                ["Status", (
                  <Badge key="s" variant={STATUS_VARIANT[(selected.status || "new") as FeedbackStatus]}>
                    {label(selected.status || "new")}
                  </Badge>
                )],
              ].map(([k, v]) => (
                <div key={String(k)} className="grid grid-cols-4 gap-4">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="col-span-3 break-words">{v}</span>
                </div>
              ))}
              <div className="mt-2 whitespace-pre-wrap rounded-md border bg-muted/40 p-3">{selected.message}</div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {selected && selected.status !== "resolved" && (
              <Button variant="outline" onClick={() => setStatus(selected, "resolved")}>
                Mark as resolved
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
