"use client";

import { useState } from "react";

/**
 * Whose conduct counts as the State's.
 *
 * Props arrive locale-resolved (see CaseTimeline for why).
 *
 * ── Two stems, not five branches ───────────────────────────────────────────
 * The five bodies here are not five parallel facts. Three were organs of the
 * State (ILC art. 4) and two acted on its instructions or under its control
 * (art. 8), and those are different routes with different proofs – which is
 * the whole reason attribution is worth a diagram at all. Drawn as five equal
 * siblings, the one thing a tree could show was the one thing it did not: the
 * distinction survived only as small type inside each card's eyebrow.
 *
 * The stems are labelled from the block's own paragraph, which already said
 * "article 4 for organs of the State, article 8 for conduct directed or
 * controlled by it" – the words are promoted, not invented.
 *
 * One branch is always open, unlike the warrant ladder next door. The
 * difference is what the closed state would say: an unselected ladder is a
 * list of names, which is still an answer, while this closed is a root, some
 * branches and a blank – the sentence under it is the point of the drawing.
 */
export interface AttributionNodeR {
  actor: string;
  basis: string;
  basisNote: string;
  did: string;
}

export default function AttributionTree({
  respondent,
  nodes,
  routes = [],
}: {
  respondent: string;
  nodes: AttributionNodeR[];
  /** Label per `basis`, in drawing order. */
  routes?: { basis: string; label: string }[];
}) {
  const [open, setOpen] = useState(0);

  /* An empty list would have gone straight through `nodes[open].did` below and
     taken the whole page down with it. Nothing renders it empty today; nothing
     stopped it either. */
  if (nodes.length === 0) return null;
  const shown = nodes[Math.min(open, nodes.length - 1)];

  /* Grouped by the rule relied on, in the order `routes` gives – and any basis
     the routes do not name still gets a stem, in first-appearance order, so a
     future write-up that adds art. 5 or art. 11 is drawn rather than dropped. */
  const order = [
    ...routes.map((r) => r.basis),
    ...nodes.map((n) => n.basis).filter((b) => !routes.some((r) => r.basis === b)),
  ];
  const stems = [...new Set(order)]
    .map((basis) => ({
      basis,
      label: routes.find((r) => r.basis === basis)?.label,
      items: nodes
        .map((n, i) => ({ n, i }))
        .filter(({ n }) => n.basis === basis),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <div className="attr">
      <div className="attr-root">{respondent}</div>
      <div className="attr-stem" aria-hidden="true" />

      <div className="attr-routes">
        {stems.map((s) => (
          <section className="attr-route" key={s.basis}>
            <h3 className="attr-route-head">
              <span className="attr-route-art">{s.basis}</span>
              {s.label && <span className="attr-route-label">{s.label}</span>}
            </h3>

            <ul className="attr-branches">
              {s.items.map(({ n, i }) => (
                <li key={i} data-on={open === i ? "yes" : "no"}>
                  <button
                    type="button"
                    className="attr-node"
                    aria-expanded={open === i}
                    aria-controls="attr-did"
                    onClick={() => setOpen(i)}
                  >
                    <span className="attr-actor">{n.actor}</span>
                    {/* The article now labels the stem, so the card carries
                        only what is particular to this body – which is what
                        the eyebrow was competing with the name to say. */}
                    <span className="attr-basis">{n.basisNote}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Named and pointed at, so the branch buttons announce that they change
          this paragraph rather than leading somewhere. aria-live because the
          text under a reader's selection is replaced in place. */}
      <p className="attr-did" id="attr-did" aria-live="polite">
        {/* The body, then what it did. The sentence stands under both routes
            and a reader who pressed a card in the right-hand column was
            reading an answer at the foot of the left one, with nothing in it
            to say which card it belonged to. */}
        <b className="attr-did-who">{shown.actor}</b> – {shown.did}
      </p>
    </div>
  );
}
