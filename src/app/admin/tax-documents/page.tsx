
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
import { MoreHorizontal, Loader2, Download, Upload } from "lucide-react";
import { useState, useEffect, ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { collection, doc, updateDoc, getDocs, serverTimestamp, addDoc } from "firebase/firestore";
import { uploadFileToCloudflare } from "@/lib/upload";
import { getAllCustomers, getTaxDocuments, createTaxDocument, updateTaxDocumentStatus } from "@/lib/supabase/services";

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
    setIsLoading(true);

    try {
      const customerMap = new Map<string, Customer>();

      // 1. Fetch customers and docs from Supabase
      try {
        const sbCustomers = await getAllCustomers();
        const sbDocs = await getTaxDocuments();

        sbCustomers.forEach(c => {
          if (c.role !== 'admin') {
            customerMap.set(c.id, {
              id: c.id,
              firstName: c.first_name || "Customer",
              lastName: c.last_name || "",
              documents: [],
            });
          }
        });

        sbDocs.forEach(d => {
          let normalizedCategory: TaxDocument['category'] = "Customer Upload";
          if (d.category === "Tax Estimation") normalizedCategory = "Tax Estimation";
          else if (d.category === "Tax Return Draft") normalizedCategory = "Tax Return Draft";
          else if (d.category === "Final Document") normalizedCategory = "Final Document";

          let normalizedStatus: DocumentStatus = "Pending";
          if (d.status === "Verified") normalizedStatus = "Verified";
          else if (d.status === "Requires Attention") normalizedStatus = "Requires Attention";

          const cust = customerMap.get(d.customer_id);
          if (cust) {
            cust.documents.push({
              id: d.id || "",
              documentName: d.document_name,
              documentType: d.document_type || "Tax Document",
              fileUrl: d.file_url,
              status: normalizedStatus,
              taxYear: d.tax_year || new Date().getFullYear(),
              uploadDate: new Date(d.upload_date || Date.now()),
              customerId: d.customer_id,
              category: normalizedCategory,
              uploader: d.uploader || "customer",
            });
          }
        });
      } catch (sbErr) {
        console.error("Supabase fetch in tax documents warning:", sbErr);
      }

      // 2. Fetch customers and docs from Firestore if available
      if (firestore) {
        try {
          const customerSnapshot = await getDocs(collection(firestore, 'customers'));
          customerSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.role !== 'admin' && !customerMap.has(doc.id)) {
              customerMap.set(doc.id, {
                id: doc.id,
                firstName: data.firstName || "Customer",
                lastName: data.lastName || "",
                documents: []
              });
            }
          });

          for (const [customerId, customerData] of customerMap.entries()) {
            const docsCollectionRef = collection(firestore, 'customers', customerId, 'taxDocuments');
            const docsSnapshot = await getDocs(docsCollectionRef);
            docsSnapshot.forEach(d => {
              // Avoid duplicates
              if (!customerData.documents.some(existing => existing.id === d.id)) {
                const docData = d.data() as Omit<TaxDocument, 'id'| 'customerId'>;
                customerData.documents.push({
                  id: d.id,
                  customerId: customerId,
                  ...docData
                } as TaxDocument);
              }
            });
          }
        } catch (fsErr) {
          console.warn("Firestore fetch in tax documents warning:", fsErr);
        }
      }

      // Sort documents by date descending for all customers
      for (const cust of customerMap.values()) {
        cust.documents.sort((a, b) => {
          const dateA = a.uploadDate instanceof Date ? a.uploadDate.getTime() : (a.uploadDate?.seconds ?? 0) * 1000;
          const dateB = b.uploadDate instanceof Date ? b.uploadDate.getTime() : (b.uploadDate?.seconds ?? 0) * 1000;
          return dateB - dateA;
        });
      }
      
      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
        console.error("Error fetching data:", error);
        toast({ variant: "destructive", title: "Fetch Failed", description: "Could not load customer and document data." });
    } finally {
        setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDocsAndCustomers();
  }, [firestore]);
  

  const handleStatusChange = async (document: TaxDocument, newStatus: DocumentStatus) => {
    let updated = false;

    // Try Supabase
    try {
      await updateTaxDocumentStatus(document.id, newStatus);
      updated = true;
    } catch (sbErr) {
      // maybe firestore document
    }

    // Try Firestore
    if (firestore) {
      try {
        const docRef = doc(firestore, 'customers', document.customerId, 'taxDocuments', document.id);
        await updateDoc(docRef, { status: newStatus });
        updated = true;
      } catch (fsErr) {
        // maybe supabase document
      }
    }

    if (updated) {
      fetchDocsAndCustomers();
      toast({ title: "Status Updated", description: `Document status has been changed to ${newStatus}.` });
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update the document status." });
    }
  };
  
  const openUploadDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setUploadDocumentName("");
    setFileToUpload(null);
    setUploadingFiles([]);
    setIsUploadDialogOpen(true);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleAdminUpload = async () => {
    if (!fileToUpload || !selectedCustomer || !uploadDocumentName) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select a file and provide a document name."});
      return;
    }

    const newUpload: UploadingFile = { name: fileToUpload.name, progress: 0 };
    setUploadingFiles(prev => [...prev, newUpload]);

    try {
      const { url: downloadURL } = await uploadFileToCloudflare(fileToUpload, {
        folder: "admin_uploads",
        userId: selectedCustomer.id,
        onProgress: (progress) => {
          setUploadingFiles(prev => prev.map(f => f.name === fileToUpload.name ? { ...f, progress } : f));
        },
      });

      // 1. Save in Supabase
      try {
        await createTaxDocument({
          customer_id: selectedCustomer.id,
          document_name: uploadDocumentName,
          file_url: downloadURL,
          document_type: uploadCategory,
          tax_year: new Date().getFullYear(),
          status: "Pending",
          category: uploadCategory,
          uploader: "admin"
        });
      } catch (sbErr) {
        console.warn("Supabase tax document creation warning:", sbErr);
      }

      // 2. Save in Firestore if configured
      if (firestore && selectedCustomer) {
        try {
          const taxDocsCollection = collection(firestore, 'customers', selectedCustomer.id, 'taxDocuments');
          await addDoc(taxDocsCollection, {
            documentName: uploadDocumentName,
            fileUrl: downloadURL,
            documentType: uploadCategory,
            uploadDate: serverTimestamp(),
            taxYear: new Date().getFullYear(),
            status: "Pending",
            category: uploadCategory,
            uploader: "admin"
          });
        } catch (fsErr) {
          console.warn("Firestore tax document creation warning:", fsErr);
        }
      }

      setUploadingFiles(prev => prev.filter(f => f.name !== fileToUpload.name));
      toast({ title: "Upload Successful", description: `${fileToUpload.name} has been uploaded to Cloudflare for ${selectedCustomer.firstName}.` });
      setIsUploadDialogOpen(false);
      setFileToUpload(null);
      setUploadDocumentName("");
      fetchDocsAndCustomers();
    } catch (error: any) {
      setUploadingFiles(prev => prev.map(f => f.name === fileToUpload.name ? { ...f, error: error.message } : f));
      toast({ variant: "destructive", title: "Upload Failed", description: error.message || `Could not upload ${fileToUpload.name}.` });
    }
  };

  const formatDate = (date: { seconds: number; nanoseconds: number } | Date | undefined) => {
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
                  <div className="flex justify-end mb-4">
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
                        <TableHead>Uploaded On</TableHead>
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
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <a href={docItem.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                    <Download className="mr-2 h-4 w-4" />Download
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(docItem, 'Verified')} disabled={docItem.status === 'Verified'}>Mark as Verified</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(docItem, 'Requires Attention')} disabled={docItem.status === 'Requires Attention'}>Mark as Requires Attention</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(docItem, 'Pending')} disabled={docItem.status === 'Pending'}>Revert to Pending</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Upload Document for {selectedCustomer?.firstName}</DialogTitle>
                <DialogDescription>Select a file and specify its details to upload for this customer.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="doc-name">Document Name</Label>
                    <Input id="doc-name" value={uploadDocumentName} onChange={(e) => setUploadDocumentName(e.target.value)} placeholder="e.g., Tax Estimation 2023"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="doc-category">Document Category</Label>
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
                    <div key={index} className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            {file.error && <p className="text-xs text-destructive">{file.error}</p>}
                        </div>
                        <Progress value={file.progress} className="h-2" />
                    </div>
                ))}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAdminUpload} disabled={uploadingFiles.some(f => f.progress < 100 && !f.error)}>
                    {uploadingFiles.length > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                    Upload to Customer
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
