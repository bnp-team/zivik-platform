/**
 * Enforce docs/DESIGN.md.
 *
 *     node scripts/design-lint.mjs          report and exit non-zero on any error
 *     node scripts/design-lint.mjs --quiet  errors only, no passing lines
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * The design system was never the problem. `globals.css` defines nine type
 * steps, a 4px spacing scale and twenty-nine colour tokens, DESIGN.md explains
 * each of them, and AGENTS.md tells anyone touching the site to read it first.
 * A measured audit still found 94 hard-coded font sizes producing 26 distinct
 * sizes on a nine-step scale, 151 off-grid spacing values, 13 colour literals,
 * and three sibling headings of the same rank at 31px, 27px and 26px – set as
 * inline React styles, where no stylesheet could reach them.
 *
 * A contract nothing checks is a document, not a system. This is the check.
 * It is deliberately mechanical: it does not have opinions about design, it
 * only asks whether a value is one the system names.
 *
 * ── What counts as a violation ─────────────────────────────────────────────
 * A font size, a spacing value or a colour written as a literal, in a place
 * where a token exists for it – and a width written in fixed pixels, which is
 * a size the viewport cannot argue with. Everything on this site is
 * responsive; the `fluid` rule is what makes that a check rather than a
 * habit. Three things are explicitly NOT violations,
 * because DESIGN.md says so and because pretending otherwise would train
 * people to add ignore comments:
 *
 *   - Illustration. The lamp, the projector and the map are authored drawings
 *     with their own register; DESIGN.md lists them as "bespoke, deliberately
 *     off-scale". Selectors matching ILLUSTRATION below are skipped.
 *   - Print. `@media print` wants real black on real white.
 *   - Geometry that is not text or rhythm. A 13px ✕ glyph, a 1px hairline, a
 *     2px optical nudge. Sub-8px lengths are rhythm-neutral and skipped; a
 *     font size on a glyph-only element is opted out by name in GLYPH_ONLY.
 *   - Anything inside `clamp()`. DESIGN.md is explicit: "Fluid gutters stay in
 *     clamp(). A scale governs rhythm, not responsive ranges –
 *     `padding-block: clamp(32px, 4vw, 56px)` is correct as written." A first
 *     draft of this file ignored that and reported 164 spacing violations, of
 *     which the great majority were correctly-written fluid gutters. A linter
 *     that cries wolf teaches people to skip it, so clamp() ranges are cut out
 *     of the line before any length is read.
 *
 * ── Adding to the system rather than around it ─────────────────────────────
 * If a value genuinely has no token, the fix is a token in `globals.css`, not
 * an exception here. That is what happened to the decision page's dark scene:
 * five hex literals became `--brand-night-rule-soft`, `--brand-gold-dim` and
 * `--brand-breach`, and two folded into tokens that already existed.
 *
 * ── The escape hatch, and when it is honest ────────────────────────────────
 *     /* design-lint-ignore space: measured against the zoom control *\/
 *
 * on the line above a declaration. It needs both the rule name and a reason;
 * a bare `design-lint-ignore` does not parse and does not silence anything.
 *
 * It is for values that are not the thing this file measures. Two exist:
 *   - `.nsv-hero` padding-top on a phone, 158px – clearance for the lamp above
 *     the wordmark. Illustration geometry, which DESIGN.md keeps off-scale.
 *   - `.mp-mast` padding-right in landscape, 330px – the width of the zoom
 *     control the title must not run under. A position measured against
 *     another element, not a rhythm chosen from a scale.
 *
 * Both were snapped to `--space-24` by a mechanical pass and both broke: the
 * hero lost 62px of lamp clearance and the map title started sliding under its
 * own zoom stepper. That is the shape of a legitimate ignore – the value
 * answers to something in the layout rather than to the reader's eye. "It
 * looked better" is not that, and neither is "I did not want to re-measure".
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const QUIET = process.argv.includes("--quiet");

/* ── the system, read from the one file that defines it ─────────────────── */

