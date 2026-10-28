
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, File, X, Loader2 } from "lucide-react";
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { useState, ChangeEvent, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getTaxDocuments, createTaxDocument, deleteTaxDocument } from "@/lib/supabase/services";
import { uploadFileToCloudflare, deleteFileFromCloudflare } from "@/lib/upload";
import { PageHeading } from "@/components/portal/PageHeading";

type UploadingFile = {
  name: string;
  progress: number;
  error?: string;
};

type TaxDocItem = {
  id: string;
  documentName: string;
  taxYear: number;
  documentType: string;
  status: string;
  uploader: string;
  fileUrl: string;
};

export default function UploadPage() {
  const { firestore, user } = useFirebase();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();

  const [taxYear, setTaxYear] = useState<string>(new Date().getFullYear().toString());
  const [documentType, setDocumentType] = useState<string>("W-2");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const [supabaseFiles, setSupabaseFiles] = useState<TaxDocItem[]>([]);
  const [isSbLoading, setIsSbLoading] = useState(true);

  const fetchSupabaseFiles = async () => {
    if (!user) return;
    try {
      const docs = await getTaxDocuments(user.uid);
      const mapped: TaxDocItem[] = docs.map(d => ({
        id: d.id || "",
        documentName: d.document_name,
        taxYear: d.tax_year || new Date().getFullYear(),
        documentType: d.document_type,
        status: d.status || "Pending",
        uploader: d.uploader,
        fileUrl: d.file_url,
      }));
      setSupabaseFiles(mapped);
    } catch (err) {
      console.error("Error fetching Supabase user docs:", err);
    } finally {
      setIsSbLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSupabaseFiles();
    }
  }, [user]);

  const taxDocsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `customers/${user.uid}/taxDocuments`);
  }, [user, firestore]);

  const { data: fsFiles, isLoading: isFsLoading } = useCollection(taxDocsCollection);

  const mergedFilesMap = new Map<string, TaxDocItem>();
  if (fsFiles) {
    fsFiles.forEach((f: any) => {
      mergedFilesMap.set(f.id, {
        id: f.id,
        documentName: f.documentName,
        taxYear: f.taxYear,
        documentType: f.documentType,
        status: f.status,
        uploader: f.uploader,
        fileUrl: f.fileUrl,
      });
    });
  }
  supabaseFiles.forEach(f => mergedFilesMap.set(f.id, f));
  const uploadedFiles = Array.from(mergedFilesMap.values());
  const isLoading = (isFsLoading && firestore) && isSbLoading;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
    }
  };

  const handleUpload = () => {
    if (fileToUpload && user) {
      const newUpload: UploadingFile = { name: fileToUpload.name, progress: 0 };
      setUploadingFiles(prev => [...prev, newUpload]);
      uploadFile(fileToUpload, user.uid);
      setFileToUpload(null); 
    } else {
        toast({
            variant: "destructive",
            title: "No file selected",
            description: "Please select a file to upload.",
        });
    }
  };


  const uploadFile = async (file: File, userId: string) => {
    try {
      const uploadResult = await uploadFileToCloudflare(file, {
        folder: "customers",
        userId,
        onProgress: (progress) => {
          setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress } : f));
        },
      });

      // 1. Save in Supabase
      try {
        await createTaxDocument({
          customer_id: userId,
          document_name: file.name,
          file_url: uploadResult.url,
          document_type: documentType,
          tax_year: parseInt(taxYear, 10),
          status: "Pending",
          category: 'Customer Upload',
          uploader: 'customer',
        });
        fetchSupabaseFiles();
      } catch (sbErr) {
        console.warn("Supabase document creation warning:", sbErr);
      }

      // 2. Save in Firestore if configured
      if (taxDocsCollection) {
        addDocumentNonBlocking(taxDocsCollection, {
          documentName: file.name,
          fileUrl: uploadResult.url,
          documentType: documentType,
          uploadDate: serverTimestamp(),
          taxYear: parseInt(taxYear),
          status: "Pending",
          mimeType: file.type,
          category: 'Customer Upload',
          uploader: 'customer'
        });
      }

      setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
      toast({
        title: "Upload Successful",
        description: `${file.name} has been securely uploaded to Cloudflare.`,
      });
    } catch (error: any) {
      console.error("Upload failed:", error);
      setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, error: error.message } : f));
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || `Could not upload ${file.name}.`,
      });
    }
  };
  
  const handleDelete = async (fileId: string, fileUrl: string) => {
      // Delete in Supabase
      try {
        await deleteTaxDocument(fileId);
        fetchSupabaseFiles();
      } catch (sbErr) {}

      // Delete from Cloudflare R2
      try {
        await deleteFileFromCloudflare(fileUrl);
      } catch (cfErr) {
        console.warn("Cloudflare delete notice:", cfErr);
      }

      // Delete in Firestore
      if (user && firestore) {
        const docRef = doc(firestore, `customers/${user.uid}/taxDocuments`, fileId);
        deleteDocumentNonBlocking(docRef);
      }

      toast({
          title: "File Deleted",
          description: "The file has been successfully deleted.",
      });
  };

  const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    "Verified": "default",
    "Pending": "secondary",
    "Requires Attention": "destructive",
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const documentTypes = ["W-2", "1099-NEC", "1099-MISC", "1099-INT", "1099-DIV", "1098-T", "Tax Return Draft", "Other"];

  return (
    <div className="space-y-6">
      <PageHeading
        title="Upload documents"
        description="Send us your W-2s, 1099s, receipts and anything else for your return. Files are encrypted and only your preparer can open them."
      />

      <Card>
        <CardHeader>
            <CardTitle>Document Uploader</CardTitle>
            <CardDescription>Select a year, type, and file to begin the upload process.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="taxYear">Tax Year</Label>
                            <Select value={taxYear} onValueChange={setTaxYear}>
                                <SelectTrigger id="taxYear">
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="documentType">Document Type</Label>
                            <Select value={documentType} onValueChange={setDocumentType}>
                                <SelectTrigger id="documentType">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {documentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                                {fileToUpload ? (
                                    <p className="font-semibold text-primary">{fileToUpload.name}</p>
                                ) : (
                                    <>
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">PDF, PNG, JPG or DOC (MAX. 10MB)</p>
                                    </>
                                )}
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div> 
                    
                    <Button onClick={handleUpload} disabled={!fileToUpload || uploadingFiles.length > 0} className="w-full">
                        {uploadingFiles.length > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Upload File
                    </Button>
                 </div>
                <div className="h-full">
                    {uploadingFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Upload Progress</h3>
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
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>My Uploaded Files</CardTitle>
          <CardDescription>
            Here are the documents you've uploaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Tax Year</TableHead>
                        <TableHead>Type</TableHead>
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
                    {uploadedFiles && uploadedFiles.filter(f => f.uploader === 'customer').map((file) => (
                        <TableRow key={file.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                <File className="h-4 w-4 text-muted-foreground" />
                                {file.documentName}
                            </TableCell>
                            <TableCell>{file.taxYear}</TableCell>
                            <TableCell>{file.documentType}</TableCell>
                            <TableCell>
                                <Badge variant={statusVariant[file.status] || "secondary"}>{file.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(file.id, file.fileUrl)}>
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && (!uploadedFiles || uploadedFiles.filter(f => f.uploader === 'customer').length === 0) && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">You haven't uploaded any documents yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
