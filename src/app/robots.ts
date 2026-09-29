import type { MetadataRoute } from "next";
import { isIndexable, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Crawling stays allowed either way: the noindex has to be readable to be
  // obeyed. While the site is private it simply stops handing out a map –
  // `app/sitemap.ts` withholds the URLs to match, so the file this line would
  // point at is empty rather than merely unadvertised.
  //
  // No `Host:` line. It was a Yandex-only extension, dropped in 2018, never
  // understood by Google or Bing, and it expected a bare hostname – the value
  // emitted here was a full `scheme://host` URL, which even Yandex rejected.
  // The canonical link on every page is what actually declares the origin.
  //
  // `/_emdash/` is the admin and its API: nothing there is for a reader or a
  // search result, and a crawler that walks it only spends the Worker's time
  // (every request there is rendered, not served from a file). Disallowed
  // here, and every response from it also carries `X-Robots-Tag: noindex`
  // (site/worker.ts) for the crawler that does not read this file.
  //
  // AI crawlers – the policy the UCU Faculty of Law uses on law.ucu.edu.ua,
  // owner's choice (26 September 2026): the assistants' search and fetch
  // agents and the two model crawlers are let in by name, so that answers
  // about these decisions can cite this archive; Common Crawl's CCBot, a bulk
  // corpus anyone may train on without asking, is shut out. A named group
  // replaces the `*` group for that bot rather than adding to it, so each one
  // repeats the admin rule.
  const ADMIN = "/_emdash/";
  const aiAllowed = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ADMIN },
      ...aiAllowed.map((userAgent) => ({ userAgent, allow: "/", disallow: ADMIN })),
      { userAgent: "CCBot", disallow: "/" },
    ],
    ...(isIndexable ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  };
}
