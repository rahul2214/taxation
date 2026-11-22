"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { PageHeading } from "@/components/portal/PageHeading";
import { getBasicInfoDocuments, type BasicInfoDocumentRecord } from "@/lib/supabase/services";
import { storedFileLinkProps } from "@/lib/upload";

const formatSize = (bytes?: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "");

/** Files the team shares with every client (welcome pack, checklists, guides). */
export default function BasicInfoPage() {
  const [documents, setDocuments] = useState<BasicInfoDocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBasicInfoDocuments()
      .then(setDocuments)
      .catch((err) => console.error("Error loading basic information documents:", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Basic information"
        description="Guides and information from our team to help you get ready for your return."
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing here yet. Our team will add information for you soon.
            </p>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="font-semibold">{doc.title}</p>
                      {doc.description && (
                        <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">{doc.description}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[doc.file_name, formatSize(doc.file_size), formatDate(doc.updated_at || doc.created_at)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="shrink-0">
                    <a {...storedFileLinkProps(doc.file_url)} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
