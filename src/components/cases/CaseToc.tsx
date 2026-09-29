"use client";

import { useEffect, useRef, useState } from "react";

export interface TocItem {
  id: string;
  label: string;
  /** Headings inside this section – the write-up's own subdivisions. */
  children?: TocItem[];
}

/**
 * The decision page's table of contents.
 *
 * It replaced two renderings of the same scrollspy: a dark pill fixed in the
 * left margin, which only appeared above 1700px, and a sticky bar of chips
 * that scrolled sideways below it. The chips were the page's map, and a map
 * you have to scroll to read is a map with half of it hidden – on this page
 * «Пов'язані рішення» sat past the right edge at every width.
 *
 * So it is a column now, in the page rather than floating over it: sticky,
 * scrolling on its own when it outgrows the viewport, and carrying the
 * write-up's own sub-headings indented under the section they belong to.
 * Below 1000px the column has nowhere to stand, so the same list folds into
 * a `<details>` the reader opens – which keeps every entry reachable instead
 * of pushing the far ones off-screen, and needs no JavaScript to open.
 */
export default function CaseToc({
  items,
  title,
  ariaLabel,
}: {
  items: TocItem[];
  /** «На цій сторінці» */
  title: string;
  ariaLabel: string;
}) {
  const flat = items.flatMap((i) => [i, ...(i.children ?? [])]);
  const [active, setActive] = useState<string>(flat[0]?.id ?? "");
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = flat
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const update = () => {
      /* A quarter of the way down the viewport, not the very top: a heading
         is "the one you are reading" from the moment it is comfortably in
         view, not from the moment it touches the edge. */
      const line = window.innerHeight * 0.25;
      let current = els[0];
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el;
        else break;
      }
      setActive(current.id);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  /* The rail scrolls itself once the list outgrows the viewport, and the
     active entry can then be outside it – which is the one entry that must
     not be. Only the rail's own scroll is touched; the page stays put. */
  useEffect(() => {
    const rail = railRef.current;
    const el = rail?.querySelector<HTMLElement>(`a[href="#${active}"]`);
    if (!rail || !el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < rail.scrollTop || bottom > rail.scrollTop + rail.clientHeight) {
      rail.scrollTo({
        top: top - rail.clientHeight / 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    }
  }, [active]);

  const link = (s: TocItem, sub: boolean) => (
    <a
      key={s.id}
      className={sub ? "toc-s" : "toc-a"}
      href={`#${s.id}`}
      data-on={s.id === active ? "yes" : "no"}
      aria-current={s.id === active ? "true" : undefined}
    >
      {s.label}
    </a>
  );

  /* The second level opens where the reader is.
   *
   * Listing it always made the rail look arbitrary: one part showed four
   * sub-headings and the parts around it showed none, although their own
   * headings are the same level. The difference is real – those four are
   * bands a reader jumps between, the others title a paragraph read in
   * order – but it is a rule the reader cannot see, so on the page it read
   * as an oversight.
   *
   * Shown only for the part being read, it is never two parts side by side
   * with and without children: it is the section you are in, opened. A part
   * that has no sub-headings simply opens to nothing, which is the truth
   * about that part.
   *
   * Owner: «зараз такого самого рівня підзаголовки не в навігації».
   */
  const list = items.map((s) => {
    const kids = s.children ?? [];
    const here = s.id === active || kids.some((c) => c.id === active);
    return (
      <div key={s.id} className="toc-group" data-open={here && kids.length > 0 ? "yes" : "no"}>
        {link(s, false)}
        {kids.length > 0 && here && (
          <div className="toc-sub">{kids.map((c) => link(c, true))}</div>
        )}
      </div>
    );
  });

  return (
    <>
      <aside className="toc-rail" ref={railRef}>
        <div className="toc-h">{title}</div>
        <nav aria-label={ariaLabel}>{list}</nav>
      </aside>

      {/* The same list, folded, for the widths that cannot hold a column. */}
      <details className="toc-fold">
        <summary>
          <span>{title}</span>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <nav aria-label={ariaLabel}>{list}</nav>
      </details>
    </>
  );
}
