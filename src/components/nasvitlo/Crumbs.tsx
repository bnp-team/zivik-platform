import Link from "next/link";
import type { Locale } from "@/i18n/config";

/**
 * «Головна / <ця сторінка>» above a page's title.
 *
 * The link used to be a bare «На головну» / "Home" in small capitals, and with
 * the arrow gone it read as a caption with no reason to be there. A path says
 * what it is: where you are, and the one step up.
 *
 * `linkClass` is the page's own back-link class, so the tap-target floor and
 * the colours each surface already gave that link keep applying; only the
 * trail around it is new.
 */
export default function Crumbs({
  locale,
  linkClass,
  here,
}: {
  locale: Locale;
  linkClass: string;
  here: string;
}) {
  return (
    <nav className="crumbs" aria-label={locale === "uk" ? "Шлях" : "Breadcrumb"}>
      <Link href={`/${locale}`} className={linkClass}>
        {locale === "uk" ? "Головна" : "Home"}
      </Link>
      <span className="crumbs-sep" aria-hidden="true">
        /
      </span>
      <span className="crumbs-here" aria-current="page">
        {here}
      </span>
    </nav>
  );
}