const globals = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");

/** Every `--t-*` step, as a set of pixel numbers. Read, not transcribed, so
 *  the linter cannot drift from the scale it is enforcing. */
const TYPE_STEPS = new Set(
  [...globals.matchAll(/--t-[a-z0-9-]+:\s*([\d.]+)px/g)].map((m) =>
    Number(m[1]),
  ),
);
/** Fluid steps are `clamp(a, v, b)`; both ends are steps in their own right. */
for (const m of globals.matchAll(
  /--t-[a-z0-9-]+:\s*clamp\(\s*([\d.]+)px[^)]*?([\d.]+)px\s*\)/g,
)) {
  TYPE_STEPS.add(Number(m[1]));
  TYPE_STEPS.add(Number(m[2]));
}

/** Every `--space-*` step. The token name is the multiple of 4. */
const SPACE_STEPS = new Set(
  [...globals.matchAll(/--space-\d+:\s*([\d.]+)px/g)].map((m) => Number(m[1])),
);

/** Every `--brand-*` colour, lower-cased, for "is this literal already a
 *  token" reporting. */
const BRAND_COLOURS = new Map();
for (const m of globals.matchAll(/(--brand-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})/g)) {
  BRAND_COLOURS.set(m[2].toLowerCase(), m[1]);
}

if (TYPE_STEPS.size === 0 || SPACE_STEPS.size === 0) {
  console.error(
    "design-lint: could not read the scale out of src/app/globals.css.\n" +
      "Either the token names changed or the file moved. Fix this before\n" +
      "trusting a passing run – an empty scale silently passes everything.",
  );
  process.exit(2);
}

/* ── what is deliberately outside the system ────────────────────────────── */

/** Authored drawings. DESIGN.md gives these their own register. */
const ILLUSTRATION =
  /\.lmp\b|\.pj\b|\.chain\b|\.roll\b|\.wm\b|\.bulb|\.bmouth|\.bshade|\.bcone|\.bpool|\.cord\b|\.kb\b|\.yk\b|\.pv\b|\.rig\b|\.rc\b|\.t0\b|\.lens\b|\.rib\b|\.flag\b|@keyframes|emap-ua\b/;

/** Elements whose "font size" is the size of a glyph, not of text. */
const GLYPH_ONLY =
  /\.reg-x\b|\.reg-opt \.ok\b|\.reg-chip \.cx\b|\.reg-sortbtn \.sd\b|\.ts\b|\.team-initials\b|\.tc\b/;

/* ── walk ───────────────────────────────────────────────────────────────── */

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

/** Blank out comments while keeping line numbers, so a value discussed in
 *  prose is never reported as one that ships. */
const decomment = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, (m) => "\n".repeat((m.match(/\n/g) || []).length));

/**
 * One CSS line into its declarations.
 *
 * Deliberately small rather than a real parser: this walks `prop: value` pairs
 * separated by `;`, keeping track of bracket depth so a `;` inside `url()` or
 * a data URI does not split a value in half. A line that opens a rule has its
 * selector stripped first.
 */
function splitDeclarations(line) {
  const body = line.includes("{") ? line.slice(line.indexOf("{") + 1) : line;
  const out = [];
  let buf = "";
  let depth = 0;
  for (const ch of body) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === ";" && depth === 0) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  out.push(buf);
  return out
    .map((d) => {
      const i = d.indexOf(":");
      if (i < 0) return null;
      return {
        prop: d.slice(0, i).trim().toLowerCase(),
        value: d.slice(i + 1).replace(/\}.*$/, ""),
      };
    })
    .filter(Boolean);
}

const errors = [];
const add = (file, line, rule, detail, fix) =>
  errors.push({ file: relative(ROOT, file), line, rule, detail, fix });

/* ── rule 1-3: stylesheets ──────────────────────────────────────────────── */

