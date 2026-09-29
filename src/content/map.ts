import { pick, type Localized } from "./types";
import { institutions } from "./institutions";
import type { Locale } from "@/i18n/config";
import geo from "./europe-map.json";

/**
 * What the events map shows.
 *
 * This used to be hardcoded Ukrainian inside public/nasvitlo/map-dark.html, so
 * the English homepage embedded a Ukrainian map and none of it was readable by
 * a search engine. Every string is a pair now; coordinates live in
 * europe-map.json, already projected (see scripts/europe-map.mjs).
 */

export interface MapEvent {
  /** Marker key in europe-map.json. */
  key: string;
  /**
   * The linked case is not one of the things this marker counts.
   *
   * Every other marker counts proceedings and links the ones that are written
   * up, so "n of total" is a true sentence about the same set. Mariupol counts
   * warrants and links the situation those warrants issue from, which is not a
   * warrant – so the arithmetic compares two different things and the card says
   * what the case actually is instead.
   */
  linksOutsideCount?: boolean;
  /**
   * How many items in the registry this site accounts for – the number its
   * own `count` string states, as a number.
   *
   * The marker's radius is derived from it (see `markerSize`) rather than
   * written down beside it, because written down it drifted. The six radii
   * were 26, 22, 24, 19, 19 and 18 against counts of 11, 2, 3, 4, 4 and 6, so
   * the second-largest dot on the map stood for two proceedings and the
   * smallest for six – while the legend told the reader in as many words that
   * a bigger circle means more proceedings. The legend was right about what
   * the map ought to say and the map was not saying it.
   *
   * `count` keeps the wording because the six are not all the same kind of
   * thing – proceedings, decisions, arbitrations, arrest warrants – and this
   * archive does not flatten that in prose. It is one quantity for the purpose
   * of a radius: how much of the record this place accounts for. The guard at
   * the foot of this file checks the two against each other, so a count
   * corrected in the string cannot leave the drawing behind.
   */
  weight: number;
  /**
   * Date or period, shown above the title – and, since the map gained oblast
   * boundaries, the source of the marker's own label on the drawing.
   *
   * NEEDS THE OWNER'S REVIEW. Every tag but one reads "<noun> · <date>", and
   * the map takes the part before the interpunct as the shortest true name the
   * archive already gives that site: Окупація / Occupation, Затримання /
   * Seizure, Схід / The east, Енергетика / Energy, MH17. "Воєнні злочини" has
   * no such noun – its tag is a bare "2022" – so its marker is labelled 2022.
   * Nothing on the drawing is a place name we invented; the alternative was to
   * name six places ourselves, on an archive whose whole subject is who has
   * the right to name them.
   *
   * The consequence is that editing a tag edits the map. If a tag ever needs
   * to grow past about ten characters before the interpunct, the labels want a
   * field of their own rather than a longer derivation.
   */
  when: Localized;
  title: Localized;
  note: Localized;
  /**
   * The ground this site stands for, where a point is not the whole truth.
   *
   * Two of the six are not places. «Воєнні злочини» is filed under the key
   * `mariupol` and drawn on Mariupol, and its content is the ICC's situation
   * in Ukraine entire – six arrest warrants, of which only some are about that
   * city. «Енергоактиви» is Ukrenergo, Energoatom, DTEK and Ukrhydroenergo:
   * generation and grid across the country, drawn on one point in the middle
   * of it. A dot is a claim about where something happened, and on an archive
   * whose subject is who has the right to name things, a dot that means "the
   * whole country" is a claim the record does not support.
   *
   * The answer is not to move the dot or drop it – a reader needs somewhere to
   * aim – but to say what it stands for: the marker keeps its place and the
   * ground it speaks for lights up behind it. "country" is Ukraine's own
   * outline; anything else names a path in `areas` in europe-map.json.
   *
   * The extents are not ours to choose. Each is the one the proceedings
   * themselves fix, and for «Схід України» that took asking the record rather
   * than guessing at a front line: the ICJ's operative paragraph in
   * *Allegations of Genocide* reads "in the Donetsk and Luhansk oblasts of
   * Ukraine"; the Dutch MH17 judgment places the launch site at Pervomaiskyi
   * in Donetsk oblast; the ECtHR inter-State application is about the April
   * 2014 seizures in Luhansk and Donetsk; and Finland v Petrovsky is the Aidar
   * ambush in Luhansk oblast. All four proceedings this marker accounts for
   * name the same two oblasts and no third – so that is the ground, and
   * `AREA_UNITS` in scripts/europe-map.mjs cuts it from those two admin-1
   * units.
   *
   * Not the four oblasts of Oschadbank's 2025 notice of dispute – Donetsk,
   * Luhansk, Kherson and Zaporizhzhia. That is a later and separate claim
   * about asset losses, it is not one of the four this marker stands for, and
   * no tribunal has been constituted for it.
   */
  area?: "country" | "crimea" | "east";
  /** Court markers this site draws a line to. */
  courts: string[];
  /** The forums, spelled out for the card. */
  forums: Localized;
  /** How many proceedings this site accounts for. */
  count: Localized;
  /**
   * Slugs in SUMMARIES this site leads to. Assigned from what each decision is
   * actually about, not from the forum: Oschadbank is a Crimea case but its
   * arbitration sat in Paris, so the seat on the map says nothing about it.
   * Checked at build time in `map-links.ts` – a typo would otherwise render a
   * link to a 404.
   */
  cases?: string[];
}

