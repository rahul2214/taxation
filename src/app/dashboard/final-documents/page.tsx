
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinalDocumentsRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/documents');
    }, [router]);
    return null;
}
