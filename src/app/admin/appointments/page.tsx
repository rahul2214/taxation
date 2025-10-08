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

const appointments = [
  { id: "APT001", client: "John Smith", service: "Personal Tax Filing", date: "2024-05-20", time: "10:00 AM", status: "Confirmed" },
  { id: "APT002", client: "Jane Doe", service: "Business Tax Services", date: "2024-05-21", time: "02:00 PM", status: "Completed" },
  { id: "APT003", client: "Peter Jones", service: "IRS Audit Support", date: "2024-05-22", time: "11:00 AM", status: "Pending" },
  { id: "APT004", client: "Mary Johnson", service: "Personal Tax Filing", date: "2024-05-23", time: "09:00 AM", status: "Cancelled" },
  { id: "APT005", client: "David Lee", service: "Tax Consulting", date: "2024-05-24", time: "03:00 PM", status: "Confirmed" },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Confirmed": "default",
    "Completed": "outline",
    "Pending": "secondary",
    "Cancelled": "destructive",
};


export default function AppointmentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booked Appointments</CardTitle>
        <CardDescription>Manage and view all client appointments.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((apt) => (
              <TableRow key={apt.id}>
                <TableCell className="font-medium">{apt.id}</TableCell>
                <TableCell>{apt.client}</TableCell>
                <TableCell>{apt.service}</TableCell>
                <TableCell>{apt.date}</TableCell>
                <TableCell>{apt.time}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[apt.status] || "default"}>{apt.status}</Badge>
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
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Reschedule</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
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
