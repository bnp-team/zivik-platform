import type { Dictionary } from "./uk";

/**
 * English UI dictionary. Typed as `Dictionary`, so it must mirror the exact
 * shape of the canonical Ukrainian dictionary — a missing or renamed key is a
 * compile error.
 *
 * The one-word rule the Ukrainian file sets out applies here word for word.
 * USER DECISION: the collection has a single name in English — "Library of
 * decisions" — and it is what the page title, the H1, the nav item, the hero
 * CTA, the home band, the footer link and every back link say. The earlier
 * library/registry split ("the library" the site, "the registry" the list) is
 * overruled; do not restore it, and do not reintroduce "registry" as a name
 * for the collection or for anything pointing at it. "Register" stays only
 * where a court or a State names its own — the Register of Damage for Ukraine,
 * the register of depositors quoted in the Oschadbank award — and "docket" is
 * the word for a case number.
 *
 * The route is still `/registry` and the keys are still `registry.*`: renaming
 * a URL that has already been given out is not a vocabulary change.
 */
const en: Dictionary = {
  meta: {
    title: "NaSvitlo — international court decisions on the war against Ukraine",
    description:
      "An open library of international court decisions on Russia's war against Ukraine: the ECtHR, ICJ, ICC and arbitral tribunals. UCU Faculty of Law.",
    ogAlt: "NaSvitlo — library of international court decisions",
  },
  nav: {
    skip: "Skip to content",
    menu: "Menu",
    home: "Home",
      about: "About the project",
    decisions: "Library of decisions",
    map: "Map",
    team: "Team",
    blog: "Blog",
  },
  brand: {
    facultyAlt: "UCU Faculty of Law",
    /* "NaSvitlo", to match «НаСвітло» — see the note in uk.ts. The English
       source materials in content/about.ts already spell it this way. */
    wordmark: "NaSvitlo",
  },
  hero: {
    credit: "A project of",
    creditCentre: "the Louis Sohn Research Centre",
    creditFaculty: "UCU Faculty of Law",
    lead: "The Library of Accountability and Justice for Ukraine — lighting the legal road Ukraine is walking towards justice",
    ctaRegistry: "Library of decisions",
    chainHint: "pull the cord",
    lampLabel: "Turn the lamp on or off",
  },
  intro: {
    text: "An online library of international case-law (the International Court of Justice, the ECtHR, the ICC, the International Tribunal for the Law of the Sea, the Permanent Court of Arbitration) and of foreign national courts, in proceedings to hold Russia accountable for violations committed during the war against Ukraine.",
    about: "About us",
  },
  about: {
    more: "More about the project",
  },
  slogan: "We research · We explain · We bring to light",
  pending: {
    title: "Still being researched",
    body: "This proceeding is in the library, but its summary is not written yet — we are working on it. Below is what is already known, and a link to the court's own document where one is public.",
    forum: "Court",
    status: "Stage",
    kind: "Field",
    docket: "Docket",
    official: "The court's document",
    toRegistry: "The library of decisions",
    toMap: "The map",
  },
  quote: {
    text: "The Russian Federation shall immediately suspend the military operations that it commenced on 24 February 2022 in the territory of Ukraine",
    source: "International Court of Justice · Provisional Measures · 16 March 2022",
    read: "Read the decision",
  },
  mapSection: {
    close: "Close card",
    moveCard: "Move the card",
    label: "Map",
    heading: "The states whose courts hear these cases",
    legendCourt: "Court",
    legendLit: "Written up",
    legendUnlit: "Still researching",
    courtsSeat: "The courts sit in",
    courtHears: "Hears",
    inLibrary: "Which ones",
    caseload: "{n} {w} in the library",
    seatsTotal: "Total {at}: {n} {w}",
    seatsNational: "National courts",
    seatsOpen: "Show in the library",
    caseloadWord: { one: "proceeding", few: "proceedings", many: "proceedings" },
    zoomLabel: "Framing",
    zoomWide: "Europe",
    zoomClose: "Ukraine",
    zoomAtlantic: "Everything",
    zoomReset: "Recentre",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    wheelHint: "Ctrl or ⌘ + scroll to zoom",
    overview: "An overview map. Pick a court from the list below, or open it full screen.",
    openFull: "Full screen",
    closeFull: "Leave full screen",
    reads: "Decisions written up",
    writtenOf: "Written up: {n} of {total}",
    writtenBehind: "The situation these warrants issue from is written up",
    allInRegistry: "See them in the library",
    pending: "Summary in preparation",
    amountLabel: "Amount in dispute",
    legendWhat: "Places",
    legendTitle: "Key",
    placesTitle: "The places",
    legendHow: "What is on the map",
    legendLine: "A court's link to an event",
    legendForum: "A state whose courts hear these cases",
    legendOffMap: "A court outside the frame",
    legendRegions: "Oblast boundaries",
    legendArea: "About all the lit ground",
    legendPick: "Press a court to see the cases it hears.",
    pageTitle: "The map of courts",
    pageLede: "The violations happened in Ukraine; they are judged thousands of kilometres away. The map shows how far the answer reached: the states whose courts are hearing these proceedings.",
    backHome: "Home",
  },
  /* Eight keys lighter. `label`, `heading`, `description`, `fullRegistry`,
     `allCases`, `caseWord`, `legendLit` and `legendQueued` belonged to the
     library band on the home page — the five courts, their caseloads, a row
     of cases apiece — which the review took off. The component went with it;
     these were the only place its words lived, and every one of them made a
     claim about a surface that no longer exists. What stays is what the
     library page and the map still read: the stage and outcome vocabularies
     and the words around them. */
  registry: {
    stageName: "Stage",
    outcomeName: "Decision type",
    stage: {
      preliminary: "Preliminary stage",
      investigation: "Investigation",
      merits: "Merits pending",
      satisfaction: "Awaiting satisfaction",
      appeal: "Under appeal",
      remitted: "Remitted",
      enforcement: "Enforcement",
      suspended: "Suspended",
      frozen: "Frozen",
      upcoming: "Yet to be heard",
      concluded: "Concluded",
    },
    outcome: {
      judgment: "Judgment",
      award: "Final award",
      verdict: "Verdict",
      liability: "Liability established",
      warrant: "Warrant",
      upheld: "Arbitration upheld",
      procedural: "Procedural",
    },
  },
  newsletter: {
    heading: "Each month, a few more decisions brought to light",
    text: "A letter on the decisions we summarised over the month: what the court found, and what of it can be relied on.",
    subscribe: "Get the letter",
    support: "Support the library",
    assurance: "Summaries only. Unsubscribe from any letter.",
  },
  partners: {
    label: "Partners",
    heading: "Who we work with",
    funded: "The project was made with the support of",
    openLabel: "Open to partnership",
    openHeading: "The library grows with those who support it",
    openText:
      "We are looking for institutions ready to work on the accessibility of international justice for Ukraine.",
    openWays: ["Research", "Educational events", "Financial support"],
    openCta: "Write to us",
  },
  footer: {
    tagline:
      "A library of international court decisions on Russia's war against Ukraine. We shed light on what they say.",
    org: "The Louis Sohn Research Centre",
    faculty: "UCU Faculty of Law",
    colArchive: "Library",
    colCenter: "Centre",
    colContacts: "Contacts",
    linkRegistry: "Library of decisions",
    linkMap: "Map",
    linkAbout: "About the project",
    linkTeam: "Team",
    linkBlog: "Blog",
    email: "louis.sohn.center@ucu.edu.ua",
    support: "Support us",
    /* "Svientsitskoho" is the transliteration content/legal.ts already
       uses; the two must not spell the same street two ways. */
    address: "17 Svientsitskoho St., Lviv, 79011",
    rights: "© 2026 the Louis Sohn Research Centre, UCU. Materials — CC BY 4.0.",
    privacy: "Privacy policy",
    terms: "Terms of use",
  },
};

export default en;
