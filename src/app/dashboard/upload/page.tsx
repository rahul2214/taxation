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

  const taxDocsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `customers/${user.uid}/taxDocuments`);
  }, [user, firestore]);

  const { data: uploadedFiles, isLoading } = useCollection(taxDocsCollection);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && user && firestore) {
      const newUploads: UploadingFile[] = Array.from(files).map(file => ({ name: file.name, progress: 0 }));
      setUploadingFiles(prev => [...prev, ...newUploads]);

      Array.from(files).forEach(file => {
        uploadFile(file, user.uid);
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
              documentType: file.type,
              uploadDate: serverTimestamp(),
              taxYear: new Date().getFullYear(),
              status: "Pending"
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


  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Documents</h1>
        <p className="text-muted-foreground">Securely upload your tax documents for processing.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Document Uploader</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG or DOC (MAX. 10MB)</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" multiple onChange={handleFileChange} />
                </label>
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
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>
            Here are the documents you've uploaded for the current tax year.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Uploaded On</TableHead>
                        <TableHead>Status</TableHead>
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
                    {uploadedFiles && uploadedFiles.map((file) => (
                        <TableRow key={file.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                <File className="h-4 w-4 text-muted-foreground" />
                                {file.documentName}
                            </TableCell>
                            <TableCell>{file.uploadDate ? new Date(file.uploadDate.seconds * 1000).toLocaleDateString() : 'Just now'}</TableCell>
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
                    {!isLoading && (!uploadedFiles || uploadedFiles.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">No documents uploaded yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