export interface MapCourt {
  key: string;
  /**
   * "in <this place>", authored rather than composed.
   *
   * The card's footer reads «Усього у Гаазі: 22 провадження», and Ukrainian
   * puts the place in the locative: Гаага → у Гаазі, Париж → у Парижі,
   * Гамбург → у Гамбурзі. There is no rule that turns the nominative in
   * `city` into any of those, and a template that glued a preposition onto
   * the nominative would print «Усього в Гаага» on every card. So the phrase
   * is written out, per locale, next to the name it inflects.
   */
  at: Localized;
  /**
   * Registry institutions seated in this city. The map draws six places where
   * harm happened, but the archive holds 33 proceedings, and the ones not tied
   * to those six places had nowhere to appear. Naming the institutions here
   * lets a court answer for its own caseload – and the union of these lists is
   * checked against the registry at build time, so no proceeding can go
   * unrepresented without the build saying so.
   */
  institutionIds: string[];
  /**
   * Outside the projection's declared frame, so it has no entry in
   * europe-map.json's `markers` and says where it is in `offAt` instead.
   *
   * Whether it is drawn *as* off the map is a question about the framing, not
   * about this flag: where the view cannot hold the city it is docked against
   * the frame's edge on the bearing of `offAt`, with a tail running off the
   * picture, and where a framing can hold it – the Atlantic one – it is drawn
   * where it is, like any other seat. The comment here used to claim such a
   * city was "named in the legend and not drawn"; it was neither. `EventsMap`
   * filtered it out of the drawing and nothing else rendered it, so the ICAO
   * Council, which decided the MH17 case the ICJ is now hearing on appeal,
   * appeared nowhere at all.
   */
  offMap?: boolean;
  /**
   * Where the city really projects to, in the same units as
   * europe-map.json – off the 0…1200 × 0…460 frame, which is the whole point.
   * Computed with the projection in scripts/europe-map.mjs rather than
   * guessed; the marker list in that script only carries points that land
   * inside the frame, so an off-map seat has to say where it is here.
   *
   * It is a position and not merely a bearing: the Atlantic framing draws the
   * marker at it, and the widest view the reader can reach is derived from it,
   * so a second off-map seat would widen that framing by itself.
   */
  offAt?: { x: number; y: number };
  /** Nudge the label off a collision with a neighbouring city. */
  labelDy?: number;
  city: Localized;
  /**
   * Abbreviation → full name. `abbr` is optional: the international courts go
   * by acronyms that appear in the case citations themselves, but a national
   * court has none, and inventing one for an archive of citations would be
   * worse than leaving it out.
   *
   * And it is a pair where the two languages cite the court differently. Most
   * acronyms are the same in both – ICJ, ICC, PCA, ITLOS, SCC, ICAO – but the
   * Strasbourg court is ЄСПЛ in a Ukrainian filing and ECtHR in an English
   * one, and carrying both in one string put «ЄСПЛ / ECtHR» on the English
   * map, in the badge on the drawing and in the seat list underneath. Both
   * halves come from the record; this only picks the one the reader is
   * reading in.
   */
  /**
   * The courts that sit in this city.
   *
   * `institutionId` is the registry institution this seat *is*, where it is
   * one – that is what makes the name a link into the registry. It is declared
   * per seat rather than inferred from the order of `institutionIds`, because
   * the two lists are not always the same list: Paris holds the ICC's Court of
   * Arbitration, which is a registry institution, and the PCA, which is not –
   * the PCA sits in The Hague, and the Paris entry records that the Oschadbank
   * arbitration was *seated* there. Pairing by position would have linked the
   * words "Permanent Court of Arbitration" to the ICC's caseload, and nobody
   * reading the card could have caught it.
   */
  seats: { abbr?: string | Localized; institutionId?: string; name: Localized }[];
}

/**
 * The diameter a site's marker is drawn at, from what it stands for.
 *
 * Square-rooted, so the mark's *area* rises with the count rather than its
 * width – the reader compares blobs, not radii, and a linear radius makes 11
 * look thirty times two rather than five. Fitted to the range the drawing
 * already used, 18…26 units, so nothing about the map's scale changes: the two
 * ends land exactly where they were (Crimea at 11 keeps 26, the Kerch strait
 * at 2 keeps 18) and only the middle four move into the right order.
 *
 * Rounded to a half unit. One decimal of a projection unit is 0.06 CSS pixels
 * at the framing the map opens in; the extra digits were noise in the markup.
 */
