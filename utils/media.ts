import { config } from "@/utils/config";

/**
 * Media URL helpers
 * Backend đôi khi trả về:
 * - string absolute: https://...
 * - string relative: /uploads/xxx.jpg hoặc uploads/xxx.jpg
 * - object: { imageUrl } | { url } | { path } | { fileUrl } | { location } | ...
 *
 * React Native <Image/> cần 1 URI hợp lệ (thường là absolute URL hoặc data:).
 */

const ABSOLUTE_URL_RE = /^https?:\/\//i;

export function getApiOrigin(): string {
  const base = config.apiUrl || "";
  // Strip trailing /api/v1 (or /api/v<number>) if present
  const stripped = base.replace(/\/api\/v\d+\/?$/i, "");
  return stripped.replace(/\/$/, "");
}

export function resolveMediaUrl(input?: string | null): string | null {
  if (!input || typeof input !== "string") return null;
  const s = input.trim();
  if (!s) return null;

  if (s.startsWith("data:")) return s;
  if (ABSOLUTE_URL_RE.test(s)) return s;

  const origin = getApiOrigin();
  if (!origin) return s; // best effort

  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("/")) return `${origin}${s}`;
  return `${origin}/${s}`;
}

export function extractMediaUrl(maybe: any): string | null {
  if (!maybe) return null;
  if (typeof maybe === "string") return resolveMediaUrl(maybe);

  if (typeof maybe === "object") {
    const candidate =
      maybe.imageUrl ??
      maybe.url ??
      maybe.fileUrl ??
      maybe.path ??
      maybe.filePath ??
      maybe.location ??
      maybe.uri ??
      maybe.secure_url ??
      null;

    if (typeof candidate === "string") return resolveMediaUrl(candidate);
  }

  return null;
}

export function extractMediaUrls(maybeArr: any): string[] {
  if (!maybeArr) return [];
  const arr = Array.isArray(maybeArr) ? maybeArr : [maybeArr];
  const out: string[] = [];
  for (const item of arr) {
    const u = extractMediaUrl(item);
    if (u) out.push(u);
  }
  return out;
}

