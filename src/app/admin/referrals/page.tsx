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

const referrals = [
  { id: "REF001", referrer: "John Smith", referred: "Alice Brown", date: "2024-02-10", status: "Completed" },
  { id: "REF002", referrer: "Jane Doe", referred: "Bob White", date: "2024-02-15", status: "Pending" },
  { id: "REF003", referrer: "John Smith", referred: "Charlie Green", date: "2024-03-01", status: "Completed" },
  { id: "REF004", referrer: "Mary Johnson", referred: "Diana Prince", date: "2024-03-05", status: "Pending" },
  { id: "REF005", referrer: "David Lee", referred: "Frank Castle", date: "2024-03-20", status: "Expired" },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    "Completed": "default",
    "Pending": "secondary",
    "Expired": "destructive",
};

export default function ReferralsPage() {
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
              <TableHead>Referred User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.map((ref) => (
              <TableRow key={ref.id}>
                <TableCell className="font-medium">{ref.id}</TableCell>
                <TableCell>{ref.referrer}</TableCell>
                <TableCell>{ref.referred}</TableCell>
                <TableCell>{ref.date}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[ref.status] || "default"}>{ref.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
