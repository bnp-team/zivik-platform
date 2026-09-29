"use client";

import { useEffect, useRef, useState } from "react";
import React from "react";
/* Locale-resolved props, like every other client component here.

   This one took `Metric[]` straight off the summary – raw {uk, en} pairs – and
   being a client component it serialised them into the payload, so every
   reader downloaded both languages of every figure, label and note. That is
   the rule ARCHITECTURE.md states and the reason CaseTimeline's docstring
   gives for resolving on the server; this component was made client-side for
   the reveal and the prop shape came along unchanged. */

/**
 * The size of the loss, in three registers.
 *
 * A countable metric becomes one mark per unit – 294 outlets read as a field,
 * not as a number. A share becomes a bar against the whole. Everything else
 * stays a figure with its caption.
 *
 * ── What the bar is for ────────────────────────────────────────────────────
 * It used to fill the share in gold and leave the rest as an empty track. On
 * this page the share is the 9.5% of deported children who have come home,
 * and gold is the colour this system gives to something recovered – so the
 * band read as a small gain against nothing, when the finding is the nine in
 * ten still held. The remainder now carries the page's own red – the colour
 * every other breach on it wears – and its own label, so both sides of the
 * proportion are stated.
 *
 * The fill grows from nothing the first time the bar is scrolled into view.
 * That is the whole of the motion here, and it is not decoration: a share
 * this small is easier to feel as it is drawn than as a printed percentage.
 * A reader who has asked for reduced motion gets the bar at full width with
 * no animation at all.
 */
export interface MetricR {
  label: string;
  value: string;
  percent?: number;
  restLabel?: string;
  count?: number;
  /** The subject this figure belongs to, on the first of its run. */
  group?: string;
  /** A part of the figure declared before it – drawn inside its tile. */
  partOfAbove?: boolean;
  note?: string;
  /** A second measure of the same quantity, where the sources disagree. */
  alt?: { label: string; value: string };
}