for (const file of files(join(ROOT, "src"), [".css"])) {
  const raw = readFileSync(file, "utf8");
  if (file.endsWith("globals.css")) continue;
  const lines = decomment(raw).split("\n");

  let selector = "";
  let printDepth = 0;
  let depth = 0;

  lines.forEach((line, i) => {
    const no = i + 1;
    /* An ignore on the previous line covers this one, and only for the rule it
       names. The reason is required by the pattern, not by convention. */
    const prev = i > 0 ? raw.split("\n")[i - 1] : "";
    const ignored = new Set();
    for (const m of prev.matchAll(
      /design-lint-ignore\s+([a-z-]+)\s*:\s*\S+/g,
    )) {
      ignored.add(m[1]);
    }
    if (/@media\s+print/.test(line)) printDepth = depth + 1;
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (line.includes("{")) selector = line.split("{")[0].trim().slice(0, 60);

    const inPrint = printDepth > 0;
    const skip = inPrint || ILLUSTRATION.test(selector);

    /* Responsiveness is checked on the drawings too.

       This rule deliberately does not take the ILLUSTRATION exemption the
       other three take. That exemption says a drawing may use colours and
       lengths the type and spacing scales do not name, which is true and has
       nothing to do with whether it fits on a screen. Written inside the
       exemption, this rule was silent on `.page .pj{width:900px}` – the exact
       declaration it exists to catch, skipped because `.pj` is the lamp's
       stage. A check that cannot see the bug that motivated it is worse than
       no check: it reports clean.

       The lamp's own light shapes are a real exception and they say so on the
       line above themselves, with the reason. That is the difference between
       an exemption and an argument.

       Owner's rule: everything on this site is responsive. The most expensive
       counter-example the site has had was that hero stage – authored as a
       fixed 900px box because the lamp's fixtures were placed at fixed
       coordinates. The fixtures were later re-anchored to `calc(50% ± n)` and
       the width stayed, so on a 2000px monitor the first screen was a 900px
       box with 550px of dead ground down each side, and the map inside it –
       `inset: 0` of that element – could not reach the screen however far its
       geometry ran. Four attempts were made at the map's outlines before
       anyone measured the box.

       320px is the threshold because it is the narrowest viewport this site
       supports: a fixed width above it cannot fit the smallest screen, so it
       either overflows or boxes the layout. Below it a fixed width is usually
       a control or an icon and is nobody's layout.

       `max-width` is not caught, and that is the point – it is the responsive
       way to say the same thing. Neither is a width built out of `%`, `vw`,
       `min()`, `max()`, `clamp()` or `calc()`: those answer to the viewport.
       Height is not measured; a fixed height has its own failure mode, but it
       does not decide how wide the page is. */
    if (!inPrint && !/^\s*@/.test(line)) {
      for (const decl of splitDeclarations(line)) {
        if (decl.prop !== "width" && decl.prop !== "min-width") continue;
        if (ignored.has("fluid")) continue;
        if (/%|vw|vh|min\(|max\(|clamp\(|calc\(/.test(decl.value)) continue;
        for (const m of decl.value.matchAll(/(\d+(?:\.\d+)?)px/g)) {
          const v = Number(m[1]);
          if (v < 320) continue;
          add(
            file,
            no,
            "fluid",
            `${decl.prop}: ${v}px is fixed (${selector || "?"})`,
            "the site is responsive everywhere – use max-width, a %, or a clamp()/min() the viewport can win",
          );
        }
      }
    }

    if (!skip) {
      /* Read declarations, not lines.

         The first draft matched every `px` on any line that mentioned `font:`,
         which made `.btn{...;font:700 var(--t-micro) ...;padding:12px 22px}`
         report 12px and 22px as illegal font sizes. Seven of its nine type
         "violations" were the line's own padding and margins. A declaration is
         the unit the cascade actually has, so that is the unit read here. */
      for (const decl of splitDeclarations(line)) {
        const prop = decl.prop;
        const value = decl.value;

        // 1. type. A bespoke ramp is still a ramp – both ends of a clamp have
        //    to be steps – so only the vw term is dropped, not the range.
        if (
          (prop === "font-size" || prop === "font") &&
          !GLYPH_ONLY.test(selector) &&
          !ignored.has("type")
        ) {
          for (const m of value.matchAll(/(\d+(?:\.\d+)?)px/g)) {
            const v = Number(m[1]);
            if (v < 8) continue; // a 1-2px rule is not type
            if (!TYPE_STEPS.has(v)) {
              add(
                file,
                no,
                "type",
                `${v}px is not a step (${selector || "?"})`,
                nearest(v, TYPE_STEPS, "--t-"),
              );
            }
          }
        }

        // 2. spacing. clamp() ranges are responsive rather than rhythm – see
        //    the note at the top of this file.
        if (
          /^(padding|margin|gap|row-gap|column-gap)/.test(prop) &&
          !ignored.has("space")
        ) {
          const rhythm = value.replace(/clamp\([^)]*\)/g, "clamp()");
          for (const m of rhythm.matchAll(/(\d+(?:\.\d+)?)px/g)) {
            const v = Number(m[1]);
            if (v < 8) continue; // hairlines and optical nudges
            if (!SPACE_STEPS.has(v)) {
              add(
                file,
                no,
                "space",
                `${v}px is off the 4px grid (${selector || "?"})`,
                nearest(v, SPACE_STEPS, "--space-"),
              );
            }
          }
        }
      }
      // 3. colour
      for (const m of ignored.has("colour")
        ? []
        : line.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([\d.,\s]+\)/g)) {
        const lit = m[0].toLowerCase();
        const known = BRAND_COLOURS.get(lit);
        add(
          file,
          no,
          "colour",
          `${m[0]} is a literal (${selector || "?"})`,
          known
            ? `it is exactly var(${known}) – use the token`
            : "add a --brand-* token in globals.css, or color-mix() an existing one",
        );
      }
    }

    depth += opens - closes;
    if (printDepth > 0 && depth < printDepth) printDepth = 0;
  });
}

/* ── rule 4: the widow guard ────────────────────────────────────────────────
   Owner's rule: no paragraph on this site ends on a single word.

   A linter cannot see a widow – where a line breaks is decided by the
   browser, at a width nobody knows at build time. What it can do is check
   that the one declaration which prevents them is still there and still
   covers the elements that carry prose. That is the whole failure mode: the
   rule is one line in one file, it is invisible when it works, and anything
   that deletes it or narrows its selector list takes the guard off every
   surface at once with nothing on screen to say so.

   The second half of the guard is in `npm run verify`, which reads the CSS
   the build actually emitted. It is there because the source being right is
   not enough to know the rule shipped: this one spent an afternoon looking as
   though the build were stripping it, when a dev server was serving a stale
   chunk, and the only way to tell those two apart is to read the output. */

const PROSE_ELEMENTS = ["p", "li", "blockquote", "figcaption"];
{
  const decommented = decomment(globals);
  /* The selector list and the declaration, as one rule. Matched loosely on
     whitespace so reformatting the file does not fail the check. */
  const rule = decommented.match(
    /([a-z,\s]+)\{[^}]*text-wrap:\s*pretty[^}]*\}/,
  );
  if (!rule) {
    add(
      join(ROOT, "src/app/globals.css"),
      0,
      "widows",
      "no text-wrap rule in globals.css",
      "every paragraph on the site relies on one declaration to avoid ending on a single word – restore `p,li,blockquote,figcaption,dd{text-wrap:pretty}`",
    );
  } else {
    const selectors = rule[1]
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    for (const el of PROSE_ELEMENTS) {
      if (!selectors.includes(el)) {
        add(
          join(ROOT, "src/app/globals.css"),
          0,
          "widows",
          `<${el}> is not covered by the text-wrap rule`,
          "it carries prose, so it can end on a one-word line – add it to the selector list",
        );
      }
    }
  }
}

