
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, File as FileIcon, Loader2, Upload, User, Shield } from "lucide-react";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import Link from "next/link";

type TaxDocument = {
  id: string; 
  documentName: string;
  documentType: string;
  fileUrl: string;
  status: "Verified" | "Pending" | "Requires Attention";
  taxYear: number;
  uploadDate: { seconds: number; nanoseconds: number } | Date;
  category: "Customer Upload" | "Tax Estimation" | "Tax Return Draft" | "Final Document";
  uploader: "customer" | "admin";
};

export default function AllDocumentsPage() {
  const { firestore, user } = useFirebase();

  const taxDocsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `customers/${user.uid}/taxDocuments`);
  }, [user, firestore]);

  const { data: documents, isLoading } = useCollection<Omit<TaxDocument, 'id'>>(taxDocsCollection);
  
  const customerUploads = documents?.filter(doc => doc.uploader === 'customer') || [];
  const adminUploads = documents?.filter(doc => doc.uploader === 'admin') || [];

  const formatDate = (date: { seconds: number; nanoseconds: number } | Date) => {
    if (!date) return "N/A";
    if (date instanceof Date) return date.toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return "N/A";
  };
  
  const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    "Verified": "default",
    "Pending": "secondary",
    "Requires Attention": "destructive",
  };

  const renderTable = (docs: TaxDocument[], title: string, description: string, emptyMessage: string, icon: React.ReactNode) => (
     <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                {icon}
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>}
                    {!isLoading && docs.length > 0 && docs.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.documentName}</TableCell>
                            <TableCell>{doc.category}</TableCell>
                            <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                            <TableCell><Badge variant={statusVariant[doc.status] || "secondary"}>{doc.status}</Badge></TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="mr-2 h-4 w-4" /> Download
                                    </a>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && docs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{emptyMessage}</TableCell></TableRow>}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Documents</h1>
        <p className="text-muted-foreground">View documents you've uploaded and those provided by our team.</p>
      </div>

      <div className="space-y-8">
        {renderTable(
            adminUploads, 
            "Documents from Polaris",
            "Tax estimations, final returns, and other documents from our team.",
            "No documents have been provided by our team yet.",
            <Shield className="w-8 h-8 text-primary" />
        )}

        {renderTable(
            customerUploads, 
            "Your Uploaded Documents",
            "Documents you have uploaded for processing.",
            "You haven't uploaded any documents yet.",
            <User className="w-8 h-8 text-primary" />
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
            <CardTitle>Need to upload more files?</CardTitle>
            <CardDescription>You can upload W-2s, 1099s, or your tax return drafts.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild>
                <Link href="/dashboard/upload">
                    <Upload className="mr-2 h-4 w-4"/> Go to Upload Page
                </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
