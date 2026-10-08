/**
 * Сторінка «Аналітика» в адмінці (меню зліва). Дані – з маршруту плагіна
 * (./index.ts), який сам ходить до Cloudflare і PostHog; тут лише показ.
 * Написано для менеджерів: що означає кожна цифра – просто під нею.
 */
import { useEffect, useRef, useState } from "react";

type Row = { label: string; value: number; views?: number };
type Section<T> = { ok: true; data: T } | { ok: false; reason: string };
type Totals = { views: number; visits: number };
type Summary = {
  days: number;
  generatedAt: string;
  titles: Record<string, string>;
  cloudflare: Section<{
    current: Totals;
    previous: Totals;
    pages: Row[];
    referers: Row[];
    countries: Row[];
    devices: Row[];
    days: Row[];
  }>;
  posthog: Section<{ clicks: Row[]; scroll: Row[]; heatmapsUrl: string; site: string }>;
};

const CSS = `
.nsva{display:grid;gap:20px;max-width:1100px;font-size:14px}
.nsva h1{font-size:22px;font-weight:600;margin:0}
.nsva h2{font-size:16px;font-weight:600;margin:0 0 4px}
.nsva-sub{opacity:.7;font-size:13px;margin:0}
.nsva-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.nsva-btn{font:inherit;font-size:13px;padding:5px 12px;border-radius:8px;cursor:pointer;background:transparent;color:inherit;border:1px solid color-mix(in srgb,currentColor 28%,transparent)}
.nsva-btn[aria-pressed=true]{background:color-mix(in srgb,currentColor 12%,transparent);font-weight:600}
.nsva-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
.nsva-card{border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:12px;padding:16px;display:grid;gap:10px;align-content:start}
.nsva-kpis{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.nsva-kpi b{display:block;font-size:30px;font-weight:600;line-height:1.1}
.nsva-delta{font-size:13px}
.nsva-up{color:#2f7d46}.nsva-down{color:#b3412e}
.nsva-note{opacity:.7;font-size:12.5px;margin:0}
.nsva-rows{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.nsva-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;position:relative;padding:3px 6px;border-radius:6px;overflow:hidden}
.nsva-row i{position:absolute;inset:0 auto 0 0;background:color-mix(in srgb,currentColor 9%,transparent);z-index:0}
.nsva-row span,.nsva-row em{position:relative;z-index:1;font-style:normal}
.nsva-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nsva-row em{font-variant-numeric:tabular-nums;opacity:.85}
.nsva-chart{display:flex;align-items:flex-end;gap:2px;height:90px}
.nsva-chart div{flex:1;min-width:2px;background:color-mix(in srgb,currentColor 35%,transparent);border-radius:2px 2px 0 0}
.nsva-off{opacity:.75;font-size:13px}
.nsva a{color:inherit}
.nsva select{font:inherit;font-size:13px;padding:5px 8px;border-radius:8px;background:transparent;color:inherit;border:1px solid color-mix(in srgb,currentColor 28%,transparent);max-width:100%}
.nsva-hm{position:relative;overflow:auto;max-height:75vh;border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:10px;background:#fff}
.nsva-hm-inner{position:relative;transform-origin:0 0}
.nsva-hm iframe{border:0;display:block;pointer-events:none}
.nsva-hm canvas{position:absolute;inset:0;pointer-events:none}
.nsva-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;opacity:.8}
`;

const fmt = (n: number) => new Intl.NumberFormat("uk-UA").format(Math.round(n));
const DEVICE: Record<string, string> = { desktop: "Комп'ютер", mobile: "Телефон", tablet: "Планшет" };
const REGION = (() => {
  try {
    return new Intl.DisplayNames(["uk"], { type: "region" });
  } catch {
    return null;
  }
})();
const country = (code: string) => {
  try {
    return (/^[A-Z]{2}$/.test(code) && REGION?.of(code)) || code;
  } catch {
    return code;
  }
};

