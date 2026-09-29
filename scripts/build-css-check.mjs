#!/usr/bin/env node
/**
 * Did the build keep the declarations the design depends on?
 *
 * Source being right is not enough to know a declaration shipped. Two things
 * between this repository and a browser can remove one without failing: the
 * stylesheet pipeline – Tailwind 4 runs everything through Lightning CSS,
 * which drops declarations its target browsers do not support – and a dev
 * server serving a chunk it built earlier. The second is what actually
 * happened here, to the one declaration that keeps a paragraph from ending on
 * a single word, and an afternoon went into blaming the first. Reading the
 * emitted CSS is how the two are told apart, and it is the only place either
 * loss is visible at all.
 *
 * So this reads what was actually emitted. It is the first half of
 * `npm run verify`, beside ghost-check, and it runs after `next build`,
 * against `.next`.
 *
 *     npm run build && npm run verify
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, ".next/static");

if (!existsSync(OUT)) {
  console.error("css-check: no build found at .next/static – run `npm run build` first.");
  process.exit(1);
}

function* cssFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* cssFiles(path);
    else if (name.endsWith(".css")) yield path;
  }
}

const files = [...cssFiles(OUT)];
const all = files.map((f) => ({ f, css: readFileSync(f, "utf8") }));

/**
 * What has to survive the build, and why it might not.
 *
 * `find` is matched against the emitted text with whitespace collapsed, so a
 * minifier's formatting cannot break the check.
 */
const REQUIRED = [
  {
    find: "p,li,blockquote,figcaption,dd{text-wrap:pretty}",
    what: "the widow guard",
    why:
      "no paragraph on this site may end on a single word, and this one declaration in\n" +
      "     globals.css is what prevents it everywhere. The selector list is matched as written:\n" +
      "     if the rule was reformatted or an element was dropped from it, fix the list here and\n" +
      "     in globals.css together, so the two cannot drift.",
  },
];

const problems = [];
for (const req of REQUIRED) {
  const hit = all.find((x) => x.css.replace(/\s+/g, "").includes(req.find.replace(/\s+/g, "")));
  if (!hit) problems.push(req);
}

if (problems.length) {
  console.error(`css-check: ${problems.length} declaration(s) did not survive the build\n`);
  for (const p of problems) {
    console.error(`  ${p.what} – \`${p.find}\` is in no emitted stylesheet`);
    console.error(`     ${p.why}\n`);
  }
  console.error(`  Scanned ${files.length} stylesheet(s) under ${relative(ROOT, OUT)}.`);
  process.exit(1);
}

console.log(
  `css-check: clean. ${REQUIRED.length} required declaration(s) present in ${files.length} emitted stylesheet(s).`,
);
