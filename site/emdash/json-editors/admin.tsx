/**
 * Form editors for the summaries' JSON fields, in place of the raw JSON box.
 *
 * EmDash draws a field through a plugin's component when the field's
 * `widget` is "<plugin id>:<name>" and the plugin's admin module exports
 * `fields[name]` (see ./index.ts and collections.ts, `widget`). One generic
 * editor draws any of the eight from its description in ./shapes.ts:
 * pairs UA / EN side by side, lists as numbered cards with «↑ ↓ ✕» and
 * «+ Додати», selects for fixed choices. «JSON» at the top still opens the
 * raw text for anyone who needs it.
 *
 * What it hands back is `clean()`ed: optional parts left empty are dropped,
 * so opening an entry and saving it without edits stores exactly what was
 * there (checked against all eight summaries).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from "react";
import { SHAPES, blank, clean, isEmpty, type Shape } from "./shapes";

type Json = unknown;
type Obj = Record<string, Json>;
const isObj = (v: Json): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

interface WidgetProps {
  value: Json;
  onChange: (v: Json) => void;
  label: string;
  id: string;
  required?: boolean;
}

/* ── Styles: neutral, inheriting the admin's colours in light and dark ── */

const CSS = `
.nsvj{display:grid;gap:10px;font-size:14px}
.nsvj-head{display:flex;align-items:center;gap:8px;justify-content:space-between}
.nsvj-title{font-weight:500;font-size:16px}
.nsvj-btn{font:inherit;font-size:13px;line-height:1.2;padding:5px 10px;border-radius:8px;cursor:pointer;background:transparent;color:inherit;border:1px solid color-mix(in srgb,currentColor 28%,transparent)}
.nsvj-btn:hover{background:color-mix(in srgb,currentColor 8%,transparent)}
.nsvj-btn[disabled]{opacity:.35;cursor:default}
.nsvj-add{border-style:dashed;justify-self:start}
.nsvj-danger:hover{color:#c23b32;border-color:#c23b32}
.nsvj-box{display:grid;gap:10px;padding:12px;border-radius:10px;border:1px solid color-mix(in srgb,currentColor 16%,transparent)}
.nsvj-lbl{display:block;font-size:13px;font-weight:500;margin-bottom:4px}
.nsvj-hint{font-size:12px;opacity:.65;margin-top:3px}
.nsvj-pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media (max-width:720px){.nsvj-pair{grid-template-columns:1fr}}
.nsvj-lang{font-size:11px;font-weight:600;letter-spacing:.06em;opacity:.6;margin-bottom:2px}
.nsvj input[type=text],.nsvj input[type=number],.nsvj textarea,.nsvj select{width:100%;box-sizing:border-box;font:inherit;padding:7px 9px;border-radius:8px;color:inherit;background:color-mix(in srgb,currentColor 4%,transparent);border:1px solid color-mix(in srgb,currentColor 22%,transparent)}
.nsvj textarea{min-height:64px;resize:vertical;line-height:1.45}
.nsvj input:focus,.nsvj textarea:focus,.nsvj select:focus{outline:2px solid color-mix(in srgb,#d9ab5e 70%,transparent);outline-offset:1px}
.nsvj-item{border-radius:10px;border:1px solid color-mix(in srgb,currentColor 16%,transparent)}
.nsvj-item>summary{display:flex;align-items:center;gap:8px;padding:8px 10px;cursor:pointer;list-style:none}
.nsvj-item>summary::-webkit-details-marker{display:none}
.nsvj-item>summary .nsvj-n{opacity:.55;font-variant-numeric:tabular-nums;min-width:1.6em}
.nsvj-item>summary .nsvj-sum{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nsvj-item[open]>summary{border-bottom:1px solid color-mix(in srgb,currentColor 12%,transparent)}
.nsvj-item>.nsvj-body{padding:12px}
.nsvj-check{display:flex;gap:8px;align-items:center}
.nsvj-raw{font-family:ui-monospace,monospace;font-size:13px;min-height:220px}
.nsvj-err{color:#c23b32;font-size:12px}`;

