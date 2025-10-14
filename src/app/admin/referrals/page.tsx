
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
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type ReferralStatus = "Completed" | "Pending" | "Expired";

type Referral = {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  referredEmail: string;
  referralDate: Date;
  status: ReferralStatus;
};

const mockReferrals: Referral[] = [
    { id: "REF001", referrerName: "John Smith", referrerEmail: "john.s@example.com", referredName: "Sarah Connor", referredEmail: "s.connor@example.com", referralDate: new Date("2024-05-15"), status: "Pending" },
    { id: "REF002", referrerName: "Jane Doe", referrerEmail: "jane.d@example.com", referredName: "Kyle Reese", referredEmail: "k.reese@example.com", referralDate: new Date("2024-04-20"), status: "Completed" },
    { id: "REF003", referrerName: "Peter Jones", referrerEmail: "peter.j@example.com", referredName: "Miles Dyson", referredEmail: "m.dyson@example.com", referralDate: new Date("2024-03-10"), status: "Expired" },
];


const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    "Completed": "default",
    "Pending": "secondary",
    "Expired": "destructive",
};

export default function ReferralsPage() {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>(mockReferrals);

  const handleStatusChange = async (referral: Referral, newStatus: ReferralStatus) => {
    setReferrals(prev => prev.map(ref => ref.id === referral.id ? { ...ref, status: newStatus } : ref));
    
    toast({
      title: "Status Updated (Local)",
      description: `Referral from ${referral.referrerName} has been marked as ${newStatus}. This change is not saved to the database.`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referrals</CardTitle>
        <CardDescription>Track and manage customer referrals. (Mock Data)</CardDescription>
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
            {referrals.map((ref) => (
              <TableRow key={ref.id}>
                <TableCell>
                    <div>{ref.referrerName}</div>
                    <div className="text-sm text-muted-foreground">{ref.referrerEmail}</div>
                </TableCell>
                 <TableCell>
                    <div>{ref.referredName}</div>
                    <div className="text-sm text-muted-foreground">{ref.referredEmail}</div>
                </TableCell>
                <TableCell>{ref.referralDate.toLocaleDateString()}</TableCell>
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
            {referrals.length === 0 && (
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
