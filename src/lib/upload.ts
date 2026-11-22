import { createTaxDocument, replaceTaxDocumentFile, type TaxDocumentRecord } from "@/lib/supabase/services";
import { supabase } from "@/lib/supabase/client";

/**
 * Auth header for /api/upload: the customer's Supabase access token. Admin pages send
 * no token; their httpOnly admin session cookie goes with the request automatically.
 */
async function uploadAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export interface UploadOptions {
  folder?: string; // e.g. "customers", "admin_uploads", "global_forms"
  userId?: string;
  onProgress?: (percent: number) => void;
}

export interface UploadResult {
  url: string;
  key: string;
  name: string;
  size: number;
}

/** Thrown when the browser could not reach R2 at all (e.g. the bucket's CORS rule is missing). */
class DirectUploadNetworkError extends Error {}

/** Sends a file with XMLHttpRequest so upload progress can be reported. */
function sendWithProgress(
  method: string,
  url: string,
  body: Document | XMLHttpRequestBodyInit,
  headers: Record<string, string>,
  options: { withCredentials?: boolean; onProgress?: (percent: number) => void }
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (options.withCredentials) xhr.withCredentials = true;
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    if (xhr.upload && options.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) options.onProgress!((event.loaded / event.total) * 100);
      };
    }
    xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
    xhr.onerror = () => reject(new DirectUploadNetworkError("Network error during file upload."));
    xhr.send(body);
  });
}

/**
 * Uploads straight from the browser to Cloudflare R2 with a signed link from /api/upload,
 * so the file doesn't pass through the web host (no 4.5 MB request limit).
 */
async function uploadDirectToR2(file: File, options: UploadOptions | undefined, authHeaders: Record<string, string>): Promise<UploadResult> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    credentials: "same-origin",
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      folder: options?.folder,
      userId: options?.userId,
    }),
  });
  const ticket = await res.json().catch(() => ({}));
  if (!res.ok || !ticket.uploadUrl) {
    throw new Error(ticket.error || `Upload failed with HTTP status ${res.status}`);
  }

  const put = await sendWithProgress("PUT", ticket.uploadUrl, file, ticket.headers || {}, {
    onProgress: options?.onProgress,
  });
  if (put.status < 200 || put.status >= 300) {
    throw new Error(`Cloudflare rejected the upload (HTTP ${put.status}). Please try again.`);
  }
  options?.onProgress?.(100);
  return { url: ticket.url, key: ticket.key, name: file.name, size: file.size };
}

/** The old way: the file goes to /api/upload, which uploads it to R2. */
async function uploadThroughServer(file: File, options: UploadOptions | undefined, authHeaders: Record<string, string>): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.folder) formData.append("folder", options.folder);
  if (options?.userId) formData.append("userId", options.userId);

  let result: { status: number; text: string };
  try {
    result = await sendWithProgress("POST", "/api/upload", formData, authHeaders, {
      withCredentials: true,
      onProgress: options?.onProgress,
    });
  } catch {
    throw new Error("Network error during file upload. Please check your internet connection.");
  }
  if (result.status === 413) {
    throw new Error("This file is too large to upload right now. Please try a smaller file or contact us.");
  }
  let response: any;
  try {
    response = JSON.parse(result.text);
  } catch {
    throw new Error(result.text || "Unexpected error parsing upload response");
  }
  if (result.status < 200 || result.status >= 300 || !response.success) {
    throw new Error(response.error || `Upload failed with HTTP status ${result.status}`);
  }
  options?.onProgress?.(100);
  return { url: response.url, key: response.key, name: response.name, size: response.size };
}

// Small enough to fit through any host's request limit (Vercel's is 4.5 MB).
const SERVER_FALLBACK_MAX_BYTES = 4 * 1024 * 1024;

/**
 * Uploads a file to Cloudflare R2 with progress callbacks: straight from the browser to R2
 * (any size up to 50 MB). If the browser can't reach R2 at all (for example the bucket's
 * CORS rule is missing), small files fall back to going through the server.
 */
