
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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2, Download, File as FileIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, collectionGroup, query, getDocs } from "firebase/firestore";

type DocumentStatus = "Verified" | "Pending" | "Requires Attention";

type TaxDocument = {
  id: string; // The doc ID from the subcollection
  documentName: string;
  documentType: string;
  fileUrl: string;
  status: DocumentStatus;
  taxYear: number;
  uploadDate: { seconds: number; nanoseconds: number } | Date;
  customerId: string; // ID of the customer who owns this doc
  customerName?: string; // Optional: To be populated later
};

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
  "Verified": "default",
  "Pending": "secondary",
  "Requires Attention": "destructive",
};

export default function TaxDocumentsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch documents and enrich them with customer data
  useEffect(() => {
    if (!firestore) return;
    
    const fetchDocsAndCustomers = async () => {
      setIsLoading(true);
      
      // 1. Get all tax documents using a collection group query
      const docsQuery = query(collectionGroup(firestore, 'taxDocuments'));
      const querySnapshot = await getDocs(docsQuery);
      
      const docs: TaxDocument[] = querySnapshot.docs.map(d => ({
        id: d.id,
        customerId: d.ref.parent.parent!.id, // Get customerId from path
        ...d.data()
      } as TaxDocument));

      // 2. Get all unique customer IDs from the documents
      const customerIds = [...new Set(docs.map(d => d.customerId))];
      
      // 3. Fetch all corresponding customer documents
      if (customerIds.length > 0) {
        const customersData: { [id: string]: string } = {};
        // Firestore 'in' query is limited to 30 items. 
        // If you expect more, you'd need to batch these requests.
        const customerCol = collection(firestore, 'customers');
        const customerQuery = query(customerCol); // You might add a where('id', 'in', customerIds) clause if not too many
        const customerSnapshot = await getDocs(customerQuery);
        
        customerSnapshot.forEach(doc => {
            customersData[doc.id] = `${doc.data().firstName} ${doc.data().lastName}`;
        });

        // 4. Enrich documents with customer names
        const enrichedDocs = docs.map(doc => ({
            ...doc,
            customerName: customersData[doc.customerId] || "Unknown Customer"
        }));
         setDocuments(enrichedDocs);
      } else {
        setDocuments([]);
      }

      setIsLoading(false);
    };

    fetchDocsAndCustomers();

  }, [firestore]);


  const handleStatusChange = async (document: TaxDocument, newStatus: DocumentStatus) => {
    if (!firestore) return;

    const docRef = doc(firestore, 'customers', document.customerId, 'taxDocuments', document.id);

    try {
      await updateDoc(docRef, { status: newStatus });
       setDocuments(prevDocs => 
        prevDocs.map(d => 
          d.id === document.id ? { ...d, status: newStatus } : d
        )
      );
      toast({
        title: "Status Updated",
        description: `Document status has been changed to ${newStatus}.`
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the document status."
      });
    }
  };

  const formatDate = (date: { seconds: number; nanoseconds: number } | Date) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    if (date && date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    return "N/A";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Tax Documents</CardTitle>
        <CardDescription>View and manage all documents uploaded by users.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Tax Year</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && documents && documents.map((docItem) => (
              <TableRow key={docItem.id}>
                <TableCell className="font-medium">{docItem.customerName}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  {docItem.documentName}
                </TableCell>
                <TableCell>{docItem.taxYear}</TableCell>
                <TableCell>{docItem.documentType}</TableCell>
                <TableCell>{formatDate(docItem.uploadDate)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[docItem.status] || "secondary"}>{docItem.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                         <a href={docItem.fileUrl} target="_blank" rel="noopener noreferrer">
                           <Download className="mr-2 h-4 w-4" />
                           Download
                         </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(docItem, 'Verified')} disabled={docItem.status === 'Verified'}>
                        Mark as Verified
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(docItem, 'Requires Attention')} disabled={docItem.status === 'Requires Attention'}>
                        Mark as Requires Attention
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleStatusChange(docItem, 'Pending')} disabled={docItem.status === 'Pending'}>
                        Mark as Pending
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (!documents || documents.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No documents found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
