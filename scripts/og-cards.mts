/**
 * The share cards – public/og/cases/<slug>.png, one per decision summary –
 * drawn at build time from the content the build is about to render.
 *
 *   tsx scripts/og-cards.mts           snapshot if there is one, else the files
 *   tsx scripts/og-cards.mts --files   the files in src/content only (Next)
 *   tsx scripts/og-cards.mts --all     redraw every card, changed or not
 *   tsx scripts/og-cards.mts --site    also redraw public/og/nasvitlo.png
 *
 * ── Why a build step ───────────────────────────────────────────────────────
 * The cards were drawn by hand with a Python script (scripts/og-cards.py,
 * Pillow – removed with this one's arrival) whose case list was a literal in
 * the script. A summary created in
 * the EmDash admin got no card: its page pointed og:image at a file that did
 * not exist, and every link to it unfurled with a broken picture. Now the
 * cards are a function of the summaries, drawn by `npm run build` (prebuild)
 * and `npm run cf:build` (after cf:pull, so from the published D1 content),
 * with nothing to install beyond node_modules.
 *
 * ── How ────────────────────────────────────────────────────────────────────
 * sharp (libvips) rasterises an SVG with librsvg; librsvg lays the text out
 * with Pango, which finds faces through fontconfig. The brand faces come from
 * the @fontsource packages the site already depends on – but those ship WOFF
 * and WOFF2 only, and the FreeType inside sharp's prebuilt libvips reads
 * neither (it silently falls back to DejaVu). WOFF 1 is only zlib-compressed
 * tables, so it is unpacked to plain TrueType here (`woffToSfnt`), written to
 * node_modules/.cache/og-cards/, and a fontconfig file that lists only that
 * directory is set in FONTCONFIG_FILE *before* sharp is loaded. The same
 * config serves the measuring: sharp's `text` input (Pango again) returns the
 * pixel width of a line, which is what the title is wrapped by. The soft
 * lights (ember glow, lamp cone) are grey masks blurred by libvips itself and
 * used as alpha, as Pillow did; librsvg's feGaussianBlur at the ember's width
 * leaves a visible rim.
 *
 * Timing: all eight cards in about 1.5 s; a run with nothing changed, ~60 ms.
 *
 * The design is the Pillow one, ported: night ground with an ember
 * glow top-left, a hanging lamp top-right, gold eyebrow (institution · date),
 * the title in Charis SIL Bold – 84px in up to two lines, else 64px in up to
 * three – a muted kicker, and the footer rule with the wordmark. Colours are
 * the card's own literals, as they were in the Python script: a raster card
 * is not themed, and these are the values the existing cards were drawn with.
 *
 * ── What the card says ─────────────────────────────────────────────────────
 * `card` on the summary (summaries/types.ts; «Картка для соцмереж» in the
 * admin) holds the editor's wording. Where a part is empty it is derived:
 * title ← `seoTitle` (minus a « – court» tail) ← `title`; eyebrow ←
 * institution · Ukrainian judgment line; kicker ← the accented stat tile.
 * A new summary therefore gets a presentable card with no extra work, and a
 * good one when someone writes the three lines.
 *
 * ── Only what changed ──────────────────────────────────────────────────────
 * public/og/cases/manifest.json maps each slug with a card to a hash of what
 * the card was drawn from – the three lines, this script's source (the
 * template) and the font packages' versions. A card is redrawn only when its
 * hash moved or its file is missing. The manifest is also what the site reads
 * (`caseOgImage` in src/lib/seo.ts): a page points og:image at its own card
 * only when the manifest lists it, and at the site card otherwise – so a
 * missing card can never become a broken image.
 *
 * ── Never fails the build ──────────────────────────────────────────────────
 * A share card is not worth a failed deploy. If the fonts cannot be prepared
 * or do not measure as Charis SIL (a guard below), or a card fails to draw,
 * this logs a warning, keeps the cards that already exist, leaves the missing
 * ones out of the manifest – their pages fall back to /og/nasvitlo.png – and
 * exits 0.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import type { DecisionSummary } from "../src/content/summaries/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public/og/cases");
const MANIFEST = join(OUT_DIR, "manifest.json");
const SNAPSHOT = join(ROOT, ".emdash/snapshot.json");
const FONT_CACHE = join(ROOT, "node_modules/.cache/og-cards");

const args = new Set(process.argv.slice(2));
const FILES_ONLY = args.has("--files");
const ALL = args.has("--all");
const SITE = args.has("--site");

const W = 1200;
const H = 630;

/* The card's palette – the Pillow script's values, so a redrawn card matches
   the ones already shared. Not the site's --brand-* tokens: those follow the
   page's theme, a PNG does not. */
