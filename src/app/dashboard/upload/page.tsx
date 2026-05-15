
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
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useState, ChangeEvent } from "react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

type UploadingFile = {
  name: string;
  progress: number;
  error?: string;
};

export default function UploadPage() {
  const { firestore, user } = useFirebase();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();

  const [taxYear, setTaxYear] = useState<string>(new Date().getFullYear().toString());
  const [documentType, setDocumentType] = useState<string>("W-2");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const taxDocsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `customers/${user.uid}/taxDocuments`);
  }, [user, firestore]);

  const { data: uploadedFiles, isLoading } = useCollection(taxDocsCollection);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
    }
  };

  const handleUpload = () => {
    if (fileToUpload && user && firestore) {
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


  const uploadFile = (file: File, userId: string) => {
    const storage = getStorage();
    const storageRef = ref(storage, `customers/${userId}/documents/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

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
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          if (taxDocsCollection) {
            addDocumentNonBlocking(taxDocsCollection, {
              documentName: file.name,
              fileUrl: downloadURL,
              documentType: documentType,
              uploadDate: serverTimestamp(),
              taxYear: parseInt(taxYear),
              status: "Pending",
              mimeType: file.type,
              category: 'Customer Upload',
              uploader: 'customer'
            });
            setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
            toast({
                title: "Upload Successful",
                description: `${file.name} has been uploaded.`,
            });
          }
        });
      }
    );
  };
  
  const handleDelete = async (fileId: string, fileUrl: string) => {
      if (!user || !firestore) return;
      
      const docRef = doc(firestore, `customers/${user.uid}/taxDocuments`, fileId);
      const storage = getStorage();
      const fileRef = ref(storage, fileUrl);
      
      try {
        await deleteObject(fileRef);
        deleteDocumentNonBlocking(docRef);
        toast({
            title: "File Deleted",
            description: "The file has been successfully deleted.",
        });
      } catch (error) {
        console.error("Error deleting file:", error);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete the file.",
        });
      }
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
       <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Your Documents</h1>
        <p className="text-muted-foreground">Securely upload your tax documents for processing.</p>
      </div>

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
