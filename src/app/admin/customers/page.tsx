
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Loader2, UploadCloud, File as FileIcon } from "lucide-react";
import { useState, ChangeEvent } from "react";
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

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
  currentYearFormUrl?: string;
  priorYearFormUrl?: string;
};

type UploadingFile = {
  name: string;
  progress: number;
  error?: string;
};

export default function CustomersPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);


  const customersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'customers'), where('role', '!=', 'admin')) : null, [firestore]);
  const { data: customers, isLoading } = useCollection<Omit<Customer, 'id'>>(customersQuery);

  const handleViewProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsProfileDialogOpen(true);
  };
  
  const handleOpenUploadDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsUploadDialogOpen(true);
  };

  const uploadFile = (file: File, customerId: string, formType: 'currentYearFormUrl' | 'priorYearFormUrl') => {
    const storage = getStorage();
    const storageRef = ref(storage, `customers/${customerId}/tax_information/${formType}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const newUpload: UploadingFile = { name: file.name, progress: 0 };
    setUploadingFiles(prev => [...prev, newUpload]);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress } : f));
      },
      (error) => {
        console.error("Upload failed:", error);
        setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, error: error.message } : f));
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: `Could not upload ${file.name}.`,
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          if (firestore) {
            const customerDocRef = doc(firestore, 'customers', customerId);
            await updateDoc(customerDocRef, { [formType]: downloadURL });

            setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
            toast({
                title: "Upload Successful",
                description: `${file.name} has been uploaded for ${selectedCustomer?.firstName}.`,
            });
            // Close dialog on success
            setIsUploadDialogOpen(false);
          }
        });
      }
    );
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, formType: 'currentYearFormUrl' | 'priorYearFormUrl') => {
    const file = event.target.files?.[0];
    if (file && selectedCustomer) {
      uploadFile(file, selectedCustomer.id, formType);
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
                        <DropdownMenuItem onClick={() => handleOpenUploadDialog(customer)}>Manage Tax Documents</DropdownMenuItem>
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
      
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Manage Tax Documents</DialogTitle>
                <DialogDescription>
                   Upload tax information for {selectedCustomer?.firstName} {selectedCustomer?.lastName}.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
               <div className="space-y-2">
                 <Label htmlFor="currentYearForm">Current Year Form</Label>
                 <Input id="currentYearForm" type="file" onChange={(e) => handleFileChange(e, 'currentYearFormUrl')} />
                 {selectedCustomer?.currentYearFormUrl && <a href={selectedCustomer.currentYearFormUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"><FileIcon className="h-3 w-3" /> View Current</a>}
               </div>
                <div className="space-y-2">
                 <Label htmlFor="priorYearForm">Prior Year Form</Label>
                 <Input id="priorYearForm" type="file" onChange={(e) => handleFileChange(e, 'priorYearFormUrl')} />
                 {selectedCustomer?.priorYearFormUrl && <a href={selectedCustomer.priorYearFormUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"><FileIcon className="h-3 w-3" /> View Current</a>}
               </div>
                {uploadingFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                      {uploadingFiles.map((file, index) => (
                          <div key={index} className="p-2 border rounded-md">
                              <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  {file.error && <p className="text-xs text-destructive">{file.error}</p>}
                              </div>
                              <Progress value={file.progress} className="h-2 mt-1" />
                          </div>
                      ))}
                  </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
