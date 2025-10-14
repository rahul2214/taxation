
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
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, Timestamp, query, writeBatch, getDocs, QuerySnapshot, DocumentData } from "firebase/firestore";

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
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;

    const fetchAllAppointments = async () => {
      setIsLoading(true);
      try {
        const customersSnapshot = await getDocs(collection(firestore, "customers"));
        let appointments: Appointment[] = [];
        
        for (const customerDoc of customersSnapshot.docs) {
          const appointmentsSnapshot = await getDocs(collection(firestore, `customers/${customerDoc.id}/appointments`));
          
          appointmentsSnapshot.forEach((aptDoc) => {
            const aptData = aptDoc.data();
            const customerData = customerDoc.data();
            appointments.push({
              id: aptDoc.id, // The unique ID for the admin view could be different if needed
              customerAppointmentId: aptDoc.id,
              customerId: customerDoc.id,
              fullName: customerData.firstName + ' ' + customerData.lastName,
              email: customerData.email,
              phone: customerData.phone || '',
              status: aptData.status,
              requestDate: aptData.requestDate,
              notes: aptData.notes,
            });
          });
        }
        
        setAllAppointments(appointments);
      } catch (error) {
        console.error("Error fetching all appointments:", error);
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "Could not fetch appointments. You may not have the required permissions.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllAppointments();
  }, [firestore, toast]);


  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };
  
  const handleStatusChange = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    if (!firestore) return;
    
    // The admin-appointments collection might not exist or be accessible, so we only update the customer's subcollection.
    // The dual-write pattern should be re-evaluated if this is the source of truth for admins.
    // For now, let's assume the primary data is in the subcollection.
    const customerAppointmentRef = doc(firestore, `customers/${appointment.customerId}/appointments/${appointment.customerAppointmentId}`);
    
    try {
      const batch = writeBatch(firestore);
      batch.update(customerAppointmentRef, { status: newStatus });
      await batch.commit();

      // Update local state to reflect the change immediately
      setAllAppointments(prev => prev.map(apt => 
        apt.id === appointment.id ? { ...apt, status: newStatus } : apt
      ));

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
              {!isLoading && allAppointments.map((apt) => (
                <TableRow key={`${apt.customerId}-${apt.id}`}>
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
               {!isLoading && allAppointments.length === 0 && (
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
