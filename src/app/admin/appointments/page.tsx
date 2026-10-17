
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
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";
import { getAppointments, updateAppointmentStatus, AppointmentRecord } from "@/lib/supabase/services";

type AppointmentStatus = "Confirmed" | "Completed" | "Pending" | "Cancelled";

type Appointment = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  status: AppointmentStatus;
  requestDate: { seconds: number, nanoseconds: number } | Date;
  customerId?: string;
};

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Confirmed": "default",
    "Completed": "outline",
    "Pending": "secondary",
    "Cancelled": "destructive",
};

export default function AppointmentsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const appointmentsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'appointments') : null, [firestore]);
  const { data: fsAppointments, isLoading: isFsLoading } = useCollection<Omit<Appointment, 'id'>>(appointmentsCollection);
  
  const [supabaseAppointments, setSupabaseAppointments] = useState<Appointment[]>([]);
  const [isSbLoading, setIsSbLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchSupabaseAppointments = async () => {
    try {
      const records = await getAppointments();
      const mapped: Appointment[] = records.map((rec) => {
        let normalizedStatus: AppointmentStatus = "Pending";
        const s = (rec.status || "").toLowerCase();
        if (s === "confirmed") normalizedStatus = "Confirmed";
        else if (s === "completed") normalizedStatus = "Completed";
        else if (s === "cancelled") normalizedStatus = "Cancelled";

        return {
          id: rec.id || "",
          fullName: rec.name || "Client",
          email: rec.email,
          phone: rec.phone || "",
          notes: rec.notes || "",
          status: normalizedStatus,
          requestDate: new Date(rec.appointment_date),
          customerId: rec.customer_id || undefined,
        };
      });
      setSupabaseAppointments(mapped);
    } catch (err) {
      console.error("Failed to load appointments from Supabase:", err);
    } finally {
      setIsSbLoading(false);
    }
  };

  useEffect(() => {
    fetchSupabaseAppointments();
  }, []);

  // Merge appointments, removing duplicate IDs
  const combinedMap = new Map<string, Appointment>();
  if (fsAppointments) {
    fsAppointments.forEach((apt) => {
      combinedMap.set(apt.id, apt);
    });
  }
  supabaseAppointments.forEach((apt) => {
    combinedMap.set(apt.id, apt);
  });
  const appointments = Array.from(combinedMap.values()).sort((a, b) => {
    const timeA = a.requestDate instanceof Date ? a.requestDate.getTime() : (a.requestDate?.seconds ?? 0) * 1000;
    const timeB = b.requestDate instanceof Date ? b.requestDate.getTime() : (b.requestDate?.seconds ?? 0) * 1000;
    return timeB - timeA;
  });

  const isLoading = (isFsLoading && firestore) && isSbLoading;

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };
  
  const handleStatusChange = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    let updated = false;

    // 1. Try updating in Supabase
    try {
      await updateAppointmentStatus(appointment.id, newStatus.toLowerCase());
      updated = true;
      fetchSupabaseAppointments();
    } catch (sbErr) {
      // Might be a Firestore-only appointment
    }

    // 2. Try updating in Firestore
    if (firestore) {
      try {
        const appointmentDocRef = doc(firestore, 'appointments', appointment.id);
        await updateDoc(appointmentDocRef, { status: newStatus });
        updated = true;
      } catch (fsErr) {
        // Might be a Supabase-only appointment
      }
    }

    if (updated) {
      toast({
        title: "Status Updated",
        description: `Appointment for ${appointment.fullName} has been marked as ${newStatus}.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the appointment status."
      });
    }
  };
  
  const formatDate = (date: { seconds: number, nanoseconds: number } | Date) => {
    if (date instanceof Date) {
        return date.toLocaleDateString();
    }
    if (date && date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString();
    }
    return "N/A";
  }

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
              {!isLoading && appointments && appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{apt.fullName}</TableCell>
                  <TableCell>{apt.email}</TableCell>
                  <TableCell>{formatDate(apt.requestDate)}</TableCell>
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
                        <span className="col-span-3 text-sm">{formatDate(selectedAppointment.requestDate)}</span>
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
