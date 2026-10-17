
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
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";
import { getReferrals, updateReferralStatus } from "@/lib/supabase/services";

type ReferralStatus = "Completed" | "Pending" | "Expired";

type Referral = {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  referredEmail: string;
  referralDate: { seconds: number, nanoseconds: number } | Date;
  status: ReferralStatus;
  referrerId?: string;
};

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    "Completed": "default",
    "Pending": "secondary",
    "Expired": "destructive",
};

export default function ReferralsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const referralsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'referrals') : null, [firestore]);
  const { data: fsReferrals, isLoading: isFsLoading } = useCollection<Omit<Referral, 'id'>>(referralsCollection);

  const [supabaseReferrals, setSupabaseReferrals] = useState<Referral[]>([]);
  const [isSbLoading, setIsSbLoading] = useState(true);

  const fetchSupabaseReferrals = async () => {
    try {
      const records = await getReferrals();
      const mapped: Referral[] = records.map((rec) => {
        let normalizedStatus: ReferralStatus = "Pending";
        const s = (rec.status || "").toLowerCase();
        if (s === "completed") normalizedStatus = "Completed";
        else if (s === "expired") normalizedStatus = "Expired";

        return {
          id: rec.id || "",
          referrerName: rec.referrer_name || "Unknown",
          referrerEmail: rec.referrer_email || "",
          referredName: rec.referred_name || "Friend",
          referredEmail: rec.referred_email,
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
    fetchSupabaseReferrals();
  }, []);

  const combinedMap = new Map<string, Referral>();
  if (fsReferrals) {
    fsReferrals.forEach((ref) => combinedMap.set(ref.id, ref));
  }
  supabaseReferrals.forEach((ref) => combinedMap.set(ref.id, ref));
  const referrals = Array.from(combinedMap.values()).sort((a, b) => {
    const timeA = a.referralDate instanceof Date ? a.referralDate.getTime() : (a.referralDate?.seconds ?? 0) * 1000;
    const timeB = b.referralDate instanceof Date ? b.referralDate.getTime() : (b.referralDate?.seconds ?? 0) * 1000;
    return timeB - timeA;
  });

  const isLoading = (isFsLoading && firestore) && isSbLoading;

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
        const referralDocRef = doc(firestore, 'referrals', referral.id);
        await updateDoc(referralDocRef, { status: newStatus });
        updated = true;
      } catch (fsErr) {
        // might be supabase record
      }
    }

    if (updated) {
      toast({
        title: "Status Updated",
        description: `Referral from ${referral.referrerName} has been marked as ${newStatus}.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the referral status."
      });
    }
  };

  const formatDate = (date: { seconds: number, nanoseconds: number } | Date) => {
    if (date instanceof Date) {
        return date.toLocaleDateString();
    }
    if (date && date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString();
    }
    return "N/A";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referrals</CardTitle>
        <CardDescription>Track and manage customer referrals.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referrer</TableHead>
              <TableHead>Referred</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
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
            {!isLoading && referrals && referrals.map((ref) => (
              <TableRow key={ref.id}>
                <TableCell>
                    <div>{ref.referrerName}</div>
                    <div className="text-sm text-muted-foreground">{ref.referrerEmail}</div>
                </TableCell>
                 <TableCell>
                    <div>{ref.referredName}</div>
                    <div className="text-sm text-muted-foreground">{ref.referredEmail}</div>
                </TableCell>
                <TableCell>{formatDate(ref.referralDate)}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleStatusChange(ref, 'Completed')} disabled={ref.status === 'Completed'}>Mark as Completed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ref, 'Pending')} disabled={ref.status === 'Pending'}>Mark as Pending</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ref, 'Expired')} disabled={ref.status === 'Expired'} className="text-destructive">Mark as Expired</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (!referrals || referrals.length === 0) && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No referrals found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
