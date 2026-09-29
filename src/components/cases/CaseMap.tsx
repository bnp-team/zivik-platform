"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import atlas from "@/content/europe-map.json";
import "./theatre-legend.css";
import "./case-map.css";

/**
 * The decision page's map, as an instrument.
 *
 * It was a picture: the seat, a dashed line, one or two zones, and a legend
 * underneath carrying the sentence that says what happened at each. Nothing
 * answered. The reader could see that a case reaches from The Hague to the
 * east of Ukraine and could not ask the map which of two theatres a sentence
 * belonged to – on `icj-cerd-icsft` there are two, ICSFT in the east and CERD
 * in Crimea, and the only way to pair a mark with its sentence was to match
 * the words by eye.
 *
 * It is not the events map. That component is fitted to its own projection in
 * several load-bearing places – the «Україна» framing is a hardcoded rect in
 * those units, the label sides and the crowding maths are measured against
 * that atlas, and its data model is a site with a caseload and a list of
 * decisions. A case has one forum and one or two theatres and no caseload.
 * What carries over is the language: a mark is a button, selecting one lights
 * the relation and quietens the rest, the legend is the other end of the same
 * control, and nothing is selected until the reader selects it.
 *
 * Props arrive locale-resolved: this is a client component, and its props are
 * serialized into the page payload.
 *
 * The ground itself is not a prop. The neighbours, Ukraine's outline, its
 * oblast mesh and the lit areas used to cross the boundary as path strings –
 * 88–95 KB of every decision page's HTML, the same bytes on all eight of them,
 * written a second time beside the SVG they had just been rendered into. They
 * are read here from the atlas instead, which the events map and the home
 * page's map already import: one module the browser fetches once and keeps,
 * rather than a copy per page it cannot. What still crosses is what differs
 * per case – the frame, the points, the names, and which areas to light, as
 * keys into `atlas.areas`. The markup is the same either way, so the server
 * render and the hydration still agree path for path.
 */
export interface CaseMapTheatre {
  id: string;
  place: string;
  tag: string;
  summary?: string;
  /** Marker positions in the frame's own units. */
  pts: [number, number][];
  /** What each of those marks is called, index-parallel to `pts`. */
  ptNames?: { label: string; dx?: number; dy?: number }[];
  /** "area" draws no dots: the ground itself is the theatre. */
  ground?: "points" | "area";
  /** The ground this theatre is about, as keys: "country" is the outline
      itself, anything else names a path in the atlas's `areas`. The page hands
      over only keys that resolve, so every one of them draws. */
  areas?: string[];
  labelDx?: number;
  labelDy?: number;
}

/** An area key, as the path it names – see `areas` on `CaseMapTheatre`. */
const AREAS = (atlas as { areas?: Record<string, string> }).areas ?? {};
const areaPath = (key: string) => (key === "country" ? atlas.ukraine : AREAS[key]);

