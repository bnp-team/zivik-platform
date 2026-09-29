/**
 * Compile the published EmDash content into src/content, in the Cloudflare
 * build only.
 *
 * `.emdash/snapshot.json` (written by scripts/cf/pull.mts) lists, for each
 * collection, the module and export whose value it replaces – e.g.
 * `src/content/cases.ts` → `registryCases`. For each of those modules this
 * swaps the initializer of that one `export const` for the published value
 * and leaves everything else in the file alone: the derived exports
 * (`registryProceedings`, `registryTotal` …), the helper
 * functions and the invariants that throw when the record contradicts itself
 * all run on the published content exactly as they run on the file's.
 *
 * The declaration is found with the TypeScript parser, not a pattern, so the
 * comments and formatting of the file do not matter.
 *
 * No snapshot, no change: the build uses the files, as the Next build does.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const VIRTUAL = "virtual:nsv-snapshot";
let announced = false;

/** @param {{ snapshot: string, root: string }} opts */
export function contentSnapshot({ snapshot, root }) {
  /** @type {null | { source: string, pulledAt: string, bindings: { collection: string, shape: string, file: string, export: string }[], collections: Record<string, unknown> }} */
  let snap = null;
  /** @type {Map<string, { collection: string, shape: string, export: string }[]>} */
  const byFile = new Map();

  const load = () => {
    snap = existsSync(snapshot) ? JSON.parse(readFileSync(snapshot, "utf8")) : null;
    byFile.clear();
    for (const b of snap?.bindings ?? []) {
      const file = resolve(root, b.file);
      byFile.set(file, [...(byFile.get(file) ?? []), b]);
    }
  };

  return {
    name: "nsv-content-snapshot",
    enforce: "pre",

    configResolved() {
      load();
      /* Once, not once per environment. */
      if (announced) return;
      announced = true;
      console.log(
        snap
          ? `  content: EmDash snapshot (${snap.source}, ${snap.pulledAt})`
          : "  content: no EmDash snapshot – building from src/content",
      );
    },

    resolveId(id) {
      if (id === VIRTUAL) return "\0" + VIRTUAL;
    },

    load(id) {
      if (id !== "\0" + VIRTUAL) return;
      /* JSON.parse of a string is faster to start than an object literal
         this size, and the snapshot is data, not code. */
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(snap?.collections ?? {}))});\n`;
    },

    transform(code, id) {
      const file = id.split("?")[0];
      const bindings = byFile.get(file);
      if (!bindings) return;

      const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      /** @type {{ start: number, end: number, text: string }[]} */
      const edits = [];
      for (const b of bindings) {
        let found = false;
        for (const stmt of sf.statements) {
          if (!ts.isVariableStatement(stmt)) continue;
          if (!stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
          for (const decl of stmt.declarationList.declarations) {
            if (!ts.isIdentifier(decl.name) || decl.name.text !== b.export || !decl.initializer) continue;
            const value = `__nsvSnapshot[${JSON.stringify(b.collection)}]`;
            edits.push({
              start: decl.initializer.getStart(sf),
              end: decl.initializer.getEnd(),
              /* A record keeps the null prototype the file gives SUMMARIES, so
                 `slug in SUMMARIES` cannot find "toString". */
              text: b.shape === "record" ? `Object.assign(Object.create(null), ${value})` : value,
            });
            found = true;
          }
        }
        if (!found) {
          this.error(
            `content snapshot: ${file} no longer declares \`export const ${b.export} = …\`. ` +
              "Update `source` in site/content/collections.ts.",
          );
        }
      }

      let out = code;
      for (const e of edits.sort((a, b) => b.start - a.start)) {
        out = out.slice(0, e.start) + e.text + out.slice(e.end);
      }
      return { code: `import __nsvSnapshot from ${JSON.stringify(VIRTUAL)};\n${out}`, map: null };
    },
  };
}
