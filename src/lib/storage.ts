import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

const localDir = path.join(process.cwd(), "uploads");

function s3() {
  if (!env.STORAGE_BUCKET || !env.STORAGE_ACCESS_KEY || !env.STORAGE_SECRET_KEY) return null;
  return new S3Client({
    region: env.STORAGE_REGION || "us-east-1",
    endpoint: env.STORAGE_ENDPOINT || undefined,
    credentials: {
      accessKeyId: env.STORAGE_ACCESS_KEY,
      secretAccessKey: env.STORAGE_SECRET_KEY,
    },
    forcePathStyle: Boolean(env.STORAGE_ENDPOINT),
  });
}

export async function storeFile(file: File) {
  const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const client = s3();
  if (client && env.STORAGE_BUCKET) {
    await client.send(
      new PutObjectCommand({
        Bucket: env.STORAGE_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: file.type,
      }),
    );
    return key;
  }
  const fullPath = path.join(localDir, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);
  return key;
}

export async function readStoredFile(key: string) {
  const client = s3();
  if (client && env.STORAGE_BUCKET) {
    const signed = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }),
      { expiresIn: 60 },
    );
    const response = await fetch(signed);
    if (!response.ok) throw new Error("Unable to read stored file");
    return Buffer.from(await response.arrayBuffer());
  }
  return readFile(path.join(localDir, key));
}

export async function signedReadUrl(key: string) {
  const client = s3();
  if (client && env.STORAGE_BUCKET) {
    return getSignedUrl(client, new GetObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }), {
      expiresIn: 120,
    });
  }
  return `/api/files/local?key=${encodeURIComponent(key)}`;
}
