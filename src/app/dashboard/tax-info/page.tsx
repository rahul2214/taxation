
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

export default function TaxInfoPage() {
  const { firestore, user } = useFirebase();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `customers/${user.uid}`);
  }, [user, firestore]);

  const { data: userData, isLoading } = useDoc(userDocRef);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Tax Information</h1>
        <p className="text-muted-foreground">Download your tax information documents here.</p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Download Tax Information Documents</CardTitle>
          <CardDescription>
            Access the latest and previous year tax information forms below.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                {userData?.currentYearFormUrl ? (
                  <Button asChild variant="outline">
                    <a href={userData.currentYearFormUrl} target="_blank" rel="noopener noreferrer">
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
                {userData?.priorYearFormUrl ? (
                  <Button asChild variant="outline">
                    <a href={userData.priorYearFormUrl} target="_blank" rel="noopener noreferrer">
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
