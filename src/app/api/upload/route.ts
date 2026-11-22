import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, deleteFromR2, isR2Configured, keyFromStoredUrl } from "@/lib/cloudflare/r2";
import { getAdminSession } from "@/lib/server/admin-auth";
import { getUserFromRequest, isSupabaseAdminConfigured } from "@/lib/supabase/server";

/**
 * Who is uploading: an admin (admin session cookie) or a signed-in customer
 * (Authorization: Bearer <Supabase access token>). Anyone else is refused.
 * Customers can only write to, and delete from, customers/<their user id>/.
 */
type Caller = { kind: "admin" } | { kind: "customer"; userId: string };

const ADMIN_FOLDERS = new Set(["admin_uploads", "global_forms", "documents", "customers"]);

async function getCaller(req: NextRequest): Promise<Caller | null> {
  if (getAdminSession(req)) return { kind: "admin" };
  if (!isSupabaseAdminConfigured) return null;
  const user = await getUserFromRequest(req).catch(() => null);
  return user ? { kind: "customer", userId: user.id } : null;
}

const unauthorized = () => NextResponse.json({ error: "Please sign in to upload or delete files." }, { status: 401 });

export async function POST(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller) return unauthorized();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let folder = (formData.get("folder") as string) || "documents";
    let userId = (formData.get("userId") as string) || "general";
    if (caller.kind === "customer") {
      // Customers always upload into their own folder, whatever the form says.
      folder = "customers";
      userId = caller.userId;
    } else if (!ADMIN_FOLDERS.has(folder)) {
      folder = "admin_uploads";
    }

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

    // Sanitize every path segment. The bucket is private: files open only through
    // /api/files, which checks the folder owner and returns a short-lived signed link.
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
    const caller = await getCaller(req);
    if (!caller) return unauthorized();

    const { fileUrl, key } = await req.json();
    if (!fileUrl && !key) {
      return NextResponse.json({ error: "No fileUrl or key provided" }, { status: 400 });
    }

    // Only delete objects in this app's own folders.
    const targetKey = keyFromStoredUrl(String(key || fileUrl));
    if (!targetKey) {
      return NextResponse.json({ error: "Not a file managed by this site" }, { status: 400 });
    }
    // Customer user ids are UUIDs, so they contain no characters the upload sanitizer changes.
    if (caller.kind === "customer" && !targetKey.startsWith(`customers/${caller.userId}/`)) {
      return NextResponse.json({ error: "You can only delete your own files." }, { status: 403 });
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