export async function uploadFileToCloudflare(file: File, options?: UploadOptions): Promise<UploadResult> {
  const authHeaders = await uploadAuthHeaders();
  try {
    return await uploadDirectToR2(file, options, authHeaders);
  } catch (err) {
    if (!(err instanceof DirectUploadNetworkError)) throw err;
    console.warn("Direct upload to R2 failed (check the bucket's CORS rule); trying through the server.");
    if (file.size > SERVER_FALLBACK_MAX_BYTES) {
      throw new Error("Couldn't reach file storage to upload this file. Please try again, or contact us if it keeps happening.");
    }
    options?.onProgress?.(0);
    return uploadThroughServer(file, options, authHeaders);
  }
}

/**
 * Uploads a tax document to Cloudflare R2, then records its URL in public.tax_documents.
 * The two steps succeed or fail together: if the database insert fails, the file is
 * removed from R2 again and the error is thrown, so no file is left without a record.
 */
export async function uploadTaxDocument(
  file: File,
  options: UploadOptions,
  record: Omit<TaxDocumentRecord, "file_url">
): Promise<{ upload: UploadResult; document: any }> {
  const upload = await uploadFileToCloudflare(file, options);
  try {
    const document = await createTaxDocument({ ...record, file_url: upload.url });
    return { upload, document };
  } catch (dbErr: any) {
    await deleteFileFromCloudflare(upload.key);
    throw new Error(
      `The file was uploaded but could not be saved to your records (${dbErr?.message || "database error"}). Please try again.`
    );
  }
}

/**
 * Replaces the file of an existing tax document: uploads the new file to R2, points the
 * document at it, and the server deletes the old file. If the database update fails, the
 * new upload is removed again so nothing is left behind.
 */
export async function replaceTaxDocument(
  documentId: string,
  file: File,
  options: UploadOptions
): Promise<{ upload: UploadResult; document: any }> {
  const upload = await uploadFileToCloudflare(file, options);
  try {
    const document = await replaceTaxDocumentFile(documentId, upload.url, file.name);
    return { upload, document };
  } catch (dbErr: any) {
    await deleteFileFromCloudflare(upload.key);
    throw new Error(`The new file could not replace the old one (${dbErr?.message || "database error"}). Please try again.`);
  }
}

/**
 * Deletes a file from Cloudflare R2 object storage by URL or key.
 */
export async function deleteFileFromCloudflare(fileUrlOrKey: string): Promise<boolean> {
  try {
    const res = await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...(await uploadAuthHeaders()) },
      credentials: "same-origin",
      body: JSON.stringify({ fileUrl: fileUrlOrKey }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error("deleteFileFromCloudflare error:", err);
    return false;
  }
}

/**
 * Opens a stored file link (/api/files/<key>) in a new tab. The bucket is private, so this
 * asks /api/files for a short-lived signed link first, sending the customer's access token
 * (admins are recognised by their session cookie).
 * The tab is opened before the request so pop-up blockers allow it.
 */
export async function openStoredFile(storedUrl: string): Promise<void> {
  const tab = typeof window !== "undefined" ? window.open("", "_blank") : null;
  try {
    const sep = storedUrl.includes("?") ? "&" : "?";
    const res = await fetch(`${storedUrl}${sep}json=1`, {
      headers: await uploadAuthHeaders(),
      credentials: "same-origin",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || `Could not open the file (HTTP ${res.status}).`);
    if (tab) {
      tab.opener = null;
      tab.location.href = data.url;
    } else {
      window.location.href = data.url;
    }
  } catch (err: any) {
    tab?.close();
    if (typeof window !== "undefined") window.alert(err?.message || "Could not open the file.");
  }
}

/** Props for an <a> that opens a stored file through openStoredFile. */
export function storedFileLinkProps(storedUrl: string) {
  return {
    href: storedUrl,
    onClick: (e: { preventDefault: () => void }) => {
      e.preventDefault();
      void openStoredFile(storedUrl);
    },
  };
}
