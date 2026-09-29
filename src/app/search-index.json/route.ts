import { contentIndex, CONTENT_INDEX_PATH } from "@/content/search-index";

/**
 * The content search index, as a file.
 *
 * It used to travel inside `/uk/registry` and `/en/registry`. Measured on the
 * built documents: 73,676 characters of postings in the flight payload, 24,137
 * gzipped bytes of a 53,379-byte page – 45% of the Ukrainian library and 48%
 * of the English one, downloaded by every reader who opened the library,
 * including the ones who never touched the search field. And downloaded twice
 * across the two locales, because the postings are language-agnostic (both
 * languages of every field went into them) but the page carrying them is not.
 *
 * As one asset it is fetched once, cached by the browser, shared by both
 * locales, and asked for only when a reader reaches for the search field. See
 * `RegistryTable` for when that is and what the field does before it lands.
 *
 * `force-static` is what makes this a file rather than a function: the route
 * is prerendered during `next build` alongside the 96 pages, so it is served
 * from the CDN and nothing here runs per request. The index is a build-time
 * constant – it is computed while this module is evaluated – so there is
 * nothing for a request to add.
 *
 * The folder name is the URL and `CONTENT_INDEX_PATH` is what the client asks
 * for; the assertion below is the only thing standing between the two, since
 * a directory name cannot be spelled by a constant.
 *
 * ONE THING TO KNOW ABOUT SERVING IT. `next start` does not compress route
 * handler responses – measured on this build, 70,672 B for this file against
 * 23,282 B of the same bytes gzipped, and `/robots.txt` and `/sitemap.xml`
 * come back uncompressed from it too, while every page and everything under
 * `public/` is gzipped. A CDN in front of the deployment compresses it and the
 * question does not arise; a self-hosted `next start` with nothing in front of
 * it would hand a reader three times the bytes. If this ever moves off a CDN,
 * put the index in `public/`, which is served gzipped and sidesteps the
 * question entirely. (The map used to have a second fetched asset there,
 * `europe-far.json`, for exactly that reason; it went when the Atlantic
 * framing did.)
 */
export const dynamic = "force-static";

if (CONTENT_INDEX_PATH !== "/search-index.json") {
  throw new Error(
    `content search index: CONTENT_INDEX_PATH is ${CONTENT_INDEX_PATH}, but this ` +
      "route handler is at /search-index.json. Rename the directory to match, or " +
      "the library will fetch a 404 and search only the rows.",
  );
}

/** The served file, built once while this module is evaluated. */
const body = JSON.stringify(contentIndex);

/**
 * Announce what the file weighs, on every build.
 *
 * Weight is a live concern here and an index is exactly the kind of thing that
 * grows quietly with the ninth write-up and the tenth. The line used to be
 * printed by `content/search-index.ts`; once this route existed, three graphs
 * reached that module – the Ukrainian library, the English one and this – and
 * each build worker gets its own module instance, so one number printed three
 * times and read as three indexes. Here it prints once per build phase that
 * evaluates the route, which is two – collecting page data and prerendering –
 * the same two lines `next.config.ts` already prints for SITE_INDEXABLE.
 *
 * And this is the honest place for it regardless: `body` is the string a
 * reader downloads, not an estimate of it.
 */
{
  let gz = -1;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    gz = (require("node:zlib") as typeof import("node:zlib")).gzipSync(body).length;
  } catch {
    /* No zlib (an edge runtime): print the raw size only. */
  }
  console.log(
    `  content search index: ${Object.keys(contentIndex.terms).length} terms, ` +
      `${contentIndex.cases.length} write-ups, ${body.length} B raw` +
      (gz >= 0 ? `, ${gz} B gzipped` : "") +
      `, served as ${CONTENT_INDEX_PATH}`,
  );
}

export function GET() {
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      /* Revalidated on every visit rather than held for a year: the URL has no
         content hash in it, so a cached copy would outlive the build that
         produced it and answer a query against an index of the wrong archive.
         A 304 costs one round trip and no bytes. */
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
