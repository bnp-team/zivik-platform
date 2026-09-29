#!/usr/bin/env node
/**
 * Rules that style nothing.
 *
 *     node scripts/ghost-check.mjs          list them
 *     node scripts/ghost-check.mjs --quiet  count only
 *
 * A selector whose class never appears in any class attribute cannot match
 * anything the site renders. It is not a bug on screen – that is exactly the
 * problem. It sits in the stylesheet looking like part of the design, it is
 * read and weighed by everyone who touches the file, it is carried into every
 * refactor, and it ships to every reader. The repository has already paid for
 * this twice in one day: a partner band whose classes outlived its component,
 * and a projector illustration whose forty rules outlived its markup.
 *
 * ── How a class is counted as live ─────────────────────────────────────────
 * Only what a class attribute can hold. Three earlier passes at this got the
 * answer wrong in instructive ways:
 *
 *   - Searching the whole file for the name reported `.t0` and `.t1` as live
 *     on the strength of two unrelated local variables in a timeline
 *     component. A substring is not a use.
 *   - Reading every string literal in the TypeScript desynchronised on the
 *     first apostrophe in a Ukrainian comment – «пов'язані» opens a string
 *     that swallows the rest of the file – and reported half the registry as
 *     dead.
 *   - Taking `className={...}` up to the first `}` cut template literals in
 *     half at their first `${`, so `` `arow ${lit ? "lit" : "dim"}` `` never
 *     matched and `.arow` looked like a ghost.
 *
 * So: class attributes only, braces balanced, and inside a braced expression
 * every string and template literal counts.
 *
 * ── Two sources, unioned ───────────────────────────────────────────────────
 * Reading the markup alone is not enough either. `.nsv-langsw` and
 * `.nsv-langsw-drawer` are written through a variable rather than inline, and
 * a source scan calls them dead while 90 and 45 elements in the build carry
 * them. So the build's own HTML is the second source: every page here is
 * prerendered, so whatever the server renders is in it, under a real class
 * attribute, with no parsing to get wrong.
 *
 * Neither source is sufficient alone. The build cannot show a class a script
 * adds on a click, and the markup cannot show one assembled at runtime; a
 * class is live if either says so. When `.next/server/app` is absent the
 * check still runs, on the markup alone, and says so.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const QUIET = process.argv.includes("--quiet");

function* files(dir, ext) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      yield* files(p, ext);
      continue;
    }
    if (ext.some((e) => name.endsWith(e))) yield p;
  }
}

const decomment = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, (m) => "\n".repeat((m.match(/\n/g) || []).length));

/* ── every class a stylesheet declares ───────────────────────────────────── */
const declared = new Map();
for (const f of files(join(ROOT, "src"), [".css"])) {
  decomment(readFileSync(f, "utf8"))
    .split("\n")
    .forEach((line, i) => {
      if (!line.includes("{")) return;
      const sel = line.split("{")[0];
      if (/^\s*@/.test(sel) || !sel.trim()) return;
      for (const m of sel.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
        const k = m[1];
        if (!declared.has(k)) declared.set(k, new Set());
        declared.get(k).add(`${relative(ROOT, f)}:${i + 1}`);
      }
    });
}

/* ── every class the markup writes ──────────────────────────────────────── */
const live = new Set();
const eat = (s) => {
  for (const t of s.split(/[\s"'`]+/)) if (t && !t.includes("$")) live.add(t);
};
/** From `i`, the index of `{`, to its matching `}`. */
function braced(src, i) {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") {
      depth--;
      if (depth === 0) return src.slice(i + 1, j);
    }
  }
  return "";
}
for (const f of files(join(ROOT, "src"), [".tsx", ".ts"])) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/class(?:Name)?\s*=\s*/g)) {
    const at = m.index + m[0].length;
    const ch = src[at];
    if (ch === '"' || ch === "'") {
      const end = src.indexOf(ch, at + 1);
      if (end > at) eat(src.slice(at + 1, end));
    } else if (ch === "{") {
      const body = braced(src, at);
      for (const q of body.matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`/g)) {
        eat(q[1] ?? q[2] ?? q[3] ?? "");
      }
    }
  }
  for (const m of src.matchAll(/classList\.(?:add|remove|toggle)\(([^)]*)\)/g)) {
    for (const q of m[1].matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`/g)) {
      eat(q[1] ?? q[2] ?? q[3] ?? "");
    }
  }
}

/* ── and every class the build emitted ──────────────────────────────────── */
const BUILD = join(ROOT, ".next/server/app");
let htmlCount = 0;
if (existsSync(BUILD)) {
  for (const f of files(BUILD, [".html"])) {
    htmlCount++;
    for (const m of readFileSync(f, "utf8").matchAll(/class="([^"]*)"/g)) eat(m[1]);
  }
}

const ghosts = [];
for (const [cls, where] of declared) if (!live.has(cls)) ghosts.push({ cls, where: [...where] });
ghosts.sort((a, b) => a.cls.localeCompare(b.cls));

if (ghosts.length === 0) {
  console.log(
    `ghost-check: clean. ${declared.size} classes declared, every one of them written in markup` +
      (htmlCount ? ` or emitted in one of ${htmlCount} built pages.` : " (no build to cross-check against)."),
  );
  process.exit(0);
}

console.log(
  `ghost-check: ${ghosts.length} class(es) styled but never written anywhere\n` +
    `  ${declared.size} declared, ${live.size} used` +
    (htmlCount ? `, cross-checked against ${htmlCount} built pages.\n` : `. No build found – run \`npm run build\` for the second source.\n`),
);
if (!QUIET) {
  for (const g of ghosts) {
    console.log(`  .${g.cls}`);
    console.log(`     ${g.where.slice(0, 4).join(", ")}${g.where.length > 4 ? ` (+${g.where.length - 4} more)` : ""}`);
  }
}
process.exit(1);
