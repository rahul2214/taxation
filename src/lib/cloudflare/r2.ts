import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'polaris-tax-documents';

// Values copied unchanged from .env.example ("your_..._here", "pub-yourbucketid") are not real settings.
const isPlaceholder = (v?: string) => !v || /your[_-]|yourbucketid|_here$/i.test(v);

export const isR2Configured =
  !isPlaceholder(accountId) &&
  !isPlaceholder(accessKeyId) &&
  !isPlaceholder(secretAccessKey) &&
  !isPlaceholder(bucketName);

/**
 * The bucket is private. The database stores an app path, /api/files/<key>, never a
 * bucket URL; /api/files checks who is asking and hands out a short-lived signed link.
 */
export const FILE_ROUTE = "/api/files/";
export const MANAGED_KEY = /^(customers|admin_uploads|global_forms|basic_info|documents)\/[^?#]+$/;

/** The object key from a stored file link: /api/files/<key>, or an older full R2 URL. */
export function keyFromStoredUrl(stored: string): string | null {
  if (!stored) return null;
  let path = stored;
  try {
    path = new URL(stored, "http://local").pathname;
  } catch {
    return null;
  }
  path = decodeURIComponent(path).replace(/^\/+/, "");
  if (path.startsWith("api/files/")) path = path.slice("api/files/".length);
  const m = path.match(/(?:^|\/)((?:customers|admin_uploads|global_forms|basic_info|documents)\/.+)$/);
  const key = m?.[1] || "";
  if (!MANAGED_KEY.test(key) || key.split("/").includes("..")) return null;
  return key;
}

let r2ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!r2ClientInstance) {
    if (!isR2Configured) {
      throw new Error(
        "Cloudflare R2 is not configured. Please set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME in your environment."
      );
    }
    r2ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
  }
  return r2ClientInstance;
}

/** A signed GET link for one object, valid for `expiresIn` seconds. */
export async function getSignedDownloadUrl(key: string, expiresIn = 300): Promise<string> {
  // Keys look like <folder>/<owner>/<uuid>_<original name>; show the original name when saved.
  const fileName = (key.split("/").pop() || "file").replace(/^[0-9a-f-]{36}_/i, "");
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: `inline; filename="${fileName.replace(/"/g, "")}"`,
    }),
    { expiresIn }
  );
}

/**
 * A signed PUT link the browser uses to upload one file straight to R2, so large files
 * never pass through (and hit the request size limit of) the web host. The signature
 * covers the key, content type and exact size, so the link can't be reused for another
 * file or a bigger one.
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  size: number,
  expiresIn = 600
): Promise<string> {
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: contentType, ContentLength: size }),
    { expiresIn, signableHeaders: new Set(["content-type", "content-length"]) }
  );
}

export async function uploadToR2(
  key: string,
  buffer: Buffer | Uint8Array,
  contentType: string
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    })
  );

  return {
    key,
    url: `${FILE_ROUTE}${key}`,
  };
}

export async function deleteFromR2(keyOrUrl: string): Promise<boolean> {
  if (!isR2Configured) return false;
  try {
    const key = keyFromStoredUrl(keyOrUrl);
    if (!key) return false;

    const client = getR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.error("Error deleting from Cloudflare R2:", err);
    return false;
  }
}
