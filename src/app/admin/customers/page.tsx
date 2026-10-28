
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
import { useState, useEffect } from "react";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { getAllCustomers, CustomerRecord } from "@/lib/supabase/services";
import { PageHeading } from "@/components/portal/PageHeading";

type Customer = {
  id: string; // UUID
  userid?: number; // int8
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
  } | string;
  signupDate: { seconds: number, nanoseconds: number } | Date;
  role?: string;
  role_id?: number;
  referralCode?: string;
  walletBalance?: number;
  referredBy?: string | number | null;
};


export default function CustomersPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const customersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'customers'), where('role', '!=', 'admin')) : null, [firestore]);
  const { data: fsCustomers, isLoading: isFsLoading } = useCollection<Omit<Customer, 'id'>>(customersQuery);

  const [supabaseCustomers, setSupabaseCustomers] = useState<Customer[]>([]);
  const [isSbLoading, setIsSbLoading] = useState(true);

  useEffect(() => {
    async function fetchSupabaseCustomers() {
      try {
        const records = await getAllCustomers();
        const mapped: Customer[] = records
          .filter(r => r.role !== 'admin' && r.role_id !== 1 && r.role_id !== 3)
          .map(r => ({
            id: r.id,
            userid: r.userid,
            role_id: r.role_id,
            firstName: r.first_name || "Customer",
            lastName: r.last_name || "",
            email: r.email,
            phone: r.phone || "",
            address: r.address || undefined,
            signupDate: new Date(r.signup_date || Date.now()),
            role: r.role || "customer",
            referralCode: r.referral_code,
            walletBalance: r.wallet_balance !== undefined ? Number(r.wallet_balance) : 0,
            referredBy: r.referred_by,
          }));
        setSupabaseCustomers(mapped);
      } catch (err) {
        console.error("Failed to load Supabase customers:", err);
      } finally {
        setIsSbLoading(false);
      }
    }

    fetchSupabaseCustomers();
  }, []);

  const mergedCustomersMap = new Map<string, Customer>();
  if (fsCustomers) {
    fsCustomers.forEach(c => mergedCustomersMap.set(c.id, c as Customer));
  }
  supabaseCustomers.forEach(c => mergedCustomersMap.set(c.id, c));
  const customers = Array.from(mergedCustomersMap.values()).sort((a, b) => {
    const timeA = a.signupDate instanceof Date ? a.signupDate.getTime() : (a.signupDate?.seconds ?? 0) * 1000;
    const timeB = b.signupDate instanceof Date ? b.signupDate.getTime() : (b.signupDate?.seconds ?? 0) * 1000;
    return timeB - timeA;
  });

  const isLoading = (isFsLoading && firestore) && isSbLoading;

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
    if (typeof address === 'string') return address;
    const { line1, line2, city, state, zip } = address;
    let fullAddress = line1;
    if (line2) fullAddress += `, ${line2}`;
    if (city) fullAddress += `, ${city}`;
    if (state) fullAddress += `, ${state}`;
    if (zip) fullAddress += ` ${zip}`;
    return fullAddress;
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Clients"
        description="Everyone with a client account, newest first."
      />
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">User ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
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
              {!isLoading && customers && customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {customer.userid ? `#${customer.userid}` : "-"}
                  </TableCell>
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
                        <DropdownMenuItem className="text-destructive">Suspend Account</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (!customers || customers.length === 0) && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No customers found.</TableCell>
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
                <DialogDescription className="font-mono text-xs">
                    {selectedCustomer?.userid ? `Customer #${selectedCustomer.userid} • ` : ""}UUID: {selectedCustomer?.id}
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
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Coupon Code</span>
                        <span className="col-span-3 text-sm font-mono font-bold text-primary">{selectedCustomer.referralCode || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Wallet Balance</span>
                        <span className="col-span-3 text-sm font-semibold text-brass-dark">
                          ${(selectedCustomer.walletBalance ?? 0).toFixed(2)}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Referred By</span>
                        <span className="col-span-3 text-sm font-mono">
                          {selectedCustomer.referredBy ? (
                            !isNaN(Number(selectedCustomer.referredBy))
                              ? `User #${selectedCustomer.referredBy}`
                              : selectedCustomer.referredBy
                          ) : 'None (Direct)'}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="col-span-1 text-sm font-medium text-muted-foreground">Account Role</span>
                        <div className="col-span-3 flex items-center gap-2">
                          <span className="capitalize text-sm font-medium">{selectedCustomer.role || "customer"}</span>
                          <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded border">
                            Role ID #{selectedCustomer.role_id ?? 2}
                          </span>
                        </div>
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