export default function CaseMap({
  frame,
  strip,
  unit,
  seat,
  reach,
  reaches,
  theatres,
  labels,
}: {
  frame: string;
  /** How much of `frame` is the strip reserved for the key, 0–1. */
  strip: number;
  /** Projection units per CSS pixel at the band's full width. */
  unit: number;
  seat: { name: string; caption: string; at: [number, number] };
  reach: [number, number];
  /** One beam per theatre: the seat, and the ground each claim is about. */
  reaches?: { id: string; at: [number, number] }[];
  theatres: CaseMapTheatre[];
  labels: { alt: string; seatRole: string; pick: string };
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [rov, setRov] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [vx, vy, vw, vh] = frame.split(" ").map(Number);
  /** A point in the frame, as a percentage of it – see the labels below. */
  const at = (x: number, y: number) => ({
    left: `${((x - vx) / vw) * 100}%`,
    top: `${((y - vy) / vh) * 100}%`,
  });

  /* Every mark, in the order the keyboard walks them: the seat first, because
     that is where the case is heard, then the theatres in authored order. */
  const order = ["seat", ...theatres.map((t) => t.id)];
  const rovKey = rov && order.includes(rov) ? rov : order[0];

  const go = useCallback((key: string) => {
    setRov(key);
    svgRef.current
      ?.querySelector<SVGGraphicsElement>(`[data-mk="${CSS.escape(key)}"]`)
      ?.focus?.();
  }, []);

  const onKey = (
    ev: { key: string; repeat: boolean; preventDefault: () => void },
    key: string,
  ) => {
    if (ev.repeat) return;
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      setSel((s) => (s === key ? null : key));
      return;
    }
    const by =
      ev.key === "ArrowRight" || ev.key === "ArrowDown"
        ? 1
        : ev.key === "ArrowLeft" || ev.key === "ArrowUp"
          ? -1
          : 0;
    if (!by || order.length < 2) return;
    ev.preventDefault();
    const i = order.indexOf(key);
    go(order[(i + by + order.length) % order.length]);
  };

  /* A selection is a view of the map, and Escape puts a view away. */
  useEffect(() => {
    if (!sel) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSel(null);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [sel]);

  const state = (key: string) =>
    sel === null ? "rest" : sel === key ? "on" : "off";

  /* The marks, in pixels, measured off the events map at a 1440px window
     rather than chosen: its place dot comes out 11.3px across, its halo 16.9
     to 24.4 depending on how much a place is carrying (19.3 is the middle of
     that, and a theatre carries no such number), and its court ring 9.4. This
     drawing had 17.9, 79.5 and 19.9 – the halo four times over, which is what
     was reading as a glow rather than as a mark. `px` puts a pixel back into
     the frame's own units. */
  const px = (n: number) => Math.round(n * unit * 100) / 100;
  const R_ZONE = px(5.65);
  const R_ZONE_HALO = px(9.65);
  const R_COURT = px(4.7);

  return (
    <div className="map-wrap" data-sel={sel ?? "none"}>
      {/* The strip's size travels with the drawing rather than being written
          into the stylesheet: it is derived per case, and only the frame that
          reserved it knows how much it took. */}
      <div className="map-plot" style={
          { "--map-strip": strip, "--map-unit": unit } as CSSProperties
        }>
        <svg
          ref={svgRef}
          className="map"
          viewBox={frame}
          /* The frame reserves a strip on the left for the key. Anchored to
             the right and set to cover, this is the identity transform at the
             frame's own ratio – and on a phone, where the stylesheet narrows
             the box and the key is back below the drawing, it crops the strip
             away instead of leaving 130px of empty water. */
          preserveAspectRatio="xMaxYMid slice"
          /* A group of controls while the marks answer – the same distinction
             the events map draws. There is no state here in which they do not:
             this drawing has at most three of them and they never crowd. */
          role="group"
          aria-label={labels.alt}
        >
          <defs>
            <clipPath id="mapclip">
              <rect x={vx} y={vy} width={vw} height={vh} />
            </clipPath>
          </defs>
          <g clipPath="url(#mapclip)">
            {atlas.context.map((d, i) => (
              <path key={i} className="ctx" d={d} />
            ))}
            <path className="ua-fill" d={atlas.ukraine} />
            {/* The oblasts, as the lines between them. The decision maps never
                had these – the atlas that carried them was the other one – and
                they are what lets a reader see that Crimea is a piece of this
                country rather than a neighbour of it. Clipped to the outline,
                because the mesh is 10m and the outline 110m and where an
                internal line runs out to meet the coast the two disagree by a
                pixel. */}
            {atlas.regions && (
              <path className="ua-regions" d={atlas.regions} clipPath="url(#mapclip)" />
            )}

            {/* The ground each theatre is about, under every mark. */}
            {theatres.flatMap((t) =>
              (t.areas ?? []).map(areaPath).filter(Boolean).map((d, i) => (
                <path
                  key={`${t.id}-${i}`}
                  className="zone-area"
                  data-state={state(t.id)}
                  d={d}
                />
              )),
            )}

            {/* The forum's reach: seat → the ground in dispute. It lights
                whichever end the reader picked, because it is the one relation
                this drawing has. */}
            {(reaches && reaches.length > 0 ? reaches : [{ id: "t0", at: reach }]).map((r, ri) => (
              <line
                /* Keyed by position, not by id: a theatre drawn as a set of
                   places now sends one beam to each of them, so several lines
                   share the id whose selection they answer to. */
                key={`${r.id}-${ri}`}
                className="reach"
                /* Quiet when another theatre is picked: with one beam the
                   line had nothing to step back from, and with two the
                   unpicked one has to, or the drawing says the case reaches
                   both places at once when the reader asked about one. */
                data-state={sel === null ? "rest" : sel === r.id ? "on" : "off"}
                x1={seat.at[0]}
                y1={seat.at[1]}
                x2={r.at[0]}
                y2={r.at[1]}
              />
            ))}
            {/* The light itself, the events map's own: one short bright
                segment runs the length of the connector and is gone. Drawn
                from the ground in dispute towards the forum, whichever end the
                reader picked, because that is the direction the case
                travelled. pathLength normalises the line to 100 so the dash
                figures are constants rather than a measurement per case.

                Keyed by the selection so that picking a second place runs it
                again: the attribute stays "on" across two selections, and a
                CSS animation only restarts when the rule starts matching. */}
            <line
              key={`glint-${sel ?? "none"}`}
              className="glint"
              data-state={sel === null ? "rest" : "on"}
              pathLength={100}
              x1={reach[0]}
              y1={reach[1]}
              x2={seat.at[0]}
              y2={seat.at[1]}
            />

            <g className="mk-seat" data-state={state("seat")}>
              <circle className="mk-court" cx={seat.at[0]} cy={seat.at[1]} r={R_COURT} />
              <circle
                className="mk-hit"
                data-mk="seat"
                cx={seat.at[0]}
                cy={seat.at[1]}
                role="button"
                tabIndex={rovKey === "seat" ? 0 : -1}
                aria-label={`${seat.name} – ${seat.caption}`}
                aria-pressed={sel === "seat"}
                onFocus={() => setRov("seat")}
                onClick={() => setSel((s) => (s === "seat" ? null : "seat"))}
                onKeyDown={(ev) => onKey(ev, "seat")}
              />
            </g>

            {theatres.map((t) => (
              <g key={t.id} className="mk-zone" data-state={state(t.id)}>
                {/* A theatre whose ground is an area draws no dots. The dot
                    was the whole error: a nationwide missile campaign stood
                    as one circle beside Kyiv, in a row with five occupied
                    oblasts, as though it were a sixth place.

                    What it does draw is the capital – a small ring, not a
                    filled mark, because it is a point of reference and not a
                    subject of the case. Owner: «або можна позначити Київ як
                    столицю України», «достав точку Київ». */}
                {t.ground === "area" && t.ptNames?.[0]?.label && (
                  <circle
                    className="mk-capital"
                    cx={t.pts[0][0]}
                    cy={t.pts[0][1]}
                    r={R_ZONE * 0.62}
                  />
                )}
                {t.ground !== "area" &&
                  t.pts.map((p, i) => (
                    <g key={i}>
                      <circle className="zone-halo" cx={p[0]} cy={p[1]} r={R_ZONE_HALO} />
                      <circle className="zone" cx={p[0]} cy={p[1]} r={R_ZONE} />
                    </g>
                  ))}
                {/* One target per theatre, on its first mark: two dots eight
                    units apart cannot each carry a 24px circle without one
                    swallowing the other's centre, and they are one thing. */}
                <circle
                  className="mk-hit"
                  data-mk={t.id}
                  cx={t.pts[0][0]}
                  cy={t.pts[0][1]}
                  role="button"
                  tabIndex={rovKey === t.id ? 0 : -1}
                  aria-label={`${t.place} – ${t.tag}`}
                  aria-pressed={sel === t.id}
                  onFocus={() => setRov(t.id)}
                  onClick={() => setSel((s) => (s === t.id ? null : t.id))}
                  onKeyDown={(ev) => onKey(ev, t.id)}
                />
              </g>
            ))}
          </g>
        </svg>

        {/* The names, in HTML over the drawing: SVG measures a font in user
            units, so the same declaration rendered 23 CSS pixels at 1440 and 6
            at 375. `aria-hidden`, because every one of them is already the
            accessible name of the mark it sits beside. */}
        <div className="map-labels" aria-hidden="true">
          <span className="ml-seat" data-state={state("seat")} style={at(...seat.at)}>
            <b>{seat.name}</b>
            <i>{seat.caption}</i>
          </span>
          {theatres.map((t) => {
            /* A theatre whose places are named one by one does not also write
               its own name over them where both would fit: that label is two
               lines and the widest thing on the drawing, and it sat in the
               middle of the cluster it describes, so five oblast names had to
               find room around it. The key under the map names the theatre.

               Marked rather than dropped, because on a phone the drawing is
               339px wide and the five names cannot fit at all – there the
               stylesheet hides them and shows this one instead. Which of the
               two is drawn is a question of width, and width is CSS's. */
            /* A theatre whose ground is the whole country writes nothing on
               the drawing at all. Its name stood over Kyiv with no mark under
               it, which put a label where a reader looks for a place – and
               the thing it names is not a place. The key below is its control:
               pressing it lights the country. Owner: «енергосистема України –
               можна прибрати з карти як підпис – нехай карта просто
               підсвічується під час натискання на легенду». */
            if (t.ground === "area") return null;
            const named = t.ptNames?.some((n) => n?.label) ? "yes" : undefined;
            const cx = t.pts.reduce((s, p) => s + p[0], 0) / t.pts.length;
            const cy = t.pts.reduce((s, p) => s + p[1], 0) / t.pts.length;
            const p = at(cx + (t.labelDx ?? 0), cy + (t.labelDy ?? 0));
            /* Held inside the frame, both ways. An HTML label does not clip,
               so a zone near an edge puts its name outside the picture and on
               top of whatever is beside it – and the nudges the summaries used
               to carry for exactly this were measured against an atlas that no
               longer exists, which is how «Донеччина та Луганщина» ended up at
               112% of the frame's height. The label sits above its mark, so
               the top bound is where it has room to and the bottom is where it
               would fall off. */
            const left = Math.min(Math.max(parseFloat(p.left), 13), 87);
            const top = Math.min(Math.max(parseFloat(p.top), 14), 96);
            return (
              <span
                key={t.id}
                className="ml-zone"
                data-named={named}
                data-state={state(t.id)}
                style={{ ...p, left: `${left}%`, top: `${top}%` }}
              >
                <i>{t.tag}</i>
                <b>{t.place}</b>
              </span>
            );
          })}
          {/* And the name of each mark. The theatre's name says what the case
              is about there; this says where there is. Not drawn for an area
              theatre, which has no marks to name. */}
          {theatres.flatMap((t) =>
            /* An area theatre names one place only – its capital. */
            (t.ground === "area" ? (t.ptNames ?? []).slice(0, 1) : (t.ptNames ?? [])).map(
              (n, i) => {
                  const pt = t.pts[i];
                  if (!pt || !n?.label) return null;
                  return (
                    <span
                      key={`${t.id}-p${i}`}
                      className="ml-pt"
                      data-capital={t.ground === "area" ? "yes" : undefined}
                      data-state={state(t.id)}
                      /* The nudge is in CSS pixels, not projection units: the
                         name is a fixed 11px whatever the drawing's scale, so
                         an offset that scales with the map is tuned for one
                         width and wrong at every other. Measured at 687 the
                         names cleared; at 1370 the same figures had grown
                         with the map and walked back onto the marks. */
                      style={
                        {
                          ...at(pt[0], pt[1]),
                          "--ml-dx": `${n.dx ?? 0}px`,
                          "--ml-dy": `${n.dy ?? 0}px`,
                        } as React.CSSProperties
                      }
                    >
                      {n.label}
                    </span>
                  );
              },
            ),
          )}
        </div>
      </div>

      {/* The legend is the other end of the same control. It carried the one
          sentence that says what happened at each place and had no way to tell
          the reader which mark that sentence belongs to; now pressing either
          lights both.

          A sibling of the drawing, not a child: with room it is lifted onto
          the map as a block standing on a strip the frame reserves for it, and
          on a phone it drops back into the flow beneath – see the stylesheet.
          Either way it must not be inside the box the names are placed
          against, whose height is the drawing's own. */}
      <div className="map-legend">
        <button
          type="button"
          className="lg-seat"
          data-state={state("seat")}
          aria-pressed={sel === "seat"}
          onClick={() => setSel((s) => (s === "seat" ? null : "seat"))}
        >
          <i className="lg-court" />
          <span className="lg-place">
            {seat.name} – {seat.caption}
          </span>
        </button>
        {theatres.map((t) => (
          <button
            key={t.id}
            type="button"
            className="lg-theatre"
            data-state={state(t.id)}
            aria-pressed={sel === t.id}
            onClick={() => setSel((s) => (s === t.id ? null : t.id))}
          >
            <i />
            <span className="lg-place">
              {t.place} – <b>{t.tag}</b>
            </span>
            {t.summary && <span className="lg-note">{t.summary}</span>}
          </button>
        ))}
        {/* That the marks answer at all. One line, and only where there is
            more than one thing to tell apart. */}
        {/* The «press a mark» line is gone. It was an instruction for
            something the marks already do – they are buttons, they take a
            hover and a focus ring, and a reader who does not press them
            loses nothing: the key says what each one is in words. A caption
            that teaches an optional interaction is a caption the reader
            has to read before deciding they did not need it. */}
      </div>
    </div>
  );
}
