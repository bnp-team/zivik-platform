import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Only what the bar reads, and nothing else.
 *
 * `Header` is a client component, so whatever it takes is serialized into
 * every page: into the RSC payload under Next and into the island's `data-p`
 * under Astro. It was typed as `Pick<Dictionary, "nav" | "brand">` – and the
 * layouts handed it the whole `Dictionary`, which satisfies that type, so all
 * of it went across: 8.6 KB of attribute on each of the site's ninety-odd
 * pages to read ten strings worth about 250 bytes. A `Pick` narrows what the
 * component may read, not what the caller may send.
 *
 * So the narrowing happens here, by construction: an object literal listing
 * each string the bar uses. Both layouts – `src/app/[locale]/layout.tsx` and
 * `site/lib/Chrome.tsx` – call this, and a new string the bar needs has to be
 * added in this one place, where the type will ask for it.
 *
 * A plain module rather than a named export of Header.tsx: a server component
 * that calls a function out of a "use client" module gets a client reference,
 * not the function.
 */
export interface HeaderDict {
  nav: Pick<
    Dictionary["nav"],
    "skip" | "menu" | "home" | "about" | "decisions" | "map" | "team" | "blog"
  >;
  brand: Pick<Dictionary["brand"], "wordmark" | "facultyAlt">;
}

export function headerDict({ nav, brand }: Dictionary): HeaderDict {
  return {
    nav: {
      skip: nav.skip,
      menu: nav.menu,
      home: nav.home,
      about: nav.about,
      decisions: nav.decisions,
      map: nav.map,
      team: nav.team,
      blog: nav.blog,
    },
    brand: { wordmark: brand.wordmark, facultyAlt: brand.facultyAlt },
  };
}
