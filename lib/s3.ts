import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.S3_BUCKET_NAME ?? "jk-curryhouse-menu-images";
const REGION = process.env.AWS_REGION     ?? "eu-west-2";

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID     ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

/** Generate a pre-signed upload URL valid for 5 minutes */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
    ACL:         "public-read",
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