const NIGHT = "#14120f";
const EMBER = "#331311";
const CREAM = "#f4f1ea";
const GOLD = "#d9ab5e";
const MUTED = "#cbbdb8";
const FAINT = "#968a85";
const RULE = "#8a6e4b";
const LAMP_LIGHT = "#e9d5a3";
const LAMP_CORD = "#5a4e42";
const LAMP_SHADE = "#d4c5a5";
const LAMP_EDGE = "#a08f70";
const LAMP_BULB = "#f8f0d8";

const TAGLINE = "рішення міжнародних судів щодо агресії проти України";

/* ─── Fonts ──────────────────────────────────────────────────────────────── */

/** The faces the cards use, by family and weight, and the subsets to load. */
const FACES = [
  { pkg: "charis-sil", family: "Charis SIL", weight: 700 },
  { pkg: "fira-sans", family: "Fira Sans", weight: 500 },
  { pkg: "fira-sans", family: "Fira Sans", weight: 700 },
] as const;
/* Ukrainian needs cyrillic (+ext for ґ/є/ї/і is in the base cyrillic block,
   ext is cheap insurance); latin carries digits, $, €, quotes and dashes. */
const SUBSETS = ["cyrillic", "cyrillic-ext", "latin", "latin-ext"];

/**
 * WOFF 1 → TrueType/OpenType. A WOFF is an sfnt whose tables were each
 * zlib-compressed (or stored, when that did not help) behind a 44-byte header
 * and a 20-byte directory entry per table; undoing it is rebuilding the sfnt
 * table directory and inflating each table in order.
 */
function woffToSfnt(buf: Buffer): Buffer {
  if (buf.toString("ascii", 0, 4) !== "wOFF") throw new Error("not a WOFF 1 file");
  const flavor = buf.readUInt32BE(4);
  const numTables = buf.readUInt16BE(12);
  let entrySelector = 0;
  while (1 << (entrySelector + 1) <= numTables) entrySelector++;
  const searchRange = (1 << entrySelector) * 16;
  const header = Buffer.alloc(12 + numTables * 16);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(searchRange, 6);
  header.writeUInt16BE(entrySelector, 8);
  header.writeUInt16BE(numTables * 16 - searchRange, 10);
  const parts: Buffer[] = [header];
  let offset = header.length;
  for (let i = 0; i < numTables; i++) {
    const e = 44 + i * 20;
    const tag = buf.readUInt32BE(e);
    const at = buf.readUInt32BE(e + 4);
    const compLength = buf.readUInt32BE(e + 8);
    const origLength = buf.readUInt32BE(e + 12);
    const checksum = buf.readUInt32BE(e + 16);
    const raw = buf.subarray(at, at + compLength);
    const data = compLength < origLength ? inflateSync(raw) : raw;
    if (data.length !== origLength) throw new Error("WOFF table length mismatch");
    const d = 12 + i * 16;
    header.writeUInt32BE(tag, d);
    header.writeUInt32BE(checksum, d + 4);
    header.writeUInt32BE(offset, d + 8);
    header.writeUInt32BE(origLength, d + 12);
    const pad = (4 - (data.length % 4)) % 4;
    parts.push(data, Buffer.alloc(pad));
    offset += data.length + pad;
  }
  return Buffer.concat(parts);
}

/** hhea ascender over unitsPerEm: where Pillow's "top of the text" sits above the baseline. */
function ascentOf(sfnt: Buffer): number {
  const n = sfnt.readUInt16BE(4);
  const table = (name: string) => {
    for (let i = 0; i < n; i++) {
      const d = 12 + i * 16;
      if (sfnt.toString("ascii", d, d + 4) === name) return sfnt.readUInt32BE(d + 8);
    }
    throw new Error(`no ${name} table`);
  };
  const unitsPerEm = sfnt.readUInt16BE(table("head") + 18);
  const ascender = sfnt.readInt16BE(table("hhea") + 4);
  return ascender / unitsPerEm;
}

