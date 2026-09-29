import type { Metadata } from "next";

/**
 * 404 boundary for everything under `/[locale]`.
 *
 * It exists for the metadata, not the markup. `notFound()` thrown inside a
 * locale segment – a decision slug that does not exist, say – discards the
 * page's own metadata and leaves only the enclosing layout's, and
 * `[locale]/layout.tsx` supplies `homeMetadata`. So a dead case link served a
 * correct 404 status wrapped in the *home page's* head: the home title,
 * `canonical` pointing at `/uk`, the home hreflang pair, and the home
 * og:image. Pasted into Slack, a broken link unfurled as a healthy site.
 *
 * This file overrides that head and nothing else – the UI is the same root
 * 404 component that already rendered here, so the page looks identical.
 *
 * `null` is the documented way to clear an inherited field: `canonical` and
 * the hreflang alternates must go (a 404 is not the canonical anything, and
 * it has no localized twin to point at), and both cards go with them. A
 * missing card is the honest answer for a page that does not exist; leaving
 * the home card would keep the lie.
 *
 * Note this is a `not-found.tsx`, so it takes no params and cannot know the
 * locale – hence one bilingual title, in the same spirit as the root 404's
 * bilingual body.
 */
export const metadata: Metadata = {
  title: "Сторінку не знайдено · Page not found",
  description:
    "Такої сторінки немає. There is no such page.",
  alternates: null,
  openGraph: null,
  twitter: null,
  // A 404 is never indexable, whatever SITE_INDEXABLE says.
  robots: { index: false, follow: false },
};

export { default } from "../not-found";
