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
  // AI crawlers are kept out for now – owner's choice, 13 October 2026,
  // reversing the law.ucu.edu.ua policy adopted on 26 September (assistants'
  // search, fetch and model crawlers let in so answers could cite the
  // archive). It also matches the bnp.works zone, which prepends Cloudflare's
  // managed block for the same bots; the two files no longer contradict each
  // other. To let them back in, give each one `allow: "/", disallow: ADMIN`
  // instead. Common Crawl's CCBot stays out either way.
  const ADMIN = "/_emdash/";
  const aiBlocked = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "CCBot"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ADMIN },
      ...aiBlocked.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    ...(isIndexable ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  };
}