export function markerSize(weight: number): number {
  const lo = 2;
  const hi = 11;
  const n = Math.min(hi, Math.max(lo, weight));
  const t = (Math.sqrt(n) - Math.sqrt(lo)) / (Math.sqrt(hi) - Math.sqrt(lo));
  return Math.round((18 + 8 * t) * 2) / 2;
}

/**
 * What a court's card says where the map has nothing to link it to.
 *
 * Three of the nine seats hear proceedings that none of the six sites on this
 * map is about – Stockholm (the Naftogaz/Gazprom gas arbitrations), Vilnius
 * (Lithuania's universal-jurisdiction proceedings) and Brussels (which is not
 * a court at all) – so `courtSites` comes back empty for them and the card had
 * a heading with nothing under it. An empty section is not a fact; this is.
 *
 * A statement about this map's own structure rather than about any one court,
 * which is why it is one sentence here and not a field on nine entries. It
 * lives with the map's data rather than in the dictionaries because it is only
 * true of this drawing and its six places: reword the sites and it changes.
 */
/* ── MAP_COURT_NO_SITES – removed ──────────────────────────────────────────
   It read «Це провадження не про жодне з шести місць на мапі – мапа показує,
   де сталося, а тут спір іншого роду», and it was both dead and false. Dead:
   map/page.tsx passed it to EventsMap and EventsMap declared it in its label
   type, and nothing ever rendered it. False: there are no six places. The map
   stopped marking where harm happened when it was re-conceived as the States
   whose courts hear these proceedings, and a sentence explaining why a
   proceeding is not about any of them explains nothing about the map that
   exists.

   Dead and false is worse than either alone: nothing on screen could reveal
   it, and the day someone re-enabled the branch it would have shipped a claim
   about six marks that are not there. */



/**
 * Ukrainian cities named on the map for orientation. Not courts and not
 * proceedings: a dot and a name, nothing to press. The points are in
 * europe-map.json's `markers`, under the same key.
 */
export const MAP_PLACES: { key: string; city: Localized }[] = [
  { key: "kyiv", city: { uk: "Київ", en: "Kyiv" } },
  { key: "lviv", city: { uk: "Львів", en: "Lviv" } },
];

