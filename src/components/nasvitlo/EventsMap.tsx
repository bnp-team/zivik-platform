"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { plural, type PluralForms } from "@/i18n/plural";
import geometry from "@/content/europe-map.json";
import "./events-map.css";

/**
 * The events map: where the harm happened, and which courts are hearing it.
 *
 * Replaces an <iframe> onto a self-contained d3 page. That page fetched d3,
 * topojson-client and the world geometry from two CDNs on every homepage view,
 * carried its own copy of the webfonts, and had its labels hardcoded in
 * Ukrainian – so the English homepage showed a Ukrainian map and none of the
 * text was visible to a search engine.
 *
 * Geometry is projected at build time (scripts/europe-map.mjs), so this is
 * plain SVG: no map library ships to the reader, and the whole thing is in the
 * page's own DOM, themed by the page's own tokens.
 *
 * Props arrive locale-resolved. This is a client component, so its props are
 * serialized into the payload – passing {uk, en} pairs would ship both
 * languages to every reader.
 */
export interface MapEventR {
  key: string;
  size: number;
  /**
   * How many items in the registry this site accounts for, as a number.
   *
   * `count` says it in words and the words differ per site – проваджень,
   * рішення, арбітражів, ордерів – so the card could not work out that it was
   * showing three links under a heading that claimed eleven. This is the same
   * figure the marker's radius comes from.
   */
  total: number;
  when: string;
  title: string;
  note: string;
  /**
   * The ground this marker speaks for, where a point is not the whole truth –
   * see `area` in src/content/map.ts. "country" is Ukraine's own outline;
   * anything else names a path in `geo.areas`.
   */
  area?: string;
  courts: string[];
  forums: string;
  count: string;
  /** The linked case is not one of the things this marker counts. */
  linksOutsideCount?: boolean;
  /** Decisions this site leads to. Empty means nothing is summarised yet. */
  cases: { slug: string; title: string; forum: string; stage?: string; amount?: string }[];
}
export interface MapCountryR {
  /** The atlas's own name for the shape – a key of `forums` in the geometry. */
  key: string;
  /** The country, in the reader's language. */
  label: string;
  /** "in <this country>", authored – see `MapCourt.at` in content/map.ts. */
  at: string;
  /** Every institution seated in it, for the card's way into the registry. */
  courtIds: string[];
  /** Every seat in the country, merged across its markers. */
  seatList: { id?: string; abbr?: string; national?: boolean; count?: number; name: string }[];
  /** How much of the archive those seats hold, summed. */
  total: number;
}

export interface MapCourtR {
  key: string;
  city: string;
  /** "in <this city>", authored – see `MapCourt.at` in content/map.ts. */
  at: string;
  /** The seats joined into one line – still what the list under the map on
   *  the full page prints. The card uses `seatList` instead. */
  seats: string;
  /**
   * The same seats one by one, each carrying the institution it is – where it
   * is one – so the card can make that court name a link into the registry.
   * `id` is absent for a seat that is not a registry institution: Paris holds
   * the PCA as the *venue* of the Oschadbank arbitration, and the PCA itself
   * sits in The Hague. Such a seat is named and not linked.
   */
  seatList: { id?: string; abbr?: string; national?: boolean; count?: number; name: string }[];
  /**
   * The city is off the projection's frame, so it has no point in
   * europe-map.json and is docked against the frame's edge instead.
   */
  offMap?: boolean;
  /**
   * Where an off-map city really projects to. Outside the frame by
   * definition – it is the bearing that matters, not the position.
   */
  offAt?: { x: number; y: number };
  /**
   * Short names – the abbreviations the citations use – shown under the city
   * once the court lights up. `courtBadges` in src/content/map.ts derives
   * them; they are required rather than optional so that a render site which
   * forgets them fails the type-check instead of quietly labelling nothing.
   */
  badges: string[];
  labelDy?: number;
  /** What the registry says this court is hearing, and which of it is readable. */
  caseload: {
    /** Registry institution ids, for the link that hands over the rest. */
    courtIds: string[];
    total: number;
    written: { slug: string; title: string; stage?: string; amount?: string }[];
    listed: {
      id: string;
      name: string;
      /** The same case in Ukrainian. Absent in the English locale. */
      nameUk?: string;
      note: string;
      stage?: string;
      amount?: string;
    }[];
  };
}
export interface MapGeometry {
  viewBox: string;
  context: string[];
  ukraine: string;
  /**
   * Ukraine's internal oblast boundaries, as one mesh of open polylines – the
   * edges two of the 27 admin-1 units share, and nothing else. See the note in
   * scripts/europe-map.mjs for why this is a mesh and not 27 outlines.
   */
  regions: string;
  /**
   * Named pieces of ground a marker can speak for. Ukraine entire is not in
   * here – that is `ukraine` above, and drawing it twice would put two strokes
   * on the same coast.
   */
  areas?: Record<string, string>;
  /**
   * The states that host a forum, keyed by the atlas's own name for each – the
   * six in `FORUM_STATES` in scripts/europe-map.mjs.
   *
   * They are also in `context`, as two of its 41 anonymous background paths;
   * these are the same outlines named, because a shape you have to fill is a
   * shape you have to be able to find. Ukraine is deliberately not among them:
   * it is the subject of these proceedings, not a forum for them.
   */
  forums: Record<string, string>;
  markers: Record<string, number[]>;
}

/**
 * The projected drawing, imported here rather than handed down as a prop.
 *
 * It is the same file `scripts/europe-map.mjs` writes, and it used to arrive
 * from the two server components that render this one. That put it in the
 * document twice: once as the `d="…"` attributes React server-rendered – which
 * is the drawing, and has to be there – and once more inside the flight
 * payload, because everything a client component is handed is serialized for
 * hydration. Measured on the built documents, the second copy cost 18,574
 * gzipped bytes of /uk's 66,149 and 18,958 of /uk/map's 56,377 – and there is
 * no deduplicating the two, because gzip's window is 32 kB and the copies are
 * a hundred kilobytes apart in the file.
 *
 * A prop was the wrong shape for it. Props are how the server tells this
 * component things it could not know – which locale, which strings, which
 * cases – and the coastline is none of those: it is the same 45,616 bytes on
 * both map surfaces in both languages, and it changes only when the generator
 * is re-run. As an import it is in the component's own chunk, which the
 * browser fetches once, caches, and reuses across all four routes, instead of
 * in four documents that cannot cache and cannot share.
 *
 * The trade, stated: that chunk goes from 8,000 to 25,681 gzipped bytes, and
 * it is only ever loaded on the two routes that draw a map. A reader who opens
 * one map page and no other pays about the same either way; a reader who opens
 * the home page and then the map's own page pays 19 kB less, and so does every
 * reader who comes back.
 *
 * Nothing about what is drawn or when changes: the paths are still in the
 * server-rendered HTML, so the map is in the first frame and hydration finds
 * the markup it expects. That is the whole reason this is an import and not a
 * second fetch – a fetched drawing would paint an empty frame first.
 */
const geo = geometry as MapGeometry;

/**
 * Which way a site's label leans off its marker.
 *
 * Pure layout, so it lives with the renderer rather than in the content file:
 * it answers a question about pixels, and it would have to change if the frame
 * or a marker moved. Measured in the close framing at 1440px, where the drawing
 * renders 1420px wide and one unit of the projection is 2.78px:
 *
 *   MH17 and eastern Ukraine are 16.9 units apart – 47px – so one goes up and
 *   the other right. Crimea and the Kerch strait are 31.7 apart on a near-
 *   horizontal line, so they go opposite ways. Energy sits due west of
 *   Mariupol, 48.6 apart, and takes the west side; Mariupol drops below,
 *   clear of the Sea of Azov coast where its own halo already sits.
 *
 * The offsets themselves are not here: a label is placed just outside its
 * marker's halo, which is drawn in projection units, plus a gap measured in
 * screen pixels. Both parts are computed below, so the placement holds at any
 * zoom instead of being tuned for one.
 */
const LABEL_SIDE: Record<string, "left" | "right" | "above" | "below"> = {
  crimea: "left",
  /* `kerch` has no event behind it today – «Затримання кораблів» is off the
     map, see content/map.ts. The entry stays because the placement was worked
     out against Crimea's label and would have to be worked out again. */
  kerch: "right",
  energy: "left",
  mariupol: "below",
  mh17: "right",
  donbas: "above",
};

/**
 * A marker label, derived from the site's own date tag.
 *
 * NEEDS THE OWNER'S REVIEW – see the note on `when` in src/content/map.ts.
 * Every tag but one reads "<noun> · <date>", and that noun is the shortest
 * true name the archive already gives the site: Окупація / Occupation,
 * Затримання / Seizure, Схід / The east, Енергетика / Energy, MH17. The sixth
 * has no noun – its tag is bare "2022" – so that is what it says. Nothing here
 * is invented: a label a reader could mistake for a place name we assigned
 * would be worse than a date.
 *
 * The full title is never far: it is in the card the marker opens and in the
 * list of six below the drawing, at 15px.
 */
const shortLabel = (when: string) => when.split("·")[0].trim();

/**
 * Below this many CSS pixels per projection unit, the labels are not drawn.
 *
 * The tightest pair on the map is MH17 and eastern Ukraine at 16.9 units. At
 * 2.6px per unit that is 44px between the two markers, which is what the
 * placement above needs to keep two labels apart; below it they touch. The
 * threshold is on the rendered scale rather than on a framing or a breakpoint
 * because that is the thing legibility actually depends on – the wide framing
 * at 1440px gives 1.18px per unit and the close one 2.78, and a phone in the
 * close framing gives 0.76, so the same rule covers all three without naming
 * any of them.
 */
const LABEL_MIN_SCALE = 2.6;

/**
 * How much room two labels need between their markers, in CSS pixels.
 *
 * `LABEL_MIN_SCALE` above asks this question of the whole set at once, using
 * the tightest pair in it – MH17 and eastern Ukraine, 16.9 units – so one
 * crowded pair kept the other four unnamed. Measured on the built page, that
 * meant the map opened with its nine courts named and the six places the
 * archive is *about* drawn as unlabelled dots: 0.94 CSS pixels per unit at
 * 1440, against the 2.6 the threshold wants. The card used to cover for it by
 * opening on one of them, and the card does not open any more.
 *
 * Asked per marker instead, against the room that marker actually has, the
 * four with a country to themselves are named at the framing the map opens
 * at and the crowded pair joins them when the reader comes closer. 44px is
 * the same figure the old threshold encodes – 16.9 units at 2.6.
 */
const LABEL_GAP = 44;

/**
 * Hit targets, in projection units, once the scale is known.
 *
 * 24 CSS pixels is the floor, and the drawing no longer has one fixed scale to
 * meet it at: the frame follows the container's shape now, so the same r=11
 * that rendered 26.4px on a 1440px home band renders 16.8px on a 1000×650
 * window. So the radius is whatever 24px works out to – but no smaller than it
 * was, and no larger than the closest pair can bear. MH17 and eastern Ukraine
 * sit 16.9 units apart, and a circle wider than that would swallow its
 * neighbour's centre: the top one would always win, and a target you cannot
 * aim at is worse than a small one. The court seats are further apart – The
 * Hague and Brussels, the tightest, are 32 – so they can grow further.
 *
 * `cap` is that room, and it is measured per marker rather than per family
 * now: see `gap` in the component. Those two figures are what it comes out at
 * for the two crowded pairs; a marker with a continent to itself gets what it
 * needs instead of what its most crowded neighbour could bear.
 */
/**
 * A label's size in projection units, so it renders at `want` CSS pixels.
 *
 * The court labels were the one thing on the drawing still measured in
 * projection units, which meant their size was whatever the framing happened
 * to give them: 12.6px on the map's own page when it filled the viewport by
 * cropping, 7.6px once it stopped cropping, and 3.2px on a phone. `cap` is the
 * floor of that trade – past it the label would be larger than the country it
 * names, so it stops growing and shrinks with the drawing instead.
 */
const labelSize = (want: number, cap: number, px: number) =>
  Math.min(cap, want * (px || 1));

const hitR = (min: number, max: number, px: number) =>
  // 12.4 rather than 12: a circle asked for exactly 24px measures 23.9 once
  // the browser has rounded its box, and 24 is a floor, not a target.
  Math.min(max, Math.max(min, 12.4 * (px || 1)));

/** Keep a frame inside the projection: never wider than it, never outside it. */
function clamp(
  v: { x: number; y: number; w: number; h: number },
  full: { x: number; y: number; w: number; h: number },
) {
  const w = Math.min(v.w, full.w);
  const h = Math.min(v.h, full.h);
  return {
    w,
    h,
    x: Math.min(Math.max(v.x, full.x), full.x + full.w - w),
    y: Math.min(Math.max(v.y, full.y), full.y + full.h - h),
  };
}

/** The element, and the strip of it each floating panel has spoken for. */
interface Box {
  w: number;
  h: number;
  t: number;
  r: number;
  b: number;
  l: number;
}

/** How far in the reader may zoom. Past this the projection's rounding shows. */
const MIN_W = 120;

/**
 * The air the widest framing leaves round the outermost thing it holds, in
 * projection units.
 *
 * 150 rather than the 64 a marker needs to clear its own halo and label: this
 * is the frame's edge, not a gap between two markers, and the easternmost
 * marker is not the easternmost thing the reader is looking at. MH17 sits at
 * x = 876.9 and Ukraine's coast runs to 900.4, so 64 would put the country
 * this map is about 40 units – 26 CSS pixels at 1440 – from the picture's
 * edge. 150 leaves 126 units, 78 pixels, behind the coast.
 */
const SPAN_EDGE = 150;
/**
 * And the air it leaves on the side an off-window seat came in from.
 *
 * A seat with no point in europe-map.json is off the projection's declared
 * window because it is on another continent – today Montreal, where the ICAO
 * Council decided the MH17 case the ICJ is hearing on appeal. A marker's own
 * 64 units there buys the Gulf of St Lawrence and calls it the Atlantic:
 * measured on the built page at 1440, that framing came out
 * `-1000.9 -555.4 2200.9 1267.0`, which put Montreal 2.9% of the frame's width
 * inside the western edge, with Greenland and open water where a reader was
 * promised America.
 *
 * 360 is the judgement, and these are the numbers behind it. It puts Montreal
 * 15.5% in – far enough from the edge to read as a city in a country rather
 * than a marker pinned to a border. It reaches x = -1296.9, about 96°W:
 * Toronto (-1030.9), Detroit (-1090.2) and Chicago (-1164.3) all project
 * inside the frame, so what stands behind Montreal is the Great Lakes and the
 * eastern half of a continent, not a coastline. Further west buys prairie at a
 * real cost to the thing the other two framings are for; nearer puts the city
 * back on the edge.
 */
const SPAN_FAR = 360;

/**
 * The air an auto-framed view leaves round the outermost thing it holds.
 *
 * Smaller than `SPAN_EDGE`, which frames the whole map and has a coastline to
 * clear: this frames one relation, and what it has to clear is a marker's own
 * halo (up to 13 units) plus its label. 90 leaves the label room at every
 * scale the frame can come out at, and keeps the two ends of a short relation
 * – a site and The Hague – from filling the picture edge to edge.
 */
const FOCUS_EDGE = 90;


/**
 * How far a press may travel and still count as a click, in CSS pixels.
 *
 * Small, because the drawing is not a scrolling surface and a reader aiming at
 * a marker holds still; large enough that the two or three pixels a hand moves
 * while pressing a mouse button do not turn a selection into a pan.
 */
