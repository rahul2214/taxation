
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

type Appointment = {
  id: string;
  client: string;
  service: string;
  date: string;
  time: string;
  status: "Confirmed" | "Completed" | "Pending" | "Cancelled";
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
};

const appointments: Appointment[] = [
  { id: "APT001", client: "John Smith", service: "Personal Tax Filing", date: "2024-05-20", time: "10:00 AM", status: "Confirmed", clientEmail: "john.s@example.com", clientPhone: "(123) 456-7890", notes: "Prefers morning appointments." },
  { id: "APT002", client: "Jane Doe", service: "Business Tax Services", date: "2024-05-21", time: "02:00 PM", status: "Completed", clientEmail: "jane.d@example.com", clientPhone: "(987) 654-3210", notes: "Needs to discuss quarterly estimates." },
  { id: "APT003", client: "Peter Jones", service: "IRS Audit Support", date: "2024-05-22", time: "11:00 AM", status: "Pending", clientEmail: "peter.j@example.com", clientPhone: "(555) 123-4567" },
  { id: "APT004", client: "Mary Johnson", service: "Personal Tax Filing", date: "2024-05-23", time: "09:00 AM", status: "Cancelled", clientEmail: "mary.j@example.com", clientPhone: "(111) 222-3333", notes: "Cancelled due to a family emergency." },
  { id: "APT005", client: "David Lee", service: "Tax Consulting", date: "2024-05-24", time: "03:00 PM", status: "Confirmed", clientEmail: "david.l@example.com", clientPhone: "(444) 555-6666" },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Confirmed": "default",
    "Completed": "outline",
    "Pending": "secondary",
    "Cancelled": "destructive",
};


export default function AppointmentsPage() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  return (
    <>
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
                        <DropdownMenuItem onClick={() => handleViewDetails(apt)}>View Details</DropdownMenuItem>
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
                <DialogDescription>
                    Information for appointment ID: {selectedAppointment?.id}
                </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Client</span>
                        <span className="col-span-3 text-sm">{selectedAppointment.client}</span>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Email</span>
                        <span className="col-span-3 text-sm">{selectedAppointment.clientEmail || 'N/A'}</span>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Phone</span>
                        <span className="col-span-3 text-sm">{selectedAppointment.clientPhone || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Service</span>
                        <span className="col-span-3 text-sm">{selectedAppointment.service}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Date</span>
                        <span className="col-span-3 text-sm">{selectedAppointment.date} at {selectedAppointment.time}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Status</span>
                        <span className="col-span-3 text-sm"><Badge variant={statusVariant[selectedAppointment.status]}>{selectedAppointment.status}</Badge></span>
                    </div>
                     {selectedAppointment.notes && (
                        <div className="grid grid-cols-4 items-start gap-4">
                            <span className="col-span-1 text-sm font-medium text-muted-foreground">Notes</span>
                            <p className="col-span-3 text-sm">{selectedAppointment.notes}</p>
                        </div>
                     )}
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}

