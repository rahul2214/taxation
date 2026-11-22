"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { PageHeading } from "@/components/portal/PageHeading";
import {
  createBasicInfoDocument,
  deleteBasicInfoDocument,
  getBasicInfoDocuments,
  updateBasicInfoDocument,
  type BasicInfoDocumentRecord,
} from "@/lib/supabase/services";
import { deleteFileFromCloudflare, storedFileLinkProps, uploadFileToCloudflare } from "@/lib/upload";

const FOLDER = "basic_info";

const formatSize = (bytes?: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Files shared with every client under "Basic information" in the client portal. */
export default function AdminBasicInfoPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<BasicInfoDocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New document form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Row actions
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<BasicInfoDocumentRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (force = false) => {
    try {
      setDocuments(await getBasicInfoDocuments(force ? { forceRefresh: true } : undefined));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't load documents", description: err?.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !file) {
      toast({ variant: "destructive", title: "Missing information", description: "Add a title and choose a file." });
      return;
    }
    setProgress(0);
    let uploadedKey: string | null = null;
    try {
      const upload = await uploadFileToCloudflare(file, { folder: FOLDER, onProgress: setProgress });
      uploadedKey = upload.key;
      await createBasicInfoDocument({
        title: title.trim(),
        description: description.trim(),
        file_url: upload.url,
        file_name: file.name,
        file_size: file.size,
      });
      uploadedKey = null;
      toast({ title: "Document added", description: `${title.trim()} is now visible to every client.` });
      setTitle("");
      setDescription("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load(true);
    } catch (err: any) {
      // Don't leave a file in storage without a record.
      if (uploadedKey) await deleteFileFromCloudflare(uploadedKey);
      toast({ variant: "destructive", title: "Upload failed", description: err?.message || "Please try again." });
    } finally {
      setProgress(null);
    }
  };

  const startReplace = (doc: BasicInfoDocumentRecord) => {
    setReplaceTarget(doc);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const newFile = e.target.files?.[0];
    const target = replaceTarget;
    if (!newFile || !target) return;
    setBusyId(target.id);
    let uploadedKey: string | null = null;
    try {
      const upload = await uploadFileToCloudflare(newFile, { folder: FOLDER });
      uploadedKey = upload.key;
      // The server points the record at the new file and deletes the old one.
      await updateBasicInfoDocument(target.id, { file_url: upload.url, file_name: newFile.name, file_size: newFile.size });
      uploadedKey = null;
      toast({ title: "File replaced", description: `${target.title} now uses ${newFile.name}. The old file was deleted.` });
      await load(true);
    } catch (err: any) {
      if (uploadedKey) await deleteFileFromCloudflare(uploadedKey);
      toast({ variant: "destructive", title: "Replace failed", description: err?.message || "Please try again." });
    } finally {
      setBusyId(null);
      setReplaceTarget(null);
    }
  };

  const handleToggleVisible = async (doc: BasicInfoDocumentRecord, visible: boolean) => {
    setBusyId(doc.id);
    try {
      await updateBasicInfoDocument(doc.id, { is_active: visible });
      await load(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't update", description: err?.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (doc: BasicInfoDocumentRecord) => {
    if (!window.confirm(`Delete "${doc.title}"? Clients won't see it any more and the file will be removed from storage.`)) return;
    setBusyId(doc.id);
    try {
      await deleteBasicInfoDocument(doc.id);
      toast({ title: "Document deleted", description: `${doc.title} and its file were deleted.` });
      await load(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete failed", description: err?.message || "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const isUploading = progress !== null;

  return (
    <div className="space-y-6">
      <input ref={replaceInputRef} type="file" className="hidden" onChange={handleReplaceFile} />
      <PageHeading
        title="Basic information"
        description="Files every client can download from Basic information in their portal."
      />

      <Card>
        <CardHeader>
          <CardTitle>Add a document</CardTitle>
          <CardDescription>Upload a file and give it a title clients will recognise.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bi-title">Title</Label>
              <Input
                id="bi-title"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Welcome pack and checklist"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bi-file">File</Label>
              <Input id="bi-file" ref={fileInputRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bi-description">Description (optional)</Label>
            <Textarea
              id="bi-description"
              value={description}
              maxLength={1000}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this document is and when clients need it"
            />
          </div>
          {isUploading && <Progress value={progress ?? 0} className="h-2" />}
          <div>
            <Button onClick={handleCreate} disabled={isUploading || !title.trim() || !file}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload document
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Hidden documents stay here but clients can't see them.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Visible to clients</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No documents yet.
                    </TableCell>
                  </TableRow>
                )}
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <p className="font-medium">{doc.title}</p>
                      {doc.description && <p className="line-clamp-2 text-xs text-muted-foreground">{doc.description}</p>}
                    </TableCell>
                    <TableCell className="text-sm">
                      <p className="max-w-[220px] truncate">{doc.file_name || "File"}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</p>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={doc.is_active}
                        disabled={busyId === doc.id}
                        onCheckedChange={(v) => handleToggleVisible(doc, v)}
                        aria-label={`Visible to clients: ${doc.title}`}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {busyId === doc.id ? (
                        <Loader2 className="inline h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Button asChild variant="ghost" size="icon" title="Download">
                            <a {...storedFileLinkProps(doc.file_url)} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" title="Replace file" onClick={() => startReplace(doc)}>
                            <RefreshCw className="h-4 w-4" />
                            <span className="sr-only">Replace file</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