const DRAG_SLOP = 4;

/**
 * The viewBox that puts `content` where the reader can actually reach it.
 *
 * Two bugs came out of one assumption – that the drawing may use every pixel
 * of its box.
 *
 *   The map's own page filled the viewport with `preserveAspectRatio: slice`,
 *   which crops whatever does not fit the container's shape. On a 1000×900
 *   window that cropped the west: The Hague – the ICJ, the ICC, the PCA and
 *   the MH17 trial court – and Paris, which holds the largest award in the
 *   collection, were both outside the frame with no way to reach them.
 *
 *   And the panels that float over the drawing – the masthead, the info card,
 *   the framing buttons – sat on top of markers. The card covered four of the
 *   six sites until it moved; the masthead still covered Stockholm, which
 *   could not be clicked at any width between 900 and 1000px.
 *
 * So the frame is computed rather than declared. It always takes the
 * container's own aspect ratio, which means `meet` and `slice` agree and
 * nothing is ever cropped; and `content` is fitted into the box *minus* the
 * strips the panels have claimed, so a marker never lands under one. The
 * frame still covers the whole element – the projection is drawn far past the
 * 1200×460 window (the atlas runs -2658…3162 across), so what the panels sit
 * on is more of Europe, not a black bar.
 */
function fitView(
  content: { x: number; y: number; w: number; h: number },
  box: Box,
) {
  if (!(box.w > 0) || !(box.h > 0)) return content;
  const uw = Math.max(1, box.w - box.l - box.r);
  const uh = Math.max(1, box.h - box.t - box.b);
  const s = Math.min(uw / content.w, uh / content.h);
  return {
    w: box.w / s,
    h: box.h / s,
    x: content.x + content.w / 2 - (box.l + uw / 2) / s,
    y: content.y + content.h / 2 - (box.t + uh / 2) / s,
  };
}

/**
 * Where the reader has zoomed to, as a ratio and a centre rather than a rect.
 *
 * The frame changes shape whenever the container does, so a stored rect goes
 * stale: it was fitted to a window that no longer exists. A ratio and a centre
 * survive the change – the view is derived from whatever the frame is now.
 */
type Nav = { z: number; cx: number; cy: number } | null;

/**
 * Keep something to look at on screen.
 *
 * The pan bound is the whole projected span now, and the span is mostly ocean:
 * measured, a drag west from the opening framing followed by nine notches of
 * zoom put the reader on an empty black rectangle in the middle of the North
 * Atlantic, with no marker, no coast and nothing to say which way back was.
 * Clamping to the bound cannot catch that – the mid-Atlantic is inside it.
 *
 * So the last word belongs to the markers: if the view holds none of them, it
 * slides the shortest distance that brings the nearest one to its edge.
 * Everywhere else this returns the view untouched, which is every framing and
 * almost every drag.
 *
 * To the edge, and not a margin inside it. A margin looks kinder and is not:
 * the Atlantic is 1227 units across, which at the opening framing is the width
 * of the whole view, so Paris and Montreal are never both in frame and are
 * only just ever either. An eighth of the frame in hand – tried, measured –
 * opened a band in the middle of the ocean that neither city could be held
 * from, and the reader who dragged west to look for Montreal was pushed back
 * to Paris every time. At zero the crossing is 0.6 units wide and a drag step
 * is fifty times that.
 */
function hold(
  v: { x: number; y: number; w: number; h: number },
  pts: [number, number][],
) {
  if (!pts.length) return v;
  const has = pts.some(
    ([x, y]) => x >= v.x && x <= v.x + v.w && y >= v.y && y <= v.y + v.h,
  );
  if (has) return v;
  const cx = v.x + v.w / 2;
  const cy = v.y + v.h / 2;
  let bx = pts[0][0];
  let by = pts[0][1];
  let best = Infinity;
  for (const [x, y] of pts) {
    const d = (x - cx) ** 2 + (y - cy) ** 2;
    if (d < best) {
      best = d;
      bx = x;
      by = y;
    }
  }
  return {
    ...v,
    x: Math.min(Math.max(v.x, bx - v.w), bx),
    y: Math.min(Math.max(v.y, by - v.h), by),
  };
}

/** Clamp to the bound, keep a marker, and stay inside the bound doing it. */
const settle = (
  v: { x: number; y: number; w: number; h: number },
  outer: { x: number; y: number; w: number; h: number },
  pts: [number, number][],
) => clamp(hold(clamp(v, outer), pts), outer);

/**
 * `full` sets the unit the zoom ratio is measured in – 1 is the framing the
 * map opens at – and `outer` is how far out and how far sideways the reader
 * may go. They used to be the same rect, which is why the map could not be
 * dragged at all until it had been zoomed in: at the opening framing the view
 * already filled its own bound, so every pan clamped straight back and the
 * `grab` cursor was describing something that could not happen. `outer` is the
 * whole projected span now – Montreal included – so a ratio above 1 is a real
 * framing and a press on the ground always moves something.
 */
function viewFrom(
  nav: Nav,
  full: { x: number; y: number; w: number; h: number },
  outer: { x: number; y: number; w: number; h: number },
  pts: [number, number][],
) {
  if (!nav) return full;
  const w = Math.min(outer.w, Math.max(MIN_W, full.w * nav.z));
  const h = w * (full.h / full.w);
  return settle({ w, h, x: nav.cx - w / 2, y: nav.cy - h / 2 }, outer, pts);
}

/** A view rect, back as the ratio and centre the state holds. */
const navOf = (v: { x: number; y: number; w: number; h: number }, fullW: number): Nav => ({
  z: v.w / fullW,
  cx: v.x + v.w / 2,
  cy: v.y + v.h / 2,
});

/**
 * The legend's group headings.
 *
 * On the home band the map sits under the section's own <h2>, so h3 is the
 * right level. On the map's own page there is nothing between them and the
 * <h1>, and h1 → h3 is a skipped level: a reader stepping the outline is told
 * a rank is missing that never existed. Same headings, the level the surface
 * it is on actually needs.
 *
 * Declared here rather than inside the component: a component defined during
 * render is a new type on every render, so React unmounts and remounts the
 * heading each time the selection changes.
 */
function LegendH({
  variant,
  children,
}: {
  variant: "band" | "full";
  children: ReactNode;
}) {
  return variant === "full" ? <h2>{children}</h2> : <h3>{children}</h3>;
}