function Rows({ rows, names, unit = "" }: { rows: Row[]; names?: Record<string, string>; unit?: string }) {
  if (!rows.length) return <p className="nsva-note">Поки немає даних.</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="nsva-rows">
      {rows.map((r) => (
        <li className="nsva-row" key={r.label} title={r.label}>
          <i style={{ width: `${(r.value / max) * 100}%` }} />
          <span>{names?.[r.label.replace(/\/$/, "")] ?? names?.[r.label] ?? r.label}</span>
          <em>
            {fmt(r.value)}
            {unit}
          </em>
        </li>
      ))}
    </ul>
  );
}

function Delta({ now, before }: { now: number; before: number }) {
  if (!before) return <span className="nsva-delta nsva-note">немає даних за попередній період</span>;
  const pct = ((now - before) / before) * 100;
  const up = pct >= 0;
  return (
    <span className={`nsva-delta ${up ? "nsva-up" : "nsva-down"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}% проти попереднього періоду ({fmt(before)})
    </span>
  );
}

type Heat = Section<{
  url: string;
  clicks: number;
  width: number;
  points: [number, number, number][];
  scroll: [number, number][];
}>;

/** Частка переглядів, що дійшли до глибини y (пікселі сторінки). */
const reached = (scroll: [number, number][], y: number) =>
  scroll.length ? scroll.filter(([seen]) => seen >= y).length / scroll.length : 0;

function HeatmapPanel({ pages, names, days }: { pages: string[]; names: Record<string, string>; days: number }) {
  const [path, setPath] = useState(pages[0] ?? "/uk");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [heat, setHeat] = useState<Heat | null>(null);
  const [height, setHeight] = useState(1200);
  const [boxWidth, setBoxWidth] = useState(900);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/_emdash/api/plugins/nsv-analytics/heatmap?path=${encodeURIComponent(path)}&device=${device}&days=${days}`, {
      method: "POST",
      headers: { "X-EmDash-Request": "1" },
      credentials: "same-origin",
    })
      .then(async (r) => {
        const body = (await r.json().catch(() => null)) as { data?: Heat; error?: { message?: string } } | null;
        if (!r.ok) throw new Error(body?.error?.message ?? `HTTP ${r.status}`);
        return (body?.data ?? body) as unknown as Heat;
      })
      .then((h) => alive && setHeat(h))
      .catch((e) => alive && setHeat({ ok: false, reason: e instanceof Error ? e.message : String(e) }));
    return () => {
      alive = false;
    };
  }, [path, device, days]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = heat?.ok ? heat.data.width : device === "desktop" ? 1440 : 390;
  const scale = Math.min(1, boxWidth / width);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !heat?.ok) return;
    c.width = width;
    c.height = height;
    const g = c.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, width, height);
    /* Прокрутка: смуги, де залишається 75%, 50% і 25% читачів. */
    const { scroll, points } = heat.data;
    if (scroll.length) {
      for (const share of [0.75, 0.5, 0.25]) {
        let y = 0;
        while (y < height && reached(scroll, y) >= share) y += 20;
        if (y >= height) continue;
        g.fillStyle = "rgba(127,23,22,.85)";
        g.fillRect(0, y, width, 2);
        g.font = "600 15px system-ui, sans-serif";
        g.fillText(`Сюди дочитують ${Math.round(share * 100)}%`, 12, y - 6);
      }
    }
    /* Кліки: червоні плями, тим насиченіші, чим частіше. */
    const max = Math.max(...points.map((p) => p[2]), 1);
    for (const [rx, py, n] of points) {
      const x = rx * width;
      const r = device === "desktop" ? 26 : 20;
      const grad = g.createRadialGradient(x, py, 0, x, py, r);
      const a = 0.35 + 0.55 * (n / max);
      grad.addColorStop(0, `rgba(220,38,38,${a})`);
      grad.addColorStop(1, "rgba(220,38,38,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, py, r, 0, Math.PI * 2);
      g.fill();
    }
  }, [heat, height, width, device]);

  const onLoad = () => {
    try {
      const doc = frame.current?.contentDocument;
      const h = doc?.documentElement.scrollHeight ?? 0;
      if (h) setHeight(Math.min(h, 20000));
    } catch {
      /* інший домен – лишаємо висоту за замовчуванням */
    }
  };

  return (
    <section className="nsva-card">
      <h2>Хітмапа сторінки</h2>
      <p className="nsva-note">
        Червоні плями – куди натискають (чим насиченіші, тим частіше). Бордові лінії – до якого місця дочитують
        75%, 50% і 25% читачів. Сторінку показано з тією шириною вікна, яку мали відвідувачі.
      </p>
      <div className="nsva-bar">
        <select value={path} onChange={(e) => setPath(e.target.value)} aria-label="Сторінка">
          {pages.map((p) => (
            <option key={p} value={p}>
              {names[p] ?? p}
            </option>
          ))}
        </select>
        {(["desktop", "mobile"] as const).map((d) => (
          <button key={d} type="button" className="nsva-btn" aria-pressed={d === device} onClick={() => setDevice(d)}>
            {d === "desktop" ? "Комп'ютер" : "Телефон"}
          </button>
        ))}
        {heat?.ok && (
          <span className="nsva-note">
            {fmt(heat.data.clicks)} кліків · {fmt(heat.data.scroll.length)} переглядів із прокруткою
          </span>
        )}
      </div>
      {heat && !heat.ok && <Off reason={heat.reason} />}
      <div className="nsva-hm" ref={box}>
        <div style={{ width: width * scale, height: height * scale, position: "relative", overflow: "hidden" }}>
        <div className="nsva-hm-inner" style={{ width, height, transform: `scale(${scale})`, position: "absolute", top: 0, left: 0 }}>
          {/* Без скриптів: сторінка лише малюється, аналітика всередині не рахує перегляд. */}
          <iframe
            ref={frame}
            key={`${path}-${width}`}
            title="Сторінка сайту"
            src={path}
            sandbox="allow-same-origin"
            width={width}
            height={height}
            onLoad={onLoad}
          />
          <canvas ref={canvas} style={{ width, height }} />
        </div>
        </div>
      </div>
      {heat?.ok && !heat.data.clicks && (
        <p className="nsva-note">На цій сторінці й цьому типі пристрою кліків за період ще немає.</p>
      )}
    </section>
  );
}

