"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ReferPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/refer");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
