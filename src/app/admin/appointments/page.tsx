
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
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, Timestamp, query, writeBatch } from "firebase/firestore";

type AppointmentStatus = "Confirmed" | "Completed" | "Pending" | "Cancelled";

type Appointment = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  status: AppointmentStatus;
  requestDate: Timestamp;
  customerId: string;
  customerAppointmentId: string;
};

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Confirmed": "default",
    "Completed": "outline",
    "Pending": "secondary",
    "Cancelled": "destructive",
};


export default function AppointmentsPage() {
  const { firestore } = useFirebase();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query the top-level collection for admins
    return query(collection(firestore, 'admin-appointments'));
  }, [firestore]);

  const { data: appointments, isLoading } = useCollection<Appointment>(appointmentsQuery);

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };
  
  const handleStatusChange = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    if (!firestore) return;
    
    const batch = writeBatch(firestore);

    // 1. Update the document in the admin collection
    const adminAppointmentRef = doc(firestore, 'admin-appointments', appointment.id);
    batch.update(adminAppointmentRef, { status: newStatus });

    // 2. Update the corresponding document in the customer's subcollection
    if (appointment.customerId && appointment.customerAppointmentId) {
      const customerAppointmentRef = doc(firestore, `customers/${appointment.customerId}/appointments/${appointment.customerAppointmentId}`);
      batch.update(customerAppointmentRef, { status: newStatus });
    }

    try {
      await batch.commit();
      toast({
        title: "Status Updated",
        description: `Appointment for ${appointment.fullName} has been marked as ${newStatus}.`
      });
    } catch (error) {
       console.error("Error updating status:", error);
       toast({
        variant: "destructive",
        title: "Update Failed",
        description: `Could not update appointment status.`
      });
    }
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
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Requested Date</TableHead>
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
              {!isLoading && appointments?.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{apt.fullName}</TableCell>
                  <TableCell>{apt.email}</TableCell>
                  <TableCell>{apt.requestDate ? new Date(apt.requestDate.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
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
               {!isLoading && (!appointments || appointments.length === 0) && (
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
                        <span className="col-span-3 text-sm">{selectedAppointment.requestDate ? new Date(selectedAppointment.requestDate.seconds * 1000).toLocaleString() : 'N/A'}</span>
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
