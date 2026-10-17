
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowUpRight, Users, CreditCard, Activity, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

type Appointment = {
  id: string;
  fullName: string;
  service?: string; // This might not exist in your model, will fallback
  requestDate: { seconds: number, nanoseconds: number } | Date;
  status: "Confirmed" | "Completed" | "Pending";
};

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  signupDate: { seconds: number, nanoseconds: number } | Date;
};

type Referral = {
  id: string;
  status: "Completed" | "Pending" | "Expired";
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Confirmed": "default",
    "Completed": "outline",
    "Pending": "secondary",
};


import { useState, useEffect } from "react";
import { getAppointments, getAllCustomers, getReferrals } from "@/lib/supabase/services";

export default function AdminDashboardPage() {
  const { firestore } = useFirebase();

  // Queries for Firestore data
  const appointmentsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'appointments'), orderBy('requestDate', 'desc'), limit(3)) : null, 
    [firestore]
  );
  const customersQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'customers'), orderBy('signupDate', 'desc'), limit(3)) : null, 
    [firestore]
  );
  const allAppointmentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'appointments') : null, [firestore]);
  const allCustomersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'customers') : null, [firestore]);
  const allReferralsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'referrals') : null, [firestore]);

  // Fetching data
  const { data: recentAppointments, isLoading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);
  const { data: newCustomers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);
  const { data: allAppointments, isLoading: allAppointmentsLoading } = useCollection<Appointment>(allAppointmentsQuery);
  const { data: allCustomers, isLoading: allCustomersLoading } = useCollection<Customer>(allCustomersQuery);
  const { data: allReferrals, isLoading: allReferralsLoading } = useCollection<Referral>(allReferralsQuery);

  // Supabase states
  const [sbAppointments, setSbAppointments] = useState<Appointment[]>([]);
  const [sbCustomers, setSbCustomers] = useState<Customer[]>([]);
  const [sbReferrals, setSbReferrals] = useState<Referral[]>([]);
  const [isSbLoading, setIsSbLoading] = useState(true);

  useEffect(() => {
    async function fetchSupabaseData() {
      try {
        const [apts, custs, refs] = await Promise.all([
          getAppointments(),
          getAllCustomers(),
          getReferrals(),
        ]);

        const mappedApts: Appointment[] = apts.map(a => ({
          id: a.id || "",
          fullName: a.name || "Client",
          service: a.service || "General",
          requestDate: new Date(a.appointment_date),
          status: (a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1).toLowerCase() : "Pending") as any,
        }));

        const mappedCusts: Customer[] = custs.filter(c => c.role !== 'admin').map(c => ({
          id: c.id,
          firstName: c.first_name || "Customer",
          lastName: c.last_name || "",
          email: c.email,
          signupDate: new Date(c.signup_date || Date.now()),
        }));

        const mappedRefs: Referral[] = refs.map(r => ({
          id: r.id || "",
          status: (r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase() : "Pending") as any,
        }));

        setSbAppointments(mappedApts);
        setSbCustomers(mappedCusts);
        setSbReferrals(mappedRefs);
      } catch (err) {
        console.error("Error loading Supabase dashboard stats:", err);
      } finally {
        setIsSbLoading(false);
      }
    }

    fetchSupabaseData();
  }, []);

  // Merge Appointments
  const mergedAptsMap = new Map<string, Appointment>();
  if (recentAppointments) {
    recentAppointments.forEach(a => mergedAptsMap.set(a.id, a));
  }
  sbAppointments.forEach(a => mergedAptsMap.set(a.id, a));
  const combinedRecentAppointments = Array.from(mergedAptsMap.values())
    .sort((a, b) => {
      const timeA = a.requestDate instanceof Date ? a.requestDate.getTime() : (a.requestDate?.seconds ?? 0) * 1000;
      const timeB = b.requestDate instanceof Date ? b.requestDate.getTime() : (b.requestDate?.seconds ?? 0) * 1000;
      return timeB - timeA;
    })
    .slice(0, 5);

  // Merge Customers
  const mergedCustsMap = new Map<string, Customer>();
  if (newCustomers) {
    newCustomers.forEach(c => mergedCustsMap.set(c.id, c));
  }
  sbCustomers.forEach(c => mergedCustsMap.set(c.id, c));
  const combinedNewCustomers = Array.from(mergedCustsMap.values())
    .sort((a, b) => {
      const timeA = a.signupDate instanceof Date ? a.signupDate.getTime() : (a.signupDate?.seconds ?? 0) * 1000;
      const timeB = b.signupDate instanceof Date ? b.signupDate.getTime() : (b.signupDate?.seconds ?? 0) * 1000;
      return timeB - timeA;
    })
    .slice(0, 5);

  // Unique totals
  const totalCustomersCount = (allCustomers?.length || 0) + sbCustomers.filter(sc => !allCustomers?.some(fc => fc.id === sc.id)).length;
  const totalAppointmentsCount = (allAppointments?.length || 0) + sbAppointments.filter(sa => !allAppointments?.some(fa => fa.id === sa.id)).length;
  const totalActiveReferrals = (allReferrals?.filter(r => r.status === "Pending").length || 0) + sbReferrals.filter(sr => sr.status === "Pending").length;

  const isLoading = (appointmentsLoading && isSbLoading);
  
  const formatDate = (date: { seconds: number, nanoseconds: number } | Date | undefined) => {
    if (!date) return "N/A";
    if (date instanceof Date) {
        return date.toLocaleDateString();
    }
    if (date && date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString();
    }
    return "N/A";
  }
  
  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName.charAt(0) : '';
    const last = lastName ? lastName.charAt(0) : '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {allCustomersLoading && isSbLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{totalCustomersCount}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {allAppointmentsLoading && isSbLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{totalAppointmentsCount}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Referrals
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {allReferralsLoading && isSbLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{totalActiveReferrals}</div>}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Recent Appointments</CardTitle>
                <CardDescription>
                  A quick look at upcoming and recent appointments.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/admin/appointments">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>}
                  {!isLoading && combinedRecentAppointments && combinedRecentAppointments.map(apt => (
                    <TableRow key={apt.id}>
                        <TableCell>{apt.fullName}</TableCell>
                        <TableCell>{formatDate(apt.requestDate)}</TableCell>
                        <TableCell>
                            <Badge variant={statusVariant[apt.status] || "default"}>{apt.status}</Badge>
                        </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && (!combinedRecentAppointments || combinedRecentAppointments.length === 0) && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No recent appointments.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>New Customers</CardTitle>
              <CardDescription>
                The latest customers to join Polaris.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8">
                {isLoading && <Loader2 className="mx-auto h-6 w-6 animate-spin" />}
                {!isLoading && combinedNewCustomers && combinedNewCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center gap-4">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarFallback>{getInitials(customer.firstName, customer.lastName)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">
                            {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {customer.email}
                        </p>
                        </div>
                    </div>
                ))}
                {!isLoading && (!combinedNewCustomers || combinedNewCustomers.length === 0) && (
                    <p className="text-center text-muted-foreground">No new customers.</p>
                )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
