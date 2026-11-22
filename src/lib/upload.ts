import { createTaxDocument, type TaxDocumentRecord } from "@/lib/supabase/services";
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

/**
 * Uploads a file to Cloudflare R2 object storage via /api/upload with real-time progress callbacks.
 */
export function uploadFileToCloudflare(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  return uploadAuthHeaders().then((authHeaders) => new Promise<UploadResult>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.folder) formData.append("folder", options.folder);
    if (options?.userId) formData.append("userId", options.userId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.withCredentials = true;
    for (const [name, value] of Object.entries(authHeaders)) xhr.setRequestHeader(name, value);

    if (xhr.upload && options?.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          options.onProgress!(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          if (options?.onProgress) options.onProgress(100);
          resolve({
            url: response.url,
            key: response.key,
            name: response.name,
            size: response.size,
          });
        } else {
          reject(new Error(response.error || `Upload failed with HTTP status ${xhr.status}`));
        }
      } catch (e: any) {
        reject(new Error(xhr.responseText || "Unexpected error parsing upload response"));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during file upload. Please check your internet connection."));
    };

    xhr.send(formData);
  }));
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
