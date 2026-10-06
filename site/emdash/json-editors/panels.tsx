/**
 * What the editor sees next to the form, drawn from the entry's own data:
 * a checklist of the sections a decision page will show, a strip of the
 * timeline, a link to the same page on staging – and the small bars under the
 * «figures» and «sums» fields.
 *
 * All of it reads the *saved* entry (EmDash hands a panel the saved entry, not
 * the form as it is being typed), so it follows «Зберегти». The bars under a
 * field are drawn from the field's own value and move as it is typed.
 *
 * Colours are literals, not tokens: this is the admin, where the site's
 * globals.css is not loaded. The same three as the admin tour – cherry, gold,
 * night – and everything else is `currentColor`, so it follows light and dark.
 */
import type { ReactNode } from "react";

type Json = unknown;
type Obj = Record<string, Json>;
const isObj = (v: Json): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

const GOLD = "#d9ab5e";
const CHERRY = "#c23b32";
const mix = (pct: number) => `color-mix(in srgb, currentColor ${pct}%, transparent)`;

/** A stored JSON field arrives as text from some paths and as a value from others. */
function value(v: Json): Json {
  if (typeof v !== "string") return v ?? null;
  if (!v.trim()) return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

/** A `{ uk, en }`, a plain string, or a `_uk`/`_en` pair on a row, as one Ukrainian line. */
function uk(v: Json): string {
  if (typeof v === "string") return v;
  if (isObj(v)) return String(v.uk ?? v.en ?? "");
  return "";
}

const list = (v: Json): Json[] => (Array.isArray(v) ? v : []);

/* ── The sections a decision page will show ───────────────────────────── */

type Row = { label: string; state: "on" | "empty" | "hidden"; detail?: string };

/** Which `hide_sections` value hides what – see `hideSections` in summaries/types.ts. */
const HIDES: Record<string, string[]> = {
  overview: ["overview"],
  rulings: ["rulings"],
  measures: ["measures"],
  scale: ["scale"],
  attribution: ["machinery", "attribution"],
  objections: ["machinery", "objections"],
  warrants: ["machinery", "warrants"],
  afterlife: ["machinery", "afterlife"],
  amounts: ["amounts"],
  glance: ["glance"],
};

function sectionRows(data: Obj): Row[] {
  const hidden = new Set(list(value(data.hide_sections)).map(String));
  const count = (k: string) => list(value(data[k])).length;
  const has = (k: string) => {
    const v = value(data[k]);
    return isObj(v) ? Object.keys(v).length > 0 : Array.isArray(v) ? v.length > 0 : false;
  };
  const row = (label: string, key: string, present: boolean, detail?: string): Row => {
    const off = (HIDES[key] ?? []).some((h) => hidden.has(h));
    return { label, state: off ? "hidden" : present ? "on" : "empty", detail };
  };
  return [
    row("Картка справи", "glance", count("glance") > 0, `${count("glance")} рядків`),
    { label: "Хронологія", state: count("timeline") > 0 ? "on" : "empty", detail: `${count("timeline")} подій` },
    { label: "Мапа: театри подій", state: count("theatres") > 0 ? "on" : "empty", detail: `${count("theatres")}` },
    row("Ключові правові висновки", "rulings", count("interpretations") > 0, `${count("interpretations")}`),
    row("Тимчасові заходи", "measures", count("provisional_measures") > 0, `${count("provisional_measures")}`),
    row("Цифри (втрати, «поза Судом»)", "scale", has("takings")),
    row("Ланцюг відповідальності", "attribution", has("attribution")),
    row("Заперечення", "objections", has("objections")),
    row("Ордери", "warrants", has("warrants")),
    row("Суми", "amounts", has("amounts")),
    row("Що було далі", "afterlife", has("afterlife")),
    { label: "Джерела", state: count("sources") > 0 ? "on" : "empty", detail: `${count("sources")}` },
  ];
}

const MARK: Record<Row["state"], { sign: string; text: string; opacity: number }> = {
  on: { sign: "●", text: "показується", opacity: 1 },
  empty: { sign: "○", text: "порожньо – розділу не буде", opacity: 0.55 },
  hidden: { sign: "⊘", text: "приховано галочкою", opacity: 0.55 },
};

/** The years a timeline row's date names, for placing it on the strip. */
function yearOf(row: Obj): number | null {
  const text = [row.iso, row.date_uk, row.date_en, uk(row.date)].map((x) => String(x ?? "")).join(" ");
  const m = /\b(19|20)\d{2}\b/.exec(text);
  return m ? Number(m[0]) : null;
}

function TimelineStrip({ rows }: { rows: Obj[] }) {
  const years = rows.map(yearOf).filter((y): y is number => y !== null);
  if (years.length < 2) return null;
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  const span = Math.max(1, hi - lo);
  const dots = rows
    .map((r) => ({ y: yearOf(r), title: `${uk(r.date) || r.date_uk || ""} – ${String(r.label_uk ?? uk(r.label) ?? "").slice(0, 70)}` }))
    .filter((d): d is { y: number; title: string } => d.y !== null);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>Хронологія ({rows.length} подій)</div>
      <div style={{ position: "relative", height: 18, margin: "0 6px" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 8, height: 2, background: mix(25) }} />
        {dots.map((d, i) => (
          <span
            key={i}
            title={d.title}
            style={{
              position: "absolute",
              left: `${((d.y - lo) / span) * 100}%`,
              top: 4,
              width: 10,
              height: 10,
              marginLeft: -5,
              borderRadius: 999,
              background: GOLD,
              opacity: 0.85,
              border: "1px solid rgba(0,0,0,.35)",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}

export function SummaryOverview({ entry }: { collection: string; entry: { data?: Obj } }) {
  const data = entry.data ?? {};
  const rows = sectionRows(data);
  const shown = rows.filter((r) => r.state === "on").length;
  return (
    <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
      <div style={{ opacity: 0.7, marginBottom: 4 }}>
        На сторінці буде розділів: <b>{shown}</b> з {rows.length}. Оновлюється після «Зберегти».
      </div>
      {rows.map((r) => (
        <div key={r.label} title={MARK[r.state].text} style={{ display: "flex", gap: 8, opacity: MARK[r.state].opacity }}>
          <span style={{ width: 14, color: r.state === "on" ? GOLD : undefined }}>{MARK[r.state].sign}</span>
          <span style={{ flex: 1 }}>{r.label}</span>
          <span style={{ opacity: 0.7, fontSize: 12 }}>{r.state === "on" ? r.detail : MARK[r.state].text.split(" ")[0]}</span>
        </div>
      ))}
      <TimelineStrip rows={list(value(data.timeline)).filter(isObj)} />
    </div>
  );
}

/* ── The same page on staging ─────────────────────────────────────────── */

const STAGING = "https://nasvitlo-staging.vm-55d.workers.dev";

/** Where a collection's entry shows up on the site, per language. */
function pathFor(collection: string, slug: string | undefined, lang: "uk" | "en"): string {
  switch (collection) {
    case "summaries":
      return `/${lang}/cases/${slug}`;
    case "posts":
      return `/${lang}/blog/${slug}`;
    case "legal_documents":
      return `/${lang}/${slug}`;
    case "team":
      return `/${lang}/team`;
    case "about":
      return `/${lang}/about`;
    case "cases":
    case "institutions":
      return `/${lang}/registry`;
    case "map_events":
    case "map_courts":
    case "map_countries":
    case "map_places":
      return `/${lang}/map`;
    default:
      return `/${lang}`;
  }
}

export function StagingPanel({ collection, entry }: { collection: string; entry: { slug?: string | null; status?: string } }) {
  const slug = entry.slug ?? undefined;
  const link = (lang: "uk" | "en"): ReactNode => (
    <a
      href={`${STAGING}${pathFor(collection, slug, lang)}`}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-block",
        padding: "6px 12px",
        borderRadius: 8,
        border: `1px solid ${mix(30)}`,
        color: "inherit",
        textDecoration: "none",
        fontSize: 13,
      }}
    >
      {lang === "uk" ? "Відкрити UA" : "Відкрити EN"}
    </a>
  );
  return (
    <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
      <div style={{ opacity: 0.75 }}>
        Чернетки видно на закритій копії сайту (staging). Вона перезбирається не миттєво – до кількох хвилин, – тож після
        «Зберегти» трохи зачекайте, відкрийте сторінку, і лише тоді публікуйте. Вхід – за листом Cloudflare на дозволену
        адресу. Якщо правки довго не з’являються, скажіть адміністраторці.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {link("uk")}
        {link("en")}
      </div>
    </div>
  );
}

/* ── Bars under the «figures» and «sums» fields ───────────────────────── */

function Bar({ share, color, rest }: { share: number; color: string; rest?: string }) {
  const p = Math.max(0, Math.min(100, share));
  return (
    <div>
      <div style={{ height: 10, borderRadius: 999, background: mix(18), overflow: "hidden" }}>
        <div style={{ width: `${p}%`, height: "100%", background: color }} />
      </div>
      {rest ? <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{rest}</div> : null}
    </div>
  );
}

function TakingsPreview({ v }: { v: Obj }) {
  const metrics = list(v.metrics).filter(isObj);
  if (!metrics.length) return null;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {metrics.map((m, i) => {
        const pct = typeof m.percent === "number" ? m.percent : null;
        return (
          <div key={i} style={{ display: "grid", gap: 3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
              <span style={{ opacity: 0.8 }}>{uk(m.label) || "—"}</span>
              <b style={{ fontVariantNumeric: "tabular-nums" }}>{uk(m.value)}</b>
            </div>
            {pct !== null ? (
              <Bar share={pct} color={GOLD} rest={`${pct}% – решта ${Math.max(0, 100 - pct).toFixed(1).replace(/\.0$/, "")}%${m.restLabel ? `: ${uk(m.restLabel)}` : ""}`} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function AmountsPreview({ v }: { v: Obj }) {
  const figs = list(v.figures).filter(isObj);
  if (!figs.length) return null;
  /* Sums in different currencies are not comparable, so each currency is its own scale. */
  const max: Record<string, number> = {};
  for (const f of figs) {
    const cur = String(f.currency ?? "USD");
    max[cur] = Math.max(max[cur] ?? 0, Number(f.amount) || 0);
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {figs.map((f, i) => {
        const cur = String(f.currency ?? "USD");
        const amount = Number(f.amount) || 0;
        return (
          <div key={i} style={{ display: "grid", gap: 3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
              <span style={{ opacity: 0.8 }}>
                {uk(f.label) || "—"}
                {f.estimated ? " (оцінка)" : ""}
              </span>
              <b style={{ fontVariantNumeric: "tabular-nums" }}>{uk(f.display)}</b>
            </div>
            <Bar share={max[cur] ? (amount / max[cur]) * 100 : 0} color={f.after ? CHERRY : GOLD} rest={f.after ? `після рішення · ${cur}` : cur} />
          </div>
        );
      })}
    </div>
  );
}

/** A picture of the field's value, if it has one. `name` is the widget's name. */
export function FieldPreview({ name, value: raw }: { name: string; value: Json }) {
  const v = value(raw);
  if (!isObj(v)) return null;
  const body = name === "takings" ? <TakingsPreview v={v} /> : name === "amounts" ? <AmountsPreview v={v} /> : null;
  if (!body) return null;
  return (
    <div style={{ marginTop: 4, padding: 12, borderRadius: 10, border: `1px dashed ${mix(28)}` }}>
      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>Як це виглядатиме (схематично)</div>
      {body}
    </div>
  );
}

/* ── The «Проблеми» column of the entry lists ─────────────────────────── */

const filled = (v: Json) => (typeof v === "string" ? v.trim() !== "" : v !== null && v !== undefined);

/**
 * What is missing or half-done in an entry, in an editor's words. Reads the
 * row as the list has it: `title_uk` next to `title_en`, JSON fields as text
 * or as values. It only looks – nothing here blocks a save.
 */
export function problemsOf(collection: string, data: Obj): string[] {
  const out: string[] = [];
  /* A pair with one side written and the other empty: a translation forgotten. */
  for (const key of Object.keys(data)) {
    if (!key.endsWith("_uk")) continue;
    const base = key.slice(0, -3);
    if (!(`${base}_en` in data)) continue;
    if (base.startsWith("base") || base === "text") continue;
    const a = filled(data[`${base}_uk`]);
    const b = filled(data[`${base}_en`]);
    if (a && !b) out.push(`немає англійського тексту в полі «${base}»`);
    if (b && !a) out.push(`немає українського тексту в полі «${base}»`);
  }
  if (collection === "summaries") {
    const timeline = list(value(data.timeline)).filter(isObj);
    if (timeline.length === 0) out.push("порожня хронологія");
    const noEn = timeline.filter((r) => filled(r.label_uk ?? uk(r.label)) && !filled(r.label_en ?? (isObj(r.label) ? r.label.en : ""))).length;
    if (noEn > 0) out.push(`у хронології ${noEn} подій без англійського тексту`);
    const paras = list(value(data.text_blocks)).filter(isObj);
    if (paras.length === 0) out.push("немає тексту огляду");
    const half = (lang: "uk" | "en") => paras.filter((r) => isObj(r.text) && !filled(r.text[lang])).length;
    if (half("en") > 0) out.push(`у тексті огляду ${half("en")} абзаців без англійського`);
    if (half("uk") > 0) out.push(`у тексті огляду ${half("uk")} абзаців без українського`);
    if (list(value(data.sources)).length === 0) out.push("немає джерел");
  }
  return out;
}

export function ProblemsCell({ collection, item }: { collection: string; item: { data?: Obj } }) {
  const found = problemsOf(collection, item.data ?? {});
  if (found.length === 0) return <span style={{ opacity: 0.4 }}>✓</span>;
  return (
    <span title={found.join("\n")} style={{ color: CHERRY, fontSize: 13, cursor: "help", whiteSpace: "nowrap" }}>
      ⚠ {found.length}
    </span>
  );
}

