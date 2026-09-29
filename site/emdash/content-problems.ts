/**
 * The check behind validate-content.ts, kept free of the EmDash runtime so a
 * plain script can run it against every record in src/content.
 */
import { COLLECTIONS, fromRow, slugOf, type Prop } from "../content/collections";

/**
 * The kind each JSON field has held since the seed – read off the content
 * files, not guessed: `collection.path` → list or object. A field not listed
 * (one that is empty everywhere today) gets the syntax check only.
 */
const KIND: Record<string, "list" | "object"> = {
  "about.links": "object",
  "map_events.courts": "list",
  "map_events.cases": "list",
  "map_courts.institutionIds": "list",
  "map_courts.seats": "list",
  "map_countries.courts": "list",
  "summaries.theatres": "list",
  "summaries.takings": "object",
  "summaries.objections": "object",
  "summaries.mapFocus": "object",
  "summaries.amounts": "object",
  "summaries.attribution": "object",
  "summaries.afterlife": "object",
  "summaries.warrants": "object",
};

export function problems(collection: string, content: Record<string, unknown>): string[] {
  const spec = COLLECTIONS.find((c) => c.slug === collection);
  if (!spec) return [];
  const out: string[] = [];
  const jsonProps = spec.props.filter((p: Prop) => p.type === "json");
  for (const p of jsonProps) {
    const slug = slugOf(p);
    const raw = content[slug];
    if (raw === undefined || raw === null || raw === "") continue;
    let value: unknown = raw;
    if (typeof raw === "string") {
      try {
        value = JSON.parse(raw);
      } catch (error) {
        const why = error instanceof Error ? error.message : String(error);
        out.push(`«${p.label}»: це не коректний JSON (${why})`);
        continue;
      }
    }
    const kind = KIND[`${collection}.${p.path}`];
    if (kind === "list" && !Array.isArray(value)) {
      out.push(`«${p.label}»: тут має бути список – [ … ]`);
    } else if (kind === "object" && (typeof value !== "object" || value === null || Array.isArray(value))) {
      out.push(`«${p.label}»: тут має бути об'єкт – { … }`);
    }
  }
  if (collection === "posts") out.push(...postProblems(content));
  if (out.length) return out;
  /* Everything else the build reads – repeaters, numbers, selects – through
     the build's own decoder, so the two cannot disagree. */
  try {
    fromRow(spec, content);
  } catch (error) {
    out.push(error instanceof Error ? error.message : String(error));
  }
  return out;
}


/**
 * A blog post's address and date, in the same formats the build checks
 * (src/content/blog.ts). Caught here, before saving: at build time the same
 * mistake fails the whole build and the post never reaches the site.
 * Written out rather than imported so the Worker does not pull the blog
 * content module into the admin bundle.
 */
function postProblems(content: Record<string, unknown>): string[] {
  const out: string[] = [];
  const slug = content.key;
  if (typeof slug === "string" && slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    out.push("«Адреса»: лише малі латинські літери, цифри й дефіс – напр. «icj-hearing-2026»");
  }
  const date = content.date;
  if (typeof date === "string" && date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)))) {
    out.push("«Дата»: у форматі РРРР-ММ-ДД – напр. 2026-09-26");
  }
  return out;
}