export default function TakingsGrid({
  metrics,
  note,
  locale,
  labels,
}: {
  metrics: MetricR[];
  /** Where the figures come from. Sits in the grid as its own cell, so a row
      with an odd number of tiles closes rather than leaving a hole. Takes a
      node, not a string: the date of verification is a `<span>` inside it. */
  note?: React.ReactNode;
  /** Still needed: the share is formatted with the reader's own separator. */
  locale: string;
  /** "of which" and the over-cap note for a dot field too large to draw. */
  labels?: { andMore?: string; shareOf?: string };
}) {
  const root = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    /* Two ways the bar can end up drawn, and both go through the same timer.

       A reader who has asked for reduced motion, or a browser with no
       observer, should see the finished bar rather than an animation or an
       empty track – but setting that state straight from the body of an effect
       cascades a second render before paint, so it is scheduled at zero delay
       instead and lands on the next tick.

       The other way is the failsafe. The fill's width is driven by this state,
       so anything that stops the observer speaking – a throttled tab, a
       restore into the background, a pipeline that is not running – would
       leave a reader looking at an empty track and reading it as "none
       returned". That is a worse failure than no animation, and it is silent.
       After two seconds the bar draws whether the observer spoke or not. */
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined";

    let io: IntersectionObserver | null = null;
    const settle = window.setTimeout(
      () => {
        setShown(true);
        io?.disconnect();
      },
      still ? 0 : 2000,
    );

    if (!still) {
      /* Once. A bar that re-draws every time it re-enters the viewport turns a
         fact into an ornament the reader has to sit through again. */
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setShown(true);
            io?.disconnect();
          }
        },
        { threshold: 0.35 },
      );
      io.observe(el);
    }

    return () => {
      window.clearTimeout(settle);
      io?.disconnect();
    };
  }, []);

  /* 9,5% in Ukrainian, 9.5% in English. The figure was printed straight out of
     the number, so the one percentage on the page that the component wrote
     itself was the only one not following the locale. */
  const pct = (n: number) =>
    n.toLocaleString(locale === "uk" ? "uk-UA" : "en-GB", {
      maximumFractionDigits: 1,
    });

  /* The dot field draws one mark per unit, which cannot go on for ever. When
     the count is over the cap the field is drawn to the cap and says so –
     silently truncating would make the marks a lie about the number printed
     directly above them. */
  const CAP = 400;

  /* A whole and its part are one tile, not two – see `partOfAbove` on Metric.
     Grouped here rather than in the markup below so the grid sees a single
     child for the pair and can give it the full width. */
  const tiles: { whole: MetricR; part?: MetricR }[] = [];
  for (const m of metrics) {
    if (m.partOfAbove && tiles.length > 0) tiles[tiles.length - 1].part = m;
    else tiles.push({ whole: m });
  }

  /* `!== undefined` on both, not truthiness: a metric of nought is a finding,
     and truthiness filed it under the wrong shape while the field rendered. */
  const shapeOf = (m: MetricR) =>
    m.count !== undefined ? "grid" : m.percent !== undefined ? "bar" : "plain";

  const bar = (m: MetricR, ofWhole?: string) =>
    m.percent === undefined ? null : (
      <>
        <div
          className="taking-bar"
          /* Only a share whose remainder has been named is drawn against a
             breach-coloured track – see the note in the stylesheet. */
          data-rest={m.restLabel ? "named" : "none"}
          role="img"
          aria-label={`${m.label}: ${pct(m.percent)}%`}
        >
          <i style={{ width: shown ? `${m.percent}%` : "0%" }} />
        </div>
        {m.restLabel && (
          <p className="taking-split">
            <span className="ts-share">
              {pct(m.percent)}%{ofWhole ? ` ${ofWhole}` : ""}
            </span>
            <span className="ts-rest">{m.restLabel}</span>
          </p>
        )}
      </>
    );

  const figure = (m: MetricR, ofWhole?: string) => (
    <>
      <div className="taking-head">
        <span className="taking-label">{m.label}</span>
        <b className="taking-value">{m.value}</b>
      </div>

      {m.count !== undefined && (
        <>
          <div className="dotfield" aria-hidden="true">
            {Array.from({ length: Math.min(m.count, CAP) }, (_, d) => (
              <i key={d} style={{ transitionDelay: `${Math.min(d * 4, 900)}ms` }} />
            ))}
          </div>
          {m.count > CAP && labels?.andMore && (
            <p className="taking-capped">{labels.andMore.replace("{n}", String(CAP))}</p>
          )}
        </>
      )}

      {m.percent !== undefined && bar(m, ofWhole)}

      {/* The note belongs to the figure above it, so it closes the figure. */}
      {m.note && <p className="taking-note">{m.note}</p>}
    </>
  );

  return (
    <div className="takings" ref={root} data-shown={shown ? "yes" : "no"}>
      {tiles.map(({ whole, part }, i) => (
        <React.Fragment key={i}>
          {/* The subject the run below belongs to. Spans the grid, so the
              figures under it read as one answer rather than six. */}
          {whole.group && <p className="takings-group">{whole.group}</p>}
        <div
          className="taking"
          data-shape={shapeOf(whole)}
          data-pair={part ? "yes" : undefined}
        >
          {/* A whole and its part flank the bar that relates them.

              They were stacked – the whole with its figure, then a note, then
              the part with its own figure, then the bar – and the big number
              ended up three lines above the drawing it is the length of.
              Owner: «ця цифра 19546 взагалі ніяк візуально не дотична до
              лінії графіку». Side by side over the track, the bar reads as
              what it is: 19 546+ long, 1 859 of it filled. */}
          {part ? (
            <>
              <div className="taking-ends">
                <div className="taking-head">
                  <span className="taking-label">{whole.label}</span>
                  <b className="taking-value">{whole.value}</b>
                </div>
                <div className="taking-head taking-end-r">
                  <span className="taking-label">{part.label}</span>
                  <b className="taking-value">{part.value}</b>
                </div>
              </div>
              {bar(part, labels?.shareOf ? `${labels.shareOf} ${whole.value}` : undefined)}
              {whole.note && <p className="taking-note">{whole.note}</p>}
              {part.note && <p className="taking-note">{part.note}</p>}
            </>
          ) : (
            figure(whole)
          )}

          {/* The other measure closes the tile, after the share rather than
              before it: read last, an estimate an order of magnitude larger
              lands on a reader who has just seen how little of it came back.
              Read first, it would have stolen the «них» from the share. */}
          {whole.alt && (
            <div className="taking-alt">
              <span className="taking-label">{whole.alt.label}</span>
              <b className="taking-value">{whole.alt.value}</b>
            </div>
          )}
        </div>
        </React.Fragment>
      ))}
      {note && <p className="taking-note takings-note">{note}</p>}
    </div>
  );
}
