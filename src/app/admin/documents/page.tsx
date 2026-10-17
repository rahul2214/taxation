
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, File as FileIcon } from "lucide-react";
import { useState, ChangeEvent, useEffect } from "react";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getSiteSettings, updateSiteSettings } from "@/lib/supabase/services";

type UploadingFile = {
  name: string;
  progress: number;
  error?: string;
};

type FormType = 'currentYearFormUrl' | 'priorYearFormUrl';

export default function SiteFormsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const formsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'siteSettings', 'taxForms') : null, [firestore]);
  const { data: formsData, isLoading: isLoadingForms } = useDoc(formsDocRef);

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [currentYearUrl, setCurrentYearUrl] = useState<string | null>(null);
  const [priorYearUrl, setPriorYearUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await getSiteSettings();
        if (s?.current_year_form_url) setCurrentYearUrl(s.current_year_form_url);
        if (s?.prior_year_form_url) setPriorYearUrl(s.prior_year_form_url);
      } catch (err) {
        console.error("Error loading Supabase site settings:", err);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (formsData) {
      if (formsData.currentYearFormUrl) setCurrentYearUrl(formsData.currentYearFormUrl);
      if (formsData.priorYearFormUrl) setPriorYearUrl(formsData.priorYearFormUrl);
    }
  }, [formsData]);

  const uploadFile = (file: File, formType: FormType) => {
    const storage = getStorage();
    const storageRef = ref(storage, `global_forms/${formType}_${Date.now()}_${file.name}`);
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
            description: `Could not upload ${file.name}. Please check storage permissions.`,
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          // 1. Update in Supabase
          try {
            await updateSiteSettings({
              current_year_form_url: formType === 'currentYearFormUrl' ? downloadURL : currentYearUrl,
              prior_year_form_url: formType === 'priorYearFormUrl' ? downloadURL : priorYearUrl,
            });
          } catch (sbErr) {
            console.warn("Supabase site settings update warning:", sbErr);
          }

          // 2. Update in Firestore if configured
          if (formsDocRef) {
            try {
              await setDoc(formsDocRef, { [formType]: downloadURL }, { merge: true });
            } catch (fsErr) {
              console.warn("Firestore site settings update warning:", fsErr);
            }
          }

          setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
          toast({
              title: "Upload Successful",
              description: `${file.name} has been uploaded.`,
          });
          
          if (formType === 'currentYearFormUrl') {
              setCurrentYearUrl(downloadURL);
          } else {
              setPriorYearUrl(downloadURL);
          }
        });
      }
    );
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, formType: FormType) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file, formType);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Site Forms</CardTitle>
        <CardDescription>Upload and manage forms that are downloadable by all users.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 py-4">
        {isLoadingForms ? (
             <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
        <>
            <div className="space-y-2">
                <Label htmlFor="currentYearForm">Current Year Form</Label>
                <Input id="currentYearForm" type="file" onChange={(e) => handleFileChange(e, 'currentYearFormUrl')} />
                {currentYearUrl && <a href={currentYearUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"><FileIcon className="h-3 w-3" /> View/Download Current Form</a>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="priorYearForm">Prior Year Form</Label>
                <Input id="priorYearForm" type="file" onChange={(e) => handleFileChange(e, 'priorYearFormUrl')} />
                {priorYearUrl && <a href={priorYearUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"><FileIcon className="h-3 w-3" /> View/Download Current Form</a>}
            </div>
        </>
        )}
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
  );
}