/* ── rule 5: a var() that names nothing ─────────────────────────────────────
   The most expensive class of bug this file can catch, because it is silent.
   CSS drops the whole declaration when a var() resolves to nothing – not just
   the colour, the entire property – so one wrong character takes a background
   or a font size off the page with no warning anywhere.

   Two of these were found by hand on 26-27 August 2026, and neither was
   visible in the source:
     - `.reg-name-uk{color:var(--ink-2)}` – the token is `--ink2`, so the
       Ukrainian line under every case name inherited full ink and shouted at
       the citation it was meant to sit quietly under.
     - `.casepage .mast{background: … var(--brand-ember) …}` while the token
       was still being added – the masthead lost its dark ground entirely and
       cream text landed on paper, twenty contrast failures at once.

   Definitions are unioned across every stylesheet, not read per-file: a
   surface legitimately uses tokens its own file does not declare. */

const DEFINED = new Set();
/** Tokens declared on `:root` in globals.css – available to every surface. */
const GLOBAL_TOKENS = new Set(
  [...decomment(globals).matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
);
/** Where each non-global token is declared, so a use outside can be caught. */
const LOCAL_TOKENS = new Map();
for (const file of files(join(ROOT, "src"), [".css"])) {
  for (const m of decomment(readFileSync(file, "utf8")).matchAll(
    /(--[a-z0-9-]+)\s*:/gi,
  )) {
    DEFINED.add(m[1]);
    if (!GLOBAL_TOKENS.has(m[1]) && !LOCAL_TOKENS.has(m[1])) {
      LOCAL_TOKENS.set(m[1], file);
    }
  }
}
/* Values that come from somewhere other than a stylesheet. next/font writes
   these onto the html element as inline styles. The `-italic` pair are their
   own loader calls: the Google loader emits the cross product of weight and
   style, so roman and italic are declared separately to stop it preloading
   italic weights nothing sets. See app/[locale]/layout.tsx. */
for (const n of [
  "--font-charis",
  "--font-charis-italic",
  "--font-fira",
  "--font-fira-italic",
  "--font-ibm-plex-mono",
]) {
  DEFINED.add(n);
}

for (const file of files(join(ROOT, "src"), [".css"])) {
  decomment(readFileSync(file, "utf8"))
    .split("\n")
    .forEach((line, i) => {
      /* `var(--x, fallback)` is a different statement from `var(--x)`: the
         first says "if this is not set, use that", which is how a value handed
         in from JavaScript is read – the lamp's `--lit` and `--mx` are set on
         the element by the hero. Only the bare form can silently drop a
         declaration, so only the bare form is an error. */
      for (const m of line.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/gi)) {
        if (m[2] === ",") continue;
        if (GLOBAL_TOKENS.has(m[1])) continue;
        if (!DEFINED.has(m[1])) {
          add(
            file,
            i + 1,
            "undefined-token",
            `var(${m[1]}) – nothing declares it`,
            "a var() that resolves to nothing drops the whole declaration; check the spelling against globals.css",
          );
          continue;
        }
        /* Declared, but not where this file can see it.

           A surface's own aliases – `.registrypage{--ink:…}` – are declared
           and used in the same stylesheet, which is fine. Reaching for a token
           that only another surface declares is not: it resolves to nothing
           and takes the declaration with it. `--t-h1` was documented in
           DESIGN.md as part of the scale and declared only inside `.casepage`,
           so five page mastheads that used it rendered at body size. A first
           version of this rule unioned every declaration in the repository and
           called that "defined", which is exactly how it missed them. */
        /* Only the namespaced system tokens. `--ink`, `--gold`, `--cream` and
           the like are a surface's own aliases, and a component stylesheet
           reaching for them is the intended pattern – `case-map.css` renders
           inside `.casepage` and inherits its palette, `events-map.css` reads
           the `--emap-safe-*` insets the map page sets on it. Static analysis
           cannot tell those from a mistake, and flagging them made the rule
           noise. The scale is different: `--t-*`, `--space-*`, `--brand-*` and
           the shape and motion tokens are the system, they belong on `:root`,
           and a surface that declares one privately has forked it. */
        if (!/^--(t|space|brand|r|shadow|dur|ease)(-|$)/.test(m[1])) continue;
        const home = LOCAL_TOKENS.get(m[1]);
        if (home && home !== file) {
          add(
            file,
            i + 1,
            "foreign-token",
            `var(${m[1]}) is a system token declared privately in ${relative(ROOT, home)}`,
            "--t-*, --space-*, --brand-* and the shape tokens belong on :root in globals.css",
          );
        }
      }
    });
}

