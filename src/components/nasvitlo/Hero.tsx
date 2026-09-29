import type { Dictionary } from "@/i18n/dictionaries";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import HeroMap from "./HeroMap";

/**
 * Hero with the industrial lamp lighting the wordmark. The lamp fixtures and
 * `.dchain` pull-cord are static markup; <LampShell/> wires the toggle + fade.
 *
 * Order follows the content brief: wordmark, lead, the collection's scope,
 * then the two ways in – and nothing after them. The credit moved out
 * entirely: the footer already names the centre and the faculty, so carrying
 * it here too was three more lines on a first screen that was already dense.
 */
export default function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <div
      id="content"
      /* The skip link's landing place. Without it the fragment moves the
         scroll position but leaves document.activeElement on <body>, so a
         screen reader's virtual cursor never follows and "skip to content"
         does nothing for the readers it exists for. */
      tabIndex={-1}
      className="pj"
      style={{
        position: "relative",
        padding: "0 0 60px",
        minHeight: 600,
        overflow: "hidden",
        background: "none",
      }}
    >
      {/* Under the fixtures and under the text: the lamp hangs in front of the
          map, and the map is what its light falls on. */}
      <HeroMap />
      <span className="dcord" />
      <span className="dcollar" />
      <span className="bcone" />
      <span className="bpool" />
      <span className="bshade">
        <i className="gloss" />
      </span>
      <span className="bmouth">
        <i />
      </span>
      <button
        type="button"
        className="dchain"
        aria-pressed={true}
        aria-label={dict.hero.lampLabel}
      >
        <i />
      </button>
      <span className="chint">{dict.hero.chainHint}</span>

      <div
        className="nsv-hero"
        style={{
          position: "relative",
          zIndex: 3,
          padding: "168px 90px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <h1
          className="wm"
          style={{ letterSpacing: "-.012em", margin: "0 0 24px" }}
        >
          <span className="dim">{dict.brand.wordmark}</span>
          <span className="lit" aria-hidden="true">
            {dict.brand.wordmark}
          </span>
        </h1>
        <p
          style={{
            // Prose, so it takes the prose face and size like every other
            // paragraph on the site; the wordmark above carries the display face.
            fontFamily: "var(--brand-font-body),sans-serif",
            fontSize: "var(--t-body)",
            lineHeight: 1.5,
            color: "var(--brand-cream)",
            margin: "0 0 16px",
            maxWidth: 560,
            textWrap: "balance",
          }}
        >
          {dict.hero.lead}
        </p>
        {/* One way in, not two.

            The lamp used to offer «Бібліотека рішень» and «Мапа» side by side.
            The owner's note is to take the map out of here, and the reason it
            is right is that the two were never equals: the archive is the
            library, and the map is a second way of looking at the same
            proceedings. Offering both at the top asked the reader to choose
            between a thing and a view of that thing before they had seen
            either. The map keeps its place in the top bar and its own page. */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {/* The library's own page, not a band on this one.

              It was `#registry`, an anchor into a section further down the
              home page – which was a reasonable link while that section was
              the library's front door, and became a link to nothing the moment
              the owner asked for the section to come off. A reader who presses
              the one button under the lamp is asking for the archive, and the
              archive is a page. */}
          <Link href={`/${locale}/registry`} className="btn btn-lit">
            {dict.hero.ctaRegistry}
          </Link>
        </div>

        {/* A colophon, not a sentence. Run on one line the two names read as
            two peers separated by a bullet, when the centre is in fact part of
            the faculty – in Ukrainian they are a genitive chain, so they stack
            and the separator goes. Faculty last and faintest: its mark already
            sits in the top bar, so here it is context, not the headline. */}
        <p className="nsv-credit">
          <span className="cr-label">{dict.hero.credit}</span>
          <span className="cr-centre">{dict.hero.creditCentre}</span>
          <span className="cr-faculty">{dict.hero.creditFaculty}</span>
        </p>

      </div>
    </div>
  );
}
