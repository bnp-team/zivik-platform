import Link from "next/link";
import { type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { pick, type AboutContent } from "@/content/types";
import { linkAboutProse } from "@/content/about-prose";

/**
 * "About the Library" – main text plus a marginalia side-rail (law-journal
 * layout), so the section carries content instead of empty space.
 */
export default function About({
  locale,
  dict,
  about,
}: {
  locale: Locale;
  dict: Dictionary;
  about: AboutContent;
  totalCases: number;
  institutionCount: number;
}) {
  const paragraphs = pick(about.paragraphs, locale);
  const links = about.links ? pick(about.links, locale) : [];

  return (
    <div
      id="about"
      style={{
        position: "relative",
        zIndex: 3,
        padding: "50px 28px",
        // See the note above the same change in [locale]/page.tsx.
        background: "var(--paper)",
        borderTop: "1px solid var(--rule)",
        scrollMarginTop: 16,
      }}
    >
      <div className="lbl">
        <span>{pick(about.title, locale)}</span>
      </div>
      {/* Проза і вихід на сторінку – двома колонками.

          Кнопка стояла окремим блоком під смугою, з від'ємним полем, яке
          підтягувало її назад під підошву смуги, – і на широкому екрані вона
          опинялася під текстом, що займає ліві дві третини, з порожнім
          папером праворуч. Власниця: «може докладніше про проєкт поставимо
          праворуч від тексту в другу колонку?». Тепер це друга колонка тієї
          самої сітки: проза тримає свою міру, кнопка стоїть на верхній лінії
          першого абзаца. Вужче за 1000 колонки складаються, і кнопка
          повертається під текст – туди, де й була. */}
      <div className="nsv-about-grid">
      <div className="nsv-about-main">
        {/* All prose of one rank, so one face, one size and one colour –
            set together on `.nsv-about-main p` in home.css. The opening
            paragraph used to lead at 18px in the display serif, then by
            colour (--ink, 17.57:1, against --ink2's 7.78:1 for the rest);
            both read as an accident rather than a hierarchy in a section
            whose text is all the same rank. Emphasis is the eyebrow's and
            the button's job. */}
        {paragraphs.map((text, i) => (
          <p key={i}>{linkAboutProse(text, links)}</p>
        ))}
      </div>
        {/* Спільна пігулка сайту, а не власна.

            Тут стояла `.btn .btn-o` – прозора пігулка з червоним обідком, –
            і це був єдиний об'єкт такого роду на всьому сайті: більше ніде
            вона не вживається. Контрол на папері в нас інший, `.nsv-cta`:
            він стоїть у «Написати нам» на /about і /team та в «Підтримати
            нас» у шапці.

            І колір. У примітці до `.btn-lit` у home.css записано, чому
            кнопку в лампі свого часу зняли з червоного: червоний на цьому
            сайті означає порушення, а навігаційна кнопка – не порушення. Ця
            носила рівно той колір, від якого та відмовилась, і в тій самій
            ролі. Власниця питала, чи вибивається; вибивалася. */}
        <p className="nsv-about-go">
          <Link className="nsv-cta" href={`/${locale}/about`}>
            {dict.about.more}
          </Link>
        </p>
      </div>
    </div>
  );
}
