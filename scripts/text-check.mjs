#!/usr/bin/env node
/**
 * Homoglyphs, and other things that are wrong in a way nobody can see.
 *
 * A Latin "C" and a Cyrillic "С" are the same shape. One of them was sitting
 * at the front of «Cпрямування» in four registry records – the charge note
 * shared by four ICC suspects – where it had presumably been pasted in from a
 * document in the other alphabet. Nothing looked wrong. Nothing was going to
 * look wrong. But a reader searching the page for «Спрямування» would not
 * find those four rows, a screen reader announces the word in the wrong
 * language, and the string does not equal itself across files.
 *
 * This is exactly the class of defect that survives every review, because
 * review is done by eye. So it is checked by machine instead.
 *
 * WHAT IS ALLOWED, and why the exceptions are narrow:
 *   - Files listed in EXEMPT hold text ingested verbatim from a source
 *     document, quirks deliberately preserved – see the docstrings in
 *     summaries/dtek-krymenergo.ts and echr-ukraine-netherlands.ts, which name
 *     the two artefacts and say the tabs will be re-ingested. Preserving a
 *     source's transcription error is a defensible archival choice; making it
 *     silently is not, which is why they are named here as well as there.
 *   - A word that is entirely Latin, or entirely Cyrillic, is nobody's
 *     business. Only a word that mixes the two scripts is reported, and only
 *     when the Latin letters it mixes in are ones with a Cyrillic twin.
 *   - Abbreviations that are genuinely Latin inside Ukrainian prose – "IP-адреса"
 *     – are real and are listed in ALLOWED_WORDS rather than suppressed by a
 *     rule that would also hide real defects.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

/** Latin letters with a Cyrillic look-alike. */
const CONFUSABLE = "AaBCcEeHIiKMOoPpTXxyY";
const CYRILLIC = /[Ѐ-ӿ]/;

/** Verbatim ingests whose quirks are documented and deliberate. */
const EXEMPT = new Set([
  "src/content/summaries/dtek-krymenergo.verbatim.json",
  "src/content/summaries/echr-ukraine-netherlands.verbatim.json",
  /* The docstrings in these two describe the artefacts above, and quoting a
     defect in order to name it necessarily reproduces it. */
  "src/content/summaries/dtek-krymenergo.ts",
  "src/content/summaries/echr-ukraine-netherlands.ts",
]);

/** Latin abbreviations that belong inside Ukrainian text. */
const ALLOWED_WORDS = new Set(["IP-адреса", "IP-адреси", "IP-адрес", "IP-адресу"]);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx|json|md)$/.test(name)) yield p;
  }
}

let found = 0;
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (EXEMPT.has(rel)) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const word of line.match(/[\p{L}\p{N}''’-]{3,}/gu) ?? []) {
      if (!CYRILLIC.test(word)) continue;
      if (ALLOWED_WORDS.has(word)) continue;
      const latin = [...word].filter((c) => CONFUSABLE.includes(c));
      if (latin.length === 0) continue;
      found++;
      console.error(
        `${rel}:${i + 1}  «${word}» mixes Cyrillic with Latin ${latin.join("")}`,
      );
    }
  });
}

if (found > 0) {
  console.error(
    `\ntext-check: ${found} word${found === 1 ? "" : "s"} written in two alphabets at once.\n` +
      `If a mix is genuinely correct, add the word to ALLOWED_WORDS or the file to EXEMPT – with a reason.`,
  );
  process.exit(1);
}
console.log("text-check: clean. No word mixes Cyrillic with a look-alike Latin letter.");
