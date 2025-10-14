
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
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collectionGroup, doc, Timestamp } from "firebase/firestore";

type ReferralStatus = "Completed" | "Pending" | "Expired";

type Referral = {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  referredEmail: string;
  referralDate: Timestamp;
  status: ReferralStatus;
  customerId: string;
};

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    "Completed": "default",
    "Pending": "secondary",
    "Expired": "destructive",
};

export default function ReferralsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const referralsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collectionGroup(firestore, 'referrals');
  }, [firestore]);

  const { data: referrals, isLoading } = useCollection<Referral>(referralsQuery);

  const handleStatusChange = (referral: Referral, newStatus: ReferralStatus) => {
    if (!firestore) return;

    const referralDocRef = doc(firestore, `customers/${referral.customerId}/referrals/${referral.id}`);
    updateDocumentNonBlocking(referralDocRef, { status: newStatus });

    toast({
      title: "Status Updated",
      description: `Referral ${referral.id} has been marked as ${newStatus}.`
    });
  };

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
            {!isLoading && referrals?.map((ref) => (
              <TableRow key={ref.id}>
                <TableCell>
                    <div>{ref.referrerName}</div>
                    <div className="text-sm text-muted-foreground">{ref.referrerEmail}</div>
                </TableCell>
                 <TableCell>
                    <div>{ref.referredName}</div>
                    <div className="text-sm text-muted-foreground">{ref.referredEmail}</div>
                </TableCell>
                <TableCell>{ref.referralDate ? new Date(ref.referralDate.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
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
