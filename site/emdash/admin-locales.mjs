/**
 * Ship the EmDash admin in English and Ukrainian only.
 *
 * The admin carries a translation catalogue for 29 locales, about 56 KB
 * gzipped each, and every one of them is bundled into the Worker whether or
 * not anyone ever picks it: 1.65 MB of a 4 MB Worker, over the 3 MB limit of
 * the free Workers plan on its own. This trims the two tables that name the
 * catalogues – the loader map and the locale picker's list – so the others
 * are never imported and never bundled. A locale outside the list falls back
 * to English, which is what EmDash does for any locale it has no catalogue
 * for.
 *
 * The patch targets EmDash's built files, so an upgrade that reshapes them
 * must not turn it into a silent no-op: if either table is not found, the
 * build stops and says so.
 */
const LOADER_FILE = /@emdash-cms[\\/]admin[\\/]dist[\\/]loadMessages-[^\\/]+\.js$/;
const LOCALES_FILE = /@emdash-cms[\\/]admin[\\/]dist[\\/]locales-[^\\/]+\.js$/;
const LOADER_ENTRY = /^\s*"\.\/([A-Za-z-]+)\/messages\.mjs": \(\) => import\([^)]*\),?\n/gm;
const ENABLED = "const ENABLED_LOCALES = LOCALES.filter((l) => l.enabled);";

/** @param {{ keep: string[] }} opts */
export function adminLocales({ keep }) {
  const kept = JSON.stringify(keep);
  return {
    name: "nsv-admin-locales",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0];
      if (LOADER_FILE.test(file)) {
        let seen = 0;
        const out = code.replace(LOADER_ENTRY, (line, locale) => {
          seen += 1;
          return keep.includes(locale) ? line : "";
        });
        if (seen === 0) this.error(`admin-locales: no catalogue table in ${file} – EmDash changed; update site/emdash/admin-locales.mjs`);
        return { code: out, map: null };
      }
      if (LOCALES_FILE.test(file) && code.includes("const LOCALES")) {
        if (!code.includes(ENABLED)) this.error(`admin-locales: no ENABLED_LOCALES in ${file} – EmDash changed; update site/emdash/admin-locales.mjs`);
        return {
          code: code.replace(ENABLED, `const ENABLED_LOCALES = LOCALES.filter((l) => l.enabled && ${kept}.includes(l.code));`),
          map: null,
        };
      }
    },
  };
}