function Off({ reason }: { reason: string }) {
  return <p className="nsva-off">{reason}</p>;
}

function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/_emdash/api/plugins/nsv-analytics/summary?days=${days}`, {
      method: "POST",
      headers: { "X-EmDash-Request": "1" },
      credentials: "same-origin",
    })
      .then(async (r) => {
        const body = (await r.json().catch(() => null)) as { data?: Summary; error?: { message?: string } } | null;
        if (!r.ok) throw new Error(body?.error?.message ?? `HTTP ${r.status}`);
        return (body?.data ?? body) as unknown as Summary;
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [days]);

  useEffect(() => {
    if (document.getElementById("nsva-css")) return;
    const s = document.createElement("style");
    s.id = "nsva-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  const cf = data?.cloudflare;
  const ph = data?.posthog;
  const names = data?.titles ?? {};

  return (
    <div className="nsva">
      <div>
        <h1>Аналітика</h1>
        <p className="nsva-sub">
          Хто читає НаСвітло і як. Без cookie й без даних про окремих людей – лише загальні цифри. Оновлюється
          раз на годину.
        </p>
      </div>
      <div className="nsva-bar" role="group" aria-label="Період">
        {[7, 30, 90].map((d) => (
          <button key={d} type="button" className="nsva-btn" aria-pressed={d === days} onClick={() => {
              if (d === days) return;
              setData(null);
              setError(null);
              setDays(d);
            }}>
            {d} днів
          </button>
        ))}
        {data && <span className="nsva-note">станом на {new Date(data.generatedAt).toLocaleString("uk-UA")}</span>}
      </div>

      {error && <Off reason={`Не вдалося завантажити: ${error}`} />}
      {!data && !error && <p className="nsva-note">Завантаження…</p>}

      {cf && !cf.ok && (
        <section className="nsva-card">
          <h2>Відвідування</h2>
          <Off reason={cf.reason} />
        </section>
      )}
      {cf?.ok && (
        <>
          <section className="nsva-kpis">
            <div className="nsva-card nsva-kpi">
              <span>Відвідування</span>
              <b>{fmt(cf.data.current.visits)}</b>
              <Delta now={cf.data.current.visits} before={cf.data.previous.visits} />
              <p className="nsva-note">Скільки разів люди заходили на сайт.</p>
            </div>
            <div className="nsva-card nsva-kpi">
              <span>Перегляди сторінок</span>
              <b>{fmt(cf.data.current.views)}</b>
              <Delta now={cf.data.current.views} before={cf.data.previous.views} />
              <p className="nsva-note">
                Скільки сторінок відкрили. В середньому{" "}
                {cf.data.current.visits ? (cf.data.current.views / cf.data.current.visits).toFixed(1) : "—"} на візит.
              </p>
            </div>
          </section>
          <section className="nsva-card">
            <h2>Відвідування по днях</h2>
            <div className="nsva-chart" aria-label="Відвідування по днях">
              {(() => {
                const max = Math.max(...cf.data.days.map((d) => d.value), 1);
                return cf.data.days.map((d) => (
                  <div key={d.label} title={`${d.label}: ${fmt(d.value)}`} style={{ height: `${(d.value / max) * 100}%` }} />
                ));
              })()}
            </div>
            <p className="nsva-note">Стрибки зазвичай – після розсилки, публікації чи згадки в медіа.</p>
          </section>
          <div className="nsva-grid">
            <section className="nsva-card">
              <h2>Найпопулярніші сторінки</h2>
              <p className="nsva-note">Перегляди за період. Які справи цікавлять найбільше.</p>
              <Rows rows={cf.data.pages} names={names} />
            </section>
            <section className="nsva-card">
              <h2>Звідки приходять</h2>
              <p className="nsva-note">Сайти, з яких перейшли. «—» – прямі заходи й закладки.</p>
              <Rows rows={cf.data.referers} />
            </section>
            <section className="nsva-card">
              <h2>Країни</h2>
              <Rows rows={cf.data.countries.map((r) => ({ ...r, label: country(r.label) }))} />
            </section>
            <section className="nsva-card">
              <h2>Пристрої</h2>
              <p className="nsva-note">Якщо більшість – телефони, перевіряйте справи саме на телефоні.</p>
              <Rows rows={cf.data.devices.map((r) => ({ ...r, label: DEVICE[r.label] ?? r.label }))} />
            </section>
          </div>
        </>
      )}

      {ph && (
        <section className="nsva-card">
          <h2>Як користуються сторінками (PostHog)</h2>
          {!ph.ok && <Off reason={ph.reason} />}
          {ph.ok && (
            <div className="nsva-grid">
              <div>
                <p className="nsva-note">Де найбільше натискають – кількість кліків на сторінці.</p>
                <Rows rows={ph.data.clicks} names={names} />
              </div>
              <div>
                <p className="nsva-note">
                  Глибина прокрутки: у середньому до якого місця сторінки дочитують. Нижче 50% – важливе варто підняти
                  вище.
                </p>
                <Rows rows={ph.data.scroll} names={names} unit="%" />
              </div>
            </div>
          )}
          {ph.ok && (
            <p className="nsva-note">
              Кольорову хітмапу сторінки видно в{" "}
              <a href={ph.data.heatmapsUrl} target="_blank" rel="noreferrer">
                PostHog → Heatmaps
              </a>{" "}
              (вставте туди адресу сторінки, напр. {ph.data.site}/uk/cases/icj-genocide).
            </p>
          )}
        </section>
      )}

      {data && (
        <HeatmapPanel
          days={days}
          names={names}
          pages={[
            ...new Set(
              [
                ...(cf?.ok ? cf.data.pages.map((r) => r.label.replace(/\/$/, "")) : []),
                ...(ph?.ok ? ph.data.clicks.map((r) => r.label.replace(/\/$/, "")) : []),
                ...Object.keys(names),
              ].filter((p) => /^\/(uk|en)(\/[a-z0-9-]+)*$/.test(p)),
            ),
          ]}
        />
      )}

      <p className="nsva-note">
        Як читати ці цифри й що дивитися щомісяця – docs/ANALYTICS.md. Ми свідомо не знаємо, хто саме читає, і не
        бачимо повторних візитів однієї людини.
      </p>
    </div>
  );
}

export const pages = { "/": AnalyticsPage };
