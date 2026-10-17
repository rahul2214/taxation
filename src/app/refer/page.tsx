"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFirebase } from "@/firebase";

function ReferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useFirebase();

  useEffect(() => {
    if (isUserLoading) return;

    const ref = searchParams.get("ref");
    if (user) {
      router.replace("/dashboard/refer");
    } else {
      const target = ref ? `/signup?ref=${encodeURIComponent(ref)}` : "/signup";
      router.replace(target);
    }
  }, [user, isUserLoading, router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}

export default function ReferPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <ReferContent />
    </Suspense>
  );
}