export const MAP_COURTS: MapCourt[] = [
  {
    key: "hague",
    at: { uk: "у Гаазі", en: "in The Hague" },
    institutionIds: ["icj", "icc", "pca", "nl"],
    city: { uk: "Гаага", en: "The Hague" },
    seats: [
      {
        institutionId: "icj",
        abbr: "ICJ",
        name: { uk: "Міжнародний суд ООН", en: "International Court of Justice" },
      },
      {
        institutionId: "icc",
        abbr: "ICC",
        name: { uk: "Міжнародний кримінальний суд", en: "International Criminal Court" },
      },
      {
        institutionId: "pca",
        abbr: "PCA",
        name: { uk: "Постійна палата третейського суду", en: "Permanent Court of Arbitration" },
      },
      {
        institutionId: "nl",
        // Six proceedings – the MH17 verdict and four Hoge Raad cassations –
        // and the map named none of them. The Supreme Court of the Netherlands
        // sits in The Hague (Korte Voorhout 8), as does the District Court
        // whose ECLI the MH17 judgment carries (RBDHA); that trial was heard
        // in the Schiphol justice complex for security, but the court is the
        // Hague one.
        /* Shortened once the card grouped these rows under a heading that
           says they are national and an NL in the column that says whose:
           «…та Верховний суд Нідерландів» was saying the state a third time
           in one row. Both courts are still named – that is the fact – and
           the interpunct is the card's own separator, not a dash standing in
           for a relation. */
        name: {
          uk: "Окружний суд Гааги · Верховний суд",
          en: "The Hague District Court · the Supreme Court",
        },
      },
    ],
  },
  {
    key: "strasbourg",
    at: { uk: "у Страсбурзі", en: "in Strasbourg" },
    institutionIds: ["ecthr"],
    city: { uk: "Страсбург", en: "Strasbourg" },
    seats: [
      {
        institutionId: "ecthr",
        /* Той самий бейдж, що в institutions.ts – див. примітку там. */
        abbr: { uk: "ECtHR", en: "ECtHR" },
        name: { uk: "Європейський суд з прав людини", en: "European Court of Human Rights" },
      },
    ],
  },
  {
    key: "hamburg",
    at: { uk: "у Гамбурзі", en: "in Hamburg" },
    institutionIds: ["itlos"],
    city: { uk: "Гамбург", en: "Hamburg" },
    seats: [
      {
        institutionId: "itlos",
        abbr: "ITLOS",
        name: {
          uk: "Міжнародний трибунал з морського права",
          en: "International Tribunal for the Law of the Sea",
        },
      },
    ],
  },
  {
    key: "paris",
    at: { uk: "у Парижі", en: "in Paris" },
    institutionIds: ["icc-arb"],
    city: { uk: "Париж", en: "Paris" },
    seats: [
      {
        /* No institutionId, deliberately. The PCA is a registry institution
           and it is seated in The Hague, where this list already carries it.
           What this entry records is that the Oschadbank arbitration *sat* in
           Paris – a fact about a venue, not a second seat of the court. So it
           is named on the card and not linked: a link here would take a reader
           who clicked "Permanent Court of Arbitration" to the ICC's caseload. */
        abbr: "PCA",
        name: {
          uk: "Постійна палата третейського суду – місце арбітражу у справі Ощадбанку",
          en: "Permanent Court of Arbitration – seat of the Oschadbank arbitration",
        },
      },
      {
        institutionId: "icc-arb",
        abbr: "ICC",
        name: {
          uk: "Міжнародний арбітражний суд Міжнародної торгової палати",
          en: "International Court of Arbitration of the International Chamber of Commerce",
        },
      },
    ],
  },
  {
    key: "vilnius",
    at: { uk: "у Вільнюсі", en: "in Vilnius" },
    institutionIds: ["lt"],
    city: { uk: "Вільнюс", en: "Vilnius" },
    seats: [
      {
        institutionId: "lt",
        name: {
          uk: "Суди Литви – універсальна юрисдикція",
          en: "The courts of Lithuania – universal jurisdiction",
        },
      },
    ],
  },
  /* Brussels – the EU and Belgium – is deliberately not here either.
   *
   * Euroclear is where the Russian central-bank assets are immobilised, and
   * the archive tracks it. But it is not a court, and this map says one thing:
   * the states whose courts hear these proceedings, or whose courts have
   * convicted under universal jurisdiction. A marker that is not a seat left
   * the drawing half-consistent – a lit dot over an unlit country, because
   * Belgium is not one of the six and could not be, on that sentence.
   *
   * So it goes the way Montreal went, and for the same reason: the map is
   * about courts, and the proceeding is in the registry, which is where a
   * reader looking for it will be. Its institution is named in
   * OFF_MAP_INSTITUTIONS in map-links.ts, because the guard there requires
   * every registry institution to be seated or explicitly excused.
   */
  /* Montreal – the ICAO Council – is deliberately not here.
   *
   * It was the one seat outside the projection's window, docked against the
   * western edge with a bearing and a tail running off the picture, and the
   * Atlantic framing existed to put it back inside. The owner's decision is
   * that the map stays European: the Council's proceeding is reachable through
   * the registry, which is where a reader looking for it will be.
   *
   * Three things went with it, and none of them had to be deleted by hand –
   * every one is drawn from this list. `hasWide` in EventsMap derives the
   * widest framing from the span of the markers, so with no seat outside the
   * frame the Atlantic button stops rendering; the off-map legend key renders
   * only where `courts.some(c => c.offMap)`; and the dock itself only ever
   * drew for a seat that declared `offAt`. Putting the entry back restores all
   * three.
   */
  {
    key: "helsinki",
    at: { uk: "у Гельсінкі", en: "in Helsinki" },
    institutionIds: ["fi"],
    city: { uk: "Гельсінкі", en: "Helsinki" },
    seats: [
      {
        institutionId: "fi",
        name: {
          uk: "Окружний суд Гельсінкі – універсальна юрисдикція",
          en: "Helsinki District Court – universal jurisdiction",
        },
      },
    ],
  },
  {
    key: "stockholm",
    at: { uk: "у Стокгольмі", en: "in Stockholm" },
    institutionIds: ["scc"],
    city: { uk: "Стокгольм", en: "Stockholm" },
    seats: [
      {
        institutionId: "scc",
        abbr: "SCC",
        name: {
          uk: "Арбітражний інститут Торгової палати",
          en: "Arbitration Institute of the Stockholm Chamber of Commerce",
        },
      },
    ],
  },
];

