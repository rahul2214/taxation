import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'polaris-tax-documents';
const publicUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL;

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && bucketName
);

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

export function getR2PublicUrl(key: string): string {
  if (publicUrl) {
    const cleanPublic = publicUrl.replace(/\/+$/, '');
    const cleanKey = key.replace(/^\/+/, '');
    return `${cleanPublic}/${cleanKey}`;
  }
  // Default to standard R2 URL
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
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
    url: getR2PublicUrl(key),
  };
}

export async function deleteFromR2(keyOrUrl: string): Promise<boolean> {
  if (!isR2Configured) return false;
  try {
    let key = keyOrUrl;
    if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
      const parsedUrl = new URL(keyOrUrl);
      key = parsedUrl.pathname.replace(/^\/+/, '');
    }

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
