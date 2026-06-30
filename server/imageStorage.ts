import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Readable } from "stream";

const SIDECAR = "http://127.0.0.1:1106";

function getStorageConfig(): { bucketName: string; prefix: string } | null {
  const dir = (process.env.PRIVATE_OBJECT_DIR || "").trim();
  if (!dir || dir.startsWith("#") || dir === "/your-bucket/private") return null;
  const parts = dir.replace(/^\//, "").split("/");
  return { bucketName: parts[0], prefix: parts.slice(1).join("/") };
}

async function signUrl(
  bucketName: string,
  objectName: string,
  method: "PUT" | "GET",
  ttlSec: number
): Promise<string> {
  const res = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`Sidecar ${res.status}`);
  const { signed_url } = await res.json();
  return signed_url;
}

function saveToLocalFs(buffer: Buffer, ext: string): string {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir, name), buffer);
  return `/uploads/${name}`;
}

export async function saveImage(buffer: Buffer, ext: string): Promise<string> {
  const config = getStorageConfig();
  if (!config) return saveToLocalFs(buffer, ext);

  try {
    const { bucketName, prefix } = config;
    const objectName = `${prefix ? prefix + "/" : ""}uploads/${randomUUID()}.${ext}`;
    const putUrl = await signUrl(bucketName, objectName, "PUT", 900);
    const ct = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
    const up = await fetch(putUrl, {
      method: "PUT",
      body: buffer,
      headers: { "Content-Type": ct },
    });
    if (!up.ok) throw new Error(`GCS upload ${up.status}`);
    return `/api/img/${bucketName}/${objectName}`;
  } catch (err) {
    console.warn("[imageStorage] Object storage unavailable, using local fs:", (err as Error).message);
    return saveToLocalFs(buffer, ext);
  }
}

export async function serveStoredImage(
  bucketName: string,
  objectName: string,
  res: any
): Promise<void> {
  try {
    const getUrl = await signUrl(bucketName, objectName, "GET", 3600);
    const upstream = await fetch(getUrl);
    if (!upstream.ok) { res.status(404).end(); return; }
    const ct = upstream.headers.get("content-type") || "image/jpeg";
    res.set("Content-Type", ct);
    res.set("Cache-Control", "public, max-age=86400");
    Readable.fromWeb(upstream.body as any).pipe(res);
  } catch {
    res.status(404).end();
  }
}
