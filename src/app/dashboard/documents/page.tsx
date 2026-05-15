
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Upload,
  Loader2,
  FileText,
  BadgeCheck,
  CircleArrowRight,
  FileCheck2,
} from "lucide-react";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useState, ChangeEvent, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

type TaxDocument = {
  id: string;
  documentName: string;
  fileUrl: string;
  uploadDate: { seconds: number; nanoseconds: number } | Date;
  category: "Customer Upload" | "Tax Estimation" | "Tax Return Draft" | "Final Document";
  uploader: "customer" | "admin";
};

type UploadingFile = {
  name: string;
  progress: number;
  error?: string;
};

export default function DocumentsWorkflowPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(null);

  const taxDocsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `customers/${user.uid}/taxDocuments`);
  }, [user, firestore]);

  const { data: documents, isLoading } = useCollection<Omit<TaxDocument, 'id'>>(taxDocsCollection);

  const taxEstimationDoc = useMemo(() => documents?.find(doc => doc.category === 'Tax Estimation'), [documents]);
  const taxReturnDraftDoc = useMemo(() => documents?.find(doc => doc.category === 'Tax Return Draft'), [documents]);
  const finalDoc = useMemo(() => documents?.find(doc => doc.category === 'Final Document'), [documents]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
    }
  };

  const handleUpload = () => {
    if (fileToUpload && user && firestore && taxDocsCollection) {
      const newUpload: UploadingFile = { name: fileToUpload.name, progress: 0 };
      setUploadingFile(newUpload);

      const storage = getStorage();
      const storageRef = ref(storage, `customers/${user.uid}/documents/draft_${fileToUpload.name}`);
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadingFile(prev => prev ? { ...prev, progress } : null);
        },
        (error) => {
          setUploadingFile(prev => prev ? { ...prev, error: error.message } : null);
          toast({ variant: "destructive", title: "Upload Failed", description: `Could not upload ${fileToUpload.name}.` });
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            addDoc(taxDocsCollection, {
              documentName: fileToUpload.name,
              fileUrl: downloadURL,
              documentType: "Tax Return Draft",
              uploadDate: serverTimestamp(),
              taxYear: new Date().getFullYear(),
              status: "Pending",
              category: 'Tax Return Draft',
              uploader: 'customer'
            });
            setUploadingFile(null);
            setFileToUpload(null);
            toast({ title: "Upload Successful", description: `${fileToUpload.name} has been uploaded.` });
          });
        }
      );
    }
  };

  const formatDate = (date: { seconds: number; nanoseconds: number } | Date) => {
    if (!date) return "N/A";
    if (date instanceof Date) return date.toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return "N/A";
  };
  
  if (isLoading) {
      return (
          <div className="flex h-full items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Document Center</h1>
        <p className="text-muted-foreground">Follow these steps to complete your tax filing process.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Step 1: Tax Estimation */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Step 1: Tax Estimation</CardTitle>
                <CardDescription>Review the tax estimation document prepared by our team.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {taxEstimationDoc ? (
              <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
                <div>
                    <p className="font-medium">{taxEstimationDoc.documentName}</p>
                    <p className="text-sm text-muted-foreground">Uploaded: {formatDate(taxEstimationDoc.uploadDate)}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={taxEstimationDoc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Download
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">Waiting for admin to upload...</p>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Upload Draft */}
        <Card className={`shadow-md ${!taxEstimationDoc ? 'bg-muted/50' : ''}`}>
          <CardHeader>
             <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full flex items-center justify-center ${!taxEstimationDoc ? 'bg-muted-foreground/20 text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Step 2: Upload Tax Return Draft</CardTitle>
                <CardDescription>Upload your completed tax return draft for our review.</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent>
            {taxReturnDraftDoc ? (
                 <div className="p-4 border border-green-500 bg-green-50 rounded-md text-center">
                    <BadgeCheck className="h-10 w-10 text-green-600 mx-auto mb-2"/>
                    <p className="font-semibold text-green-700">Draft Uploaded!</p>
                    <p className="text-sm text-green-600">{taxReturnDraftDoc.documentName}</p>
                </div>
            ) : (
              <>
                <div className="space-y-2">
                    <label htmlFor="draft-upload" className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg ${!taxEstimationDoc ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-muted'}`}>
                        <div className="text-center text-sm">
                             {fileToUpload ? (
                                <p className="font-medium">{fileToUpload.name}</p>
                            ) : (
                                <p className="text-muted-foreground">Click or drag to select file</p>
                            )}
                        </div>
                         <input id="draft-upload" type="file" className="hidden" onChange={handleFileChange} disabled={!taxEstimationDoc} />
                    </label>
                </div>
                 {uploadingFile && (
                    <div className="mt-2">
                        <Progress value={uploadingFile.progress} className="h-2" />
                    </div>
                 )}
              </>
            )}
          </CardContent>
          <CardFooter>
             {!taxReturnDraftDoc && (
                <Button onClick={handleUpload} className="w-full" disabled={!fileToUpload || !!uploadingFile || !taxEstimationDoc}>
                    {uploadingFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                    Upload Draft
                </Button>
             )}
          </CardFooter>
        </Card>

        {/* Step 3: Final Document */}
        <Card className={`shadow-md ${!taxReturnDraftDoc ? 'bg-muted/50' : ''}`}>
           <CardHeader>
             <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full flex items-center justify-center ${!taxReturnDraftDoc ? 'bg-muted-foreground/20 text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Step 3: Final Document</CardTitle>
                <CardDescription>Download your final, filed tax return document.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
             {finalDoc ? (
              <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
                 <div>
                    <p className="font-medium">{finalDoc.documentName}</p>
                    <p className="text-sm text-muted-foreground">Uploaded: {formatDate(finalDoc.uploadDate)}</p>
                </div>
                <Button asChild variant="default" size="sm">
                  <a href={finalDoc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Download Final
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                {taxReturnDraftDoc ? 'Waiting for admin to upload final document...' : 'Complete Step 2 to proceed.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

       <Card className="mt-8">
        <CardHeader>
            <CardTitle>Need to upload supporting files?</CardTitle>
            <CardDescription>You can upload W-2s, 1099s, or other documents needed for your return.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild variant="secondary">
                <a href="/dashboard/upload">
                    <CircleArrowRight className="mr-2 h-4 w-4"/> Go to General Uploads
                </a>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    