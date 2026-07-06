import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const REQUIRED_ENV = ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_PUBLIC_URL_BASE'];

function createClient() {
  if (!REQUIRED_ENV.every((key) => process.env[key])) return null;
  return new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
}

export const s3Client = createClient();
const bucket = process.env.S3_BUCKET;
const publicUrlBase = process.env.S3_PUBLIC_URL_BASE?.replace(/\/$/, '');

export async function uploadFile(key, buffer, contentType) {
  await s3Client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType })
  );
  return `${publicUrlBase}/${key}`;
}
