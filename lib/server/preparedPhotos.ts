import {readFileSync} from "node:fs";
import path from "node:path";

export type PreparedPhoto = {avif: string; webp: string; fallback: string};

let photos: Record<string, PreparedPhoto> | undefined;

export function getPreparedPhoto(src: string | undefined): PreparedPhoto | undefined {
  if (!src || process.env.NODE_ENV === "development") return;
  if (!photos) {
    try {
      const manifest = path.join(process.cwd(), ".tmp/prepared-photos.json");
      photos = JSON.parse(readFileSync(manifest, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      photos = {};
    }
  }
  return photos?.[src];
}
