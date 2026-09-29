/**
 * Next's `Metadata` object → the tags it would have put in <head>.
 *
 * The SEO rules live in src/lib/seo.ts and in each page's `generateMetadata`,
 * and they are written against Next's metadata API. Rather than restate them
 * for Astro, the route adapters call the same functions and hand the result
 * here. Only the fields this site sets are supported; an unexpected one is a
 * build-time type error, not a silently missing tag.
 *
 * Merge semantics follow Next: a page's metadata replaces the layout's
 * key by key (so `openGraph` is replaced wholesale, never deep-merged), and
 * `null` clears an inherited key.
 */
import type { Metadata } from "next";

export type Tag =
  | { tag: "title"; text: string }
  | { tag: "meta"; attrs: Record<string, string> }
  | { tag: "link"; attrs: Record<string, string> };

export function mergeMetadata(...layers: (Metadata | undefined)[]): Metadata {
  const out: Record<string, unknown> = {};
  /* A layout's `title.template` dresses the titles of the layers below it –
     a plain string, or `{ default }` – and never its own; `{ absolute }`
     opts out. As in Next. */
  let template: string | undefined;
  for (const layer of layers) {
    if (!layer) continue;
    for (const [k, v] of Object.entries(layer)) {
      if (v === undefined) continue;
      out[k] = k === "title" ? templated(v, template) : v;
    }
    const t = layer.title;
    if (t && typeof t === "object" && "template" in t && t.template) template = t.template;
  }
  return out as Metadata;
}

function templated(title: unknown, template: string | undefined): unknown {
  if (!template || title == null) return title;
  if (typeof title === "string") return template.replace("%s", title);
  if (typeof title === "object" && !("absolute" in title) && "default" in title) {
    return { ...title, default: template.replace("%s", String((title as { default: string }).default)) };
  }
  return title;
}

type Absolute = (u: string | URL | undefined | null) => string | undefined;

function text(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "absolute" in (v as object)) return String((v as { absolute: string }).absolute);
  if (typeof v === "object" && "default" in (v as object)) return String((v as { default: string }).default);
  return String(v);
}

function list<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

export function metadataTags(md: Metadata): Tag[] {
  const base = md.metadataBase ?? undefined;
  const abs: Absolute = (u) => {
    if (u == null) return undefined;
    return base ? new URL(u.toString(), base).toString() : u.toString();
  };
  const tags: Tag[] = [];
  const meta = (attrs: Record<string, string | undefined>) => {
    const clean = Object.fromEntries(Object.entries(attrs).filter(([, v]) => v != null)) as Record<string, string>;
    if (Object.keys(clean).length > 1) tags.push({ tag: "meta", attrs: clean });
  };
  const link = (attrs: Record<string, string | undefined>) => {
    if (!attrs.href) return;
    tags.push({ tag: "link", attrs: attrs as Record<string, string> });
  };

  const title = text(md.title);
  if (title) tags.push({ tag: "title", text: title });
  meta({ name: "description", content: md.description ?? undefined });

  if (md.robots) {
    const r = md.robots;
    const content =
      typeof r === "string"
        ? r
        : [r.index === false ? "noindex" : r.index ? "index" : null, r.follow === false ? "nofollow" : r.follow ? "follow" : null]
            .filter(Boolean)
            .join(", ");
    meta({ name: "robots", content: content || undefined });
  }

  /* Search Console – лише `google`, бо тільки його сайт і задає
     (`verificationMetadata` у src/lib/seo.ts). Рядок або масив, як у Next;
     інші пошуковики (yandex, yahoo, `other`) додати тут, коли знадобляться. */
  if (md.verification) {
    for (const code of list(md.verification.google)) {
      meta({ name: "google-site-verification", content: String(code) });
    }
  }

  if (md.alternates) {
    link({ rel: "canonical", href: abs(md.alternates.canonical as string | URL | undefined) });
    for (const [lang, href] of Object.entries(md.alternates.languages ?? {})) {
      for (const h of list(href as string | URL | (string | URL)[])) {
        link({ rel: "alternate", hreflang: lang, href: abs(typeof h === "object" && "url" in h ? (h as { url: string }).url : (h as string)) });
      }
    }
  }

  const og = md.openGraph as Record<string, unknown> | null | undefined;
  if (og) {
    meta({ property: "og:title", content: text(og.title) });
    meta({ property: "og:description", content: og.description as string | undefined });
    meta({ property: "og:url", content: abs(og.url as string | undefined) });
    meta({ property: "og:site_name", content: og.siteName as string | undefined });
    meta({ property: "og:locale", content: og.locale as string | undefined });
    for (const alt of list(og.alternateLocale as string | string[])) meta({ property: "og:locale:alternate", content: alt });
    for (const img of list(og.images as unknown)) {
      const i = typeof img === "string" || img instanceof URL ? { url: img } : (img as Record<string, unknown>);
      meta({ property: "og:image", content: abs(i.url as string) });
      meta({ property: "og:image:width", content: i.width != null ? String(i.width) : undefined });
      meta({ property: "og:image:height", content: i.height != null ? String(i.height) : undefined });
      meta({ property: "og:image:alt", content: i.alt as string | undefined });
      meta({ property: "og:image:type", content: i.type as string | undefined });
    }
    meta({ property: "og:type", content: og.type as string | undefined });
  }

  const tw = md.twitter as Record<string, unknown> | null | undefined;
  if (tw) {
    meta({ name: "twitter:card", content: tw.card as string | undefined });
    meta({ name: "twitter:title", content: text(tw.title) });
    meta({ name: "twitter:description", content: tw.description as string | undefined });
    for (const img of list(tw.images as unknown)) {
      const url = typeof img === "string" || img instanceof URL ? img : (img as { url: string }).url;
      meta({ name: "twitter:image", content: abs(url as string) });
    }
  }

  return tags;
}