export const MAP_EVENTS: MapEvent[] = [
  {
    key: "crimea",
    area: "crimea",
    cases: ["icj-cerd-icsft", "oschadbank", "dtek-krymenergo"],
    weight: 11,
    when: { uk: "Окупація · 2014", en: "Occupation · 2014" },
    title: { uk: "Окупація Криму", en: "Occupation of Crimea" },
    note: {
      uk: "Порушення прав людини, націоналізація активів.",
      en: "Human-rights violations and the seizure of assets.",
    },
    // Paris because the Oschadbank award – the largest here at $1.1bn – was
    // made there. The map listed Oschadbank among the decisions this site
    // leads to while drawing no line to where it was decided.
    //
    // The ICJ is named because this card links one of its cases. It was
    // missing from `forums` while `cases` led to icj-cerd-icsft, so the card
    // spelled out two of the three fora it actually sends a reader to.
    courts: ["strasbourg", "hague", "paris"],
    forums: {
      uk: "ЄСПЛ (Страсбург) · ICJ і PCA (Гаага) · PCA (Париж)",
      en: "ECtHR (Strasbourg) · the ICJ and the PCA (The Hague) · the PCA (Paris)",
    },
    // WHAT THIS COUNTS: the registry rows whose subject is the occupation of
    // Crimea, in the fora named above. Eleven, and they can be listed –
    // icj-1 (CERD limb; its note reads "Crimea, Donbas"), ecthr-4 (Ukraine v
    // Russia (re Crimea)), and the nine BIT arbitrations over property taken
    // in Crimea: pca-20 Naftogaz/Chornomornaftogaz (PCA 2017-16), pca-21
    // Belbek, pca-22 PrivatBank, pca-23 Oschadbank, pca-24 Ukrnafta, pca-25
    // Stabil and others, pca-26 Everest Estate, pca-27 Lugzor and others,
    // pca-28 DTEK Krymenergo.
    //
    // It said 8, and no definition reconstructs 8 from this registry: the
    // arbitrations alone are 9, and with the ICJ and the ECtHR they are 11.
    // Deliberately NOT counted, so the next reader does not re-derive them:
    // nl-34…nl-37, the Hoge Raad set-aside and enforcement proceedings, which
    // are the afterlife of four awards already counted here rather than
    // separate Crimea cases; and eu-40 (Euroclear), which the registry itself
    // records as an enforcement measure and not a proceeding.
    count: { uk: "11 проваджень", en: "11 proceedings" },
  },
  /* ── «Затримання кораблів» (key `kerch`) – removed, owner's decision ───────
     It was the only event on this map with no `cases`, which made it the only
     member of the «Ще досліджуємо» category – so a legend key, a colour and a
     third of the map's vocabulary existed to describe one dot. Worse, it read
     as a claim about the archive: a reader met one unwritten event and could
     reasonably conclude that one is all there is, when the library holds
     thirty-one proceedings without a write-up. The map carries only what has
     been worked through, and the band above it now says so.

     Nothing about the proceedings is disputed and none of it is lost – they
     are itlos-15 in `content/cases.ts`, whose citation recites both the ITLOS
     provisional-measures case (ITLOS Case No. 26) and the Annex VII merits
     arbitration (PCA Case No. 2019-28). The marker's own note recorded three
     vessels and 24 sailors, seized in 2018, heard at ITLOS (Hamburg) and the
     PCA (The Hague); the `kerch` point is still in europe-map.json.

     TO RESTORE IT: put the event back with a `cases` array once one of the two
     proceedings is written up. Restoring it *without* a write-up also means
     restoring the «Ще досліджуємо» key – `legendUnlit` in both dictionaries is
     still there, and the legend renders that key from the data (see the
     `hasUnlit` test in EventsMap), so it will reappear on its own. */
  {
    key: "mh17",
    cases: ["hague-mh17", "echr-ukraine-netherlands"],
    weight: 3,
    when: { uk: "MH17 · 17.07.2014", en: "MH17 · 17 July 2014" },
    title: { uk: "Збиття рейсу MH17", en: "The downing of flight MH17" },
    note: {
      uk: "ЄСПЛ, суд Нідерландів та апеляція на рішення Ради ICAO до Міжнародного суду ООН.",
      en: "The ECtHR, a Dutch court, and an appeal from the ICAO Council to the ICJ.",
    },
    // Two courts, not three. The note below names the chain in full – the
    // ICAO Council, then the appeal from it to the ICJ – but the Council
    // itself is no longer a seat on this map, so there is nothing here to
    // draw a line to. The proceeding is the registry's icao-16.
    courts: ["strasbourg", "hague"],
    forums: {
      uk: "ЄСПЛ (Страсбург) · ICJ і суд Нідерландів (Гаага)",
      en: "ECtHR (Strasbourg) · ICJ and the Dutch courts (The Hague)",
    },
    count: { uk: "3 рішення", en: "3 decisions" },
  },
  {
    key: "donbas",
    area: "east",
    cases: ["echr-ukraine-netherlands", "icj-cerd-icsft", "icj-genocide", "finland-torden"],
    weight: 4,
    when: { uk: "Схід · 2014", en: "The east · 2014" },
    title: { uk: "Схід України", en: "East of Ukraine" },
    // Three of the four are inter-State applications; the fourth, Finland v
    // Petrovsky, is a national criminal trial of one man. The note used to say
    // only "inter-State applications", which described the card's own link
    // list wrongly.
    note: {
      uk: "Збройний конфлікт – міждержавні заяви та вирок за універсальною юрисдикцією.",
      en: "Armed conflict – inter-State applications and a universal-jurisdiction conviction.",
    },
    // Helsinki: Finland tried Petrovsky for the Aidar ambush under universal
    // jurisdiction, and that judgment is one of the eight written up here.
    // The Hague, because two of the four cases this card links are the ICJ's
    // (icj-cerd-icsft and icj-genocide) and the card drew no line to them.
    courts: ["strasbourg", "hague", "helsinki"],
    forums: {
      uk: "ЄСПЛ (Страсбург) · ICJ (Гаага) · Окружний суд Гельсінкі",
      en: "ECtHR (Strasbourg) · the ICJ (The Hague) · Helsinki District Court",
    },
    // WHAT THIS COUNTS: the four proceedings this card links, one per registry
    // row – ecthr-5 (Ukraine and Netherlands v Russia), icj-1 (the ICSFT limb,
    // terrorism financing in the east), icj-2 (Allegations of Genocide) and
    // fi-38 (Finland v Petrovsky). It said 2 while linking 4.
    // Deliberately NOT counted: ecthr-8, Russia's own inter-State application
    // (App 36958/21, Rule 39 refused). The registry fixes no place for it –
    // its note is the application number and nothing else – so it cannot be
    // put on this site's card without deciding, here, what it is about.
    count: { uk: "4 провадження", en: "4 proceedings" },
  },
  {
    key: "energy",
    area: "country",
    cases: ["dtek-krymenergo"],
    weight: 4,
    when: { uk: "Енергетика · 2020", en: "Energy · 2020" },
    title: { uk: "Енергоактиви", en: "Energy assets" },
    note: {
      uk: "Укренерго, Енергоатом, ДТЕК – арбітражі проти РФ.",
      en: "Ukrenergo, Energoatom and DTEK – arbitrations against Russia.",
    },
    courts: ["hague"],
    forums: { uk: "PCA (Гаага)", en: "PCA (The Hague)" },
    // WHAT THIS COUNTS: the arbitrations against Russia over generation and
    // grid assets that this registry holds – pca-28 DTEK Krymenergo (PCA
    // 2018-41), pca-29 Ukrenergo (PCA 2020-17), pca-30 Energoatom (II) and
    // pca-31 Ukrhydroenergo. Four, and the note above names three of the four
    // operators.
    //
    // It said 6, which nothing here reconstructs. Two things it is not: the
    // Naftogaz/Gazprom gas arbitrations (scc-17, scc-18, icc-arb-19) and
    // Naftogaz v Russia (pca-20) are gas-supply and Crimea-expropriation
    // matters, and adding them gives 8, not 6; and row pca-30 is styled
    // "(II)" while the registry holds no Energoatom (I), so the missing first
    // arbitration cannot be counted from this file either. If the six is
    // right in the world, the two extra proceedings have to enter the
    // registry before this card may say so.
    count: { uk: "4 арбітражі", en: "4 arbitrations" },
  },
  {
    key: "mariupol",
    area: "country",
    cases: ["icc-ukraine"],
    weight: 6,
    when: { uk: "2022", en: "2022" },
    title: { uk: "Воєнні злочини", en: "War crimes" },
    note: {
      uk: "Ситуація в Україні – розслідування та ордери Міжнародного кримінального суду.",
      en: "The situation in Ukraine – the ICC's investigation and its arrest warrants.",
    },
    courts: ["hague"],
    forums: { uk: "ICC (Гаага)", en: "ICC (The Hague)" },
    // WHAT THIS COUNTS: the six arrest warrants on the registry – icc-9 Putin,
    // icc-10 Lvova-Belova, icc-11 Kobylash, icc-12 Sokolov, icc-13 Shoigu,
    // icc-14 Gerasimov. Warrants, not proceedings: the umbrella situation
    // (icc-situation, ICC-01/22) is the investigation they issue from and is
    // not one of the six.
    //
    // Which is why this marker cannot use the "written up: n of total" line
    // every other one uses. The case linked below is that situation, so the
    // card was reading «Опрацьовано 1 з 6» – one of the six warrants written
    // up, when none is. `linksOutsideCount` says so, and the card states the
    // relation instead of doing arithmetic across two different things.
    linksOutsideCount: true,
    count: { uk: "6 ордерів", en: "6 warrants" },
  },
];

