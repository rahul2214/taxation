
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
  referredEmail: string;
  date: string;
  status: ReferralStatus;
};

const initialReferrals: Referral[] = [
  { id: "REF001", referrerName: "John Smith", referrerEmail: "john.s@example.com", referredEmail: "alice.b@example.com", date: "2024-02-10", status: "Completed" },
  { id: "REF002", referrerName: "Jane Doe", referrerEmail: "jane.d@example.com", referredEmail: "bob.w@example.com", date: "2024-02-15", status: "Pending" },
  { id: "REF003", referrerName: "John Smith", referrerEmail: "john.s@example.com", referredEmail: "charlie.g@example.com", date: "2024-03-01", status: "Completed" },
  { id: "REF004", referrerName: "Mary Johnson", referrerEmail: "mary.j@example.com", referredEmail: "diana.p@example.com", date: "2024-03-05", status: "Pending" },
  { id: "REF005", referrerName: "David Lee", referrerEmail: "david.l@example.com", referredEmail: "frank.c@example.com", date: "2024-03-20", status: "Expired" },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    "Completed": "default",
    "Pending": "secondary",
    "Expired": "destructive",
};

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
  const { toast } = useToast();

  const handleStatusChange = (referralId: string, newStatus: ReferralStatus) => {
    setReferrals(currentReferrals => 
      currentReferrals.map(ref => 
        ref.id === referralId ? { ...ref, status: newStatus } : ref
      )
    );
    toast({
      title: "Status Updated",
      description: `Referral ${referralId} has been marked as ${newStatus}.`
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
              <TableHead>Referral ID</TableHead>
              <TableHead>Referrer</TableHead>
              <TableHead>Referred Email</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.map((ref) => (
              <TableRow key={ref.id}>
                <TableCell className="font-medium">{ref.id}</TableCell>
                <TableCell>
                    <div>{ref.referrerName}</div>
                    <div className="text-sm text-muted-foreground">{ref.referrerEmail}</div>
                </TableCell>
                <TableCell>{ref.referredEmail}</TableCell>
                <TableCell>{ref.date}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleStatusChange(ref.id, 'Completed')} disabled={ref.status === 'Completed'}>Mark as Completed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ref.id, 'Pending')} disabled={ref.status === 'Pending'}>Mark as Pending</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ref.id, 'Expired')} disabled={ref.status === 'Expired'} className="text-destructive">Mark as Expired</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
