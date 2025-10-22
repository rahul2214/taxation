
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, Loader2, Download, File as FileIcon, Upload } from "lucide-react";
import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { collection, doc, updateDoc, collectionGroup, query, getDocs, serverTimestamp, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

type DocumentStatus = "Verified" | "Pending" | "Requires Attention";

type TaxDocument = {
  id: string; 
  documentName: string;
  documentType: string;
  fileUrl: string;
  status: DocumentStatus;
  taxYear: number;
  uploadDate: { seconds: number; nanoseconds: number } | Date;
  customerId: string; 
  category: "Customer Upload" | "Tax Estimation" | "Tax Return Draft" | "Final Document";
  uploader: "customer" | "admin";
};

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  documents: TaxDocument[];
};

type UploadingFile = {
  name: string;
  progress: number;
  error?: string;
};

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
  "Verified": "default",
  "Pending": "secondary",
  "Requires Attention": "destructive",
};

export default function TaxDocumentsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadDocumentName, setUploadDocumentName] = useState("");
  const [uploadCategory, setUploadCategory] = useState<TaxDocument['category']>("Tax Estimation");
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const fetchDocsAndCustomers = async () => {
    if (!firestore) return;
    setIsLoading(true);

    const customerMap = new Map<string, Customer>();

    // 1. Get all customers
    const customerSnapshot = await getDocs(collection(firestore, 'customers'));
    customerSnapshot.forEach(doc => {
      customerMap.set(doc.id, {
        id: doc.id,
        firstName: doc.data().firstName,
        lastName: doc.data().lastName,
        documents: []
      });
    });

    // 2. Get all tax documents
    const docsQuery = query(collectionGroup(firestore, 'taxDocuments'));
    const querySnapshot = await getDocs(docsQuery);

    querySnapshot.forEach(d => {
      const docData = d.data() as Omit<TaxDocument, 'id' | 'customerId'>;
      const customerId = d.ref.parent.parent!.id;
      const customer = customerMap.get(customerId);
      if (customer) {
        customer.documents.push({
          id: d.id,
          customerId,
          ...docData
        } as TaxDocument);
      }
    });

    setCustomers(Array.from(customerMap.values()));
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchDocsAndCustomers();
  }, [firestore]);
  

  const handleStatusChange = async (document: TaxDocument, newStatus: DocumentStatus) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'customers', document.customerId, 'taxDocuments', document.id);
    try {
      await updateDoc(docRef, { status: newStatus });
      fetchDocsAndCustomers(); // Refetch all data to update UI
      toast({ title: "Status Updated", description: `Document status has been changed to ${newStatus}.` });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update the document status." });
    }
  };
  
  const openUploadDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsUploadDialogOpen(true);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleAdminUpload = () => {
    if (!fileToUpload || !selectedCustomer || !uploadDocumentName) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select a file and provide a document name."});
      return;
    }

    const storage = getStorage();
    const storageRef = ref(storage, `customers/${selectedCustomer.id}/documents/${Date.now()}_${fileToUpload.name}`);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
    
    const newUpload: UploadingFile = { name: fileToUpload.name, progress: 0 };
    setUploadingFiles(prev => [...prev, newUpload]);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadingFiles(prev => prev.map(f => f.name === fileToUpload.name ? { ...f, progress } : f));
      },
      (error) => {
        setUploadingFiles(prev => prev.map(f => f.name === fileToUpload.name ? { ...f, error: error.message } : f));
        toast({ variant: "destructive", title: "Upload Failed", description: `Could not upload ${fileToUpload.name}.` });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          if (firestore) {
            const taxDocsCollection = collection(firestore, 'customers', selectedCustomer.id, 'taxDocuments');
            await addDoc(taxDocsCollection, {
              documentName: uploadDocumentName,
              fileUrl: downloadURL,
              documentType: uploadCategory, // Or more specific if needed
              uploadDate: serverTimestamp(),
              taxYear: new Date().getFullYear(),
              status: "Pending",
              category: uploadCategory,
              uploader: "admin"
            });
            
            setUploadingFiles(prev => prev.filter(f => f.name !== fileToUpload.name));
            toast({ title: "Upload Successful", description: `${fileToUpload.name} has been uploaded for ${selectedCustomer.firstName}.` });
            setIsUploadDialogOpen(false);
            setFileToUpload(null);
            setUploadDocumentName("");
            fetchDocsAndCustomers(); // Refresh data
          }
        });
      }
    );
  };

  const formatDate = (date: { seconds: number; nanoseconds: number } | Date) => {
    if (!date) return "N/A";
    if (date instanceof Date) return date.toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return "N/A";
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>User Tax Documents</CardTitle>
        <CardDescription>View and manage all documents uploaded by users, grouped by customer.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {customers.filter(c => c.documents.length > 0).map(customer => (
              <AccordionItem value={`customer-${customer.id}`} key={customer.id}>
                <AccordionTrigger>
                    <div className="flex justify-between items-center w-full pr-4">
                        <span className="font-medium">{customer.firstName} {customer.lastName}</span>
                        <Badge>{customer.documents.length} document(s)</Badge>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex justify-end mb-2">
                    <Button size="sm" onClick={() => openUploadDialog(customer)}>
                        <Upload className="mr-2 h-4 w-4"/>
                        Upload for {customer.firstName}
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Uploader</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.documents.map((docItem) => (
                        <TableRow key={docItem.id}>
                          <TableCell className="font-medium">{docItem.documentName}</TableCell>
                          <TableCell>{docItem.category}</TableCell>
                          <TableCell>
                            <Badge variant={docItem.uploader === 'admin' ? 'default' : 'secondary'}>
                              {docItem.uploader}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(docItem.uploadDate)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[docItem.status] || "secondary"}>{docItem.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <a href={docItem.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />Download
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(docItem, 'Verified')} disabled={docItem.status === 'Verified'}>Mark as Verified</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(docItem, 'Requires Attention')} disabled={docItem.status === 'Requires Attention'}>Mark as Requires Attention</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(docItem, 'Pending')} disabled={docItem.status === 'Pending'}>Mark as Pending</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
             {customers.filter(c => c.documents.length > 0).length === 0 && !isLoading && (
                 <div className="text-center text-muted-foreground py-8">No documents found for any customer.</div>
             )}
          </Accordion>
        )}
      </CardContent>
    </Card>

    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Upload Document for {selectedCustomer?.firstName}</DialogTitle>
                <DialogDescription>Select a file and specify its details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="doc-name">Document Name</Label>
                    <Input id="doc-name" value={uploadDocumentName} onChange={(e) => setUploadDocumentName(e.target.value)} placeholder="e.g., Final Tax Return 2023"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="doc-category">Category</Label>
                     <select id="doc-category" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value as TaxDocument['category'])} className="w-full h-10 border-input bg-background rounded-md border px-3 py-2 text-sm">
                        <option value="Tax Estimation">Tax Estimation</option>
                        <option value="Final Document">Final Document</option>
                    </select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="file-upload">File</Label>
                    <Input id="file-upload" type="file" onChange={handleFileChange} />
                </div>
                {uploadingFiles.map((file, index) => (
                    <div key={index}>
                        <Progress value={file.progress} className="h-2" />
                        {file.error && <p className="text-sm text-destructive mt-1">{file.error}</p>}
                    </div>
                ))}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAdminUpload} disabled={uploadingFiles.length > 0}>
                    {uploadingFiles.length > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                    Upload
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