/**
 * The short name a city's court wears on the drawing when it lights up.
 *
 * The map labelled its cities and nothing else, so "ГААГА" stood for four
 * institutions and said none of them. Only the abbreviations are used, because
 * those are what the case citations carry; where a city has none at all – a
 * national court, an enforcement body – the clause before the em dash in its
 * own name stands in, which is the shortest true name this file already
 * records. Nothing here is invented, and a seat that has neither is simply not
 * badged: the card and the legend still spell every institution out.
 */
export function courtBadges(c: MapCourt, locale: Locale): string[] {
  const abbrs = c.seats
    .map((s) => abbrOf(s.abbr, locale))
    .filter((a): a is string => !!a);
  if (abbrs.length) return abbrs;
  const first = c.seats[0];
  return first ? [pick(first.name, locale).split(" – ")[0].trim()] : [];
}

/** The acronym a citation carries, in the language the reader is reading in. */
const abbrOf = (a: string | Localized | undefined, locale: Locale) =>
  a === undefined ? undefined : typeof a === "string" ? a : pick(a, locale);

/**
 * "ICJ – Міжнародний суд ООН · ICC – …" – every institution seated in one
 * city, on one line.
 *
 * Exported rather than written out at each render site: the home band and the
 * map's own page both build it, and they had drifted to two copies of the same
 * expression, which is how one of them would have kept the old single-string
 * abbreviation after the other stopped.
 */
