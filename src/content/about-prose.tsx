import type { ReactNode } from "react";
import type { AboutLink } from "./types";

/**
 * The about prose, with its citations turned into links.
 *
 * The paragraphs in `content/about.ts` are plain strings and are rendered in
 * two places – the home page's About band and /about – so a link written into
 * one of them by hand would exist on one page and not the other. The link
 * table travels with the prose instead, and both call sites render through
 * here.
 *
 * The match is on the literal phrase, first occurrence, once per paragraph:
 * Wikipedia's rule, for Wikipedia's reason – a phrase linked at every
 * appearance turns prose into a field of underlines. A phrase the
 * prose does not contain is caught at module load in `content/about.ts`, not
 * here – by the time a paragraph reaches this function the only honest thing
 * left to do with an unmatched phrase is leave the text alone.
 */
export function linkAboutProse(
  text: string,
  links: readonly AboutLink[],
): ReactNode {
  /* Longest first: two citations where one phrase contains the other would
     otherwise have the shorter one eat the head of the longer. */
  const ordered = [...links].sort((a, b) => b.text.length - a.text.length);

  const out: ReactNode[] = [];
  let rest = text;
  let key = 0;

  /* One pass per link rather than one regex over all of them: the phrases are
     sentences with guillemets and apostrophes in them, and building a pattern
     out of those is how the wrong half of a quotation ends up as the anchor. */
  for (const link of ordered) {
    const at = rest.indexOf(link.text);
    if (at === -1) continue;
    out.push(rest.slice(0, at));
    out.push(
      <a
        key={key++}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="abt-cite-link"
      >
        {link.text}
      </a>,
    );
    rest = rest.slice(at + link.text.length);
  }

  if (!out.length) return text;
  out.push(rest);
  return out;
}
