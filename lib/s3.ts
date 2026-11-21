import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { awsClientConfig, awsRegion } from "@/lib/aws";

const BUCKET = process.env.S3_BUCKET_NAME ?? "jk-curryhouse-menu-images";
const REGION = awsRegion();

const s3 = new S3Client(awsClientConfig());

/** Generate a pre-signed upload URL valid for 5 minutes */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
    // No ACL: new S3 buckets have ACLs disabled; public read comes from the bucket policy.
  });
  return getSignedUrl(s3, cmd, { expiresIn: 300 });
}

/** Public CDN URL for a stored object */
export function getPublicUrl(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

/** Delete an object by key */
export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Extract the S3 key from a full public URL */
export function keyFromUrl(url: string): string {
  return url.replace(`https://${BUCKET}.s3.${REGION}.amazonaws.com/`, "");
}