export function seatsLine(c: MapCourt, locale: Locale): string {
  return c.seats
    .map((s) => {
      const a = abbrOf(s.abbr, locale);
      return a ? `${a} – ${pick(s.name, locale)}` : pick(s.name, locale);
    })
    .join(" · ");
}

/**
 * The states the map lights, and the courts that sit in each.
 *
 * The drawing gained lit countries before it gained a way to press one: a
 * reader could see that six states hear these cases and could only ask about
 * them by finding the city dot inside. The owner's note is that pressing a
 * country should do what pressing a city does – put that country's courts in
 * the panel, as a list, each linking to its own caseload in the registry.
 *
 * `key` is the atlas's own name for the shape, so it matches a key of `forums`
 * in europe-map.json rather than being a second spelling of the same country.
 * The guard at the foot of this file checks that it does, and that every court
 * named here exists – a country whose shape is lit but whose press does
 * nothing, or which claims a court that is not on the map, is exactly the kind
 * of silent gap the rest of these checks exist for.
 *
 * France holds two: the ECtHR in Strasbourg and the ICC's Court of
 * Arbitration in Paris. That is why this is a list of courts per country and
 * not a court with a country attached.
 *
 * Belgium is deliberately absent. Brussels is on the map – Euroclear, where
 * the Russian central-bank assets are immobilised – but it is not a court, so
 * Belgium is not one of the states whose courts hear these cases and its shape
 * is not lit. Pressing the Brussels marker still works; there is simply no
 * country under it to press.
 */
export const MAP_COUNTRIES: {
  key: string;
  name: Localized;
  /** "in <this country>" – see the note on `MapCourt.at`. */
  at: Localized;
  courts: string[];
}[] = [
  {
    key: "Netherlands",
    name: { uk: "Нідерланди", en: "The Netherlands" },
    at: { uk: "в Нідерландах", en: "in the Netherlands" },
    courts: ["hague"],
  },
  {
    key: "France",
    name: { uk: "Франція", en: "France" },
    at: { uk: "у Франції", en: "in France" },
    courts: ["strasbourg", "paris"],
  },
  {
    key: "Germany",
    name: { uk: "Німеччина", en: "Germany" },
    at: { uk: "у Німеччині", en: "in Germany" },
    courts: ["hamburg"],
  },
  {
    key: "Sweden",
    name: { uk: "Швеція", en: "Sweden" },
    at: { uk: "у Швеції", en: "in Sweden" },
    courts: ["stockholm"],
  },
  {
    key: "Finland",
    name: { uk: "Фінляндія", en: "Finland" },
    at: { uk: "у Фінляндії", en: "in Finland" },
    courts: ["helsinki"],
  },
  {
    key: "Lithuania",
    name: { uk: "Литва", en: "Lithuania" },
    at: { uk: "у Литві", en: "in Lithuania" },
    courts: ["vilnius"],
  },
];

/**
 * The seats of one marker, one by one, each with the institution it is.
 *
 * `seatsLine` above joins them into a sentence – "ICJ – Міжнародний суд ООН ·
 * ICC – …" – which is what the card used to print. The owner's note on it is
 * specific: build the courts as a list, give every one an active link to the
 * registry, and drop the wide dashes. A run-on line cannot carry four links,
 * and an em-dash between an abbreviation and the name it abbreviates was
 * punctuation standing in for a relation the layout can simply show.
 *
 * `abbr` and `name` come back apart rather than joined, so the card decides
 * how they sit next to each other and no dash is needed to hold them together.
 *
 * The pairing is positional: `seats[i]` is `institutionIds[i]`. That is a
 * quiet assumption to build a link on – get it wrong and a court name points
 * at another court's caseload, which no reader could detect – so the guard at
 * the foot of this file checks the two lists are the same length.
 */
export function seatsList(c: MapCourt, locale: Locale) {
  /* Whether a seat is a state's own court rather than an international one.

     Derived, not written out again: a national seat is already
     `category: "national"` in institutions.ts. The card groups by this – one
     heading over the national rows – rather than tagging each row with its
     state, which is what it did first and which repeated «Нідерланди» in a
     card already headed НІДЕРЛАНДИ.

     Per seat and not per marker, because The Hague's one dot carries three
     international courts and the Dutch judiciary at once. */
  const isNational = (id?: string) =>
    !!id && institutions.find((i) => i.id === id)?.category === "national";
  return c.seats.map((s) => ({
    id: s.institutionId,
    abbr: abbrOf(s.abbr, locale) ?? abbrOfInstitution(s.institutionId, locale),
    national: isNational(s.institutionId),
    name: pick(s.name, locale),
  }));
}