/* ── rule 6: inline styles in components ────────────────────────────────── */

for (const file of files(join(ROOT, "src"), [".tsx"])) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const m = line.match(/fontSize:\s*(\d+(?:\.\d+)?)\b/);
    if (m && !TYPE_STEPS.has(Number(m[1]))) {
      add(
        file,
        i + 1,
        "inline-type",
        `fontSize: ${m[1]} set on the element`,
        'inline styles beat every stylesheet – use a class, or fontSize: "var(--t-*)"',
      );
    }
    /* The same responsiveness rule, inside a style object. `maxWidth` is not
       matched and `<Image width={900}>` is not either – that is an intrinsic
       pixel size for the image loader, not a layout width. The leading
       boundary is what keeps `sizes="(max-width: 560px)"` out of it. */
    for (const w of line.matchAll(/(?:^|[{,\s])(width|minWidth):\s*(\d+)\b/g)) {
      if (Number(w[2]) < 320) continue;
      add(
        file,
        i + 1,
        "inline-fluid",
        `${w[1]}: ${w[2]} set on the element`,
        "the site is responsive everywhere – maxWidth, a percentage, or a class that can hold a media query",
      );
    }
  });
}

/* ── report ─────────────────────────────────────────────────────────────── */

function nearest(v, steps, prefix) {
  const best = [...steps].sort((a, b) => Math.abs(a - v) - Math.abs(b - v))[0];
  const name =
    prefix === "--t-"
      ? (globals.match(new RegExp(`(--t-[a-z0-9-]+):\\s*${best}px`)) ?? [])[1]
      : (globals.match(new RegExp(`(--space-\\d+):\\s*${best}px`)) ?? [])[1];
  return `nearest step is ${best}px${name ? ` – var(${name})` : ""}`;
}

