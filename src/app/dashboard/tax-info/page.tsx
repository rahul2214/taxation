
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { getSiteSettings } from "@/lib/supabase/services";

export default function TaxInfoPage() {
  const { firestore } = useFirebase();

  const formsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, `siteSettings/taxForms`);
  }, [firestore]);

  const { data: formsData, isLoading: isFsLoading } = useDoc(formsDocRef);
  const [sbSettings, setSbSettings] = useState<{ current_year_form_url?: string | null; prior_year_form_url?: string | null } | null>(null);
  const [isSbLoading, setIsSbLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const s = await getSiteSettings();
        setSbSettings(s);
      } catch (e) {
        console.error("Error loading Supabase site settings:", e);
      } finally {
        setIsSbLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const currentYearUrl = formsData?.currentYearFormUrl || sbSettings?.current_year_form_url;
  const priorYearUrl = formsData?.priorYearFormUrl || sbSettings?.prior_year_form_url;
  const isLoading = (isFsLoading && firestore) && isSbLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Download Tax Information Documents</h1>
        <p className="text-muted-foreground">Access the latest and previous year tax information forms below.</p>
      </div>
      <Separator />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div>
                  <p className="font-semibold">Current Year Form</p>
                  <p className="text-sm text-muted-foreground">The most recent tax information form provided by our team.</p>
                </div>
                {currentYearUrl ? (
                  <Button asChild variant="outline">
                    <a href={currentYearUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" disabled>Not Available</Button>
                )}
              </div>
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div>
                  <p className="font-semibold">Prior Year Form</p>
                  <p className="text-sm text-muted-foreground">The tax information form from the previous year.</p>
                </div>
                {priorYearUrl ? (
                  <Button asChild variant="outline">
                    <a href={priorYearUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" disabled>Not Available</Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