/* A national seat carries no `abbr` of its own in MAP_COURTS – the marker's
   own list names the court, not an acronym – but the registry has one for
   every institution, and the card's first column is empty without it. NL, FI,
   LT: two letters that say which state's courts these are, which is exactly
   the thing the grouping heading above them cannot say per row. */
function abbrOfInstitution(id: string | undefined, locale: Locale) {
  const inst = id ? institutions.find((i) => i.id === id) : undefined;
  return inst && inst.category === "national" ? pick(inst.abbr, locale) : undefined;
}

/**
 * Everything the drawing needs about a court that its card does not.
 *
 * Returned as one object so a render site adds a single spread rather than a
 * line per field – `EventsMap` is a client component and its props are
 * resolved on the server, so anything the SVG needs has to come through here.
 */
export function courtMarks(c: MapCourt, locale: Locale) {
  return { badges: courtBadges(c, locale), offAt: c.offAt };
}

/**
 * Nothing on this map may vanish without the build saying so.
 *
 * `map-links.ts` already refuses to build when a linked decision or a seated
 * institution disagrees with the registry. It could not catch the failure that
 * actually shipped: Montreal had a court entry, a comment claiming it was
 * "named in the legend", and no point in europe-map.json – so it rendered
 * nowhere, and nothing complained. This is the geometry half of that check,
 * next to the data it guards.
 */
{
  const markers = geo.markers as Record<string, number[]>;
  const keys = new Set(MAP_COURTS.map((c) => c.key));
  const wrong: string[] = [];
  for (const c of MAP_COURTS) {
    /* Every institution this marker claims must be claimed back by one of its
       seats, and no seat may name an institution the marker does not hold.
       This is what makes a court name in a card a link the reader can trust:
       without it a seat could point at another court's caseload and the page
       would look entirely correct. The first version of this check compared
       lengths and paired by position, which was wrong on Paris – see the note
       on `seats` above. */
    const claimed = c.seats.map((s) => s.institutionId).filter(Boolean) as string[];
    for (const id of c.institutionIds) {
      if (!claimed.includes(id)) {
        wrong.push(`court "${c.key}" holds institution "${id}", but no seat of it says so`);
      }
    }
    for (const id of claimed) {
      if (!c.institutionIds.includes(id)) {
        wrong.push(`court "${c.key}" has a seat naming institution "${id}", which the marker does not hold`);
      }
    }
    if (c.offMap) {
      if (!c.offAt) wrong.push(`court "${c.key}" is offMap and has no offAt to dock it by`);
    } else if (!(c.key in markers)) {
      wrong.push(`court "${c.key}" has no point in europe-map.json and is not offMap`);
    }
  }
  /* A lit country the reader can press must have a shape to press and courts
     to show. Both halves are checked: a name that is not in `forums` lights
     nothing, and a court key that is not on the map opens an empty panel. */
  const shapes = (geo as { forums?: Record<string, string> }).forums ?? {};
  for (const c of MAP_COUNTRIES) {
    if (!(c.key in shapes)) {
      wrong.push(`country "${c.key}" is not among the lit shapes in europe-map.json`);
    }
    for (const k of c.courts) {
      if (!keys.has(k)) wrong.push(`country "${c.key}" names court "${k}", which is not on the map`);
    }
  }
  for (const name of Object.keys(shapes)) {
    if (!MAP_COUNTRIES.some((c) => c.key === name)) {
      wrong.push(`shape "${name}" is lit but no country entry says what pressing it should show`);
    }
  }

  const areas = (geo as { areas?: Record<string, string> }).areas ?? {};
  for (const e of MAP_EVENTS) {
    if (!(e.key in markers)) wrong.push(`event "${e.key}" has no point in europe-map.json`);
    // A marker that says it speaks for ground and has no ground to light would
    // fail silently – the drawing would simply omit the highlight and go on
    // claiming the point. `country` is Ukraine's own outline and always there.
    if (e.area && e.area !== "country" && !(e.area in areas)) {
      wrong.push(`event "${e.key}" names area "${e.area}", which europe-map.json does not carry`);
    }
    // The radius says how much of the record a place accounts for, and the
    // card says it in words. They came apart once – six radii in one order and
    // six counts in another – so they are checked against each other here.
    // Both locales, because either string could be the one that is edited.
    for (const loc of ["uk", "en"] as const) {
      const said = /^\s*(\d+)/.exec(e.count[loc])?.[1];
      if (said !== String(e.weight)) {
        wrong.push(
          `event "${e.key}" is drawn for ${e.weight} but its ${loc} count reads "${e.count[loc]}"`,
        );
      }
    }
    for (const k of e.courts) {
      if (!keys.has(k)) wrong.push(`event "${e.key}" draws a line to unknown court "${k}"`);
    }
  }
  if (wrong.length) {
    throw new Error(`the map would silently drop something:\n  ${wrong.join("\n  ")}`);
  }
}