const RULES = {
  type: "font sizes off the --t-* scale",
  space: "spacing off the 4px grid",
  widows: "the guard against one-word last lines",
  fluid: "fixed pixel widths the viewport cannot override",
  "inline-fluid": "fixed pixel widths set inline in JSX",
  colour: "colour literals outside globals.css",
  "inline-type": "font sizes set inline in JSX",
  "undefined-token": "var() naming a custom property nothing declares",
  "foreign-token": "var() naming a token another surface owns",
};

if (errors.length === 0) {
  console.log(
    `design-lint: clean.\n` +
      `  ${TYPE_STEPS.size} type steps, ${SPACE_STEPS.size} spacing steps, ` +
      `${BRAND_COLOURS.size} colour tokens, all honoured.\n` +
      `  No fixed width over 320px outside the lamp's own light.\n` +
      `  Widow guard in place over ${PROSE_ELEMENTS.join(", ")}.`,
  );
  process.exit(0);
}

const byRule = new Map();
for (const e of errors) {
  if (!byRule.has(e.rule)) byRule.set(e.rule, []);
  byRule.get(e.rule).push(e);
}

console.log(`design-lint: ${errors.length} violation(s) of docs/DESIGN.md\n`);
for (const [rule, list] of byRule) {
  console.log(`── ${RULES[rule]} (${list.length})`);
  for (const e of list) {
    console.log(`   ${e.file}:${e.line}`);
    console.log(`     ${e.detail}`);
    if (!QUIET) console.log(`     → ${e.fix}`);
  }
  console.log("");
}
process.exit(1);
