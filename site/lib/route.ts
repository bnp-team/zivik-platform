/**
 * Route adapter: runs a Next App Router page module under Astro.
 *
 * A page in src/app is an async function of `{ params }` that returns a React
 * tree, plus an optional `generateMetadata`/`metadata` and
 * `generateStaticParams`. This calls all three exactly as Next would, layers
 * the page's metadata over the locale layout's (`homeMetadata`), and turns
 * `notFound()` into the locale 404 with its own metadata and a 404 status.
 * The Astro route files stay a few lines long, and every page keeps a single
 * implementation shared by both builds.
 *
 * Every public page is prerendered. Content reaches this build as a snapshot
 * taken at build time (see site/content/), so a page cannot change between
 * builds and there is nothing to gain from rendering it per request – and a
 * good deal to lose: the invariants src/content checks when its modules load
 * would otherwise first run on a reader's request, and a bad edit published
 * from the admin would take the site down instead of failing the build.
 */
import type { AstroGlobal } from "astro";
import type { Metadata } from "next";
import { createElement, type ReactNode } from "react";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { homeMetadata } from "@/lib/seo";
import * as localeNotFound from "@/app/[locale]/not-found";
import { isNotFound, RedirectError } from "../shims/navigation";
import { renderIslands } from "../islands/runtime";
import { mergeMetadata } from "./metadata";
import Chrome from "./Chrome";

type Params = Record<string, string | undefined>;

export interface NextPageModule {
  default: (props: {
    params: Promise<Params>;
    searchParams?: Promise<Params>;
  }) => ReactNode | Promise<ReactNode>;
  generateMetadata?: (props: { params: Promise<Params> }) => Metadata | Promise<Metadata>;
  generateStaticParams?: () => Params[] | Promise<Params[]>;
  metadata?: Metadata;
}

export interface Resolved {
  locale: Locale;
  metadata: Metadata;
  /** The page with its header and footer, rendered. */
  html: string;
}

type Outcome =
  | { kind: "page"; status: 200 | 404; resolved: Resolved }
  | { kind: "redirect"; location: string; status: 307 | 308 };

/**
 * Render to a string before Astro starts the response.
 *
 * `notFound()` is not only called by page functions: CasePending calls it
 * while rendering. Under Next that unwinds to the not-found boundary; here it
 * has to be caught before any byte is sent, or the reader gets a 200 with an
 * empty body. So the whole tree is rendered to completion first, and a 404
 * raised anywhere inside it is still a 404.
 */
function renderPage(locale: Locale, dict: Dictionary, pathname: string, node: ReactNode): Promise<string> {
  return renderIslands(createElement(Chrome, { locale, dict, pathname, node }), pathname);
}

async function notFoundOutcome(locale: Locale, pathname: string): Promise<Outcome> {
  const dict = await getDictionary(locale);
  const NotFound = localeNotFound.default as () => ReactNode;
  return {
    kind: "page",
    status: 404,
    resolved: {
      locale,
      metadata: mergeMetadata(homeMetadata(locale, dict), localeNotFound.metadata),
      html: await renderPage(locale, dict, pathname, createElement(NotFound)),
    },
  };
}

async function resolvePage(
  page: NextPageModule,
  params: Params,
  pathname: string,
  search: Params = {},
): Promise<Outcome> {
  const raw = params.locale ?? "";
  if (!isLocale(raw)) return notFoundOutcome(defaultLocale, pathname);
  const locale = raw;
  const p = () => Promise.resolve({ ...params, locale });
  try {
    const dict = await getDictionary(locale);
    const pageMeta = page.generateMetadata ? await page.generateMetadata({ params: p() }) : page.metadata;
    const node = await page.default({ params: p(), searchParams: Promise.resolve(search) });
    const html = await renderPage(locale, dict, pathname, node);
    return {
      kind: "page",
      status: 200,
      resolved: { locale, metadata: mergeMetadata(homeMetadata(locale, dict), pageMeta), html },
    };
  } catch (err) {
    if (isNotFound(err)) return notFoundOutcome(locale, pathname);
    if (err instanceof RedirectError) {
      return { kind: "redirect", location: err.location, status: err.status as 307 | 308 };
    }
    throw err;
  }
}

/** Pages already rendered by `staticPaths`, by pathname. */
const rendered = new Map<string, Outcome>();

const fill = (pattern: string, params: Params) =>
  pattern.replace(/\[(\w+)\]/g, (_, k: string) => params[k] ?? "");

/**
 * `getStaticPaths` for a Next page: its `generateStaticParams` crossed with
 * the locales, as the `[locale]` layout does under Next.
 *
 * A path whose page calls `notFound()` is left out rather than written: a
 * prerendered 404 would be served as a file, with a 200. That is how the
 * blog stays absent from a locale that has no posts yet.
 */
export function staticPaths(page: NextPageModule, pattern: string) {
  return async () => {
    const own = page.generateStaticParams ? await page.generateStaticParams() : [{}];
    const paths = [];
    for (const locale of locales) {
      for (const p of own) {
        const params = { ...p, locale };
        const pathname = fill(pattern, params);
        const outcome = await resolvePage(page, params, pathname);
        if (outcome.kind === "page" && outcome.status === 404) continue;
        rendered.set(pathname, outcome);
        paths.push({ params });
      }
    }
    return paths;
  };
}

/**
 * The page's URL as a reader types it. `build.format: "file"` writes
 * uk/about.html, and during prerender Astro reports that file name as the
 * pathname – which reached `usePathname()`, so the header's language switch
 * linked to /en/about.html (a 307 on every page), the nav never marked its
 * active item, and the `rendered` cache, keyed by the clean path, missed and
 * rendered every page twice.
 */
const pagePath = (astro: AstroGlobal) => astro.url.pathname.replace(/\.html$/, "");

export async function runRoute(astro: AstroGlobal, page: NextPageModule): Promise<Resolved | Response> {
  const pathname = pagePath(astro);
  const outcome =
    rendered.get(pathname) ??
    (await resolvePage(
      page,
      astro.params,
      pathname,
      astro.isPrerendered ? {} : Object.fromEntries(astro.url.searchParams),
    ));
  rendered.delete(pathname);
  if (outcome.kind === "redirect") return astro.redirect(outcome.location, outcome.status);
  astro.response.status = outcome.status;
  return outcome.resolved;
}

export async function notFoundPage(astro: AstroGlobal): Promise<Resolved> {
  const outcome = await notFoundOutcome(defaultLocale, pagePath(astro));
  astro.response.status = 404;
  return (outcome as Extract<Outcome, { kind: "page" }>).resolved;
}
