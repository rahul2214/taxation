
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  signupDate: { seconds: number, nanoseconds: number } | Date;
  role?: string;
};


export default function CustomersPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const customersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'customers'), where('role', '!=', 'admin')) : null, [firestore]);
  const { data: customers, isLoading } = useCollection<Omit<Customer, 'id'>>(customersQuery);

  const handleViewProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsProfileDialogOpen(true);
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
  
  const formatAddress = (address: Customer['address']) => {
    if (!address) return "N/A";
    const { line1, line2, city, state, zip } = address;
    let fullAddress = line1;
    if (line2) fullAddress += `, ${line2}`;
    if (city) fullAddress += `, ${city}`;
    if (state) fullAddress += `, ${state}`;
    if (zip) fullAddress += ` ${zip}`;
    return fullAddress;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>View and manage all registered customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && customers && customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                      <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{formatDate(customer.signupDate)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewProfile(customer)}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>View Documents</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Suspend Account</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (!customers || customers.length === 0) && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No customers found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Customer Profile</DialogTitle>
                <DialogDescription>
                    Details for customer ID: {selectedCustomer?.id}
                </DialogDescription>
            </DialogHeader>
            {selectedCustomer && (
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Name</span>
                        <span className="col-span-3 text-sm">{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Email</span>
                        <span className="col-span-3 text-sm">{selectedCustomer.email}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Phone</span>
                        <span className="col-span-3 text-sm">{selectedCustomer.phone || 'N/A'}</span>
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Address</span>
                        <span className="col-span-3 text-sm">{formatAddress(selectedCustomer.address)}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Joined</span>
                        <span className="col-span-3 text-sm">{formatDate(selectedCustomer.signupDate)}</span>
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
