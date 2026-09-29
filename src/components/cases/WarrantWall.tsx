"use client";

import { useEffect, useRef, useState } from "react";
import "./warrant-wave.css";

/**
 * The warrants of arrest, drawn as a ladder of command.
 *
 * The strongest fact in this data is not the six names – it is their
 * altitude: the warrants run down an entire vertical of power. One spine,
 * named rungs, each suspect pinned to their rung and coloured by the theory
 * of the case that charged them. Selecting a suspect opens the charges in
 * their own rung – every chip a Rome Statute article, the Court's own
 * announcement one click away. Without `rungs` the component falls back to
 * plain wave sections. Props arrive locale-resolved (see CaseTimeline).
 */
export interface WarrantPersonR {
  name: string;
  role: string;
  born?: string;
  rung?: number;
  charges: { art: string; label: string; kind: "war-crime" | "cah" }[];
  modes: { art: string; label: string }[];
}
export interface WarrantWaveR {
  /** Which accusation line this batch belongs to. */
  line?: string;
  date: string;
  iso: string;
  theme: string;
  summary: string;
  url: string;
  persons: WarrantPersonR[];
}

export default function WarrantWall({
  waves,
  rungs,
  lines,
  labels,
}: {
  waves: WarrantWaveR[];
  rungs?: string[];
  /** The accusation lines, each drawn as a ladder of its own. */
  lines?: { key: string; label: string; summary: string }[];
  labels: {
    charges: string;
    modes: string;
    announcement: string;
    warCrime: string;
    cah: string;
    /** "ст." / "art." */
    art: string;
  };
}) {
  /* Nobody is selected on arrival. The first suspect used to be open before
     the reader had asked anything, which made the panel look like part of the
     page rather than an answer to a click, and pinned the ladder's first rung
     open at whatever height that one man's charges happened to be. */
  const [open, setOpen] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const flat = waves.flatMap((w, wi) => w.persons.map((p, pi) => ({ w, wi, p, key: `${wi}-${pi}` })));
  const sel = flat.find((f) => f.key === open) ?? null;

  /* Escape closes it, the way every other disclosure on the web does. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const detail = sel === null ? null : (
    /* aria-live because selecting a second suspect while the first is open
       replaces this panel's text in place: the page changes, the focus does
       not move, and without it a screen reader is told nothing happened. */
    <div className="wr-detail" id="wr-detail" ref={panelRef} data-wave={sel.wi} aria-live="polite">
      <div className="wr-detail-head">
        <span className="wr-detail-name">{sel.p.name}</span>
        <span className="wr-detail-wave">
          {sel.w.theme} · {sel.w.date}
        </span>
      </div>
      <p className="wr-detail-role">
        {sel.p.role}
        {sel.p.born ? ` · ${sel.p.born}` : ""}
      </p>

      <span className="suspect-lbl">{labels.charges}</span>
      <div className="charges">
        {sel.p.charges.map((c, ci) => (
          <span key={ci} className="charge" data-kind={c.kind}>
            <b>{c.kind === "cah" ? labels.cah : labels.warCrime}</b>
            {c.label}
            <em>
              {labels.art} {c.art}
            </em>
          </span>
        ))}
      </div>

      <span className="suspect-lbl">{labels.modes}</span>
      <div className="modes">
        {sel.p.modes.map((m, mi) => (
          <span key={mi} className="mode">
            {m.label}
            <em>
              {" "}
              · {labels.art} {m.art}
            </em>
          </span>
        ))}
      </div>

      <a className="wave-src" href={sel.w.url} target="_blank" rel="noopener noreferrer">
        {labels.announcement}
      </a>
    </div>
  );

  if (!rungs) {
    return (
      <div className="warrants">
        {waves.map((w, wi) => (
          <section key={wi} className="wave" data-wave={wi}>
            <header className="wave-head">
              <span className="wave-date">{w.date}</span>
              <h3 className="wave-theme">{w.theme}</h3>
              <p className="wave-sum">{w.summary}</p>
            </header>
            <ul className="wave-people">
              {w.persons.map((p, pi) => (
                <li key={pi} data-on={open === `${wi}-${pi}` ? "yes" : "no"}>
                  <button
                    type="button"
                    className="suspect"
                    aria-expanded={open === `${wi}-${pi}`}
                    aria-controls={sel === null ? undefined : "wr-detail"}
                    /* Toggling, like the ladder's nodes. It only ever set,
                       so a control reporting aria-expanded="true" could not
                       be closed by the key that opened it. */
                    onClick={() => setOpen(open === `${wi}-${pi}` ? null : `${wi}-${pi}`)}
                  >
                    <span className="suspect-name">{p.name}</span>
                    <span className="suspect-role">{p.role}</span>
                  </button>
                </li>
              ))}
            </ul>
            {sel !== null && sel.wi === wi && detail}
          </section>
        ))}
      </div>
    );
  }

  /* ── Two verticals, not one ──────────────────────────────────────────────
     The band drew a single spine with four rungs and called it the chain of
     command. It is not one chain: the warrants over the deportation of
     children name the head of state and the children's commissioner, the
     warrants over the grid name the Defence Minister, the General Staff and
     two operational commanders – and no warrant names the head of state for
     the grid. Drawn as one ladder it asserted a descent that no document
     draws. Each line now has its own ladder, numbered from its own top, so
     what the reader sees is the true and stronger fact: how high the Court
     reached in each. Owner: «переробляй на дві вертикалі». */
  const drawn =
    lines && lines.length > 0
      ? lines
          .map((ln) => ({
            ...ln,
            items: flat.filter((f) => f.w.line === ln.key),
          }))
          .filter((ln) => ln.items.length > 0)
      : null;

  if (rungs && drawn) {
    return (
      <div className="warrants warrants-ladder">
        {drawn.map((ln) => {
          /* Numbered within the line. Globally these are rungs 3 and 4 of an
             authored list; inside the grid's own vertical they are its first
             and second, and the numeral is there to say how far down the
             line goes, not where it sits in a table. */
          const used = rungs
            .map((label, ri) => ({ label, ri, here: ln.items.filter((f) => (f.p.rung ?? 0) === ri) }))
            .filter((r) => r.here.length > 0);
          const wi = ln.items[0].wi;
          return (
            <section key={ln.key} className="wr-line" data-wave={wi}>
              <h3 className="wr-line-head">
                <i aria-hidden="true" />
                {ln.label}
              </h3>
              <p className="wr-line-sum">{ln.summary}</p>
              <div className="ladder">
                <div className="ladder-spine" aria-hidden="true" />
                {used.map((r, n) => (
                  <div key={r.ri} className="rung">
                    <div className="rung-label">
                      <b>{String(n + 1).padStart(2, "0")}</b>
                      {r.label}
                    </div>
                    <div className="rung-people">
                      {r.here.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          className="wr-node"
                          data-wave={f.wi}
                          data-on={open === f.key ? "yes" : "no"}
                          aria-expanded={open === f.key}
                          aria-controls={sel === null ? undefined : "wr-detail"}
                          onClick={() => setOpen(open === f.key ? null : f.key)}
                        >
                          <span className="wr-node-name">{f.p.name}</span>
                          <span className="wr-node-role">{f.p.role}</span>
                          <span className="wr-node-date">{f.w.date}</span>
                        </button>
                      ))}
                      {sel !== null && r.here.some((f) => f.key === sel.key) && detail}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="warrants warrants-ladder">
      {/* The legend is also where each wave says what it is about. `summary`
          is authored on every wave and used to render only in the `!rungs`
          fallback below – and icc-ukraine, the one page with warrants, sets
          `rungs`, so the sentence never appeared: the ladder named three
          waves and explained none of them. */}
      <div className="wr-legend">
        {waves.map((w, wi) => (
          <span key={wi} className="wr-key wr-key-note" data-wave={wi}>
            <i aria-hidden="true" />
            {/* The date leaves the bold head and takes the line under it, in
                the same mono register every other date on this page uses.
                Glued on with a middot it made a run of bold that wrapped to
                three lines in a narrow column, and buried the date inside
                it. Owner: «допрацюй дизайн цього блоку». */}
            <span className="wr-key-head">{w.theme}</span>
            <span className="wr-key-date">{w.date}</span>
            <span className="wr-key-sum">{w.summary}</span>
          </span>
        ))}
      </div>

      <div className="ladder">
        <div className="ladder-spine" aria-hidden="true" />
        {rungs.map((r, ri) => {
          const here = flat.filter((f) => (f.p.rung ?? 0) === ri);
          if (here.length === 0) return null;
          return (
            <div key={ri} className="rung">
              <div className="rung-label">
                <b>{String(ri + 1).padStart(2, "0")}</b>
                {r}
              </div>
              <div className="rung-people">
                {here.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className="wr-node"
                    data-wave={f.wi}
                    data-on={open === f.key ? "yes" : "no"}
                    aria-expanded={open === f.key}
                    /* Only while the panel is in the document. Nothing is
                       selected on arrival, so #wr-detail does not exist yet,
                       and all six nodes pointed at an id that was not on the
                       page – a dangling reference every assistive technology
                       has to decide what to do with. */
                    aria-controls={sel === null ? undefined : "wr-detail"}
                    onClick={() => setOpen(open === f.key ? null : f.key)}
                  >
                    <span className="wr-node-name">{f.p.name}</span>
                    <span className="wr-node-role">{f.p.role}</span>
                    <span className="wr-node-date">{f.w.date}</span>
                  </button>
                ))}
                {sel !== null && here.some((f) => f.key === sel.key) && detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
