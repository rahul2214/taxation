
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type AppointmentStatus = "Confirmed" | "Completed" | "Pending" | "Cancelled";

type Appointment = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  status: AppointmentStatus;
  requestDate: Date;
  customerId: string;
  customerAppointmentId: string;
};

const mockAppointments: Appointment[] = [
    { id: "APT001", fullName: "Alice Johnson", email: "alice.j@example.com", phone: "111-222-3333", status: "Confirmed", requestDate: new Date("2024-05-20"), customerId: "cust1", customerAppointmentId: "c-apt1", notes: "Prefers a morning call." },
    { id: "APT002", fullName: "Bob Williams", email: "bob.w@example.com", phone: "444-555-6666", status: "Completed", requestDate: new Date("2024-05-18"), customerId: "cust2", customerAppointmentId: "c-apt2" },
    { id: "APT003", fullName: "Charlie Brown", email: "charlie.b@example.com", phone: "777-888-9999", status: "Pending", requestDate: new Date("2024-05-22"), customerId: "cust3", customerAppointmentId: "c-apt3" },
    { id: "APT004", fullName: "Diana Prince", email: "diana.p@example.com", phone: "123-456-7890", status: "Cancelled", requestDate: new Date("2024-05-19"), customerId: "cust4", customerAppointmentId: "c-apt4", notes: "Rescheduling for next month." },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Confirmed": "default",
    "Completed": "outline",
    "Pending": "secondary",
    "Cancelled": "destructive",
};


export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };
  
  const handleStatusChange = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    // This is now a local state update
    setAppointments(prev => prev.map(apt => 
      apt.id === appointment.id ? { ...apt, status: newStatus } : apt
    ));
      
    toast({
      title: "Status Updated (Local)",
      description: `Appointment for ${appointment.fullName} has been marked as ${newStatus}. This is a local change and is not saved to the database.`
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Booked Appointments</CardTitle>
          <CardDescription>Manage and view all client appointments. (Mock Data)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{apt.fullName}</TableCell>
                  <TableCell>{apt.email}</TableCell>
                  <TableCell>{apt.requestDate.toLocaleDateString()}</TableCell>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(apt, 'Confirmed')} disabled={apt.status === 'Confirmed'}>Mark as Confirmed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(apt, 'Completed')} disabled={apt.status === 'Completed'}>Mark as Completed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(apt, 'Cancelled')} disabled={apt.status === 'Cancelled'} className="text-destructive">Mark as Cancelled</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {appointments.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No appointments found.</TableCell>
                </TableRow>
              )}
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
                        <span className="col-span-3 text-sm">{selectedAppointment.fullName}</span>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Email</span>
                        <span className="col-span-3 text-sm">{selectedAppointment.email || 'N/A'}</span>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Phone</span>
                        <span className="col-span-3 text-sm">{selectedAppointment.phone || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Date</span>
                        <span className="col-span-3 text-sm">{selectedAppointment.requestDate.toLocaleString()}</span>
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
