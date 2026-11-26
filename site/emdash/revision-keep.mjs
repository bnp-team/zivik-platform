/**
 * Keep more of a page's history.
 *
 * EmDash keeps the last 50 saved versions of every entry and prunes the rest,
 * not configurably. For a library of legal summaries whose history matters –
 * who changed a sentence in a decision and when – 50 saves per entry is a few
 * months of steady editing, after which the oldest versions are deleted for
 * good. Storage is not the constraint: a summary's snapshot is about 100 kB,
 * so 1000 versions of the biggest entry are 100 MB of a 10 GB database.
 *
 * The 50 is written in two ways in EmDash's built code, and both are patched:
 *
 *   - `const REVISION_KEEP_COUNT = 50;` in the runtime – the scheduled sweep
 *     of the prune queue;
 *   - `pruneQueuedEntry(…, 50)` literals – the prune that runs right after a
 *     save and after restoring a version (admin, REST, MCP). Until 2026-11-26
 *     only the constant was patched, so these trimmed history to 50 anyway.
 *
 * (A third `REVISION_KEEP_COUNT = 50` sits in migration 059, which only
 * filled the queue once when it was created; it is left alone.)
 *
 * The patch targets EmDash's built files, so an upgrade that reshapes them
 * must not turn into a silent no-op: if the runtime constant is not found, or
 * a build ends without a single literal patched, the build stops and says so.
 */
const RUNTIME_FILE = /emdash[\\/]dist[\\/]emdash-runtime-[^\\/]+\.mjs$/;
const DIST_FILE = /emdash[\\/]dist[\\/][^\\/]+\.mjs$/;
const KEEP = /const REVISION_KEEP_COUNT = 50;/;
const PRUNE_LITERAL = /(\.pruneQueuedEntry\([^()]*?),\s*50\)/g;

/** @param {{ keep: number }} opts */
export function revisionKeep({ keep }) {
  let literals = 0;
  let building = false;
  return {
    name: "nsv-revision-keep",
    enforce: "pre",
    buildStart() {
      literals = 0;
    },
    configResolved(config) {
      building = config.command === "build";
    },
    transform(code, id) {
      const file = id.split("?")[0];
      if (!DIST_FILE.test(file)) return;
      let out = code;
      if (RUNTIME_FILE.test(file)) {
        if (!KEEP.test(out)) {
          this.error(`revision-keep: no REVISION_KEEP_COUNT in ${file} – EmDash changed; update site/emdash/revision-keep.mjs`);
        }
        out = out.replace(KEEP, `const REVISION_KEEP_COUNT = ${keep};`);
      }
      out = out.replace(PRUNE_LITERAL, (_, head) => {
        literals += 1;
        return `${head}, ${keep})`;
      });
      return out === code ? undefined : { code: out, map: null };
    },
    buildEnd(error) {
      /* Only the server bundle loads EmDash's runtime; the client build has
         nothing to patch, and dev transforms modules lazily. */
      if (error || !building || this.environment?.name === "client") return;
      if (this.environment && this.environment.name !== "ssr") return;
      if (literals === 0) {
        this.error("revision-keep: no pruneQueuedEntry(…, 50) found in EmDash – it changed; update site/emdash/revision-keep.mjs");
      }
    },
  };
}
