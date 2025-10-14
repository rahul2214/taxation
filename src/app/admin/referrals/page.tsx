
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
import { useFirebase } from "@/firebase";
import { collection, doc, Timestamp, writeBatch, getDocs } from "firebase/firestore";

type ReferralStatus = "Completed" | "Pending" | "Expired";

type Referral = {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  referredEmail: string;
  referralDate: Timestamp;
  status: ReferralStatus;
  referrerId: string;
  customerReferralId: string;
};

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    "Completed": "default",
    "Pending": "secondary",
    "Expired": "destructive",
};

export default function ReferralsPage() {
  const { firestore } = useFirebase();
  const [allReferrals, setAllReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!firestore) return;

    const fetchAllReferrals = async () => {
      setIsLoading(true);
      try {
        const customersSnapshot = await getDocs(collection(firestore, "customers"));
        let referrals: Referral[] = [];
        
        for (const customerDoc of customersSnapshot.docs) {
          const referralsSnapshot = await getDocs(collection(firestore, `customers/${customerDoc.id}/referrals`));
          
          referralsSnapshot.forEach((refDoc) => {
            const refData = refDoc.data();
            referrals.push({
              id: refDoc.id,
              customerReferralId: refDoc.id,
              referrerId: customerDoc.id,
              referrerName: refData.referrerName,
              referrerEmail: refData.referrerEmail,
              referredName: refData.referredName,
              referredEmail: refData.referredEmail,
              referralDate: refData.referralDate,
              status: refData.status,
            });
          });
        }
        
        setAllReferrals(referrals);
      } catch (error) {
        console.error("Error fetching all referrals:", error);
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "Could not fetch referrals. You may not have the required permissions.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllReferrals();
  }, [firestore, toast]);


  const handleStatusChange = async (referral: Referral, newStatus: ReferralStatus) => {
    if (!firestore) return;

    const customerReferralRef = doc(firestore, `customers/${referral.referrerId}/referrals/${referral.customerReferralId}`);

    try {
      const batch = writeBatch(firestore);
      batch.update(customerReferralRef, { status: newStatus });
      await batch.commit();

      // Update local state
      setAllReferrals(prev => prev.map(ref => 
        ref.id === referral.id ? { ...ref, status: newStatus } : ref
      ));

      toast({
        title: "Status Updated",
        description: `Referral from ${referral.referrerName} has been marked as ${newStatus}.`
      });
    } catch (error) {
      console.error("Error updating referral status:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: `Could not update referral status.`
      });
    }
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
            {!isLoading && allReferrals.map((ref) => (
              <TableRow key={`${ref.referrerId}-${ref.id}`}>
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
            {!isLoading && allReferrals.length === 0 && (
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
