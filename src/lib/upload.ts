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
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.folder) formData.append("folder", options.folder);
    if (options?.userId) formData.append("userId", options.userId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

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
  });
}

/**
 * Deletes a file from Cloudflare R2 object storage by URL or key.
 */
export async function deleteFileFromCloudflare(fileUrlOrKey: string): Promise<boolean> {
  try {
    const res = await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl: fileUrlOrKey }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error("deleteFileFromCloudflare error:", err);
    return false;
  }
}
