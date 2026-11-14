import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, deleteFromR2, isR2Configured, isR2PublicUrlConfigured } from "@/lib/cloudflare/r2";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "documents";
    const userId = (formData.get("userId") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Protection: Max file size 50MB
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the maximum allowed size of 50MB." },
        { status: 413 }
      );
    }

    // Protection: Block potentially dangerous executable file extensions
    const dangerousExtensions = /\.(exe|bat|cmd|sh|php|pl|cgi|vbs|msi|scr|pif|jar)$/i;
    if (dangerousExtensions.test(file.name)) {
      return NextResponse.json(
        { error: "Executable and script files are strictly prohibited for security reasons." },
        { status: 400 }
      );
    }

    if (!isR2Configured) {
      return NextResponse.json(
        {
          error: "Cloudflare R2 storage is not configured. Please add CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME to your environment variables.",
          isConfigured: false,
        },
        { status: 503 }
      );
    }

    if (!isR2PublicUrlConfigured) {
      return NextResponse.json(
        {
          error: "Cloudflare R2 public URL is not configured. Set NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL to your bucket's r2.dev URL or custom domain, otherwise saved file links will not open.",
          isConfigured: false,
        },
        { status: 503 }
      );
    }

    // Sanitize every path segment. The random UUID makes file URLs unguessable,
    // which matters because these are tax documents served from a public bucket URL.
    const safeSegment = (v: string) => v.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'general';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
    const key = `${safeSegment(folder)}/${safeSegment(userId)}/${crypto.randomUUID()}_${cleanFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { url } = await uploadToR2(key, buffer, file.type || "application/octet-stream");

    return NextResponse.json({
      success: true,
      url,
      key,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("API /api/upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file to Cloudflare" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { fileUrl, key } = await req.json();
    if (!fileUrl && !key) {
      return NextResponse.json({ error: "No fileUrl or key provided" }, { status: 400 });
    }

    // Only delete objects in this app's own folders.
    const target: string = key || fileUrl;
    const targetKey = /^https?:\/\//.test(target) ? new URL(target).pathname.replace(/^\/+/, "") : target;
    if (!/^(customers|admin_uploads|global_forms|documents)\//.test(targetKey)) {
      return NextResponse.json({ error: "Not a file managed by this site" }, { status: 400 });
    }
    const success = await deleteFromR2(targetKey);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error("API /api/upload DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete file from Cloudflare" },
      { status: 500 }
    );
  }
}
