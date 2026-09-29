/**
 * "use client" boundaries, honoured under Astro.
 *
 * The components in src/ are written for React Server Components: a page is
 * server-rendered markup with a handful of client components inside it, and
 * only those ship JavaScript. Astro has no RSC, so this reproduces the one
 * part of it the site relies on – the boundary.
 *
 * In the server build, the default export of every module that opens with
 * "use client" is wrapped by `island()` (runtime.tsx). The wrapper
 * server-renders the component as usual inside an <nsv-island> element that
 * records which module it came from and the props it was given. In the
 * browser, client.tsx finds those elements and hydrates each one with the
 * same component and props – exactly the set of components Next would have
 * hydrated, and nothing else.
 *
 * Named exports pass straight through: in this codebase they are types,
 * helpers and constants, never components.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const DIRECTIVE = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/;
const HAS_DEFAULT = /^export\s+default\b/m;
const VIRTUAL = "virtual:nsv-islands";
const ORIGINAL = "nsv-island-original";

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * @param {{ root: string, serverOnly?: string[] }} opts
 *
 * `serverOnly` lists "use client" modules (paths relative to `root`) that
 * render here as plain server markup and never hydrate. A module belongs on
 * it when it has no state, no effects and no handlers – when "use client" is
 * there for a reason that is Next's alone. HeroMap is the case: under Next
 * the directive keeps its 68 outlines out of the flight payload; under Astro
 * there is no flight payload, and hydrating it only shipped its geometry
 * again as a 38 kB (brotli) chunk to redraw a picture already in the HTML.
 */
export function clientIslands({ root, serverOnly = [] }) {
  const skip = new Set(serverOnly);
  /** @type {Map<string, string>} absolute path -> island key */
  let islands = new Map();

  const scan = () => {
    islands = new Map();
    for (const file of walk(root)) {
      const src = readFileSync(file, "utf8");
      const key = relative(root, file).split(sep).join("/");
      if (DIRECTIVE.test(src) && HAS_DEFAULT.test(src) && !skip.has(key)) {
        islands.set(file, key);
      }
    }
  };
  scan();

  /**
   * In the browser build, an island's stylesheet imports are dropped.
   *
   * client.tsx loads every island through one dynamic-import table, and Astro
   * hands each page the CSS of everything that script can reach – so
   * EventsMap's 26 kB of `.emap` rules were a render-blocking stylesheet on
   * /team, /about and every decision, none of which has a map. The server
   * build still imports them, and that is how a page that renders the island
   * gets its CSS: from what it renders, not from what the shared script
   * could load.
   */
  const CSS_IMPORT = /^\s*import\s+["'][^"']+\.css["'];?\s*$/gm;
  const clientSide = (code, id) => {
    const [file] = id.split("?");
    if (!islands.has(file) || !CSS_IMPORT.test(code)) return;
    CSS_IMPORT.lastIndex = 0;
    return { code: code.replace(CSS_IMPORT, ""), map: null };
  };

  return {
    name: "nsv-use-client-islands",
    enforce: "pre",
    buildStart: scan,

    resolveId(id) {
      if (id === VIRTUAL) return "\0" + VIRTUAL;
    },

    load(id) {
      if (id !== "\0" + VIRTUAL) return;
      const entries = [...islands].map(
        ([file, key]) => `  ${JSON.stringify(key)}: () => import(${JSON.stringify(file)}),`,
      );
      return `export default {\n${entries.join("\n")}\n};\n`;
    },

    transform(code, id, options) {
      const ssr =
        options?.ssr ?? (this.environment ? this.environment.config.consumer === "server" : false);
      if (!ssr) return clientSide(code, id);
      const [file, query = ""] = id.split("?");
      if (query.includes(ORIGINAL)) return;
      const key = islands.get(file);
      if (!key) return;
      const original = JSON.stringify(`${file}?${ORIGINAL}`);
      return {
        code: [
          `import { island } from ${JSON.stringify(join(root, "../site/islands/runtime.tsx"))};`,
          `import Component from ${original};`,
          `export * from ${original};`,
          `export default island(Component, ${JSON.stringify(key)});`,
        ].join("\n"),
        map: null,
      };
    },
  };
}
