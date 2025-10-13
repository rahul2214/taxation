
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
import { ArrowUpRight, DollarSign, Users, CreditCard, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock Data - In a real app, this would come from your database
const recentAppointments = [
  { id: "APT001", client: "John Smith", service: "Personal Tax Filing", date: "2024-05-20", status: "Confirmed" },
  { id: "APT002", client: "Jane Doe", service: "Business Tax Services", date: "2024-05-21", status: "Completed" },
  { id: "APT003", client: "Peter Jones", service: "IRS Audit Support", date: "2024-05-22", status: "Pending" },
];

const newCustomers = [
  { name: "Mary Johnson", email: "mary.j@example.com", avatar: "https://picsum.photos/seed/cust4/40/40", fallback: "MJ" },
  { name: "David Lee", email: "david.l@example.com", avatar: "https://picsum.photos/seed/cust5/40/40", fallback: "DL" },
  { name: "Alice Brown", email: "alice.b@example.com", avatar: "https://picsum.photos/seed/cust6/40/40", fallback: "AB" },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Confirmed": "default",
    "Completed": "outline",
    "Pending": "secondary",
};


export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+235</div>
              <p className="text-xs text-muted-foreground">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12</div>
              <p className="text-xs text-muted-foreground">
                +19% from last month
              </p>
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
              <div className="text-2xl font-bold">+57</div>
              <p className="text-xs text-muted-foreground">
                +2 since last hour
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
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
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAppointments.map(apt => (
                    <TableRow key={apt.id}>
                        <TableCell>{apt.client}</TableCell>
                        <TableCell>{apt.service}</TableCell>
                        <TableCell>{apt.date}</TableCell>
                        <TableCell>
                            <Badge variant={statusVariant[apt.status] || "default"}>{apt.status}</Badge>
                        </TableCell>
                    </TableRow>
                  ))}
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
                {newCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={customer.avatar} alt="Avatar" />
                        <AvatarFallback>{customer.fallback}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">
                            {customer.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {customer.email}
                        </p>
                        </div>
                    </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