const pkgVersion = (pkg: string) =>
  (JSON.parse(readFileSync(join(ROOT, "node_modules/@fontsource", pkg, "package.json"), "utf8")) as {
    version: string;
  }).version;

/** Unpack the faces and point fontconfig at them. Returns each family's ascent. */
function prepareFonts(): Record<string, number> {
  mkdirSync(join(FONT_CACHE, "fc"), { recursive: true });
  const ascent: Record<string, number> = {};
  for (const f of FACES) {
    for (const sub of SUBSETS) {
      const src = join(ROOT, "node_modules/@fontsource", f.pkg, "files", `${f.pkg}-${sub}-${f.weight}-normal.woff`);
      if (!existsSync(src)) continue;
      const out = join(FONT_CACHE, `${f.pkg}-${sub}-${f.weight}.ttf`);
      const sfnt = existsSync(out) ? readFileSync(out) : woffToSfnt(readFileSync(src));
      if (!existsSync(out)) writeFileSync(out, sfnt);
      ascent[f.family] ??= ascentOf(sfnt);
    }
  }
  for (const f of FACES) if (!(f.family in ascent)) throw new Error(`no font files for ${f.family}`);
  /* Only these faces: a missing glyph falls back to another brand face, never
     to whatever the build machine happens to have installed. */
  const conf = join(FONT_CACHE, "fonts.conf");
  writeFileSync(
    conf,
    `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n` +
      `  <dir>${FONT_CACHE}</dir>\n  <cachedir>${join(FONT_CACHE, "fc")}</cachedir>\n</fontconfig>\n`,
  );
  process.env.FONTCONFIG_FILE = conf;
  return ascent;
}

/* ─── Content ────────────────────────────────────────────────────────────── */

/**
 * The summaries the build will render. The Cloudflare build compiles the
 * EmDash snapshot over src/content inside Vite (site/content/vite-plugin.mjs);
 * outside Vite the same values are simply `collections.summaries` of that
 * snapshot – cf:pull already turned the rows back into DecisionSummary
 * values with fromRow.
 */
async function loadSummaries(): Promise<{ from: string; summaries: Record<string, DecisionSummary> }> {
  if (!FILES_ONLY && existsSync(SNAPSHOT)) {
    const snap = JSON.parse(readFileSync(SNAPSHOT, "utf8")) as {
      source: string;
      collections: Record<string, unknown>;
    };
    const s = snap.collections.summaries as Record<string, DecisionSummary> | undefined;
    if (s) {
      /* Transitional. Until `cf:content -- schema --yes` adds the card_*
         columns to the deployed D1, every published summary reads back with
         no `card`, and the eight hand-worded cards would be redrawn with
         derived text. While the files are the source of truth (docs/
         CLOUDFLARE.md, «Перехідний період») a summary without a card borrows
         the file's for the same slug; one the files do not have is derived. */
      const files = (await import("../src/content/summaries/index")).SUMMARIES;
      for (const [slug, v] of Object.entries(s)) {
        if (!v.card && files[slug]?.card) s[slug] = { ...v, card: files[slug].card };
      }
      return { from: `EmDash snapshot (${snap.source})`, summaries: s };
    }
  }
  const mod = await import("../src/content/summaries/index");
  return { from: "src/content", summaries: mod.SUMMARIES };
}

interface CardText {
  title: string;
  eyebrow: string;
  kicker: string;
}

/** What goes on the card: the editor's wording, else a derivation. */
function cardText(s: DecisionSummary): { text: CardText; eyebrowShort: string } {
  const institution = s.forum?.institution.uk ?? s.judgment.court.uk;
  const when = s.mastheadUk?.judgment;
  /* seoTitle is written as «parties – court»; the court is the eyebrow. */
  const title = s.card?.title ?? s.seoTitle?.uk.split(" – ")[0] ?? s.title?.uk ?? s.masthead.parties;
  const em = s.stats.find((t) => t.em);
  const kicker =
    s.card?.kicker ??
    (em ? `${typeof em.value === "string" ? em.value : em.value.uk} ${em.label.uk}` : "");
  return {
    text: {
      title: title.trim(),
      eyebrow: s.card?.eyebrow ?? (when ? `${institution} · ${when}` : institution),
      kicker: kicker.trim(),
    },
    /* What the eyebrow drops to when the derived one is wider than the card. */
    eyebrowShort: s.card?.eyebrow ?? institution,
  };
}

