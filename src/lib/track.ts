/**
 * Named analytics events – a no-op unless the build loads PostHog
 * (`public/heatmaps.js`, `heatmapsEnabled` in lib/analytics.ts).
 *
 * Properties are controlled values only: counts, lengths, option keys from
 * the page's own lists, the page language. Never the reader's typed text, a
 * full URL, or anything that identifies the reader.
 */
type Props = Record<string, string | number | boolean>;

export function track(event: string, props: Props = {}): void {
  if (typeof window === "undefined") return;
  const ph = (window as { posthog?: { capture?: (e: string, p: Props) => void } }).posthog;
  try {
    ph?.capture?.(event, { locale: document.documentElement.lang || "uk", ...props });
  } catch {
    /* analytics must never break the page */
  }
}