function useStyles() {
  useEffect(() => {
    if (document.getElementById("nsvj-css")) return;
    const s = document.createElement("style");
    s.id = "nsvj-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);
}

/* ── Pieces ─────────────────────────────────────────────────────────── */

/** A textarea as tall as its text, so a paragraph reads without scrolling. */
function Grow(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const t = ref.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${t.scrollHeight + 2}px`;
  }, [props.value]);
  return <textarea ref={ref} {...props} />;
}

function Label({ text, hint, children }: { text: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span className="nsvj-lbl">{text}</span>
      {children}
      {hint ? <div className="nsvj-hint">{hint}</div> : null}
    </label>
  );
}

function TextInput({ value, onChange, multiline }: { value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return multiline ? (
    <Grow value={value} onChange={(e) => onChange(e.target.value)} dir="auto" />
  ) : (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} dir="auto" />
  );
}

function Pair({
  uk,
  en,
  onChange,
  multiline,
  enPlaceholder,
}: {
  uk: string;
  en: string;
  onChange: (uk: string, en: string) => void;
  multiline?: boolean;
  enPlaceholder?: string;
}) {
  const field = (value: string, set: (v: string) => void, lang: string, placeholder?: string) =>
    multiline ? (
      <Grow value={value} placeholder={placeholder} onChange={(e) => set(e.target.value)} lang={lang} />
    ) : (
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => set(e.target.value)} lang={lang} />
    );
  return (
    <div className="nsvj-pair">
      <div>
        <div className="nsvj-lang">UA</div>
        {field(uk, (v) => onChange(v, en), "uk")}
      </div>
      <div>
        <div className="nsvj-lang">EN</div>
        {field(en, (v) => onChange(uk, v), "en", enPlaceholder)}
      </div>
    </div>
  );
}

/**
 * One string per line. The text is kept as typed – a blank line while the
 * editor is still typing the next one – and the list handed back skips blanks.
 */
function LinesInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const joined = value.join("\n");
  const [text, setText] = useState(joined);
  /* A new value from outside (a row moved, the raw JSON edited) replaces the
     text; our own keystrokes, which give the same list, do not. */
  const [seen, setSeen] = useState(joined);
  if (joined !== seen) {
    setSeen(joined);
    if (text.split("\n").map((s) => s.trim()).filter(Boolean).join("\n") !== joined) setText(joined);
  }
  return (
    <Grow
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean));
      }}
    />
  );
}

/** A short line for a collapsed list row. */
function summaryOf(shape: Shape, v: Json, keys: string[] = [], format?: (v: never) => string): string {
  if (format) return format(v as never);
  if (typeof v === "string") return v;
  if (!isObj(v)) return "";
  if (shape.kind === "loc" || shape.kind === "either") return String(v.uk ?? v.en ?? "");
  const parts: string[] = [];
  for (const k of keys) {
    const x = v[k];
    const s = typeof x === "string" ? x : isObj(x) ? String(x.uk ?? x.en ?? "") : typeof x === "number" ? String(x) : "";
    if (s.trim()) parts.push(s.trim());
  }
  return parts.join(" · ");
}

/* ── The editor, one shape at a time ─────────────────────────────────── */

function Editor({ shape, value, onChange }: { shape: Shape; value: Json; onChange: (v: Json) => void }): ReactNode {
  switch (shape.kind) {
    case "text":
      return (
        <Label text={shape.label} hint={shape.hint}>
          <TextInput value={typeof value === "string" ? value : ""} onChange={onChange} multiline={shape.multiline} />
        </Label>
      );
    case "loc": {
      const v = isObj(value) ? value : {};
      return (
        <Label text={shape.label} hint={shape.hint}>
          <Pair
            uk={String(v.uk ?? "")}
            en={String(v.en ?? "")}
            multiline={shape.multiline}
            onChange={(uk, en) => onChange({ ...v, uk, en })}
          />
        </Label>
      );
    }
    case "either": {
      const uk = typeof value === "string" ? value : isObj(value) ? String(value.uk ?? "") : "";
      const en = isObj(value) ? String(value.en ?? "") : "";
      return (
        <Label text={shape.label} hint={shape.hint ?? "Якщо EN порожнє – на англійській сторінці те саме, що UA."}>
          <Pair
            uk={uk}
            en={en}
            enPlaceholder="те саме, що UA"
            onChange={(u, e) => onChange(e.trim() ? { uk: u, en: e } : u)}
          />
        </Label>
      );
    }
    case "number":
      return (
        <Label text={shape.label} hint={shape.hint}>
          <input
            type="number"
            value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </Label>
      );
    case "bool":
      return (
        <label className="nsvj-check">
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          <span>{shape.label}</span>
        </label>
      );
    case "select":
      return (
        <Label text={shape.label}>
          <select value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || undefined)}>
            {shape.optional ? <option value="">–</option> : null}
            {shape.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Label>
      );
    case "lines":
      return (
        <Label text={shape.label} hint={shape.hint}>
          <LinesInput value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />
        </Label>
      );
    case "object":
      return <ObjectEditor shape={shape} value={value} onChange={onChange} />;
    case "list":
      return <ListEditor shape={shape} value={value} onChange={onChange} />;
  }
}

function ObjectEditor({
  shape,
  value,
  onChange,
}: {
  shape: Extract<Shape, { kind: "object" }>;
  value: Json;
  onChange: (v: Json) => void;
}) {
  const v = isObj(value) ? value : {};
  const body = (
    <>
      {Object.entries(shape.fields).map(([k, s]) => {
        /* An optional group left empty is one button, not a column of empty
           boxes: «Інша оцінка» on a metric that has none. */
        if (s.kind === "object" && s.optional && isEmpty(s, v[k])) {
          return (
            <button key={k} type="button" className="nsvj-btn nsvj-add" onClick={() => onChange({ ...v, [k]: blank(s) })}>
              + {s.label ?? k}
            </button>
          );
        }
        return (
          <div key={k}>
            {s.kind === "object" && s.label ? (
              <div className="nsvj-head">
                <span className="nsvj-lbl">{s.label}</span>
                {s.optional ? (
                  <button
                    type="button"
                    className="nsvj-btn nsvj-danger"
                    onClick={() => {
                      const next = { ...v };
                      delete next[k];
                      onChange(next);
                    }}
                  >
                    Прибрати
                  </button>
                ) : null}
              </div>
            ) : null}
            <Editor shape={s} value={v[k]} onChange={(x) => onChange({ ...v, [k]: x })} />
          </div>
        );
      })}
    </>
  );
  return shape.label ? <div className="nsvj-box">{body}</div> : <div style={{ display: "grid", gap: 12 }}>{body}</div>;
}

function ListEditor({
  shape,
  value,
  onChange,
}: {
  shape: Extract<Shape, { kind: "list" }>;
  value: Json;
  onChange: (v: Json) => void;
}) {
  const list = Array.isArray(value) ? value : [];
  /* Which rows are open survives a re-render: new rows open, the rest keep
     whatever the editor did with them. */
  const [open, setOpen] = useState<Set<number>>(new Set());
  const move = (i: number, d: number) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
    setOpen(new Set());
  };
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <span className="nsvj-lbl">
        {shape.label} <span style={{ opacity: 0.55, fontWeight: 400 }}>({list.length})</span>
      </span>
      {list.map((item, i) => (
        <details
          key={i}
          className="nsvj-item"
          open={open.has(i)}
          onToggle={(e) => {
            const isOpen = (e.currentTarget as HTMLDetailsElement).open;
            setOpen((prev) => {
              const next = new Set(prev);
              if (isOpen) next.add(i);
              else next.delete(i);
              return next;
            });
          }}
        >
          <summary>
            <span className="nsvj-n">{i + 1}.</span>
            <span className="nsvj-sum">{summaryOf(shape.item, item, shape.title, shape.format) || "(порожньо)"}</span>
            <button type="button" className="nsvj-btn" disabled={i === 0} aria-label="Вище" onClick={(e) => (e.preventDefault(), move(i, -1))}>
              ↑
            </button>
            <button
              type="button"
              className="nsvj-btn"
              disabled={i === list.length - 1}
              aria-label="Нижче"
              onClick={(e) => (e.preventDefault(), move(i, 1))}
            >
              ↓
            </button>
            <button
              type="button"
              className="nsvj-btn nsvj-danger"
              aria-label="Видалити"
              onClick={(e) => {
                e.preventDefault();
                if (!window.confirm(`Видалити ${i + 1}-й рядок «${summaryOf(shape.item, item, shape.title, shape.format) || "порожній"}»?`)) return;
                onChange(list.filter((_, j) => j !== i));
                setOpen(new Set());
              }}
            >
              ✕
            </button>
          </summary>
          {open.has(i) ? (
            <div className="nsvj-body">
              <Editor shape={shape.item} value={item} onChange={(x) => onChange(list.map((y, j) => (j === i ? x : y)))} />
            </div>
          ) : null}
        </details>
      ))}
      <button
        type="button"
        className="nsvj-btn nsvj-add"
        onClick={() => {
          onChange([...list, blank(shape.item)]);
          setOpen(new Set([list.length]));
        }}
      >
        + Додати {shape.noun ?? "рядок"}
      </button>
    </div>
  );
}

/* ── The widget EmDash mounts ─────────────────────────────────────────── */

function parse(value: Json): Json {
  if (typeof value !== "string") return value ?? null;
  if (!value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function JsonForm({ name, value, onChange, label, id }: WidgetProps & { name: string }) {
  useStyles();
  const shape = SHAPES[name];
  const parsed = useMemo(() => parse(value), [value]);
  const [raw, setRaw] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const emit = (v: Json) => onChange(v == null ? null : clean(shape, v));
  const unreadable = typeof parsed === "string";
  const rawRef = useRef<HTMLTextAreaElement>(null);

  const openRaw = () => {
    setText(parsed == null ? "" : typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2));
    setError(null);
    setRaw(true);
  };

  return (
    <div className="nsvj" id={id}>
      <div className="nsvj-head">
        <span className="nsvj-title">{label}</span>
        {raw ? (
          <button
            type="button"
            className="nsvj-btn"
            onClick={() => {
              try {
                const v = text.trim() ? JSON.parse(text) : null;
                emit(v);
                setRaw(false);
              } catch (e) {
                setError(`Це не коректний JSON: ${e instanceof Error ? e.message : e}`);
              }
            }}
          >
            До форми
          </button>
        ) : (
          <button type="button" className="nsvj-btn" onClick={openRaw} title="Для досвідчених: сирий JSON">
            JSON
          </button>
        )}
      </div>
      {raw || unreadable ? (
        <>
          <textarea
            ref={rawRef}
            className="nsvj-raw"
            value={raw ? text : String(parsed)}
            onChange={(e) => {
              setText(e.target.value);
              setRaw(true);
            }}
          />
          {unreadable && !raw ? <div className="nsvj-err">Збережене значення не читається як JSON – виправте його тут.</div> : null}
          {error ? <div className="nsvj-err">{error}</div> : null}
        </>
      ) : parsed == null ? (
        <button type="button" className="nsvj-btn nsvj-add" onClick={() => emit(blank(shape))}>
          + Заповнити «{label.replace(/^\d+ · [^–]+– /, "").replace(/ \(JSON\)$/, "")}»
        </button>
      ) : (
        <div className="nsvj-box">
          <Editor shape={shape} value={parsed} onChange={emit} />
          <button
            type="button"
            className="nsvj-btn nsvj-danger"
            style={{ justifySelf: "start" }}
            onClick={() => window.confirm("Очистити все поле? Розділ зникне зі сторінки.") && onChange(null)}
          >
            Очистити поле
          </button>
        </div>
      )}
    </div>
  );
}

function widget(name: string) {
  const Widget = (props: WidgetProps) => <JsonForm name={name} {...props} />;
  Widget.displayName = `JsonForm(${name})`;
  return Widget;
}

export const fields = Object.fromEntries(Object.keys(SHAPES).map((name) => [name, widget(name)]));
