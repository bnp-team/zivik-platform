/**
 * Блог – дописи редакції: новини справ, пояснення рішень, події.
 *
 * Дописи пишуть в адмінці (site/content/collections.ts, «Блог»); збірка
 * Cloudflare бере опубліковані зі знімка D1 у `posts`. Сторінки –
 * src/app/[locale]/blog. Поки не опубліковано жодного допису певною мовою,
 * блогу цією мовою на сайті немає: ні пункту меню, ні сторінки /blog.
 *
 * Порожній масив – не заглушка, а справжній стан файлів: на Vercel блогу не
 * буде, доки сайт не переїде на CMS.
 */
import { locales, type Locale } from "@/i18n/config";
import type { Localized } from "./types";

export interface BlogPost {
  /** Адреса допису: /uk/blog/{slug}. Латиницею, через дефіс. */
  slug: string;
  title: Localized;
  /** Анонс для списку дописів і опис для пошуковиків – до 160 знаків. */
  excerpt: Localized;
  /** Текст, абзац на елемент масиву (в адмінці – абзаци через порожній рядок). */
  body: { uk: string[]; en: string[] };
  /** Дата публікації, РРРР-ММ-ДД. */
  date: string;
  author?: Localized;
  /** Обкладинка – шлях у /public/blog. */
  cover?: string;
  coverAlt?: Localized;
  /** Теги, по одному в рядку. */
  tags?: string[];
  /** Пов'язані огляди – slug сторінок /cases/{slug}, по одному в рядку. */
  relatedCases?: string[];
}

export const posts: BlogPost[] = [];

/**
 * Дописи, від найновішого. Сторінки блогу, навігація й карта сайту читають
 * лише це: поки нічого не опубліковано, блогу на сайті немає зовсім – ні
 * пункту меню, ні сторінки /blog (вона віддає 404), ні рядків у sitemap.
 * Порожній розділ із написом «скоро» – обіцянка, яку читач перевіряє і не
 * отримує.
 */
export const blogPosts: BlogPost[] = [...posts].sort(
  (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
);

/**
 * Чи є допис цією мовою. Редакція може написати допис лише українською:
 * адмінка не вимагає обох мов, і тоді англійської сторінки в нього просто
 * немає – ні в списку /en/blog, ні в hreflang, – а не сторінка з порожнім
 * заголовком.
 */
export function postHasLocale(p: BlogPost, locale: Locale): boolean {
  return Boolean(p.title?.[locale]?.trim() && p.body?.[locale]?.some((x) => x.trim()));
}

export function postsIn(locale: Locale): BlogPost[] {
  return blogPosts.filter((p) => postHasLocale(p, locale));
}

/** Чи показувати блог цією мовою: меню, футер, sitemap і сама сторінка /blog. */
export function blogEnabled(locale: Locale): boolean {
  return postsIn(locale).length > 0;
}

/**
 * Blog addresses that do not exist: a post in the language it was not
 * written in, and /blog in a language with no post. The header's language
 * switch reads this, so «EN» on a Ukrainian-only post leads to the English
 * blog (or home) rather than to a 404. Usually empty or a few entries.
 */
export function blogMissingPaths(): string[] {
  const out: string[] = [];
  if (!blogPosts.length) return out; // no blog page anywhere to switch from
  for (const l of locales) {
    if (!blogEnabled(l)) out.push(`/${l}/blog`);
    for (const p of blogPosts) if (!postHasLocale(p, l)) out.push(`/${l}/blog/${p.slug}`);
  }
  return out;
}

export function postBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

/** Той самий формат, що перевіряє адмінка (site/emdash/content-problems.ts). */
export const POST_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const POST_DATE = /^\d{4}-\d{2}-\d{2}$/;

/* Інваріанти, як у решті src/content: збірка падає тут, а не на сторінці,
   яка тихо покаже «Invalid Date» чи зламану адресу. Адмінка ловить те саме
   ще до збереження, тож до збірки це доходить лише з файлів. */
{
  const seen = new Set<string>();
  for (const p of posts) {
    if (!POST_SLUG.test(p.slug)) throw new Error(`blog: адреса «${p.slug}» – лише латиниця, цифри й дефіс`);
    if (seen.has(p.slug)) throw new Error(`blog: адреса «${p.slug}» повторюється`);
    seen.add(p.slug);
    if (!POST_DATE.test(p.date) || Number.isNaN(Date.parse(p.date))) {
      throw new Error(`blog: «${p.slug}» – дата «${p.date}» не у форматі РРРР-ММ-ДД`);
    }
  }
}
