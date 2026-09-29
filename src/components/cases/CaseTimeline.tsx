"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * The case history as an instrument: a year rail, a filter per track, and rows
 * that open for detail.
 *
 * Props arrive locale-resolved: this is a client component, and its props are
 * serialized into the page payload – passing the raw {uk, en} pairs shipped
 * both languages to every reader and leaked the other locale into the HTML.
 * The server template picks the strings; this component just renders them.
 */
export interface TimelineEventR {
  date: string;
  label: string;
  note?: string;
  kind?: string;
  track?: string;
  /** Sort key, ISO 8601 – the visible `date` may be a range or a month. */
  iso?: string;
}
export interface TimelineTrackR {
  id: string;
  label: string;
}

export default function CaseTimeline({
  events,
  tracks = [],
  labels,
}: {
  events: TimelineEventR[];
  tracks?: TimelineTrackR[];
  labels: {
    all: string;
    /** Names the filter row. See the note on the row itself. */
    trackFilter: string;
    openDetail: string;
    /**
     * The rail. It used to be `aria-hidden` decoration – and decoration is
     * what it was: a row of dots that answered nothing, placed by year, so
     * every event in 2022 stacked into one mark. Named and pressable, it is
     * the index of the chronology below it.
     */
    railLabel: string;
  };
}) {
  const [active, setActive] = useState<string>("all");
  const [open, setOpen] = useState<number | null>(null);
  /**
   * The list, so a press on the rail can take the reader to the row it stands
   * for. By id rather than a ref per row: the rows are re-created whenever the
   * filter changes, and the id is stable across that.
   */
  const listRef = useRef<HTMLUListElement>(null);
  /**
   * Where a press on the rail is taking the reader.
   *
   * Held in state rather than acted on in the handler, because the row may not
   * exist yet: the press can clear a filter that was hiding it, and it can
   * open a row that was closed. Both are renders. A `requestAnimationFrame`
   * was the first attempt and it fired before React had committed – measured,
   * the scroll landed and `document.activeElement` was still the page.
   */
  const [jump, setJump] = useState<number | null>(null);
  useEffect(() => {
    if (jump === null) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setJump(null);
    const row = listRef.current?.querySelector<HTMLElement>(`[data-idx="${jump}"]`);
    if (!row) return;
    /* scrollIntoView names its own behaviour, and a named "smooth" animates
       whatever the stylesheet says – globals.css forces scroll-behavior: auto
       under prefers-reduced-motion and CSS cannot reach a script's argument.
       PageNav already answers this for its two scrolls; the rail's jump into
       the chronology was the one left animating for a reader who asked for
       no motion. */
    row.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    // Without preventScroll the browser jumps to the row instantly and the
    // smooth scroll above has nowhere left to go.
    row.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, [jump]);

  const goto = (idx: number) => {
    const e = events[idx];
    // A mark whose event the current filter hides has to bring the filter back
    // with it, or the press would send the reader to a row that is not there.
    if (active !== "all" && e?.track && e.track !== active) pickTrack("all");
    setOpen(e?.note ? idx : null);
    setJump(idx);
  };

  // The chosen filter lives in the hash (#chronology:warrants), so a filtered
  // view survives reload and can be shared as a link.
  useEffect(() => {
    const m = window.location.hash.match(/^#chronology:(\w[\w-]*)$/);
    // Setting state in an effect costs one extra render, and here that is the
    // price of the feature: the hash exists only in the browser, this page is
    // prerendered, and reading it any earlier would drag the subtree into
    // client rendering. Render the default, then correct it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (m && tracks.some((t) => t.id === m[1])) setActive(m[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* A jump into a filtered chronology must not land on nothing.

     The filter hides rows, and a link from elsewhere on the page names an
     event, not a filter – so arriving at #ev-2023-03-17 while the reader (or a
     previous shared link) had narrowed to "Юрисдикція" would scroll to an
     element that is not in the list. The filter opens rather than the link
     failing silently: the reader asked to see this event.

     Also on hashchange, not only on mount. The filter hash was read once when
     the component mounted, so a link clicked on this same page changed the
     address bar and nothing else. */
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash;
      const f = h.match(/^#chronology:(\w[\w-]*)$/);
      if (f && tracks.some((t) => t.id === f[1])) {
        setActive(f[1]);
        return;
      }
      const ev = h.match(/^#ev-(\d{4}-\d{2}-\d{2})$/);
      if (!ev) return;
      const target = events.find((e) => e.iso === ev[1]);
      if (target && target.track) setActive("all");
    };
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [events, tracks]);

  const pickTrack = (id: string) => {
    setActive(id);
    const hash = id === "all" ? "#chronology" : `#chronology:${id}`;
    window.history.replaceState(null, "", hash);
  };

  const shown = useMemo(
    () =>
      events
        .filter((e) => active === "all" || !e.track || e.track === active)
        // The rail places its dots from `iso`, but the list printed the array
        // in authoring order – so oschadbank showed 24 July 2025 above 1 July,
        // a chronology out of chronological order. Sorting here fixes it for
        // every page and cannot be undone by the next person to append an
        // event. Entries without `iso` keep their authored position relative
        // to each other and sort last, since they carry no date to place.
        .map((e, i) => ({ e, i }))
        .sort((a, b) =>
          a.e.iso && b.e.iso
            ? a.e.iso.localeCompare(b.e.iso) || a.i - b.i
            : a.e.iso
              ? -1
              : b.e.iso
                ? 1
                : a.i - b.i,
        )
        .map(({ e }) => e),
    [events, active],
  );

  /**
   * The rail: one mark per event on a linear time axis.
   *
   * Placed by the date, not by the year it falls in. `Number(iso.slice(0, 4))`
   * was the old rule and it made the rail meaningless on exactly the pages
   * that need it most: the ICJ genocide chronology has ten events in 2022 –
   * the recognition of the "republics", the invasion, the application, the
   * provisional-measures hearing, the order, the Memorial, the declarations of
   * intervention, the preliminary objections – and all ten landed on one
   * pixel. What the reader saw was four dots for twenty events, and no way to
   * tell that the case is nine years of nothing followed by one year of
   * everything, which is the shape of it.
   */
  const stamps = useMemo(
    () =>
      events.map((e) => {
        if (!e.iso) return null;
        const t = Date.parse(e.iso.length === 4 ? `${e.iso}-01-01` : e.iso);
        return Number.isFinite(t) ? t : null;
      }),
    [events],
  );
  const dated = stamps.filter((t): t is number => t !== null);
  const t0 = dated.length ? Math.min(...dated) : 0;
  const t1 = dated.length ? Math.max(...dated) : 0;
  const tspan = Math.max(1, t1 - t0);
  /** Where on the rail a moment falls, 0…100. */
  const at = (t: number) => ((t - t0) / tspan) * 100;

  const yr = (t: number) => new Date(t).getUTCFullYear();
  /**
   * Year marks under the rail. The old rule stepped every five years from the
   * first and dropped the first itself, so a 2014–2025 case was labelled
   * «2019» and «2024» – two numbers, neither of them an end. Both ends are
   * named now, and the step between them is whatever keeps the labels from
   * touching: at most six numbers across the rail.
   */
  const ticks = useMemo(() => {
    if (!dated.length) return [] as number[];
    const y0 = yr(t0);
    const y1 = yr(t1);
    if (y1 <= y0) return [y0];
    const step = Math.max(1, Math.ceil((y1 - y0) / 5));
    const out: number[] = [];
    for (let y = y0; y < y1; y += step) out.push(y);
    // The last year is an end of the axis, not a step on it: it is always
    // named, and a step that lands within a step of it is dropped so the two
    // labels do not sit on top of each other.
    if (out.length && y1 - out[out.length - 1] < step) out.pop();
    out.push(y1);
    return out;
  }, [t0, t1, dated.length]);
  /** A year's own position on the rail – its first of January. */
  const yearAt = (y: number) => at(Date.UTC(y, 0, 1));

  const trackLabel = (id?: string) => (id ? tracks.find((t) => t.id === id)?.label : undefined);

  /* `kind` still rides out on every row as `data-kind`, but only two of its
     four values are set differently now – an operative act is bold, background
     is receded and italic, and a filing and a procedural order are the same
     line of a docket. The key that used to stand above the rail is gone with
     the other two treatments: it named a distinction the reader had to hold in
     their head, and the owner asked twice what the colours meant. See the note
     on .ctl-list li[data-kind] in 40-instruments.css. */

  return (
    // data-tracks drives the row grid: with no tracks at all there is no
    // track column to reserve, and the event text takes the width the track
    // column would have had. See .ctl-row in 40-instruments.css.
    <div className="ctl" data-tracks={tracks.length > 0 ? "yes" : "no"}>
      {/* A group of toggles, not a tablist.

          role="tablist" promises the tabs pattern and none of it was here: no
          element carried role="tabpanel", every tab was aria-controls nothing,
          all five were tab stops rather than one with a roving tabindex, and
          the arrow keys the role tells a screen-reader user to press moved
          nothing. A reader was told "tab 1 of 5" and handed a widget that did
          not behave like one. These are filters over the list below – a
          pressed state is what they have and aria-pressed is how it is said.
          The group takes its own name; it used to borrow «Усе» from the first
          button inside it. */}
      {tracks.length > 0 && (
        <div className="ctl-filters" role="group" aria-label={labels.trackFilter}>
          <button
            type="button"
            aria-pressed={active === "all"}
            data-on={active === "all" ? "yes" : "no"}
            onClick={() => pickTrack("all")}
          >
            {labels.all}
          </button>
          {tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={active === t.id}
              data-on={active === t.id ? "yes" : "no"}
              data-track={t.id}
              onClick={() => pickTrack(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {dated.length > 1 && (
        <div className="ctl-rail" role="group" aria-label={labels.railLabel}>
          <div className="ctl-rail-line" aria-hidden="true" />
          {events.map((e, i) => {
            const t = stamps[i];
            if (t === null) return null;
            const dim = active !== "all" && e.track && e.track !== active;
            return (
              <button
                key={i}
                type="button"
                className="ctl-dot"
                data-track={e.track}
                data-dim={dim ? "yes" : "no"}
                data-on={open === i ? "yes" : "no"}
                /* Date and event, in that order, because that is what the mark
                   encodes: where it sits and what sits there. It is also the
                   tooltip, so a mouse gets the same answer as a screen
                   reader without hovering blind. */
                aria-label={`${e.date} – ${e.label}`}
                title={`${e.date} – ${e.label}`}
                style={{ left: `${at(t)}%` }}
                onClick={() => goto(i)}
              />
            );
          })}
          {ticks.map((y) => {
            /* A year mark sits at its own first of January, which for the year
               the case starts in is usually before the first event and so off
               the left end of the rail – «Весна 2014» puts 1 January 2014 at
               −2%. Held to the rail, and the two that can reach an end are
               aligned from that end rather than centred on it, so no label
               hangs off the picture. */
            const x = yearAt(y);
            const edge = x <= 0 ? "start" : x >= 100 ? "end" : undefined;
            return (
              <span
                key={y}
                className="ctl-tick"
                data-edge={edge}
                aria-hidden="true"
                style={{ left: `${Math.max(0, Math.min(100, x))}%` }}
              >
                {y}
              </span>
            );
          })}
        </div>
      )}

      <ul className="ctl-list" ref={listRef}>
        {shown.map((e) => {
          const idx = events.indexOf(e);
          const isOpen = open === idx;
          const label = trackLabel(e.track);
          return (
            /* An anchor per dated event. The verdict matrix links here when a
               track names a date this chronology also records – the ICC's
               tracks are the days its warrants issued. Keyed by the date
               rather than by position, so appending an event does not move
               every link that already exists. */
            <li
              key={idx}
              id={e.iso ? `ev-${e.iso}` : undefined}
              data-idx={idx}
              data-kind={e.kind}
              data-track={e.track}
            >
              {e.note ? (
                <button
                  type="button"
                  className="ctl-row"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : idx)}
                  title={labels.openDetail}
                >
                  <span className="ctl-date">{e.date}</span>
                  {label && <span className="ctl-track">{label}</span>}
                  <span className="ctl-label">{e.label}</span>
                  <span className="ctl-more" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
              ) : (
                <div className="ctl-row ctl-row-static">
                  <span className="ctl-date">{e.date}</span>
                  {label && <span className="ctl-track">{label}</span>}
                  <span className="ctl-label">{e.label}</span>
                </div>
              )}
              {e.note && isOpen && <p className="ctl-note">{e.note}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
