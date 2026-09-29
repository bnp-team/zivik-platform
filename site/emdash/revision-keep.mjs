/**
 * Keep more of a page's history.
 *
 * EmDash keeps the last 50 saved versions of every entry and prunes the rest
 * (`REVISION_KEEP_COUNT` in its runtime, not configurable). For a library of
 * legal summaries whose history matters – who changed a sentence in a decision
 * and when – 50 saves per entry is a few months of steady editing, after which
 * the oldest versions are deleted for good. Storage is not the constraint: a
 * summary's snapshot is about 100 kB, so 1000 versions of the biggest entry are
 * 100 MB of a 10 GB database.
 *
 * The patch targets EmDash's built runtime, so an upgrade that reshapes it must
 * not turn into a silent no-op: if the constant is not found the build stops
 * and says so.
 */
const RUNTIME_FILE = /emdash[\\/]dist[\\/]emdash-runtime-[^\\/]+\.mjs$/;
const KEEP = /const REVISION_KEEP_COUNT = 50;/;

/** @param {{ keep: number }} opts */
export function revisionKeep({ keep }) {
  return {
    name: "nsv-revision-keep",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0];
      if (!RUNTIME_FILE.test(file)) return;
      if (!KEEP.test(code)) {
        this.error(`revision-keep: no REVISION_KEEP_COUNT in ${file} – EmDash changed; update site/emdash/revision-keep.mjs`);
      }
      return { code: code.replace(KEEP, `const REVISION_KEEP_COUNT = ${keep};`), map: null };
    },
  };
}