export default function EventsMap({
  events = [],
  countries = [],
  courts,
  labels,
  locale,
  variant = "full",
}: {
  /**
   * The six event markers inside Ukraine, and the dashed lines from each to
   * the courts hearing it.
   *
   * Optional, and nothing passes it any more. The map used to answer "what
   * happened, and who is judging it", which made the drawing a claim about
   * particular events; the owner's decision is that it answers "which states
   * hear these cases" instead, and a claim about states is not made out of
   * pins stuck in the country the cases are about.
   *
   * The prop stays rather than being torn out, because everything it drives is
   * written to render from the data it is given: pass none and the markers,
   * the reach lines, the six site cards, the «Місця подій» group and the
   * dashed-line key all stop rendering on their own. That is also what makes
   * the decision reversible by one line at the call site instead of a revert.
   */
  events?: MapEventR[];
  /**
   * The lit countries, and what pressing one should say.
   *
   * The drawing gained lit states before it gained a way to press one: a
   * reader could see that six countries hear these cases and could only ask
   * about them by finding the city dot inside. Pressing a country now does
   * what pressing a city does – its courts, as a list, each linking to its own
   * caseload. France carries two, which is why each entry brings its own
   * merged seat list rather than a court key.
   */
  countries?: MapCountryR[];
  courts: MapCourtR[];
  labels: {
    alt: string;
    close: string;
    courtsSeat: string;
    /** The two states a site can be in: written up, or not yet. */
    legendLit: string;
    legendUnlit: string;
    court: string;
    /** The grip that moves the card out from over whatever it is covering. */
    moveCard: string;
    /** Heading above the decision links inside a card. */
    reads: string;
    /**
     * "Written up: 3 of 11" – the gap between what a site accounts for and
     * what a reader can open. The count line said 11 and the list showed 3,
     * and nothing said whether the other eight existed.
     */
    writtenOf: string;
    /** For a marker whose linked case is not one of the things it counts. */
    writtenBehind: string;
    /**
     * "See them in the registry". A seat's full caseload is the registry's
     * job, not a 300px card's: The Hague's ran to 3011px of scroll against a
     * 753px window, in raw registry captions, with the same paragraph of Rome
     * Statute articles repeated four times.
     */
    allInRegistry: string;
    /** Shown where a site has no summarised decision yet. */
    pending: string;
    /**
     * What the figure on a decision is. The sign in the registry encodes which
     * way the money ran – the gas sales arbitration is recorded as −2.02bn –
     * and no tag can caption that honestly, so the map shows the magnitude and
     * says what it is: the sum in dispute. Same wording as the pending case
     * page, from the same reasoning.
     */
    amountLabel: string;
    /** The key's own name, on the control that folds it away. */
    legendTitle: string;
    /**
     * The name on the control that folds the six places away. Not «Список» –
     * it is the same six the drawing holds, said in words, and where the marks
     * are too small to aim at it is the only way to reach them.
     */
    placesTitle: string;
    /** Legend group headings. */
    legendWhat: string;
    legendHow: string;
    /** What the dashed line means. */
    legendLine: string;
    /** What a state filled in the institutional blue means. */
    legendForum: string;
    /**
     * And what a marker docked against the frame's edge means. Only rendered
     * where a seat is actually off the projection's window – today Montreal,
     * and by data rather than by name.
     *
     * This comment stood here for a long time with no field under it: the key
     * was planned when the dock was built and never written, so the one glyph
     * on the drawing a reader has no way to recognise – a marker pinned to the
     * border with a chevron and a tail running off the picture – was the one
     * the legend did not explain.
     */
    legendOffMap: string;
    /** The oblast mesh inside Ukraine's outline. */
    legendRegions: string;
    /**
     * The ground a mark speaks for, where a point is not the whole truth about
     * it. Only rendered where some site declares an `area` – by data rather
     * than by name, like the docked-seat key above.
     */
    legendArea: string;
    /**
     * That the marks answer at all, and what answering does. The map's whole
     * mechanic – pick one end of a relation and the other lights – was
     * nowhere on the page; a reader had to discover it by clicking something
     * they had no reason to think was a control.
     */
    legendPick: string;
    /** Heading over the sites a selected court hears. */
    courtHears: string;
    /* `courtNoSites` was declared here and never read. It named a sentence
       in content/map.ts about "the six places on the map"; the map has not
       marked places since it became a map of the States whose courts hear
       these proceedings, and the sentence is gone with the field. */
    /**
     * "{n} {w} in the library" – the court's own caseload, with the noun left
     * to `caseloadWord` because it agrees with the number. The template used
     * to carry the genitive plural itself and this component substituted the
     * figure with a bare `.replace`, so eight of the nine courts read
     * «1 проваджень» / «3 проваджень» and seven of nine "1 proceedings".
     */
    caseload: string;
    caseloadWord: PluralForms;
    /** The card's foot: the total, and the way out into the registry. */
    seatsTotal: string;
    /** The heading over the rows that are a state's own courts. */
    seatsNational: string;
    seatsOpen: string;
    /** Heading over the cases a court hears that have no write-up yet. */
    inLibrary: string;
    /** The three framings. */
    zoomLabel: string;
    zoomWide: string;
    zoomClose: string;
    /**
     * The widest framing there is – everything the map has to show.
     *
     * It was «Атлантика», which named the ocean in the middle of it rather
     * than what it is for. The three read as a ladder now, widest to
     * tightest: the whole map, Europe, Ukraine. A reader picking a framing is
     * choosing how close to stand, not which sea to look at.
     */
    zoomAtlantic: string;
    /**
     * Back to what is being looked at: the selection if there is one, the
     * opening framing if there is not.
     *
     * The three framings are absolutes, and the wheel, the drag and the
     * stepper leave the reader between them – nothing pressed, and no way back
     * that does not throw away the card they have open.
     */
    zoomReset: string;
    zoomIn: string;
    zoomOut: string;
    /**
     * What the home band says when the wheel scrolled the page instead of
     * zooming the map. Never shown on the map's own page, where it does zoom.
     */
    wheelHint: string;
    /**
     * What the drawing says where it is a picture rather than a control.
     *
     * On a phone the marks are 9.9px across and the component correctly stops
     * answering the pointer – but it said so nowhere, and kept a grab cursor
     * and a zoom stepper that could not reach a usable scale. Now it says what
     * it is and offers the one thing that does work: the whole screen.
     */
    overview: string;
    openFull: string;
    closeFull: string;
  };
  locale: string;
  /**
   * "band" is the home page: the drawing, a card when a dot is picked, and a
   * key to the three colours. Nothing else – the seat list, the how-to-read
   * column and the row of six site cards belong on the map's own page, where
   * there is room to read them.
   */
  variant?: "band" | "full";
}) {
  /**
   * One selection, of either kind. Sites and courts are two ends of the same
   * relation, so selecting one must clear the other – holding both would light
   * two different sets of lines at once and mean nothing.
   */
  /**
   * Nothing, until the reader picks something.
   *
   * The map used to open with one card already up – MH17, by an `open` flag on
   * the content – so a reader arriving at the page found a panel lit over the
   * drawing describing a place they had not asked about, and the six marks all
   * quietened behind one relation they had not chosen. A default selection is
   * the map answering a question nobody put to it.
   */
  const [sel, setSel] = useState<{ kind: "site" | "court" | "country"; key: string } | null>(null);

  /**
   * The whole screen, on a device that cannot use the drawing any other way.
   *
   * On a phone the marks render 9.9 CSS pixels across and the component
   * correctly stops answering the pointer – but the answer to "the drawing is
   * too small" was a zoom stepper that needed twelve presses to reach a usable
   * scale and left the reader in a corner of the Atlantic. Rotating is not the
   * answer either: most phones have autorotate locked, so a "turn your phone"
   * prompt is a dead end for the reader who most needs it.
   *
   * The screen is. Held full, a 390px phone gives the drawing 390 x 780
   * instead of 390 x 202, which is 2.5 CSS pixels per projection unit – past
   * every threshold on this page: the marks answer, the sites are labelled and
   * the cities are named. It works in either orientation and asks nothing of
   * the device's settings.
   */
  const [full, setFull] = useState(false);

  /**
   * Where the reader has put the card, in CSS pixels from where it opens.
   *
   * The card is anchored to one corner and the drawing is not: a marker, the
   * masthead, a seat the reader wants to reach can all end up under it, and
   * the only answers were to close it or to change the framing. Now it can be
   * moved. Kept across selections, because a reader who moved it out of the
   * way meant it; cleared when they close the last card, so it does not open
   * somewhere surprising an hour later.
   */
  const [cardAt, setCardAt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const cardDrag = useRef<{ id: number; x: number; y: number } | null>(null);



  /**
   * Is the key open?
   *
   * A legend is read once and then remembered – after that it is a column of
   * things the reader already knows, sitting where the map could be. So it
   * folds, and the drawing takes the height back. Open by default: a reader
   * who has not read it yet cannot be expected to go looking for it.
   */
  const [legendUser, setLegendUser] = useState<boolean | null>(null);
  /* `null` is not closed: it is "whatever the surface can spare", and the
     stylesheet answers it – open on a window wide enough to lay it beside the
     drawing, folded on a phone, where an open key stands between the reader
     and everything under it. */
  /* Вузьке вікно – та сама межа, що в events-map.css (`max-width: 900px`).

     Стилі й розмітка відповідали на `null` по-різному. CSS ховав ключ на
     телефоні, а кнопка вважала `null` відкритим: на 390 «Легенда» стояла з
     трикутником донизу і `aria-expanded="true"` над складеним блоком, а
     перший дотик ставив `false` – тобто нічого не робив, і відкрити ключ
     вдавалося лише з другого разу. Тепер кнопка питає ту саму ширину, що й
     стилі. До гідратації `narrow` – `false`, як на сервері, тож розмітка
     збігається; перший кадр усе одно малює CSS, а JS лише доганяє атрибут. */
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const legendOpen = legendUser ?? !narrow;

  /**
   * A legend key held down: show me this set of marks and quieten the rest.
   *
   * The legend drew the marks instead of naming them, which was the right
   * idea and half the job – a key that shows you what a mark looks like still
   * leaves you to find them yourself, on a drawing where five of fifteen are
   * inside one country. Pressing the key answers it.
   *
   * Only the three keys that name a *set* take a press. «Пунктир» and the
   * size key describe a property of the drawing, not a group you could ask to
   * see on its own, so they stay captions.
   */
  const [hi, setHi] = useState<"lit" | "unlit" | "court" | "area" | null>(null);

  /**
   * The selection lives in the URL so a card can be linked to.
   *
   * Written with history.replaceState rather than useSearchParams: on a
   * prerendered route that hook pushes the client tree up to the nearest
   * Suspense boundary into client-side rendering, and the whole point of
   * replacing the old iframe was that this map's text ships in the HTML.
   */
  /**
   * Write the selection into the address bar, leaving every other parameter
   * alone. replaceState rather than pushState: a card is a view of the page,
   * not a page, and six clicks around the drawing should not cost a reader six
   * presses of Back to leave.
   */
  const syncUrl = useCallback((next: { kind: "site" | "court" | "country"; key: string } | null) => {
    const q = new URLSearchParams(window.location.search);
    q.delete("site");
    q.delete("court");
    /* A lit country is linkable like any other selection – `?country=France`,
       keyed by the atlas name the geometry uses, so the parameter and the
       shape it opens cannot drift apart. */
    q.delete("country");
    if (next) q.set(next.kind, next.key);
    const qs = q.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, "", url);
    }
  }, []);

  /**
   * A selection waiting for a frame that can hold both ends of it.
   *
   * Requested here and served by the effect below, because the frame is
   * computed from the element's measured box and that is not known this far up
   * the component. Only ever set by an act of the reader's – the card the map
   * opens with does not move the view.
   */
  const [focusReq, setFocusReq] = useState<{ kind: "site" | "court" | "country"; key: string } | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const site = q.get("site");
    const court = q.get("court");
    const country = q.get("country");
    // Same trade as CaseTimeline: one extra render buys a selection that
    // survives a reload and can be shared as a link. The query string is only
    // legible in the browser – useSearchParams would pull this prerendered
    // page into client rendering to learn it a render earlier.
    const from =
      site && events.some((e) => e.key === site)
        ? ({ kind: "site", key: site } as const)
        : court && courts.some((c) => c.key === court)
          ? ({ kind: "court", key: court } as const)
          : country && countries.some((c) => c.key === country)
            ? ({ kind: "country", key: country } as const)
            : null;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (from) {
      setSel(from);
      // A link to ?site= or ?court= is the reader asking for that thing, so
      // it gets a frame that holds it. Nothing else opens a card any more –
      // the map opens with none – so this is the only way in that moves the
      // view, and it moves it because a reader followed a link to one place.
      setFocusReq(from);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // A parameter that names nothing – a typo, a link to a site that has since
    // been renamed, or ?site= and ?court= both set, where only the first can
    // win – used to be left standing in the address bar describing something
    // the page was not showing. ?site=atlantis drew MH17 and still said
    // atlantis, and that is the URL the reader would have copied. So the
    // address bar is rewritten to whatever is actually drawn, which for a
    // parameter that resolves to nothing is the page's own default: no
    // parameter at all.
    if (site !== null || court !== null) syncUrl(from);
    // events/courts are stable per render of the server component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * The control that opened the current card.
   *
   * Dismissing a card unmounts everything inside it, the close button
   * included. If the keyboard was in there, the browser drops focus on
   * <body> – measured: pressing the card's × left activeElement === body, so
   * the next Tab restarted at the top of the document. Remembering the opener
   * lets the card hand the keyboard back where it came from.
   */
  const openerRef = useRef<HTMLElement | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  /** The way out of the full screen, and where the keyboard lands on the way in. */
  const exitRef = useRef<HTMLButtonElement>(null);

  const select = useCallback(
    (next: { kind: "site" | "court" | "country"; key: string } | null) => {
      if (next) {
        openerRef.current = document.activeElement as HTMLElement | null;
      } else {
        setCardAt({ x: 0, y: 0 });
        if (liveRef.current?.contains(document.activeElement)) {
          openerRef.current?.focus?.();
        }
      }
      setSel(next);
      setFocusReq(next);
      syncUrl(next);
    },
    [syncUrl],
  );

  /* A card is a popup, and a popup closes on Escape. Until now the only way
     out was to Tab to the × – and the × dropped focus on <body>. The full
     screen is the outer of the two, so it is the second thing Escape reaches:
     one press puts the card away, the next gives the page back. */
  useEffect(() => {
    if (!sel && !full && !hi) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (hi) setHi(null);
      else if (sel) select(null);
      else setFull(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sel, full, hi, select]);

  /* Held full, the drawing covers the document; a document that still scrolls
     underneath is the classic overlay bug – the reader leaves the map and
     finds the page has moved somewhere they never went. */
  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [full]);

  const toggleSite = (key: string) =>
    select(sel?.kind === "site" && sel.key === key ? null : { kind: "site", key });
  const toggleCourt = (key: string) =>
    select(sel?.kind === "court" && sel.key === key ? null : { kind: "court", key });
  const toggleCountry = (key: string) =>
    select(sel?.kind === "country" && sel.key === key ? null : { kind: "country", key });


  /**
   * Two framings of the same projection.
   *
   * Wide is the argument the map makes: the distance between where the harm
   * happened and where it is being weighed. But Ukraine is 24% of that frame,
   * and inside it MH17 and eastern Ukraine sit 20px apart on a 1440px screen –
   * their haloes overlap and the hit targets nearly touch. Close reframes on
   * the sites at x2.35, which opens that gap to 47px. Nothing is reprojected;
   * only the viewBox changes.
   */
  /**
   * The frame, as numbers rather than two strings. Two named framings were not
   * enough: between them the sites still crowd each other, and a reader who
   * wants one corner of the Donbas had no way to get there. Zoom and pan are
   * arithmetic on the viewBox – no library, no reprojection.
   *
   * The wheel is bound on both variants now, but not the same way, and not
   * through React's `onWheel`: that prop is registered passively, so
   * `preventDefault` is unavailable and one notch over the map's own page both
   * zoomed the drawing and scrolled the page 120px away from it. It is a
   * non-passive listener in an effect instead. See the note on that effect for
   * what each variant does.
   */
  const BASE = useMemo(() => {
    const [x, y, w, h] = geo.viewBox.split(" ").map(Number);
    return { x, y, w, h };
    /* No dependency: `geo` is a module constant now, not a prop, so there is
       nothing here that can change between renders. */
  }, []);
  /**
   * Measured, not assumed: the element's size and the strips the floating
   * panels have claimed, which the stylesheets declare as --emap-safe-* so the
   * file that knows where a panel sits is the file that reserves room for it.
   */
  const [box, setBox] = useState<Box>({ w: 0, h: 0, t: 0, r: 0, b: 0, l: 0 });
  const FULL = useMemo(() => fitView(BASE, box), [BASE, box]);
  const CLOSE = useMemo(
    () => clamp(fitView({ x: 556, y: 234, w: 511, h: 213 }, box), FULL),
    [box, FULL],
  );
  /**
   * The widest framing: everything the map has to show, and nothing else.
   *
   * This used to be the projection's own 0…1200 × 0…460 window plus 64 units
   * round Montreal, and the result did not deserve the name it was given.
   * Measured on the built page at 1440: the frame came out
   * `-1000.9 -555.4 2200.9 1267.0`, Montreal sat at x = -936.9 – 64 units, or
   * 2.9% of the frame's width, inside the western edge – and what a reader saw
   * beside Europe was Greenland and open water. North America was in the
   * drawing (the atlas reaches x = -2658) and out of the picture.
   *
   * Two things were wrong with taking the window as the floor. It carries 323
   * units of empty steppe east of the last marker – MH17 at x = 876.9, and
   * Ukraine's own coast ends at 900.4 – which is a sixth of the frame spent on
   * nothing. And it treats the margin round an off-window seat as the same
   * kind of thing as the margin round a marker in Kyiv oblast, when it is not:
   * a seat is off the window because it is on another continent, and a frame
   * that clears it by 64 units shows the city without the continent.
   *
   * So the span is the markers themselves – `SPAN_EDGE` round the ones inside
   * the window, `SPAN_FAR` on the side an off-window seat came in from. Still
   * derived rather than written down: a second off-window seat, in any
   * direction, widens this by itself.
   *
   * What it comes to today: x -1296.9 … 1026.9, y -140.4 … 565.2. Montreal
   * lands 360 units – 15.5% of the width – inside the western edge, with the
   * coast from Labrador to the Chesapeake, the Great Lakes and the ground out
   * to about 96°W behind it, and Ukraine's own coast keeps 126 units of air on
   * the other side instead of the 40 the marker margin alone would leave.
   *
   * The frame is 2323.8 units wide against the 2200.9 it was, so Europe is
   * drawn 5.3% smaller in this framing than it used to be. That is the trade,
   * and it is a small one because most of the room America needed came out of
   * the empty steppe rather than out of Europe. The other two framings are
   * untouched: «Європа» is still the projection's own window.
   */
  const SPAN = useMemo(() => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const put = (x: number, y: number, m: number) => {
      x0 = Math.min(x0, x - m);
      y0 = Math.min(y0, y - m);
      x1 = Math.max(x1, x + m);
      y1 = Math.max(y1, y + m);
    };
    for (const e of events) {
      const p = geo.markers[e.key];
      if (p) put(p[0], p[1], SPAN_EDGE);
    }
    for (const c of courts) {
      const p = geo.markers[c.key];
      if (p) put(p[0], p[1], SPAN_EDGE);
      else if (c.offAt) put(c.offAt.x, c.offAt.y, SPAN_EDGE);
    }
    // And the continent, on whichever side of the window the seat lies off.
    for (const c of courts) {
      if (!c.offAt) continue;
      if (c.offAt.x < BASE.x) x0 = Math.min(x0, c.offAt.x - SPAN_FAR);
      if (c.offAt.x > BASE.x + BASE.w) x1 = Math.max(x1, c.offAt.x + SPAN_FAR);
      if (c.offAt.y < BASE.y) y0 = Math.min(y0, c.offAt.y - SPAN_FAR);
      if (c.offAt.y > BASE.y + BASE.h) y1 = Math.max(y1, c.offAt.y + SPAN_FAR);
    }
    // Nothing to frame at all – no markers in the geometry. Fall back to the
    // declared window rather than returning an infinite rect.
    if (!Number.isFinite(x0)) return BASE;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }, [BASE, events, courts]);
  /** The third framing: North America beside Europe. */
  const WIDE = useMemo(() => fitView(SPAN, box), [SPAN, box]);
  /**
   * Every place the drawing has something to look at. What `hold` keeps in
   * frame – the true positions, not the docked ones, so the set does not
   * change under the reader as they pan.
   */
  const ANCHORS = useMemo(() => {
    const pts: [number, number][] = [];
    for (const e of events) {
      const p = geo.markers[e.key];
      if (p) pts.push([p[0], p[1]]);
    }
    for (const c of courts) {
      const p = geo.markers[c.key];
      if (p) pts.push([p[0], p[1]]);
      else if (c.offAt) pts.push([c.offAt.x, c.offAt.y]);
    }
    return pts;
  }, [events, courts]);
  /**
   * Is there a third framing at all?
   *
   * It exists for one thing: a seat the projection's window cannot hold. That
   * was Montreal, and with the ICAO Council off the map there is none – so the
   * button goes with it, rather than staying on to offer a view of the same
   * Europe with more sea round it.
   *
   * The span test alone was not enough to notice. `SPAN` leaves 150 units of
   * air round every marker, and Helsinki and Stockholm sit near the top of a
   * 460-unit frame, so the span still overflowed vertically and the framing
   * survived the removal – reframing to something a reader could not tell from
   * the one they were already looking at. The geometry says whether a wider
   * view is *possible*; `offAt` says whether it is *for* anything.
   */
  const hasWide =
    courts.some((c) => c.offAt) && (SPAN.w > BASE.w + 1 || SPAN.h > BASE.h + 1);
  /**
   * How far the reader may get, by any means – the smallest rect of the
   * element's own shape that holds both named framings. Grown from their
   * union rather than taken from the wider of the two: the Atlantic framing is
   * centred on the span from Montreal to Ukraine, so its eastern edge stops a
   * few units short of Europe's own, and clamping to it alone would shave a
   * sliver off the framing the map opens at.
   */
  const OUTER = useMemo(() => {
    if (!hasWide) return FULL;
    const x0 = Math.min(FULL.x, WIDE.x);
    const y0 = Math.min(FULL.y, WIDE.y);
    const x1 = Math.max(FULL.x + FULL.w, WIDE.x + WIDE.w);
    const y1 = Math.max(FULL.y + FULL.h, WIDE.y + WIDE.h);
    const a = FULL.h / FULL.w;
    const w = Math.max(x1 - x0, (y1 - y0) / a);
    const h = w * a;
    return { w, h, x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2 };
  }, [FULL, WIDE, hasWide]);
  const [nav, setNav] = useState<Nav>(null);
  const view = useMemo(() => viewFrom(nav, FULL, OUTER, ANCHORS), [nav, FULL, OUTER, ANCHORS]);


  /**
   * Bring both ends of the picked relation into the picture.
   *
   * This is the one thing the map exists to say, and until now no framing said
   * it. Measured at 1440: «Європа», the framing the map opens at, renders 1.2
   * CSS pixels per projection unit – under the 2.6 the site labels need – so
   * the nine courts are named and the six places the archive is *about* are
   * unlabelled dots in one corner. «Україна» renders 2.82 and labels them, and
   * holds no court at all: the dashed lines simply leave the frame. A reader
   * could see where harm happened, or who is weighing it, never both.
   *
   * So the frame follows the selection. Pick Crimea and the view holds Crimea,
   * Strasbourg, The Hague and Paris; pick The Hague and it holds The Hague and
   * the five places it hears.
   *
   * Two restraints, because a map that jumps on every press is worse than one
   * that never moves.
   *
   *   Seats off the projection's window are left out. Montreal is docked at
   *   the frame's edge with a chevron and is reachable there; fitting it would
   *   throw every MH17 press into the Atlantic framing, where Ukraine is a
   *   tenth of the width. The reader who wants that has a button for it.
   *
   *   And nothing moves when nothing needs to. If every point is already in
   *   frame – which on the home band's opening view is almost every selection –
   *   the view is left exactly where the reader put it.
   */
  useEffect(() => {
    if (!focusReq) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setFocusReq(null);
    if (!(box.w > 0) || !(box.h > 0)) return;

    const pts: [number, number][] = [];
    const put = (key: string) => {
      const p = geo.markers[key];
      if (p) pts.push([p[0], p[1]]);
    };
    if (focusReq.kind === "site") {
      const e = events.find((x) => x.key === focusReq.key);
      if (!e) return;
      put(e.key);
      for (const k of e.courts) {
        if (!courts.find((c) => c.key === k)?.offMap) put(k);
      }
    } else {
      const c = courts.find((x) => x.key === focusReq.key);
      if (!c || c.offMap) return;
      put(c.key);
      for (const e of events) if (e.courts.includes(c.key)) put(e.key);
    }
    if (!pts.length) return;

    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    /* Centred, and no closer than the map opens.
       This fitted the relation exactly at first, and fitting is too much: a
       court with one site – Hamburg and the Kerch strait – is a narrow span,
       and the map dived into it, so pressing a seat threw the reader from a
       picture of Europe into two cities filling the band. The scale a reader
       chose by arriving is the scale they keep; what a selection earns is the
       middle of the picture, not a different picture. So the frame is the
       opening framing's own size, centred on the relation – and it widens only
       where the relation genuinely does not fit inside that, which is what the
       framing buttons are for the rest of the time. */
    const w0 = Math.max(FULL.w, x1 - x0 + 2 * FOCUS_EDGE);
    const h0 = Math.max(FULL.h, y1 - y0 + 2 * FOCUS_EDGE);
    const want = settle(
      fitView(
        {
          x: (x0 + x1) / 2 - w0 / 2,
          y: (y0 + y1) / 2 - h0 / 2,
          w: w0,
          h: h0,
        },
        box,
      ),
      OUTER,
      ANCHORS,
    );
    // On the home band, where `outer` is the opening framing itself, this
    // clamps back to where the view already was. Saying so costs a render.
    if (
      Math.abs(want.w - view.w) < 1 &&
      Math.abs(want.x - view.x) < 1 &&
      Math.abs(want.y - view.y) < 1
    ) {
      return;
    }
    setNav(navOf(want, FULL.w));
    // `view` is read to decide whether to move at all; re-running on every
    // frame the reader drags would fight them for control of the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusReq, box, OUTER, ANCHORS, FULL.w, FULL.h, events, courts]);

  /**
   * The full screen opens on something, not on the whole of Europe.
   *
   * A 375px window fits the 1200-unit projection by its width whatever its
   * height, so simply giving the drawing the screen bought 0.31 CSS pixels per
   * unit and 600px of Scandinavia and open sea: taller, and no more legible.
   * The reader who pressed the button was looking at a card; the frame opens
   * on that, and where there is no card, on Ukraine – which is the subject and
   * is also the one framing a tall window can hold at a useful scale.
   */
  const wantFull = useRef(false);
  useEffect(() => {
    if (!full) {
      wantFull.current = false;
      return;
    }
    if (wantFull.current) return;
    wantFull.current = true;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (sel) setFocusReq(sel);
    else setNav(navOf(CLOSE, FULL.w));
    /* eslint-enable react-hooks/set-state-in-effect */
    exitRef.current?.focus();
    // Read once, on the way in: the reader is free to go anywhere afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  /**
   * Which of the two named framings the reader is actually in, if either.
   *
   * "Close" used to mean anything at least as tight as the close framing, so
   * every step of the plus button past it left "Україна" reading as pressed:
   * at full zoom, on one corner of one oblast, the control still announced the
   * whole-country framing as the current one. A control that answers a
   * question about state has to answer it about the state that exists – zoom
   * or pan away from a preset and neither preset is what you are looking at.
   */
  const near = (a: { x: number; y: number; w: number }, b: { x: number; y: number; w: number }) =>
    Math.abs(a.w - b.w) < 1 && Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1;
  const atFull = near(view, FULL);
  const atClose = near(view, CLOSE);
  const atWide = hasWide && near(view, WIDE);

  /** Scale about a point in viewBox units, holding that point still. */
  const zoomBy = useCallback(
    (factor: number, ax?: number, ay?: number) =>
      setNav((prev) => {
        const v = viewFrom(prev, FULL, OUTER, ANCHORS);
        const w = Math.min(OUTER.w, Math.max(MIN_W, v.w * factor));
        const h = w * (FULL.h / FULL.w);
        const px = ax ?? v.x + v.w / 2;
        const py = ay ?? v.y + v.h / 2;
        return navOf(
          settle(
            { w, h, x: px - ((px - v.x) / v.w) * w, y: py - ((py - v.y) / v.h) * h },
            OUTER,
            ANCHORS,
          ),
          FULL.w,
        );
      }),
    [FULL, OUTER, ANCHORS],
  );
  const viewBox = `${view.x} ${view.y} ${view.w} ${view.h}`;
  /**
   * Is there anywhere to drag to?
   *
   * The `grab` cursor was a promise the drawing could not always keep. On the
   * map's own page `outer` is the union of the European framing and the
   * Atlantic one, so the opening view is smaller than its bound and a press on
   * the ground always moves something. On the home band, which does not offer
   * the Atlantic framing, `outer` *is* the opening framing – measured, a
   * 160px pull at 1440 left the viewBox at `-13.3 -51.1 1226.7 511.1`,
   * unchanged – and the hand-shaped cursor was describing a gesture with no
   * effect. It has somewhere to go the moment the reader zooms in, by the
   * stepper, by «Україна», by a double-click or by ⌘-wheel, so this is asked
   * of the current frame rather than of the surface.
   */
  const canPan = view.w < OUTER.w - 0.5 || view.h < OUTER.h - 0.5;

  /** Pointer position in viewBox units – what both drag and double-click need. */
  const svgRef = useRef<SVGSVGElement | null>(null);
  /** Carries the reserved strips as padding so they resolve to pixels. */
  const safeRef = useRef<HTMLSpanElement | null>(null);
  const atPointer = useCallback(
    (ev: { clientX: number; clientY: number }) => {
      const el = svgRef.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: view.x + ((ev.clientX - r.left) / r.width) * view.w,
        y: view.y + ((ev.clientY - r.top) / r.height) * view.h,
      };
    },
    [view],
  );

  /**
   * A press in progress. `ox`/`oy` is where it began and `x`/`y` where it was
   * last seen; `on` says whether it has travelled far enough to be a drag
   * rather than a click.
   */
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    ox: number;
    oy: number;
    on: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  /**
   * Every pointer currently down on the drawing, so two of them can be told
   * from one. A phone had no gesture for the map at all before this: the only
   * zoom binding was a wheel with Ctrl or ⌘ held, which is a trackpad pinch
   * and not a screen one, and `touch-action: pan-y` on the drawing withheld
   * the browser's own pinch as well.
   */
  const touches = useRef(new Map<number, { x: number; y: number }>());
  /** The span and midpoint the current two-finger gesture started from. */
  const pinch = useRef<{ d: number; x: number; y: number } | null>(null);
  /**
   * The band tells the reader why its wheel did not zoom. Shown only after a
   * bare wheel over the drawing, and only there: it is an answer to something
   * the reader just did, not a permanent instruction printed on the map.
   */
  const [hint, setHint] = useState(false);
  const hintOff = useRef<number | null>(null);
  useEffect(() => () => {
    if (hintOff.current) window.clearTimeout(hintOff.current);
  }, []);

  /**
   * Whatever the last render worked out. The wheel listener below is attached
   * once and must not be rebuilt on every zoom step, so it reads the current
   * frame from here instead of from a closure that would go stale after the
   * first notch.
   */
  const now = useRef({ view, OUTER, atPointer, zoomBy });
  useEffect(() => {
    now.current = { view, OUTER, atPointer, zoomBy };
  });

  /**
   * The wheel.
   *
   * Attached here rather than as React's `onWheel`, which registers passively:
   * `preventDefault` is simply unavailable on a passive listener, so the last
   * time this was bound one notch over the map's own page zoomed the drawing
   * *and* scrolled the page 120px, and three notches took the reader away from
   * the map with a framing they had not chosen.
   *
   * One answer on both surfaces, and it is the page's: a bare notch scrolls,
   * Ctrl or ⌘ zooms, and the map says so for a moment after the first bare
   * notch over it.
   *
   * The map's own page used to be the exception – the drawing is the page
   * there, so a notch meant zoom, and the page only moved once the zoom hit
   * its ends. Measured against a reader rather than against the drawing, that
   * is the classic trap: the map fills the viewport, so anyone on their way
   * down the page has to zoom all the way out before the document will move,
   * and anyone who only wanted to read what is under the map has zoomed it by
   * accident on the way. Nothing is lost by giving the wheel back, because
   * every other route to the zoom is right there: three framings, a stepper, a
   * recentre, a double-click, a drag, and the pinch a trackpad already sends
   * as Ctrl-wheel.
   *
   * Held full there is no page underneath to scroll, so the wheel is the
   * map's again with no modifier.
   *
   * Anchored at the pointer, not the centre: zooming towards Ukraine keeps
   * Ukraine under the cursor.
   */
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      const held = ev.ctrlKey || ev.metaKey;
      // Held full there is no page to scroll past, so the wheel is the map's.
      if (!held && !full) {
        setHint(true);
        if (hintOff.current) window.clearTimeout(hintOff.current);
        hintOff.current = window.setTimeout(() => setHint(false), 1800);
        // No preventDefault: the page scrolls past the band, which it must
        // always be able to do.
        return;
      }
      // deltaMode 1 is lines and 2 is pages; both are rare, and both would
      // otherwise read as a wheel that barely moved.
      const unit = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? 400 : 1;
      const dy = Math.max(-240, Math.min(240, ev.deltaY * unit));
      const factor = Math.exp(dy * 0.0015);
      const { view: v, OUTER: o } = now.current;
      const w = Math.min(o.w, Math.max(MIN_W, v.w * factor));
      const moved = Math.abs(w - v.w) > 0.01;
      // Held down, the modifier is the reader asking for the map and not the
      // browser's own page zoom, so it is swallowed either way.
      if (!moved && !held) return;
      ev.preventDefault();
      if (!moved) return;
      setHint(false);
      const p = now.current.atPointer(ev);
      now.current.zoomBy(factor, p?.x, p?.y);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [variant, full]);
  /**
   * The last press moved the map, so the click that follows it is the tail of
   * a drag and must not also pick whatever the pointer came to rest on.
   * Cleared by the next press, not by the drag ending: the click arrives after
   * the pointerup, so it has to still be able to see this.
   */
  const panned = useRef(false);

  /** End a press, whether it turned into a drag or not. */
  const endDrag = useCallback((el: Element | null, id: number) => {
    drag.current = null;
    setDragging(false);
    if (el && el.hasPointerCapture(id)) el.releasePointerCapture(id);
  }, []);

  /**
   * How many CSS pixels one projection unit currently renders as.
   *
   * The labels are the only thing on the drawing that must not scale with the
   * zoom: a country outline is still a country outline at half size, but 11px
   * of Charis SIL at half size is 5.5px, which nobody reads. So they are sized
   * and offset in real pixels, converted back into projection units through
   * this number – which means measuring the element, since the scale depends on
   * the container width as much as on the viewBox. Zero until the effect runs,
   * and zero suppresses the labels, so nothing is drawn at the wrong size
   * during hydration.
   */
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // The reserved strips come from the stylesheet, so a panel is declared
      // once, where it is positioned, instead of being a number in here that
      // nobody updates when the panel moves. They are read off the padding of
      // a hidden sentinel rather than from the custom properties directly:
      // getComputedStyle hands back an unregistered custom property as the
      // tokens it was written with, so `max(0px, 436px - 35.2%)` would come
      // back as that string. As padding it comes back resolved, in pixels,
      // against the figure's own width – which is what lets the reserve be a
      // function of the width instead of one number for every screen.
      const cs = getComputedStyle(safeRef.current ?? el);
      const safe = (side: string) =>
        Math.max(0, parseFloat(cs.getPropertyValue(`padding-${side}`)) || 0);
      setBox((prev) => {
        const next = {
          w: r.width,
          h: r.height,
          t: safe("top"),
          r: safe("right"),
          b: safe("bottom"),
          l: safe("left"),
        };
        return prev.w === next.w &&
          prev.h === next.h &&
          prev.t === next.t &&
          prev.r === next.r &&
          prev.b === next.b &&
          prev.l === next.l
          ? prev
          : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // A media query can change the reserved strips without changing the
    // element's size – the masthead stops floating below 900px – and a
    // ResizeObserver never fires for that.
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // And neither does folding the key, which changes `--emap-safe-left` and
    // nothing else: the element is exactly the size it was. Measured before
    // this dependency existed, folding the key left the frame reserving the
    // 312px strip it no longer stood on, and the drawing kept the 0.94 CSS
    // pixels per unit it had had rather than the 1.2 it was owed.
  }, [legendUser]);
  /**
   * Is the reader pointing with a finger? Asked of the input device rather
   * than of the viewport: a narrow desktop window is not a phone, and a tablet
   * held in landscape is not a desktop.
   */
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setTouch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  /**
   * Does the drawing answer gestures, or is it a picture inside a document?
   *
   * `touch-action: pan-y` was the worst of the three possible answers and it
   * was the one in force: a finger could drag the map east and west, a finger
   * dragged north or south scrolled the page out from under it, and pinch –
   * the first thing a hand tries on a map – was withheld from both the browser
   * and this component. One axis of pan is not a map; it is a map stealing
   * half of a scroll.
   *
   * So it is all or nothing, and which one depends on what the drawing is at
   * that moment. In the page, on a phone, it is a picture: the page scrolls
   * over it in both directions and the list below is the interface, which is
   * what the component already decided when it made the marks inert. Held
   * full, it is the only thing on the screen – there is no page left to steal
   * a scroll from – so it takes every gesture: drag to pan, two fingers to
   * zoom. A mouse is unaffected either way.
   */
  const gestures = !touch || full;
  /**
   * Can this device produce a touch at all? A different question from the one
   * above, and the one `touch-action` has to be answered with.
   *
   * `(pointer: coarse)` asks what the *primary* pointer is, which on a laptop
   * with a touchscreen is the mouse – so `gestures` is true there, correctly:
   * a mouse drag should pan. But `touch-action: none` is not about the mouse.
   * Set on that laptop it would take the finger's page scroll away over the
   * drawing while giving nothing back, which is the trap this whole rule
   * exists to avoid. So the property follows what the screen can do, and the
   * pointer handlers below follow what the pointer is.
   */
  const [anyTouch, setAnyTouch] = useState(false);
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setAnyTouch(navigator.maxTouchPoints > 0);
  }, []);

  /**
   * One number, because the frame now carries the container's own aspect
   * ratio: `meet` and `slice` resolve to the same scale, and neither crops.
   */
  const scale = box.w > 0 && view.w > 0 ? box.w / view.w : 0;
  /** One CSS pixel, in projection units. */
  const px = scale > 0 ? 1 / scale : 0;
  const labelled = scale >= LABEL_MIN_SCALE;
  const at = (key: string) => geo.markers[key] ?? [0, 0];

  /**
   * Where a court sits. Almost always its point in europe-map.json; for a city
   * off the frame, the nearest place on the frame's edge along the bearing of
   * the real one, so the line to it runs the right way and stops at the border
   * instead of disappearing into a corner. The margin is in CSS pixels, so the
   * marker hugs the edge by the same amount however far the reader has zoomed.
   */
  const dockMargin = 26 * (px || 1);
  const courtXY: Record<string, [number, number]> = {};
  /**
   * Which seats are being shown at the frame's edge rather than where they
   * are. `offMap` says a city has no point in europe-map.json; it does not say
   * the reader cannot see it. The Atlantic framing puts Montreal inside the
   * picture, and there it is an ordinary court marker with an ordinary
   * connector running to it – no chevron, no tail, nothing claiming it is
   * somewhere off to the west. The dock is what happens when the city really
   * is outside the view, which is still every other framing and will be
   * whatever other seat needs it next; the clamp below decides by whether it
   * had to move the point, so neither the framing nor the city is named here.
   */
  const docked: Record<string, boolean> = {};
  for (const c of courts) {
    if (c.offMap && c.offAt) {
      // Outside the view, not merely near its edge. Asked this way round
      // because the dock margin is measured in pixels and so grows, in the
      // units this comparison is in, as the reader zooms out: at 1000px the
      // Atlantic framing puts Montreal 65.0 units inside the frame and the
      // margin at 65.5, and the city was being pulled half a unit and given
      // a chevron and a tail pointing at where it already was.
      const out =
        c.offAt.x < view.x ||
        c.offAt.x > view.x + view.w ||
        c.offAt.y < view.y ||
        c.offAt.y > view.y + view.h;
      courtXY[c.key] = out
        ? [
            Math.min(Math.max(c.offAt.x, view.x + dockMargin), view.x + view.w - dockMargin),
            Math.min(Math.max(c.offAt.y, view.y + dockMargin), view.y + view.h - dockMargin),
          ]
        : [c.offAt.x, c.offAt.y];
      docked[c.key] = out;
    } else {
      const [x, y] = at(c.key);
      courtXY[c.key] = [x, y];
      docked[c.key] = false;
    }
  }

  /**
   * How much room each marker has, in projection units: the distance to the
   * nearest other marker it is drawn beside.
   *
   * This used to be two constants – 16.9 for the sites, 32 for the courts –
   * measured once and written into the two calls below as the largest radius
   * each family could bear before a circle swallowed its neighbour's centre.
   * They were the right numbers, and they are the numbers this still produces:
   * MH17 and eastern Ukraine are 16.9 apart and The Hague and Brussels 32. But
   * a constant per family is a fact about the crowded members of it, and the
   * Atlantic framing put a marker on the map that has 1259 units of ocean
   * around it. Capping Montreal's target at what The Hague and Brussels can
   * bear made the one framing that shows Montreal a framing in which Montreal
   * measured 22px and answered nothing.
   *
   * Where the old caps bound, nothing moves: they only ever bit below about
   * 0.65 CSS pixels per unit, which is further out than either of the original
   * framings goes at any width. Computed from the drawn positions, so a docked
   * seat is measured where it is actually shown.
   */
  const room: Record<string, number> = {};
  {
    const pts: [string, number, number][] = [
      ...events.map((e) => [e.key, ...at(e.key)] as [string, number, number]),
      ...courts.map((c) => [c.key, ...courtXY[c.key]] as [string, number, number]),
    ];
    for (const [k, x, y] of pts) {
      let m = Infinity;
      for (const [k2, x2, y2] of pts) {
        if (k2 === k) continue;
        m = Math.min(m, Math.hypot(x - x2, y - y2));
      }
      // 95% of it, not all of it. At exactly the neighbour's distance a hit
      // circle reaches its neighbour's centre and which of the two answers a
      // click at that point is decided by the order they are painted in and by
      // a rounding – measured, MH17's own centre returned eastern Ukraine's
      // circle. The old constants had this margin baked in: 16 against a
      // 16.9-unit pair is 95% of it.
      room[k] = Number.isFinite(m) ? 0.95 * m : 1e6;
    }
  }
  /** The most crowded member of each family – what the family's floor is set by. */
  const siteRoom = Math.min(...events.map((e) => room[e.key]));
  const courtRoom = Math.min(...courts.map((c) => room[c.key]));

  /**
   * How wide a site's hit target actually comes out, in CSS pixels.
   *
   * The radius is asked for in projection units and rendered at whatever the
   * container makes of them, and past a point the answer is a target nobody
   * can hit: measured on the map's own page in the wide framing it comes out
   * 26.4px at 1440, 24.4 at 1000, 20.8 at 900, 17.2 at 800 and 11.5 at 641 –
   * and the two closest markers, MH17 and eastern Ukraine, are 12.9px apart at
   * 1000 and 7.2px at 700, so below about 1000px there is no radius that would
   * let a reader pick one of the two rather than the other.
   */
  const targetPx = 2 * scale * hitR(11, siteRoom, px);
  /**
   * How far apart the two closest markers come out, in CSS pixels.
   *
   * Targets that overlap are the accepted trade here – MH17 and eastern
   * Ukraine are 16.9 projection units apart and no radius that clears 24px
   * also fits between them – and what makes it survivable is that a hit circle
   * never covers its neighbour's *centre*, so each marker keeps a crescent of
   * its own. A mouse can aim at a crescent. A finger cannot, and that, not the
   * viewport width, is what the old `max-width: 640px` was really about.
   */
  const gapPx = (siteRoom / 0.95) * scale;
  /**
   * Whether the drawing is a control surface at all, or a picture of one.
   *
   * This used to be `max-width: 640px`, on the reasoning that a phone cannot
   * aim at the markers – true, but the width was never what made it true. The
   * scale is. At 800px in the wide framing the targets are 17.2px and two of
   * them are 9.1px apart, which is no more aimable than a phone; in the close
   * framing at the same 800px they are 27.8px and 21.4px apart, which is fine.
   * So the question is asked of the rendered target, exactly as it is for the
   * labels above: below the 24px floor the drawing stops answering the pointer
   * and the list underneath is the interface, and pressing "Україна" or the
   * plus button hands the drawing back.
   *
   * On a touch device the two closest markers have to clear the same 24px as
   * the targets themselves, because a finger has no crescent to aim at: a
   * phone at 390px in the close framing renders 24.4px targets 12.9px apart,
   * which passes the first test and fails this one, so the list stays the
   * interface there exactly as it did before. A tablet in the same framing has
   * room for both and keeps the drawing.
   *
   * It also starts out true, before anything has been measured – which is what
   * a reader with no JavaScript keeps. That reader cannot select anything, and
   * fifteen circles announcing themselves as buttons and answering nothing was
   * the map lying about what it could do.
   */
  const coarse = !(targetPx >= 24 && (!touch || gapPx >= 24));
  /**
   * The same question, asked of the courts, which are not as crowded.
   *
   * It used to be asked once, of the sites, and answered for everything on the
   * drawing. That held while the two framings were both framings of Europe.
   * The Atlantic framing broke it: at 1440 it renders a site target at 20.9px
   * – under the floor, correctly inert – and a court target at 24.8px, and the
   * one thing that framing exists to show is a court. Answering the sites'
   * question for Montreal would have made the new button open a picture of a
   * city nobody could click.
   *
   * Nothing about the rule changes, only which numbers it is asked about. The
   * radii already differed – 11…16 units for a site, 13…19 for a court –
   * because the closest pair of each differs: MH17 and eastern Ukraine are
   * 16.9 units apart, The Hague and Brussels 32. Those are the two constants
   * below, and each family is now measured against its own.
   */
  const courtTargetPx = 2 * scale * hitR(13, courtRoom, px);
  const courtGapPx = (courtRoom / 0.95) * scale;
  const coarseCourts = !(courtTargetPx >= 24 && (!touch || courtGapPx >= 24));
  /**
   * Court badges are sized in real pixels rather than projection units, like
   * the site labels and unlike the city names beside them, so the answer to a
   * click is legible at the framing the reader is actually in. They are held
   * back where the markers themselves are: a drawing too small to aim at is
   * too small to carry nine more labels.
   */
  const badged = !coarseCourts;
  /** The city labels, in projection units, aiming at 11 CSS pixels. */
  const cityF = labelSize(11, 14, px);
  /**
   * Whether a city can be named at all at this size.
   *
   * `labelSize` asks for 11 CSS pixels and gives up at 14 projection units,
   * because past that a place name is wider than the country it stands in –
   * «СТРАСБУРГ» at 14 units already measures about the width of France. Where
   * the cap binds the label stops being 11px and starts shrinking with the
   * drawing, and nothing stopped it: measured on a 390px phone, the nine city
   * names rendered at 4.6 CSS pixels, and in the Atlantic framing on a 1024px
   * window at 5.7. That is not a small label, it is a grey smudge beside a
   * marker, and on a 210px-tall drawing it was most of what was on the map.
   *
   * 7.5px is where uppercase Fira Sans at this tracking stops resolving into
   * letters. Below it the cities are drawn as rings and named by the card a
   * press opens, by the seat list under the full map, and by the `aria-label`
   * on the target, which is what a screen reader was reading all along.
   */
  const citied = cityF * scale >= 7.5;

  /**
   * "28 проваджень у бібліотеці" – the same sentence in the card and in the
   * seat list, so the noun agrees in one place rather than two.
   */
  const caseload = (n: number) =>
    labels.caseload.replace("{n}", String(n)).replace("{w}", plural(n, labels.caseloadWord, locale));

  const selected = sel?.kind === "site" ? events.find((e) => e.key === sel.key) ?? null : null;
  const selectedCourt =
    sel?.kind === "court" ? courts.find((c) => c.key === sel.key) ?? null : null;
  const selectedCountry =
    sel?.kind === "country" ? countries.find((c) => c.key === sel.key) ?? null : null;

  /**
   * What the panel shows, whichever of the two was pressed.
   *
   * A city and a country ask the same question of this map – which courts sit
   * here, and how much of the archive do they hold – so they get one card
   * rather than two that would drift apart. The card's own machinery, the grip
   * and the close button and the drag, is written once and does not care which
   * kind opened it.
   */
  const panel = selectedCourt
    ? {
        title: selectedCourt.city,
        at: selectedCourt.at,
        seatList: selectedCourt.seatList,
        courtIds: selectedCourt.caseload.courtIds,
        total: selectedCourt.caseload.total,
      }
    : selectedCountry
      ? {
          title: selectedCountry.label,
          at: selectedCountry.at,
          seatList: selectedCountry.seatList,
          courtIds: selectedCountry.courtIds,
          total: selectedCountry.total,
        }
      : null;

  /** Sites heard at the selected court – what a court selection used to be
   *  *for*, back when the drawing had sites. A plain expression rather than a
   *  `useMemo`: with no events passed it filters an empty array, and the memo
   *  was costing the React Compiler a bail-out on this whole component. */
  const courtSites = selectedCourt
    ? events.filter((e) => e.courts.includes(selectedCourt.key))
    : [];

  /**
   * The two ends of one relation.
   *
   * A selection used to light its own marker and leave the other end alone: a
   * court's ring only warmed when the court itself was picked, so clicking a
   * site told you nothing about who is hearing it – which is the single thing
   * this drawing exists to say. `on` is what the reader picked; `rel` is the
   * far end of every line running out of it, and both are lit.
   */
  const relCourts = new Set(selected?.courts ?? []);
  const relSites = new Set(courtSites.map((e) => e.key));

  /**
   * One tab stop for the whole drawing, and the arrow keys inside it.
   *
   * Fifteen markers each took a stop of their own, so a keyboard reader who
   * did not want the map had thirty-six presses to get past it (fifteen marks,
   * five framing controls, the six-site list, the nine seats) and no way to
   * skip. A grid of controls is a *composite* widget: it takes one stop, and
   * the arrows move within it. That is what a reader already expects from a
   * map, a toolbar or a calendar, and it costs the map nothing – every mark is
   * still reachable, in the same order the list below is in.
   *
   * Only the marks that actually answer are in the ring: where the drawing is
   * too small to aim at, its circles are `tabIndex={-1}` and inert, and the
   * ring is the other family's, or empty.
   */
  const markerKeys = [
    ...(coarse ? [] : events.map((e) => e.key)),
    ...(coarseCourts ? [] : courts.map((c) => c.key)),
  ];
  /**
   * The two blocks under the drawing, folded.
   *
   * The map's own page is the map, and everything under it is furniture below
   * the fold – but neither block is decoration, so neither is deleted.
   *
   * The six places are the interface wherever the marks are too small to aim
   * at, so `null` here does not mean closed: it means "whatever the drawing
   * can do". The stylesheet answers that for the first paint, by width, and
   * `coarse` answers it after the client has measured; a press by the reader
   * overrules both.
   *
   * The nine seats are a directory, and the registry is a better one – 39
   * rows, six filters, a search box, one click away in the top bar. What this
   * block has that the registry does not is nine caseloads side by side, which
   * is worth a line, not a screen. Folded.
   *
   * Складені – на широкому вікні. На вузькому навпаки, і так само, як ключ,
   * `null` тут означає «як вирішить ширина», а не «закрито». На 390 мапа –
   * це смужка 341 піксель заввишки, де дев'ять міст злипаються в кластер, а
   * під нею був складений ключ і складений перелік судів: читач, що
   * догортав до кінця мапи, бачив два заголовки й жодного міста. На телефоні
   * перелік і є мапою судів, тож він відкритий, а ключ – складений (див.
   * `narrow` вище). Перший кадр вирішує CSS за шириною (`data-seats="auto"`,
   * events-map.css), тож блок не стрибає після гідратації; натискання
   * читача переважує обидва.
   */
  const [listUser, setListUser] = useState<boolean | null>(null);
  const [seatsUser, setSeatsUser] = useState<boolean | null>(null);
  const seatsOpen = seatsUser ?? narrow;
  const [rov, setRov] = useState<string | null>(null);
  /* The remembered mark, unless it has just gone inert under the reader –
     zooming out past the floor, or turning the phone. Then the ring's first. */
  const rovKey = rov && markerKeys.includes(rov) ? rov : markerKeys[0];
  const goMarker = (key: string) => {
    setRov(key);
    svgRef.current
      ?.querySelector<SVGGraphicsElement>(`[data-mkey="${CSS.escape(key)}"]`)
      ?.focus?.();
  };
  const stepMarker = (from: string, by: number) => {
    const i = markerKeys.indexOf(from);
    if (i < 0 || markerKeys.length < 2) return;
    goMarker(markerKeys[(i + by + markerKeys.length) % markerKeys.length]);
  };
  /** Enter and Space pick; the arrows, Home and End move. */
  const onMarkerKey = (
    ev: { key: string; repeat: boolean; preventDefault: () => void },
    key: string,
    toggle: () => void,
  ) => {
    // Not on auto-repeat. Held down, Enter toggled the selection thirty times
    // a second: the card blinked in and out and the light ran the connectors
    // again on every frame, which is a strobe, not a control.
    if (ev.repeat) return;
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      toggle();
    } else if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
      ev.preventDefault();
      stepMarker(key, 1);
    } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
      ev.preventDefault();
      stepMarker(key, -1);
    } else if (ev.key === "Home") {
      ev.preventDefault();
      if (markerKeys[0]) goMarker(markerKeys[0]);
    } else if (ev.key === "End") {
      ev.preventDefault();
      const last = markerKeys[markerKeys.length - 1];
      if (last) goMarker(last);
    }
  };

  /**
   * What a screen reader is told when the selection changes.
   *
   * The live region used to wrap the cards themselves, `aria-atomic`, so
   * picking The Hague read its entire card aloud – twenty-two registry
   * captions, about three thousand characters, in one announcement that could
   * not be interrupted. A live region is for saying that something happened.
   * The card says what; it is right there, it is reachable, and the focus goes
   * back to the control that opened it.
   */
  const announce = selected
    ? `${selected.title}. ${selected.count}.`
    : selectedCourt
      ? `${selectedCourt.city}. ${caseload(selectedCourt.caseload.total)}.`
      : "";

  /**
   * The ground the selected marker speaks for, if a point is not the whole
   * truth about it. Resolved here so the drawing takes a path or nothing.
   */
  const areaPath = !selected?.area
    ? null
    : selected.area === "country"
      ? geo.ukraine
      : (geo.areas?.[selected.area] ?? null);

  return (
    <div
      className="emap"
      data-variant={variant}
      data-coarse={coarse ? "yes" : "no"}
      data-coarse-courts={coarseCourts ? "yes" : "no"}
      data-full={full ? "yes" : "no"}
      data-hi={hi ?? undefined}
      data-legend={legendUser === null ? "auto" : legendUser ? "on" : "off"}
      data-list={listUser === null ? "auto" : listUser ? "on" : "off"}
      data-seats={seatsUser === null ? "auto" : seatsUser ? "on" : "off"}
      data-touch={touch ? "yes" : "no"}
      /* Which framing is on the screen, for the one rule that has to know.
         The Atlantic framing is 2.3 times as wide as the projection and puts
         everything worth clicking in the right-hand tenth of it, so on the
         home band – where the drawing is only 500 units tall – a floating card
         covers the lot. Measured at 1024, 1100 and 1280: all fifteen markers
         under the card, every site and every seat, on a page whose default
         state opens a card. See events-map.css. */
      data-framing={atWide ? "wide" : undefined}
    >
      <div className="emap-figure">
        {/* Not drawn and not reachable: it exists so the stylesheet can state
            how much of the drawing each floating panel has taken, in any CSS
            the stylesheet likes, and have it come back as pixels. */}
        <span className="emap-safe" ref={safeRef} aria-hidden="true" />
        {/* Three named framings, because there are three questions: how far
            the courts are, which site is which, and – since the ICAO Council
            sits in Montreal – how far one of them really is. Everything
            between them is the wheel, the drag and the two steppers. */}
        <div className="emap-zoom" role="group" aria-label={labels.zoomLabel}>
          {hasWide && (
            <button
              type="button"
              className="emap-zoom-far"
              aria-pressed={atWide}
              onClick={() => setNav(navOf(WIDE, FULL.w))}
            >
              {labels.zoomAtlantic}
            </button>
          )}
          <button
            type="button"
            aria-pressed={atFull}
            onClick={() => setNav(null)}
          >
            {labels.zoomWide}
          </button>
          <button
            type="button"
            aria-pressed={atClose}
            onClick={() => setNav(navOf(CLOSE, FULL.w))}
          >
            {labels.zoomClose}
          </button>
          <button
            type="button"
            className="emap-zoom-step"
            aria-label={labels.zoomReset}
            title={labels.zoomReset}
            onClick={() => {
              if (sel) setFocusReq(sel);
              else setNav(null);
            }}
          >
            {/* A reticle: a ring with four ticks off it. Drawn rather than
                lettered, because it sits beside − and + and belongs to them. */}
            <svg viewBox="0 0 16 16" aria-hidden="true" className="emap-reticle">
              <circle cx="8" cy="8" r="3.6" />
              <path d="M8 0.6V3M8 13v2.4M0.6 8H3M13 8h2.4" />
            </svg>
          </button>
          <button
            type="button"
            className="emap-zoom-step"
            aria-label={labels.zoomOut}
            onClick={() => zoomBy(1 / 0.7)}
            disabled={view.w >= OUTER.w - 0.5}
          >
            −
          </button>
          <button
            type="button"
            className="emap-zoom-step"
            aria-label={labels.zoomIn}
            onClick={() => zoomBy(0.7)}
            disabled={view.w <= MIN_W}
          >
            +
          </button>
        </div>
        {/* The way back out. Beside the framing controls rather than in a
            corner of its own: it is the same kind of thing – a control over
            what the drawing is showing and how much of it. */}
        {full && (
          <button
            type="button"
            ref={exitRef}
            className="emap-unfull"
            aria-label={labels.closeFull}
            title={labels.closeFull}
            onClick={() => setFull(false)}
          >
            ×
          </button>
        )}
        {/* Why the wheel did not zoom. Only on the band, only just after a
            bare wheel over the drawing, and never in the accessibility tree:
            a reader who is not using a wheel is not being told about one. */}
        {!full && (
          <div className="emap-hint" data-on={hint ? "yes" : "no"} aria-hidden="true">
            {labels.wheelHint}
          </div>
        )}
      <svg
          ref={svgRef}
          className="emap-svg"
          data-dragging={dragging ? "yes" : undefined}
          data-pan={canPan ? "yes" : "no"}
          viewBox={viewBox}
          /* The frame is built to the container's aspect ratio, so meet and
             slice are the same fit – and meet cannot crop during the one
             render before the element has been measured. */
          preserveAspectRatio="xMidYMid meet"
          /* `role="img"` claims the subtree is a picture, and a picture has no
             parts: an assistive technology is entitled to skip everything
             inside it – which here is fifteen circles that carefully announce
             themselves as buttons with labels and pressed states. Where the
             marks answer the pointer this is a group of controls and says so;
             where they do not – a phone, a drawing too small to aim at – it
             really is a picture, and the list below carries the content. */
          role={coarse && coarseCourts ? "img" : "group"}
          aria-label={labels.alt}
          data-gest={full || !anyTouch ? "yes" : "no"}
          onPointerDown={(ev) => {
            // A mouse or a pen always drags; a finger only where the drawing
            // has taken the gestures it would be stealing from the page.
            if (ev.pointerType === "touch" && !gestures) return;
            touches.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
            /* Two fingers: a pinch, and no longer a drag or a click. The press
               that started as one has to be abandoned rather than finished –
               otherwise lifting the second finger would leave a "click" on
               whatever the first one is resting on. */
            if (touches.current.size === 2) {
              const [a, b] = [...touches.current.values()];
              pinch.current = {
                d: Math.hypot(a.x - b.x, a.y - b.y) || 1,
                x: (a.x + b.x) / 2,
                y: (a.y + b.y) / 2,
              };
              drag.current = null;
              panned.current = true;
              setDragging(false);
              return;
            }
            if (touches.current.size > 2) return;
            // The markers drag too. They used to be excluded – "only the
            // ground drags" – but a marker's hit circle is measured in
            // projection units, so it is 26px wide at the opening framing and
            // 264px wide at full zoom, and at that point most of the picture
            // is marker: pressing anywhere near the Donbas and pulling simply
            // did nothing, and the reader could not reach the part of the
            // country they had zoomed in to see. A press is still a click
            // until it has travelled; only then does it become a drag.
            if (ev.button !== 0) return;
            drag.current = {
              id: ev.pointerId,
              x: ev.clientX,
              y: ev.clientY,
              ox: ev.clientX,
              oy: ev.clientY,
              on: false,
            };
            panned.current = false;
          }}
          onPointerMove={(ev) => {
            if (touches.current.has(ev.pointerId)) {
              touches.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
            }
            /* The pinch. Anchored at the midpoint between the two fingers and
               re-anchored as that midpoint travels, so spreading over Crimea
               keeps Crimea between the fingers and the gesture pans as well as
               scales – which is what a hand expects and what makes a second
               drag gesture unnecessary. */
            if (pinch.current && touches.current.size >= 2) {
              const [a, b] = [...touches.current.values()];
              const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              const factor = pinch.current.d / d;
              const at = atPointer({ clientX: mx, clientY: my });
              pinch.current = { d, x: mx, y: my };
              if (Math.abs(factor - 1) > 0.002) zoomBy(factor, at?.x, at?.y);
              return;
            }
            const d = drag.current;
            if (!d || d.id !== ev.pointerId) return;
            // Nothing is held down any more, so this is not a drag: the up
            // went somewhere we never heard about it. Belt and braces beside
            // onLostPointerCapture below – a released button that still pans
            // the map is the failure this guards, and neither guard was here
            // before. Chrome rewrites `buttons` from its own press state, so
            // this path could not be provoked in a headless test; it costs a
            // comparison and closes the case that pointercancel does not.
            if (ev.buttons === 0) {
              endDrag(ev.currentTarget, ev.pointerId);
              return;
            }
            if (!d.on) {
              if (Math.hypot(ev.clientX - d.ox, ev.clientY - d.oy) < DRAG_SLOP) return;
              d.on = true;
              panned.current = true;
              // Capture only now. Taken at the press it would retarget the
              // click that follows onto the <svg>, which is the whole element
              // – and a marker would never be selectable by mouse again.
              ev.currentTarget.setPointerCapture(ev.pointerId);
              setDragging(true);
            }
            const r = ev.currentTarget.getBoundingClientRect();
            const dx = ((ev.clientX - d.x) / r.width) * view.w;
            const dy = ((ev.clientY - d.y) / r.height) * view.h;
            d.x = ev.clientX;
            d.y = ev.clientY;
            setNav((prev) => {
              const v = viewFrom(prev, FULL, OUTER, ANCHORS);
              return navOf(settle({ ...v, x: v.x - dx, y: v.y - dy }, OUTER, ANCHORS), FULL.w);
            });
          }}
          onPointerUp={(ev) => {
            touches.current.delete(ev.pointerId);
            if (touches.current.size < 2) pinch.current = null;
            if (drag.current?.id === ev.pointerId) endDrag(ev.currentTarget, ev.pointerId);
          }}
          onPointerCancel={(ev) => {
            touches.current.delete(ev.pointerId);
            if (touches.current.size < 2) pinch.current = null;
            endDrag(ev.currentTarget, ev.pointerId);
          }}
          onLostPointerCapture={(ev) => {
            if (drag.current?.id === ev.pointerId) {
              drag.current = null;
              setDragging(false);
            }
          }}
          /* No wheel prop here, and that is the point: React registers
             `onWheel` passively, so `preventDefault` is unavailable on it and
             one notch over the map's own page zoomed the drawing *and*
             scrolled the page 120px away from it. The wheel is bound as a
             non-passive listener in the effect above instead, which is the
             only place it can be bound and still be able to refuse the
             scroll. This comment used to say there was no wheel handler at
             all; measured on the built page, there is. A bare notch over the
             map's own page zooms and the page holds still (scrollY 0 before
             and after); over the home band the page scrolls its 120px, the
             drawing does not move, and the hint appears. */
          onDoubleClick={(ev) => {
            // Not on a marker: two clicks there have already selected it and
            // deselected it again, and zooming into a card that just closed
            // itself is the worst of both answers.
            if ((ev.target as Element).closest("[role='button']")) return;
            const p = atPointer(ev);
            zoomBy(0.6, p?.x, p?.y);
          }}
      >
        {/* Base geography is decoration: the information is in the markers,
            which are listed as real text below for anyone not reading pixels. */}
        <g aria-hidden="true">
          {/* The oblast mesh is clipped to the outline it belongs inside. The
              boundaries come from Natural Earth at 10m and the outline from a
              110m atlas, so where an internal line runs out to meet the coast
              the two disagree by a pixel or two – 21 of the mesh's 1063 points
              fall marginally outside. Clipping is cheaper and more honest than
              pretending two sources at different scales agree. */}
          <defs>
            <clipPath id="emap-ua-clip">
              <path d={geo.ukraine} />
            </clipPath>
          </defs>
          {geo.context.map((d, i) => (
            <path key={i} className="emap-ctx" d={d} />
          ))}
          {/* The states that host a forum, lit out of the grey.

              This is what the map is for. A reader who takes nothing else from
              it should still leave knowing that the response to this war is
              being heard in six countries besides Ukraine – and that is a fact
              about states, so it is drawn on states rather than inferred from
              a scatter of city dots the eye has to gather up itself.

              Under Ukraine and under the markers: the subject of these
              proceedings and the seats themselves both stay on top.

              Outside the aria-hidden group: these shapes are buttons, and a
              focusable control inside aria-hidden is announced as nothing –
              the keyboard lands on it and a screen reader says silence. The
              group closes around them and reopens after, so the painting
              order is unchanged. */}
        </g>
        <g>
          {Object.entries(geo.forums).map(([name, d]) => {
            /* A shape with a country entry behind it answers when pressed; one
               without is scenery. Today every lit shape has an entry – the
               build fails otherwise – but the drawing asks rather than
               assumes, so a shape lit before its entry exists is inert rather
               than a control that does nothing. */
            const country = countries.find((c) => c.key === name);
            if (!country) return <path key={name} className="emap-forum-state" d={d} />;
            const on = sel?.kind === "country" && sel.key === name;
            return (
              <path
                key={name}
                className="emap-forum-state"
                data-on={on ? "yes" : "no"}
                d={d}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={country.label}
                onClick={(ev) => {
                  ev.stopPropagation();
                  toggleCountry(name);
                }}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    toggleCountry(name);
                  }
                }}
              />
            );
          })}
        </g>
        <g aria-hidden="true">
          <path className="emap-ua" d={geo.ukraine} />
          {/* The 27 regions, as the lines between them. Six unlabelled dots
              inside a blank country said nothing about where anything was;
              the oblasts are the frame a Ukrainian reader already has, and a
              foreign one can at least see that Crimea is a piece of this
              country and not a neighbour of it. Quieter than the outer border
              by a wide margin – that stroke is the shape that matters. */}
          {/* The ground a marker speaks for, where the marker alone would be a
              claim the record does not support: the ICC's situation is the
              whole country, not Mariupol, and the energy arbitrations are a
              grid, not a point. Drawn over the country's fill and under its
              internal boundaries, so it reads as the same country lit rather
              than as a shape laid on top of it. */}
          {areaPath && (
            <path
              className="emap-area"
              d={areaPath}
              /* Clipped to the country, like the oblast mesh and for the same
                 reason: an area cut from Natural Earth's 10m admin-1 units is
                 drawn against an outline from a 110m atlas, and where the two
                 disagree – a pixel or two along the coast and the border – the
                 fill would spill past the country it is lighting. */
              clipPath="url(#emap-ua-clip)"
            />
          )}
          <path className="emap-regions" d={geo.regions} clipPath="url(#emap-ua-clip)" />

          {/* Reach lines: from each site to the courts hearing it. Drawn
              before the markers so they pass under, not over. */}
          {events.map((e) =>
            e.courts.map((c) => {
              const [x1, y1] = at(e.key);
              const [x2, y2] = courtXY[c] ?? at(c);
              /* A court selection lights only the lines that end at that
                 court: picking The Hague must not light Crimea's line to
                 Strasbourg just because Crimea is also heard in The Hague. */
              const on =
                sel?.kind === "site"
                  ? sel.key === e.key
                  : sel?.kind === "court"
                    ? sel.key === c
                    : false;
              return (
                <g key={`${e.key}-${c}`} data-pair={`${e.key}-${c}`}>
                  <line
                    className="emap-reach"
                    data-on={on ? "yes" : "no"}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                  />
                  {/* The light itself: one short bright segment that runs the
                      length of the line, from the place where the harm
                      happened to the court weighing it, and is gone. It is
                      always drawn from the site outwards, whichever end the
                      reader picked, because that is the direction the case
                      travelled. pathLength normalises every line to 100, so a
                      run to Strasbourg and a run to Montreal take the same
                      time however far apart they are, and the dash figures
                      below are constants rather than nine measurements. */}
                  <line
                    className="emap-glint"
                    data-on={on ? "yes" : "no"}
                    pathLength={100}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                  />
                </g>
              );
            }),
          )}

          </g>

          {/* Courts were decoration inside the aria-hidden group: a circle and
              a label, answering to nothing and invisible to a screen reader.
              The map's subject is the relation between a place where harm
              happened and a court weighing it, and only one end of it could be
              interrogated. Selecting a court lights every site it hears. */}
          {courts.map((c) => {
            const [x, y] = courtXY[c.key] ?? at(c.key);
            const on = sel?.kind === "court" && sel.key === c.key;
            const rel = relCourts.has(c.key);
            /* A city the frame cannot hold gets a bearing as well as a place:
               the chevron and the tail point at where it really is and run off
               the picture, so a marker pinned to the border does not read as a
               city sitting in the Atlantic. Once a framing brings it inside,
               both go: it is where it is, and saying otherwise would be a lie
               the reader can see through. */
            const off = docked[c.key] && c.offAt ? c.offAt : null;
            const bx = off ? off.x - x : 0;
            const by = off ? off.y - y : 0;
            const bl = Math.hypot(bx, by) || 1;
            return (
              <g
                key={c.key}
                className="emap-court"
                data-key={c.key}
                data-on={on ? "yes" : "no"}
                data-rel={rel ? "yes" : "no"}
                data-off={off ? "yes" : "no"}
              >
                {off && (
                  <>
                    <line
                      className="emap-court-tail"
                      x1={x}
                      y1={y}
                      x2={x + (bx / bl) * view.w}
                      y2={y + (by / bl) * view.w}
                    />
                    <path
                      className="emap-court-bearing"
                      d="M0,-4.5 L5,0 L0,4.5"
                      transform={`translate(${x + (bx / bl) * 13} ${y + (by / bl) * 13}) rotate(${(Math.atan2(by, bx) * 180) / Math.PI})`}
                    />
                  </>
                )}
                <circle
                  className="emap-court-hit"
                  cx={x}
                  cy={y}
                  r={hitR(13, room[c.key], px)}
                  data-mkey={c.key}
                  role={coarseCourts ? undefined : "button"}
                  aria-hidden={coarseCourts || undefined}
                  tabIndex={coarseCourts || rovKey !== c.key ? -1 : 0}
                  aria-label={coarseCourts ? undefined : c.city}
                  aria-pressed={coarseCourts ? undefined : on}
                  onFocus={() => setRov(c.key)}
                  onClick={() => {
                    // The tail of a drag, not a pick: the press began here and
                    // the pointer travelled before it came up.
                    if (panned.current) return;
                    toggleCourt(c.key);
                  }}
                  onKeyDown={(ev) => onMarkerKey(ev, c.key, () => toggleCourt(c.key))}
                />
                <circle className="emap-court-dot" cx={x} cy={y} r={5} />
                {citied && (
                  <text
                    x={x + 12}
                    y={y + 0.4 * cityF + (c.labelDy ?? 0)}
                    fontSize={cityF}
                  >
                    {c.city}
                  </text>
                )}
                {/* The court's own name, at its city, once it is lit. Not
                    always: The Hague alone seats four institutions and the
                    names run to sixty characters, so every city named at once
                    would bury the drawing. Only the abbreviations the
                    citations use, and only while the reader is looking at
                    that relation. */}
                {(on || rel) && badged && citied && c.badges.length > 0 && (
                  <text
                    className="emap-court-abbr"
                    aria-hidden="true"
                    x={x + 12}
                    y={y + 0.4 * cityF + (c.labelDy ?? 0) + 1.15 * cityF}
                    fontSize={labelSize(9.5, 12.5, px)}
                    strokeWidth={2.6 * px}
                  >
                    {c.badges.join(" · ")}
                  </text>
                )}
              </g>
            );
          })}

        {/* Markers are buttons: keyboard-reachable, and each one names the
            site it stands for. The old map answered only to the mouse. */}
        {events.map((e) => {
          const [x, y] = at(e.key);
          const side = LABEL_SIDE[e.key] ?? "right";
          return (
              <g
                key={e.key}
                className="emap-site"
                data-key={e.key}
                data-on={sel?.kind === "site" && sel.key === e.key ? "yes" : "no"}
                data-rel={relSites.has(e.key) ? "yes" : "no"}
                data-lit={e.cases.length > 0 ? "yes" : "no"}
                data-area={e.area ? "yes" : "no"}
              >
              <circle className="emap-halo" cx={x} cy={y} r={e.size / 2} />
                {/* The drawn dot is r=6, which renders 14.4px wide on a
                    1440px screen – under the 24px minimum target size. The
                    interaction sits on its own circle so the drawing keeps
                    the scale it wants. */}
              <circle
                  className="emap-hit"
                cx={x}
                cy={y}
                  r={hitR(11, room[e.key], px)}
                data-mkey={e.key}
                role={coarse ? undefined : "button"}
                aria-hidden={coarse || undefined}
                aria-label={coarse ? undefined : e.title}
                  aria-pressed={sel?.kind === "site" && sel.key === e.key}
                  tabIndex={coarse || rovKey !== e.key ? -1 : 0}
                  onFocus={() => setRov(e.key)}
                  onClick={() => {
                    if (panned.current) return;
                    toggleSite(e.key);
                  }}
                  onKeyDown={(ev) => onMarkerKey(ev, e.key, () => toggleSite(e.key))}
              />
                <circle className="emap-dot" cx={x} cy={y} r={6} />
                {/* The name, once the drawing is big enough to hold it – or,
                    whatever the scale, when this is the one the reader picked.

                    `labelled` is a question about six labels at once: the
                    tightest pair, MH17 and eastern Ukraine, are 16.9 units
                    apart and their labels touch below 2.6 CSS pixels per unit.
                    One label has nothing to collide with. And the alternative
                    was what the map did: in the framing it opens at – 1.2
                    pixels per unit at 1440 – it named all nine courts and left
                    the six places the archive is *about* as unlabelled dots. */}
                {(labelled ||
                  room[e.key] * scale >= LABEL_GAP ||
                  (sel?.kind === "site" && sel.key === e.key)) && (
                  <text
                    className="emap-site-label"
                    aria-hidden="true"
                    x={
                      side === "left"
                        ? x - e.size / 2 - 5 * px
                        : side === "right"
                          ? x + e.size / 2 + 5 * px
                          : x
                    }
                    y={
                      side === "above"
                        ? y - e.size / 2 - 5 * px
                        : side === "below"
                          ? y + e.size / 2 + 5 * px + 8.5 * px
                          : y + 3.8 * px
                    }
                    textAnchor={
                      side === "left" ? "end" : side === "right" ? "start" : "middle"
                    }
                    fontSize={11 * px}
                    strokeWidth={2.6 * px}
                  >
                    {shortLabel(e.when)}
                  </text>
                )}
            </g>
          );
        })}
      </svg>

      {/* Clicking a dot changes a panel that can be 800px away. Without a live
          region a screen-reader user hears nothing at all – and with the wrong
          one they hear three thousand characters of registry citation. One
          sentence: what was picked, and how much of the record it stands for.
          The card carries the rest, where it can be read at leisure. */}
      <div className="emap-say" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <div className="emap-live" ref={liveRef}>
      {selected && (
        <div
          className="emap-card"
          style={{ transform: `translate(${cardAt.x}px, ${cardAt.y}px)` }}
        >
          {/* The grip. The card is anchored to a corner and the drawing is
              not, so a marker or a seat can end up underneath it and the only
              answers used to be closing it or changing the framing. It moves
              now – by this, and not by the card itself, which is full of links
              a drag would swallow. Only where the card floats: below 1000px it
              is in the flow under the drawing and covers nothing. */}
          <button
            type="button"
            className="emap-grip"
            aria-label={labels.moveCard}
            title={labels.moveCard}
            onPointerDown={(ev) => {
              if (ev.button !== 0) return;
              ev.preventDefault();
              cardDrag.current = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
              ev.currentTarget.setPointerCapture(ev.pointerId);
            }}
            onPointerMove={(ev) => {
              const d = cardDrag.current;
              if (!d || d.id !== ev.pointerId) return;
              const dx = ev.clientX - d.x;
              const dy = ev.clientY - d.y;
              d.x = ev.clientX;
              d.y = ev.clientY;
              // Held inside the drawing, with a corner always in reach: a card
              // dragged off the picture is a card that cannot be brought back.
              const r = svgRef.current?.getBoundingClientRect();
              setCardAt((p) => ({
                x: Math.min(Math.max(p.x + dx, r ? -(r.width - 120) : -600), 40),
                y: Math.min(Math.max(p.y + dy, -40), r ? r.height - 120 : 600),
              }));
            }}
            onPointerUp={(ev) => {
              if (cardDrag.current?.id === ev.pointerId) cardDrag.current = null;
            }}
            onPointerCancel={() => {
              cardDrag.current = null;
            }}
            onKeyDown={(ev) => {
              // The keyboard gets it too, in steps of sixteen.
              const step =
                ev.key === "ArrowLeft" ? [-16, 0] :
                ev.key === "ArrowRight" ? [16, 0] :
                ev.key === "ArrowUp" ? [0, -16] :
                ev.key === "ArrowDown" ? [0, 16] : null;
              if (!step) return;
              ev.preventDefault();
              setCardAt((p) => ({ x: p.x + step[0], y: p.y + step[1] }));
            }}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <circle cx="3.5" cy="2.5" r="1" />
              <circle cx="8.5" cy="2.5" r="1" />
              <circle cx="3.5" cy="6" r="1" />
              <circle cx="8.5" cy="6" r="1" />
              <circle cx="3.5" cy="9.5" r="1" />
              <circle cx="8.5" cy="9.5" r="1" />
            </svg>
          </button>
          <button
            type="button"
            className="emap-close"
            aria-label={labels.close}
            onClick={() => select(null)}
          >
            ×
          </button>
          <div className="emap-when">{selected.when}</div>
          <div className="emap-title">{selected.title}</div>
          <p className="emap-note">{selected.note}</p>
          <div className="emap-forums">{selected.forums}</div>
          <div className="emap-count">{selected.count}</div>

          {/* The point of the map. Until now a reader could see that MH17 is
              heard in Strasbourg and The Hague and had no way to reach either
              decision from here. */}
          {selected.cases.length > 0 ? (
            <div className="emap-reads">
              <div className="emap-reads-h">{labels.reads}</div>
              {/* «11 проваджень» stood over three links and the reader had no
                  way to tell whether the other eight existed, were elsewhere,
                  or had never been written. The court cards answer the same
                  question with a named list; a site's proceedings are not all
                  in one forum, so it answers with the arithmetic. Only where
                  the two numbers differ: "3 of 3" is noise. */}
              {/* Mariupol counts six warrants and links the situation they
                  issue from, which is not one of the six – so the arithmetic
                  read «1 of 6», claiming a warrant was written up when none
                  is. A marker that says its link sits outside its count gets
                  the relation stated instead. */}
              {selected.linksOutsideCount
                ? selected.cases.length > 0 && (
                    <p className="emap-written">{labels.writtenBehind}</p>
                  )
                : selected.total > selected.cases.length && (
                    <p className="emap-written">
                      {labels.writtenOf
                        .replace("{n}", String(selected.cases.length))
                        .replace("{total}", String(selected.total))}
                    </p>
                  )}
              <ul>
                {selected.cases.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/${locale}/cases/${c.slug}`}>
                      <span className="emap-read-t">{c.title}</span>
                      {c.forum && <span className="emap-read-f">{c.forum}</span>}
                      {/* The map counted rows and said nothing about
                          consequences: it gave a number of proceedings and no
                          posture and no figure, while the registry beside it
                          carries both on every row – and the largest award in
                          the collection, $1.1bn in Oschadbank, appeared
                          nowhere on the map at all. */}
                      {(c.stage || c.amount) && (
                        <span className="emap-tags">
                          {c.stage && <span className="emap-tag">{c.stage}</span>}
                          {c.amount && (
                            <span className="emap-tag emap-tag-sum" title={labels.amountLabel}>
                              {c.amount}
                            </span>
                          )}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="emap-pending">{labels.pending}</p>
          )}
        </div>
      )}

      {/* A court selection answers the reverse question: not "who is hearing
          this?" but "what is this court hearing?" */}
      {panel && (
        <div
          className="emap-card emap-card-court"
          style={{ transform: `translate(${cardAt.x}px, ${cardAt.y}px)` }}
        >
          {/* The grip. The card is anchored to a corner and the drawing is
              not, so a marker or a seat can end up underneath it and the only
              answers used to be closing it or changing the framing. It moves
              now – by this, and not by the card itself, which is full of links
              a drag would swallow. Only where the card floats: below 1000px it
              is in the flow under the drawing and covers nothing. */}
          <button
            type="button"
            className="emap-grip"
            aria-label={labels.moveCard}
            title={labels.moveCard}
            onPointerDown={(ev) => {
              if (ev.button !== 0) return;
              ev.preventDefault();
              cardDrag.current = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
              ev.currentTarget.setPointerCapture(ev.pointerId);
            }}
            onPointerMove={(ev) => {
              const d = cardDrag.current;
              if (!d || d.id !== ev.pointerId) return;
              const dx = ev.clientX - d.x;
              const dy = ev.clientY - d.y;
              d.x = ev.clientX;
              d.y = ev.clientY;
              // Held inside the drawing, with a corner always in reach: a card
              // dragged off the picture is a card that cannot be brought back.
              const r = svgRef.current?.getBoundingClientRect();
              setCardAt((p) => ({
                x: Math.min(Math.max(p.x + dx, r ? -(r.width - 120) : -600), 40),
                y: Math.min(Math.max(p.y + dy, -40), r ? r.height - 120 : 600),
              }));
            }}
            onPointerUp={(ev) => {
              if (cardDrag.current?.id === ev.pointerId) cardDrag.current = null;
            }}
            onPointerCancel={() => {
              cardDrag.current = null;
            }}
            onKeyDown={(ev) => {
              // The keyboard gets it too, in steps of sixteen.
              const step =
                ev.key === "ArrowLeft" ? [-16, 0] :
                ev.key === "ArrowRight" ? [16, 0] :
                ev.key === "ArrowUp" ? [0, -16] :
                ev.key === "ArrowDown" ? [0, 16] : null;
              if (!step) return;
              ev.preventDefault();
              setCardAt((p) => ({ x: p.x + step[0], y: p.y + step[1] }));
            }}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <circle cx="3.5" cy="2.5" r="1" />
              <circle cx="8.5" cy="2.5" r="1" />
              <circle cx="3.5" cy="6" r="1" />
              <circle cx="8.5" cy="6" r="1" />
              <circle cx="3.5" cy="9.5" r="1" />
              <circle cx="8.5" cy="9.5" r="1" />
            </svg>
          </button>
          <button
            type="button"
            className="emap-close"
            aria-label={labels.close}
            onClick={() => select(null)}
          >
            ×
          </button>
            {/* The court leads and the city locates it, mirroring the event
                card where the date tag sits above and the event is the heading.
                This opened with the legend's own wording ("the courts sit in")
                and put the city where the name belongs. */}
            <div className="emap-when">{panel.title}</div>
            {/* The seats as a list, one link each.

                This was a single run-on line – "ICJ – Міжнародний суд ООН ·
                ICC – Міжнародний кримінальний суд · …" – under which sat the
                court's whole caseload: every summarised decision with its
                status chip, then four more from the registry, then a link to
                the rest. The owner's note is to keep the court names and the
                number of proceedings and nothing else, and to make every name
                a way into the registry.

                So the card answers two questions and stops: which courts sit
                here, and how much of the archive they hold. Everything it used
                to list is one click away, in the one place that can sort and
                filter it. */}
            {(() => {
              /* Two groups, in one order: the international courts, then a
                 heading and the state's own. The card was a flat list in
                 which the Dutch judiciary sat fourth among three
                 international courts and nothing said it was a different
                 kind of thing. The heading says it once, over however many
                 rows there are, instead of tagging each row with a state
                 the card's own title already names. */
              const intl = panel.seatList.filter((s) => !s.national);
              const national = panel.seatList.filter((s) => s.national);
              const row = (seat: (typeof panel.seatList)[number]) => {
                const inner = (
                  <>
                    <span className="emap-seat-abbr">{seat.abbr ?? ""}</span>
                    <span className="emap-seat-name">{seat.name}</span>
                    {/* The count only where a seat is an institution with a
                        caseload. Paris's PCA row is the venue of one
                        arbitration, not a court the registry can be filtered
                        on, so it carries neither number nor link. */}
                    {seat.count != null && (
                      <span className="emap-seat-n">{seat.count}</span>
                    )}
                    {seat.id && (
                      <span className="emap-seat-go" aria-hidden="true">
                        ›
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={seat.id ?? seat.name}>
                    {/* A seat with no institution of its own is a fact about
                        where something sat, not a way into a caseload – so it
                        is named and not linked, rather than linked at
                        something else. */}
                    {seat.id ? (
                      <Link href={`/${locale}/registry?court=${seat.id}`}>{inner}</Link>
                    ) : (
                      <span className="emap-seat-plain">{inner}</span>
                    )}
                  </li>
                );
              };
              return (
                <>
                  {intl.length > 0 && <ul className="emap-seats">{intl.map(row)}</ul>}
                  {national.length > 0 && (
                    <>
                      <p className="emap-seats-group">{labels.seatsNational}</p>
                      <ul className="emap-seats emap-seats-nat">{national.map(row)}</ul>
                    </>
                  )}
                </>
              );
            })()}
            {/* The foot: what the card adds up to, and the one place that can
                sort and filter the same set. The total used to stand alone as
                «22 провадження у бібліотеці», which named a number and left
                the reader no way to reach it. */}
            <div className="emap-seats-foot">
              <p className="emap-caseload">
                {(() => {
                  /* The figure is what the reader came for, so the figure is
                     what is lit – which means the sentence has to come apart
                     at it rather than be substituted whole. Split on the
                     template's own «{n} {w}», not on the rendered number: a
                     card whose total is 3 would otherwise light the 3 in
                     «33 провадження» too. A locale that reorders the two
                     falls back to the plain sentence rather than to a
                     mis-split one. */
                  const figure = `${panel.total} ${plural(panel.total, labels.caseloadWord, locale)}`;
                  const parts = labels.seatsTotal.replace("{at}", panel.at).split("{n} {w}");
                  return parts.length === 2 ? (
                    <>
                      {parts[0]}
                      <strong>{figure}</strong>
                      {parts[1]}
                    </>
                  ) : (
                    labels.seatsTotal
                      .replace("{at}", panel.at)
                      .replace("{n}", String(panel.total))
                      .replace("{w}", plural(panel.total, labels.caseloadWord, locale))
                  );
                })()}
              </p>
              {panel.courtIds.length > 0 && (
                <Link
                  className="emap-seats-open"
                  href={`/${locale}/registry?court=${panel.courtIds.join(",")}`}
                >
                  {labels.seatsOpen}
                </Link>
              )}
            </div>
        </div>
      )}
      </div>

      </div>

      {/* Outside the figure, not inside it. The figure is the drawing's own
          box and on the map's own page it carries a declared height, so a
          strip laid out in it overlapped the legend below – measured, the rail
          and the legend both started at y = 706. The cards can live in there
          because they are absolutely placed; these are in flow. */}
      {/* Where the drawing is a picture, it says so – and offers the one
          thing that turns it back into a map. It was silent about this: the
          marks went inert below the 24px floor, correctly, while the grab
          cursor and the zoom stepper stayed on, promising a control surface
          that answered nothing. Rendered only where both families are inert,
          so a landscape phone – which can already reach the courts – is not
          told its map is a picture. */}
      {(touch || (coarse && coarseCourts)) && !full && (
        <div className="emap-overview">
          {/* The sentence only where the drawing really is a picture. A phone
              held sideways renders a court target at 24.9px and names its nine
              cities – it is a small map, not a picture of one – so it is
              offered the screen without being told its map does not work. */}
          {coarse && coarseCourts && <p>{labels.overview}</p>}
          <button type="button" className="emap-gofull" onClick={() => setFull(true)}>
            {labels.openFull}
          </button>
        </div>
      )}

      {/* The six, as text, under the key that explains the drawing above
          them. The legend used to sit below this list – which put the keys a
          screen away from the marks they name, so pressing one to see the five
          sites with a written decision showed the reader a legend and no map.
          A key belongs beside the thing it is a key to; the list is content and
          follows both. */}
      {/*
        The same content as text. The iframe version was invisible to search
        engines and to anyone not using a pointing device; this list is the
        map's actual payload, and on a narrow screen it is the whole map.
      */}
      {/* The six, as text, under the key that explains the drawing above
          them. The legend used to sit below this list – which put the keys a
          screen away from the marks they name, so pressing one to see the five
          sites with a written decision showed the reader a legend and no map.
          A key belongs beside the thing it is a key to; the list is content and
          follows both. */}
      {/*
        The same content as text. The iframe version was invisible to search
        engines and to anyone not using a pointing device; this list is the
        map's actual payload, and on a narrow screen it is the whole map.
      */}
      {/* The key lies on the drawing, bottom left, and folds away.
          Inside the figure because that is what it is a key to: on the map's
          own page the drawing takes the screen, and a key a scroll below it is
          a key to something you cannot see. Absolutely placed, so the figure's
          declared height is not its business; below 901px it goes back into
          the flow under the drawing, where a phone has always had it. */}
      {/* A legend that draws the marks instead of naming them. Every glyph
          below is the same shape the map uses, at the same size, so the reader
          matches by sight rather than by reading a colour word – and the three
          that name a *set* of marks are controls, not captions. */}
      <div className="emap-legend" data-variant={variant}>
        {/* Only on the map's own page. On the home band the key is a single
            wrapped row of six words under the drawing – there is nothing there
            to fold, and a control to fold it would be larger than the thing. */}
        {variant === "full" && (
          <button
            type="button"
            className="emap-leg-toggle"
            aria-expanded={legendOpen}
            onClick={() => setLegendUser(!legendOpen)}
          >
            <span className="emap-leg-chev" aria-hidden="true" />
            {labels.legendTitle}
          </button>
        )}
        {/* What the marks do, at the top, where an invitation belongs – it was
            at the foot of the key, under eight things a reader has to get past
            before being told the marks answer at all. The map's whole mechanic
            was written down nowhere before this: a reader had to find it by
            pressing something they had no reason to think was a control. */}
        <p className="emap-leg-how">{labels.legendPick}</p>
        {/* The whole group, not just its keys. Two of the three were already
            drawn from the data and self-hid when the sites went; the first was
            not, so the key kept a colour, a heading and a filter standing for
            marks that are no longer on the drawing – and pressing it would
            have dimmed the map to show nothing. */}
        {events.length > 0 && (
        <div className="emap-leg-group">
          <LegendH variant={variant}>{labels.legendWhat}</LegendH>
          <ul>
            <li>
              <button
                type="button"
                className="emap-key"
                aria-pressed={hi === "lit"}
                onClick={() => setHi(hi === "lit" ? null : "lit")}
              >
                <svg viewBox="0 0 22 22" aria-hidden="true">
                  <circle className="k-halo" cx="11" cy="11" r="9" />
                  <circle className="k-lit" cx="11" cy="11" r="5" />
                </svg>
                {labels.legendLit}
              </button>
            </li>
            {/* «Ще досліджуємо», and only where there is one to point at.
                It used to render unconditionally, and after «Затримання
                кораблів» was taken off the map (see content/map.ts) it would
                have been a key, a colour and a filter standing for nothing –
                a reader pressing it would light up an empty map. Rendered
                from the data, so putting an unwritten event back restores the
                key with it. */}
            {events.some((e) => !e.cases?.length) && (
              <li>
                <button
                  type="button"
                  className="emap-key"
                  aria-pressed={hi === "unlit"}
                  onClick={() => setHi(hi === "unlit" ? null : "unlit")}
                >
                  <svg viewBox="0 0 22 22" aria-hidden="true">
                    <circle className="k-unlit" cx="11" cy="11" r="5" />
                  </svg>
                  {labels.legendUnlit}
                </button>
              </li>
            )}
            {/* The ground a mark speaks for, where a point is not the whole
                truth about it. Only where some site actually has one. */}
            {variant === "full" && events.some((e) => e.area) && (
              <li>
                <button
                  type="button"
                  className="emap-key"
                  aria-pressed={hi === "area"}
                  onClick={() => setHi(hi === "area" ? null : "area")}
                >
                  <svg viewBox="0 0 22 22" aria-hidden="true">
                    <path className="k-area" d="M2,7 L9,3 L17,5 L20,11 L15,18 L6,17 L3,12 Z" />
                    <circle className="k-lit" cx="11" cy="10.5" r="3" />
                  </svg>
                  {labels.legendArea}
                </button>
              </li>
            )}
          </ul>
        </div>
        )}

        {/* On the home band this group renders too, but only its first key:
            without it the reader sees the site marks and no key to the rings
            the courts are drawn as, which are half the picture. Everything
            else here – the dashed line, the docked seat, the lit ground, the
            oblast mesh – explains a detail of a drawing the band is showing at
            a glance, and a band is a glance. Three marks and one sentence; the
            rest is on the map's own page, which is one link away. */}
        <div className="emap-leg-group">
          <LegendH variant={variant}>{labels.legendHow}</LegendH>
          <ul>
            <li>
              <button
                type="button"
                className="emap-key"
                aria-pressed={hi === "court"}
                onClick={() => setHi(hi === "court" ? null : "court")}
              >
                <svg viewBox="0 0 22 22" aria-hidden="true">
                  <circle className="k-court" cx="11" cy="11" r="5.5" />
                </svg>
                {labels.court}
              </button>
            </li>
            {/* The rest are captions, not controls: they explain a property of
                the drawing rather than name a set of marks you could ask to
                see on their own. A button that filtered to "the dashed lines"
                would be a button that did nothing. */}
            {/* The lit states. First after the court mark, because between
                them they are the whole drawing now: a ring where a court sits,
                and the colour over the country it sits in. */}
            <li className="emap-key">
              <svg viewBox="0 0 22 22" aria-hidden="true">
                <path className="k-forum" d="M2,7 L9,3 L17,5 L20,11 L15,18 L6,17 L3,12 Z" />
              </svg>
              {labels.legendForum}
            </li>
            {/* Only where there is still a line to explain. */}
            {variant === "full" && events.length > 0 && (
              <li className="emap-key">
                <svg viewBox="0 0 22 22" aria-hidden="true">
                  <line className="k-line" x1="1" y1="11" x2="21" y2="11" />
                </svg>
                {labels.legendLine}
              </li>
            )}
            {/* The one glyph on the drawing a reader has no way to recognise,
                and the one the legend did not explain: a seat the frame cannot
                hold, pinned to the border with a chevron and a tail running off
                the picture. By data rather than by name – today that is
                Montreal and the ICAO Council, and a second such seat would
                bring its own key with it. */}
            {variant === "full" && courts.some((c) => c.offMap) && (
              <li className="emap-key">
                <svg viewBox="0 0 22 22" aria-hidden="true">
                  <line className="k-line" x1="1" y1="11" x2="11" y2="11" />
                  <circle className="k-court" cx="4" cy="11" r="3.4" />
                  <path className="k-bearing" d="M13,7 L17.5,11 L13,15" />
                </svg>
                {labels.legendOffMap}
              </li>
            )}
            {/* No key for the marker sizes. They still encode how much of the
                record a place accounts for – that is what `markerSize` is for,
                and the build still checks it against each card's own count –
                but the range is 18 to 26 projection units, which at the scale
                this is read at is a 24px circle beside a 17px one. The eye does
                not read that as "five times the caseload", and a key that names
                a distinction the reader cannot see is a key that teaches them
                to distrust the others. The number is on every card, in words. */}
            {/* The oblast mesh. It is a deliberate and useful part of the
                drawing – it is what lets a reader see that Crimea is a piece of
                this country and not a neighbour of it – and to anyone who does
                not already know the country it was an unexplained grid. */}
            {variant === "full" && (
              <li className="emap-key">
                <svg viewBox="0 0 22 22" aria-hidden="true">
                  <path className="k-mesh" d="M2,15 L8,9 L14,12 L20,6 M8,9 L7,2 M14,12 L15,20" />
                </svg>
                {labels.legendRegions}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* `events.length > 0`, not just `variant === "full"`.

          The legend's own «Місця подій» key already self-hid when the sites
          came off the map; this header did not, so the map page rendered a
          fold control reading «МІСЦЯ ПОДІЙ 0» over an empty list. A count of
          zero is not information – it is a section admitting it has nothing
          in it – and it was the first thing under the drawing on a phone. */}
      {variant === "full" && events.length > 0 && (
        <button
          type="button"
          className="emap-fold-h"
          /* `auto` means open here – see the note in events-map.css – so the
             control has to say open. It said `coarse`, which is false on a
             desktop, so the chevron pointed at a folded block while six cards
             sat under it. */
          aria-expanded={listUser ?? true}
          onClick={() => setListUser((v) => !(v ?? true))}
        >
          <span className="emap-leg-chev" aria-hidden="true" />
          {labels.placesTitle}
          <span className="emap-fold-n">{events.length}</span>
        </button>
      )}
      <ul className="emap-list" data-variant={variant}>
        {events.map((e) => (
          <li key={e.key}>
            <button
              type="button"
              onClick={() => toggleSite(e.key)}
              aria-pressed={sel?.kind === "site" && sel.key === e.key}
            >
              <span className="emap-li-when">{e.when}</span>
              <span className="emap-li-title">{e.title}</span>
              <span className="emap-li-forums">{e.forums}</span>
              <span className="emap-li-count">{e.count}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* The seats, out of the legend and into a block of their own.
          A legend answers "how do I read this drawing". Nine cities with the
          full names of every institution seated in them answers "where do I go
          next", which is a different question – and it was the longest thing on
          the page, pushing the two actual keys to the top of a block a reader
          read as one list. Same buttons, same comparison of nine caseloads side
          by side; each one now also opens the registry filtered on that seat's
          institutions, which is where its proceedings actually live. */}
      {variant === "full" && (
        <>
          <button
            type="button"
            className="emap-fold-h"
            aria-expanded={seatsOpen}
            onClick={() => setSeatsUser(!seatsOpen)}
          >
            <span className="emap-leg-chev" aria-hidden="true" />
            {labels.courtsSeat}
            <span className="emap-fold-n">{courts.length}</span>
          </button>
          <div className="emap-index">
            <ul>
              {courts.map((c) => (
                <li key={c.key}>
                  {/* One row per seat, and the figure at the end of it.
                      The one thing this block holds that the registry does not
                      is nine caseloads side by side – and until now they were
                      set under the text in a four-column grid, where no two of
                      them lined up and the comparison it exists for could not
                      be made. A row, a rule, and the number in the right-hand
                      column, in figures that share a width. */}
                  <button type="button" onClick={() => toggleCourt(c.key)}>
                    <span className="emap-seat-city">{c.city}</span>
                    <span className="emap-seat-list">{c.seats}</span>
                  </button>
                  {c.caseload.courtIds.length > 0 ? (
                    <Link
                      className="emap-seat-count"
                      href={`/${locale}/registry?court=${c.caseload.courtIds.join(",")}`}
                    >
                      {c.caseload.total}
                    </Link>
                  ) : (
                    <span className="emap-seat-count">{c.caseload.total}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
