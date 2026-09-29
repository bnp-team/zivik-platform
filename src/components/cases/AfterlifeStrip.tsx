import { pick } from "@/content/types";
import type { Locale } from "@/i18n/config";
import type { Stage } from "@/content/summaries/types";

/**
 * What happened to the decision after it was rendered.
 *
 * An award is not the end of the story where the seat's courts can annul it.
 * Each step carries a standing flag – did the decision survive this round –
 * so the reader can see the award fall in 2021 and come back in 2022 without
 * having to hold four dates in their head.
 */
export default function AfterlifeStrip({
  stages,
  locale,
  labels,
}: {
  stages: Stage[];
  locale: Locale;
  labels: { standing: string; notStanding: string };
}) {
  return (
    <ol className="afterlife">
      {stages.map((s, i) => (
        <li key={i} data-standing={s.standing}>
          {/* The year is the seam to the chronology, where the page carries
              the same step as a dated event. */}
          {s.iso ? (
            <a className="af-year af-year-link" href={`#ev-${s.iso}`}>
              {s.year}
            </a>
          ) : (
            <span className="af-year">{s.year}</span>
          )}
          <span className="af-title">{pick(s.title, locale)}</span>
          <p className="af-note">{pick(s.note, locale)}</p>
          <span className="af-flag">
            {s.standing === "yes" ? labels.standing : labels.notStanding}
          </span>
        </li>
      ))}
    </ol>
  );
}
