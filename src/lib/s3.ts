import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3 client for Emerse photo storage.
 *
 * Requires AWS credentials and bucket configuration.
 * See MANUAL_SETUP.md for S3 setup instructions.
 */

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME ?? "emerse-photos";

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  expiresAt: Date;
}

/**
 * Generate a presigned URL for uploading a file to S3.
 * The client can use this URL to upload directly to S3.
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  userId: string
): Promise<PresignedUploadResult> {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `uploads/${userId}/${timestamp}-${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  });

  const expiresAt = new Date(Date.now() + 3600 * 1000);

  return {
    uploadUrl,
    key,
    expiresAt,
  };
}

/**
 * Get the public URL for an S3 object.
 * In production, this would be a CloudFront URL.
 */
export function getPublicUrl(key: string): string {
  // TODO: Use CloudFront distribution URL in production
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
