import type { Locale } from "@/i18n/config";
import { txt } from "@/lib/ui-texts";

/**
 * Рядки й дата, спільні для списку дописів і сторінки допису.
 *
 * Окремий модуль, а не експорт із page.tsx: сторінка Next може експортувати
 * лише те, що знає маршрутизатор (default, generateMetadata …).
 */
export const BLOG_T = {
  title: txt("blog.title", { uk: "Блог", en: "Blog" }),
  metaDesc: txt("blog.metaDesc", {
    uk: "Дописи редакції «НаСвітло»: нові рішення, пояснення до оглядів і події Дослідницького центру Луї Зона.",
    en: "Notes from the nasvitlo editors: new decisions, context for the summaries, and events at the Louis Sohn Research Centre.",
  }),
  toBlog: txt("blog.toBlog", { uk: "Усі дописи", en: "All posts" }),
  related: txt("blog.related", { uk: "Огляди, про які йдеться", en: "Summaries discussed" }),
  tags: txt("blog.tags", { uk: "Теми", en: "Topics" }),
} as const;

/** «uk-UA», не «uk»: голий «en» форматує по-американськи (див. content/legal.ts). */
const DATE_TAG: Record<Locale, string> = { uk: "uk-UA", en: "en-GB" };

export function formatPostDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_TAG[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
