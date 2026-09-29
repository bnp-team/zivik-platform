import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getContentRepository } from "@/content/repository";
import { jsonLdHtml, siteUrl } from "@/lib/seo";
import "./home.css";
import LampShell from "@/components/nasvitlo/LampShell";
import Hero from "@/components/nasvitlo/Hero";
import About from "@/components/nasvitlo/About";
import Quote from "@/components/nasvitlo/Quote";
import Partners from "@/components/nasvitlo/Partners";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const repo = getContentRepository();
  /* Only what the page still draws. The library band used to need the five
     phase-1 courts, their cases grouped by institution and the analysed count;
     it is gone, and so is all of that. `institutions` and `cases` stay because
     the About summary counts them. */
  const [institutions, partners, cases, about] = await Promise.all([
    repo.getInstitutions(),
    repo.getPartners(),
    repo.getCases(),
    repo.getAbout(),
  ]);
  const totalCases = cases.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: dict.brand.wordmark,
    url: `${siteUrl}/${locale}`,
    inLanguage: locale,
    description: dict.meta.description,
    /* `url: siteUrl` вказував на голий корінь, а `/` – це 307 на мовну
       версію: видавець, що веде на редирект. Тепер – мовна головна, як і
       `url` самого WebSite вище. */
    publisher: {
      "@type": "Organization",
      name: dict.footer.org,
      url: `${siteUrl}/${locale}`,
    },
  };

  return (
    /* `homepage` as well as `page`: home.css carries three rules that match on
       an element rather than a class, and Next leaves a route's stylesheet in
       the document after a client-side navigation away from it – so those
       three were repainting headings and links on every other surface a
       reader reached from here. They are scoped to this class now. */
    <div className="page homepage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(jsonLd)}
      />
      {/* The one content region on the page. Without it there is no landmark
          for a screen reader to jump to. */}
      <main>
        <LampShell>
        <Hero dict={dict} locale={locale} />
        {/* On paper, not on --brand-surface.

        This band and the strip under it were `var(--surface)` – #ffffff, which
        globals.css documents as "cards / rows – float above the page". Used as a
        full-bleed ground it made the home page's largest light surface a card, and
        gave the page three light grounds where the system has two: white here,
        --brand-paper-2 under the slogan, --brand-paper under the partners. /about,
        rebuilt on the same two grounds, has no white on it at all.

        The change is invisible – #ffffff against #fbfbfa is 1.01:1 – and that is
        the point: nothing on screen was relying on it, and the palette now says
        the same thing on both pages.

        design-lint could not have caught this. It reads only `fontSize` out of
        JSX, so a ground set in an inline style is outside everything it checks. */}
        <About
          locale={locale}
          dict={dict}
          about={about}
          totalCases={totalCases}
          institutionCount={institutions.length}
        />
        {/* Вихід на сторінку «Про проєкт» переїхав усередину смуги, у другу
            колонку при прозі – див. примітку в components/nasvitlo/About.tsx.
            Тут він був окремим блоком із від'ємним полем, яке підтягувало
            його назад під підошву смуги; блок, який існує, щоб компенсувати
            поле сусіда, – це шов, а не композиція. */}
        {/* No map band here any more.

            The map is the background of the first screen now – the thing the
            lamp lights – and a second, fuller copy of it a screen later was
            the same drawing asked twice. It keeps its own page, which is where
            a reader who wants to work with it goes, and the top bar still
            points at it. */}
        {/* Partners before the quotation, which is a swap of the two.

            Owner's decision, and the page reads better for it: the quotation
            band is the site's one dark surface below the lamp, and it used to
            sit between two grounds of pale paper, so the page went light,
            dark, light and ended on a partner row that had nothing after it
            but the footer. Now the light half of the page runs unbroken – the
            summary, the slogan, the partners – and the dark begins at the
            quotation and does not stop: the Court's words run straight into
            the footer's dark, with the gold rule between them, and the page
            closes in the same colour the lamp lit at the top. */}
        <Partners locale={locale} dict={dict} partners={partners} />
        {/* The library is not a band here any more.

            It was the home page's front door – the five courts, their
            caseloads, a row of cases apiece – and the owner's note is to take
            it off. The button under the lamp now goes to /registry, which is
            the page that can sort, filter and search the same thirty-three
            proceedings. A summary of the archive on the way to the archive was
            a stop the reader did not need. */}
        {/* The support band is gone from here.

            It was a heading, a paragraph and a «Підтримати бібліотеку» button
            in a band of their own. The owner's note is to take the text off
            and move the ask – into the footer's contacts, where it now sits
            beside the address, and to somewhere near the top of the page,
            which is still open: the lamp carries exactly one button now, and
            putting a second one back there would undo the change that put it
            there. */}
        <Quote dict={dict} locale={locale} />
        </LampShell>
      </main>
    </div>
  );
}
