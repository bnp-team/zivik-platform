/**
 * Pictures uploaded in the admin, turned into files the site serves itself.
 *
 * An `image` field with `upload` (site/content/collections.ts) holds what the
 * admin's media picker stored: an id, the R2 storage key in `meta`, or a
 * direct URL in `src`. The site is prerendered, and its pages read a path –
 * `photo: "/team/…jpg"` – so at build time each upload is fetched from the
 * running site's public media route, sized for where it appears, written to
 * public/media/, and its path put where the page reads it. The page code does
 * not know an upload happened, and a reader is served a small static file
 * rather than the full-size original through the Worker.
 *
 * Sizes, measured against where each picture is drawn:
 *   portrait – the whole photograph, at most 640×800 (never cropped here: the
 *              team page frames it 4:5 and the editor picks the focus);
 *   logo     – at most 1040×296, the partner plate draws 520×148 (2×),
 *              PNG so a transparent mark stays transparent;
 *   cover    – 1600×900, the post's cover spans the 820px column (2×), 16:9.
 *
 * Never fails the build. A picture that cannot be fetched or read is
 * reported and the entry falls back to its path field, if it has one.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { COLLECTIONS, type CollectionSpec, type Prop } from "../../site/content/collections";

type Obj = Record<string, unknown>;
type Upload = NonNullable<Prop["upload"]>;

const OUT_DIR = resolve("public/media");

/** Where the running site answers for media – the same Worker the admin is on. */
function mediaBase(): string {
  const base = process.env.EMDASH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://nasvitlo.ucu.edu.ua";
  return base.replace(/\/$/, "");
}

function sourceUrl(v: Obj): string | null {
  const meta = (v.meta ?? {}) as Obj;
  const key = typeof meta.storageKey === "string" ? meta.storageKey : null;
  if (key) return `${mediaBase()}/_emdash/api/media/file/${key.split("/").map(encodeURIComponent).join("/")}`;
  if (typeof v.src === "string" && /^https?:\/\//.test(v.src)) return v.src;
  return null;
}

async function render(bytes: Buffer, profile: Upload["profile"]): Promise<{ data: Buffer; ext: string }> {
  const img = sharp(bytes, { failOn: "none" }).rotate();
  switch (profile) {
    case "portrait":
      return {
        data: await img.resize(640, 800, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer(),
        ext: "jpg",
      };
    case "cover":
      return {
        data: await img.resize(1600, 900, { fit: "cover", position: "attention" }).jpeg({ quality: 80, mozjpeg: true }).toBuffer(),
        ext: "jpg",
      };
    case "logo":
      return {
        data: await img.resize(1040, 296, { fit: "inside", withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer(),
        ext: "png",
      };
  }
}

const done = new Map<string, string>();

/** The site path for one upload, fetching and writing it once per build. */
async function materialize(v: Obj, upload: Upload, where: string): Promise<string | null> {
  const url = sourceUrl(v);
  if (!url) {
    console.warn(`  media: ${where} – the upload has no storage key or URL; using the path field.`);
    return null;
  }
  const memo = `${upload.profile}:${url}`;
  if (done.has(memo)) return done.get(memo)!;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    const { data, ext } = await render(bytes, upload.profile);
    /* Named by content: a replaced picture gets a new name, so the long
       cache on /media/* never serves the old one. */
    const name = `${upload.profile}-${createHash("sha256").update(data).digest("hex").slice(0, 12)}.${ext}`;
    mkdirSync(OUT_DIR, { recursive: true });
    const file = resolve(OUT_DIR, name);
    if (!existsSync(file)) writeFileSync(file, data);
    const path = `/media/${name}`;
    done.set(memo, path);
    console.log(`  media: ${where} → ${path} (${Math.round(bytes.length / 1024)} → ${Math.round(data.length / 1024)} KB)`);
    return path;
  } catch (error) {
    console.warn(`  media: ${where} – could not fetch or read ${url}: ${error instanceof Error ? error.message : error}; using the path field.`);
    return null;
  }
}

async function resolveValue(spec: CollectionSpec, value: Obj, key: string) {
  for (const p of spec.props) {
    if (p.type !== "image" || !p.upload) continue;
    const v = value[p.path];
    delete value[p.path];
    if (!v || typeof v !== "object") continue;
    const path = await materialize(v as Obj, p.upload, `${spec.slug}/${key}.${p.path}`);
    if (path) value[p.upload.into] = path;
  }
}

/**
 * Replace every upload in the snapshot's collections with a path, in place.
 * `collections` is keyed by collection slug, shaped as the snapshot is.
 */
export async function resolveUploads(collections: Record<string, unknown>) {
  for (const spec of COLLECTIONS) {
    if (!spec.props.some((p) => p.type === "image" && p.upload)) continue;
    const data = collections[spec.slug];
    if (!data) continue;
    if (spec.shape === "array") {
      for (const [i, v] of (data as Obj[]).entries()) await resolveValue(spec, v, String(v.id ?? v.slug ?? i));
    } else if (spec.shape === "record") {
      for (const [k, v] of Object.entries(data as Record<string, Obj>)) await resolveValue(spec, v, k);
    } else {
      await resolveValue(spec, data as Obj, spec.slug);
    }
  }
}