/* ─── Drawing ────────────────────────────────────────────────────────────── */

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Sharp = typeof import("sharp").default;

function drawing(sharp: Sharp, ascent: Record<string, number>) {
  const widths = new Map<string, number>();
  /**
   * Advance width of `text` in pixels. Pango reports the *ink* box, which
   * leaves out the side bearings of the first and last glyph; bracketing the
   * text between two bars and subtracting the bars alone gives the advance.
   */
  async function width(text: string, family: string, weight: number, size: number): Promise<number> {
    const key = `${family}|${weight}|${size}|${text}`;
    const hit = widths.get(key);
    if (hit !== undefined) return hit;
    const font = `${family} ${weight === 700 ? "Bold" : "Medium"} ${size}`;
    const ink = async (t: string) =>
      (await sharp({ text: { text: esc(t), font, dpi: 72 } }).toBuffer({ resolveWithObject: true })).info.width;
    const w = (await ink(`|${text}|`)) - (await ink("||"));
    widths.set(key, w);
    return w;
  }

  /** An SVG <text> placed like Pillow's: (x, y) is the top of the line box. */
  const text = (
    t: string,
    x: number,
    y: number,
    o: { family: string; weight: number; size: number; fill: string; anchor?: "end" | "middle"; spacing?: number },
  ) =>
    `<text x="${x}" y="${(y + ascent[o.family] * o.size).toFixed(2)}" font-family="${o.family}" ` +
    `font-weight="${o.weight}" font-size="${o.size}" fill="${o.fill}"` +
    (o.anchor ? ` text-anchor="${o.anchor}"` : "") +
    (o.spacing ? ` letter-spacing="${o.spacing}"` : "") +
    `>${esc(t)}</text>`;

  const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`;

  /**
   * A soft light of `color`, Pillow's way: `shapes` are painted in grey
   * (the grey is the strength, 0–255, and a later shape paints over an
   * earlier one rather than adding to it), the mask is blurred with libvips'
   * Gaussian, and it becomes the alpha of a flat layer of the colour.
   * librsvg's own feGaussianBlur at the ember's width leaves a visible rim.
   */
  async function light(shapes: string, sigma: number, color: string) {
    const mask = await sharp(Buffer.from(svg(`<rect width="${W}" height="${H}" fill="#000"/>${shapes}`)))
      .blur(sigma)
      .extractChannel(0)
      .toBuffer();
    return sharp({ create: { width: W, height: H, channels: 3, background: color } })
      .joinChannel(mask)
      .png()
      .toBuffer();
  }
  const grey = (v: number) => `rgb(${v},${v},${v})`;

  /** Night with the ember glow in the upper left (case) or across the top (site). */
  const glow = (cx: number, cy: number, rx: number, ry: number) =>
    light(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${grey(110)}"/>`, 120, EMBER);

  /** A lamp: cord, shade and bulb, at x = cx, shade top at `top`, on a transparent layer. */
  const lamp = (cx: number, top: number, half: { rim: number; crown: number; h: number }, bulb: { dy: number; r: number }, cord: number) =>
    svg(
      `<line x1="${cx}" y1="0" x2="${cx}" y2="${top}" stroke="${LAMP_CORD}" stroke-width="${cord}"/>` +
        `<polygon points="${cx - half.rim},${top + half.h} ${cx + half.rim},${top + half.h} ` +
        `${cx + half.crown},${top} ${cx - half.crown},${top}" fill="${LAMP_SHADE}" stroke="${LAMP_EDGE}" stroke-width="0.5"/>` +
        `<circle cx="${cx}" cy="${top + bulb.dy}" r="${bulb.r}" fill="${LAMP_BULB}"/>`,
    );

  /** Night, ember, the lamp's cone, the lamp – flattened once and reused. */
  async function ground(ember: Buffer, cone: Buffer, lampSvg: string) {
    return sharp({ create: { width: W, height: H, channels: 3, background: NIGHT } })
      .composite([{ input: ember }, { input: cone }, { input: Buffer.from(lampSvg) }])
      .png()
      .toBuffer();
  }

  const X = 84;
  const MAXW = W - X - 260;

  /**
   * A title as break points: at spaces, and after a hyphen between two
   * letters («держави-|інтервенти»), as Python's textwrap broke the titles on
   * the hand-drawn cards. `glue` is what joins a piece to the next one.
   */
  const pieces = (title: string) =>
    title
      .split(/\s+/)
      .filter(Boolean)
      .flatMap((word) => {
        const parts = word.split(/(?<=\p{L}-)(?=\p{L})/u);
        return parts.map((text, i) => ({ text, glue: i < parts.length - 1 ? "" : " " }));
      });
  type Piece = ReturnType<typeof pieces>[number];
  const join = (ps: Piece[]) => ps.map((p, i) => p.text + (i < ps.length - 1 ? p.glue : "")).join("");

  /**
   * Break the title into exactly `n` lines so the widest is as narrow as it
   * can be, and among equally wide ones the most even – the Pillow script got
   * much the same by trying ever wider `textwrap` widths and taking the first
   * that fit, which is why the titles on the cards are balanced, not filled.
   */
  async function balance(ps: Piece[], n: number, size: number): Promise<{ lines: string[]; widest: number }> {
    const w = (from: number, to: number) => width(join(ps.slice(from, to)), "Charis SIL", 700, size);
    const cuts: number[][] = [];
    if (n === 1 || ps.length === 1) cuts.push([]);
    else if (n === 2 || ps.length === 2) for (let k = 1; k < ps.length; k++) cuts.push([k]);
    else for (let i = 1; i < ps.length - 1; i++) for (let j = i + 1; j < ps.length; j++) cuts.push([i, j]);
    let best = { lines: [] as string[], widest: Infinity, ragged: Infinity };
    for (const cut of cuts) {
      const bounds = [0, ...cut, ps.length];
      const ws: number[] = [];
      for (let i = 0; i + 1 < bounds.length; i++) ws.push(await w(bounds[i], bounds[i + 1]));
      const widest = Math.max(...ws);
      const ragged = ws.reduce((sum, x) => sum + (widest - x) ** 2, 0);
      /* Within a pixel counts as a tie; the more even set of lines wins it. */
      if (widest < best.widest - 1 || (widest <= best.widest + 1 && ragged < best.ragged)) {
        best = {
          lines: bounds.slice(0, -1).map((from, i) => join(ps.slice(from, bounds[i + 1]))),
          widest,
          ragged,
        };
      }
    }
    return best;
  }

  /** The title's lines and size: 84px in two lines, else 64px in three, else cut. */
  async function fitTitle(title: string): Promise<{ lines: string[]; size: number }> {
    const ps = pieces(title);
    const two = await balance(ps, 2, 84);
    if (two.widest <= MAXW) return { lines: two.lines, size: 84 };
    /* Three lines of a long title are a few hundred measurements; past
       sixteen pieces it would not fit anyway, so skip straight to filling. */
    if (ps.length <= 16) {
      const three = await balance(ps, 3, 64);
      if (three.widest <= MAXW) return { lines: three.lines, size: 64 };
    }
    /* Too long for the card: fill three lines and end the third with «…».
       The editor's `card.title` is the fix; this only keeps the card sane. */
    const lines: string[] = [];
    let rest = ps;
    while (lines.length < 3 && rest.length) {
      let k = 1;
      while (k < rest.length && (await width(join(rest.slice(0, k + 1)), "Charis SIL", 700, 64)) <= MAXW) k++;
      lines.push(join(rest.slice(0, k)));
      rest = rest.slice(k);
    }
    if (rest.length) lines[2] = await fitLine(`${lines[2]} ${join(rest)}`, "Charis SIL", 700, 64, MAXW);
    return { lines, size: 64 };
  }

  /** One line of `family` at `size`, cut at a word with «…» if wider than `max`. */
  async function fitLine(t: string, family: string, weight: number, size: number, max: number) {
    if ((await width(t, family, weight, size)) <= max) return t;
    const words = t.split(" ");
    while (words.length > 1 && (await width(`${words.join(" ")}…`, family, weight, size)) > max) words.pop();
    return `${words.join(" ")}…`;
  }

  let caseGround: Buffer | null = null;

  async function caseCard(c: CardText, eyebrowShort: string): Promise<Buffer> {
    /* The ground is the same for every case: drawn once per run. */
    const cx = W - 150;
    caseGround ??= await ground(
      await glow(200, -100, 700, 400),
      await light(
        `<polygon points="${cx - 14},92 ${cx + 14},92 ${cx + 95},260 ${cx - 95},260" fill="${grey(40)}"/>`,
        24,
        LAMP_LIGHT,
      ),
      lamp(cx, 56, { rim: 36, crown: 17, h: 32 }, { dy: 36, r: 8 }, 2),
    );
    const up = (t: string) => t.toLocaleUpperCase("uk");
    let eyebrow = up(c.eyebrow);
    if ((await width(eyebrow, "Fira Sans", 700, 26)) > MAXW) eyebrow = up(eyebrowShort);
    eyebrow = await fitLine(eyebrow, "Fira Sans", 700, 26, MAXW);
    const { lines, size } = await fitTitle(c.title);
    const lh = size * 1.08;
    let y = 168;
    const parts = [text(eyebrow, X, 90, { family: "Fira Sans", weight: 700, size: 26, fill: GOLD })];
    for (const l of lines) {
      parts.push(text(l, X, y, { family: "Charis SIL", weight: 700, size, fill: CREAM }));
      y += lh;
    }
    if (c.kicker) {
      const k = await fitLine(c.kicker, "Fira Sans", 500, 30, W - 2 * X);
      parts.push(text(k, X, y + 26, { family: "Fira Sans", weight: 500, size: 30, fill: MUTED }));
    }
    parts.push(
      `<line x1="${X}" y1="${H - 120}" x2="${W - 84}" y2="${H - 120}" stroke="${RULE}" stroke-width="2"/>`,
      text("насвітло", X, H - 98, { family: "Charis SIL", weight: 700, size: 40, fill: CREAM }),
      text(TAGLINE, W - 84, H - 88, { family: "Fira Sans", weight: 700, size: 26, fill: FAINT, anchor: "end" }),
    );
    const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${parts.join("")}</svg>`;
    return sharp(caseGround)
      .composite([{ input: Buffer.from(overlay) }])
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
  }

  /** The site card, /og/nasvitlo.png: the lamp centred over the wordmark. */
  async function siteCard(): Promise<Buffer> {
    const cx = W / 2;
    const top = 92;
    const base = await ground(
      await glow(cx, -80, 700, 340),
      await light(
        `<polygon points="${cx - 26},${top + 58} ${cx + 26},${top + 58} ${cx + 190},400 ${cx - 190},400" fill="${grey(42)}"/>` +
          `<ellipse cx="${cx}" cy="${top + 95}" rx="120" ry="65" fill="${grey(70)}"/>`,
        38,
        LAMP_LIGHT,
      ),
      lamp(cx, top, { rim: 64, crown: 30, h: 52 }, { dy: 59, r: 13 }, 3),
    );
    /* Pillow spaced the Latin line out with real spaces; SVG collapses runs
       of spaces unless told to keep them. */
    const words = svg(
      text("ПРОЄКТ ФАКУЛЬТЕТУ ПРАВА УКУ", cx + 3, 236, {
        family: "Fira Sans", weight: 700, size: 22, fill: GOLD, anchor: "middle", spacing: 6,
      }) +
        text("насвітло", cx, 282, { family: "Charis SIL", weight: 700, size: 132, fill: CREAM, anchor: "middle" }) +
        text("Рішення міжнародних судів щодо агресії проти України", cx, 462, {
          family: "Fira Sans", weight: 500, size: 34, fill: MUTED, anchor: "middle",
        }) +
        `<line x1="${cx - 260}" y1="545" x2="${cx + 260}" y2="545" stroke="${RULE}" stroke-width="2"/>` +
        text("N A S V I T L O  ·  I N T E R N A T I O N A L  C O U R T  D E C I S I O N S", cx, 560, {
          family: "Fira Sans", weight: 500, size: 17, fill: FAINT, anchor: "middle",
        }).replace("<text ", '<text xml:space="preserve" '),
    );
    return sharp(base)
      .composite([{ input: Buffer.from(words) }])
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
  }

  return { width, caseCard, siteCard };
}

/* ─── Run ────────────────────────────────────────────────────────────────── */

type Manifest = { note: string; cards: Record<string, string> };

const NOTE =
  "Written by scripts/og-cards.mts. Slug → hash of what its card was drawn from. " +
  "The site links a case's own card only if its slug is listed here (src/lib/seo.ts).";

function readManifest(): Manifest {
  try {
    return JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
  } catch {
    return { note: NOTE, cards: {} };
  }
}

function writeManifest(cards: Record<string, string>) {
  const sorted = Object.fromEntries(Object.entries(cards).sort(([a], [b]) => a.localeCompare(b)));
  const next = `${JSON.stringify({ note: NOTE, cards: sorted }, null, 2)}\n`;
  /* Leave the file alone when nothing changed: no dirty tree after a build. */
  if (!existsSync(MANIFEST) || readFileSync(MANIFEST, "utf8") !== next) writeFileSync(MANIFEST, next);
}

async function main() {
  const t0 = performance.now();
  const previous = readManifest().cards;

  let loaded: Awaited<ReturnType<typeof loadSummaries>>;
  try {
    loaded = await loadSummaries();
  } catch (err) {
    /* Without the content there is nothing to decide; the manifest stays as
       it is, and so do the pages that read it. */
    console.warn(`  og-cards: could not read the summaries – cards left as they are.\n  ${String(err)}`);
    return;
  }
  const { from, summaries } = loaded;
  const template = createHash("sha256")
    .update(readFileSync(fileURLToPath(import.meta.url)))
    .update(FACES.map((f) => `${f.pkg}@${pkgVersion(f.pkg)}`).join())
    .digest("hex");

  /* The slug is a file name here: one that would leave public/og/cases
     (cf:pull already refuses those) gets no card. */
  const inside = (slug: string) => resolve(OUT_DIR, `${slug}.png`).startsWith(resolve(OUT_DIR) + sep);
  const jobs = Object.entries(summaries).filter(([slug]) => inside(slug)).map(([slug, s]) => {
    const { text, eyebrowShort } = cardText(s);
    const hash = createHash("sha256").update(template).update(JSON.stringify(text)).digest("hex").slice(0, 16);
    const file = join(OUT_DIR, `${slug}.png`);
    const fresh = !ALL && previous[slug] === hash && existsSync(file);
    return { slug, text, eyebrowShort, hash, file, fresh };
  });
  const todo = jobs.filter((j) => !j.fresh);

  /* Cards that are up to date – or, if drawing fails below, that exist at
     all – stay listed; a stale card still names the right case. */
  const cards: Record<string, string> = {};
  for (const j of jobs) if (existsSync(j.file)) cards[j.slug] = j.fresh ? j.hash : (previous[j.slug] ?? "stale");

  let drawn = 0;
  if (todo.length || SITE) {
    try {
      const ascent = prepareFonts();
      const { default: sharp } = await import("sharp");
      const draw = drawing(sharp, ascent);
      /* Guard: Pango must really be setting Charis SIL. If fontconfig fell
         back to another face the widths would differ – a card in the wrong
         face is worse than the site card. 429px is «насвітло» at 100px in
         Charis SIL Bold; Fira Sans Bold sets it at 403px, DejaVu wider still. */
      const probe = await draw.width("насвітло", "Charis SIL", 700, 100);
      if (Math.abs(probe - 429) > 8) throw new Error(`Charis SIL measured ${probe}px, expected ~429px`);
      mkdirSync(OUT_DIR, { recursive: true });
      for (const j of todo) {
        try {
          writeFileSync(j.file, await draw.caseCard(j.text, j.eyebrowShort));
          cards[j.slug] = j.hash;
          drawn++;
          console.log(`  og-cards: drew ${j.slug}`);
        } catch (err) {
          console.warn(`  og-cards: ${j.slug} failed – ${String(err)}`);
        }
      }
      if (SITE) {
        writeFileSync(join(ROOT, "public/og/nasvitlo.png"), await draw.siteCard());
        console.log("  og-cards: drew the site card");
      }
    } catch (err) {
      console.warn(
        `  og-cards: cannot draw cards (${String(err)}).\n` +
          `  og-cards: pages without a card use /og/nasvitlo.png.`,
      );
    }
  }

  writeManifest(cards);
  const missing = jobs.filter((j) => !(j.slug in cards)).map((j) => j.slug);
  console.log(
    `  og-cards: ${jobs.length} summaries from ${from}; ${drawn} drawn, ` +
      `${jobs.length - todo.length} unchanged${missing.length ? `; no card: ${missing.join(", ")}` : ""} ` +
      `(${Math.round(performance.now() - t0)} ms)`,
  );
}

main().catch((err) => {
  console.warn(`  og-cards: ${String(err)}`);
});
