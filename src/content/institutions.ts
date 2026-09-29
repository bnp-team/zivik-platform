import type { Institution } from "./types";

/**
 * Courts, tribunals and bodies hearing cases against Russia. `phase1` marks the
 * five international courts featured on the homepage registry (per the project's
 * "Phase 1" court list); the rest surface in the full registry.
 */
export const institutions: Institution[] = [
  {
    id: "icj",
    abbr: { uk: "ICJ", en: "ICJ" },
    name: { uk: "Міжнародний суд ООН", en: "International Court of Justice" },
    seat: { uk: "Гаага", en: "The Hague" },
    category: "international",
    phase1: true,
    order: 1,
  },
  {
    id: "ecthr",
    /* ECtHR, not «ЄСПЛ», і в українській теж. Власниця: «ЄСПЛ - пиши
       англійською мовою». Це був єдиний кириличний бейдж у наборі – поруч
       стояли ICJ, ICC, ITLOS, PCA, і один знак іншою абеткою читався як
       інший рід об'єкта. Повна назва в рядку під ним лишається українською. */
    abbr: { uk: "ECtHR", en: "ECtHR" },
    name: {
      uk: "Європейський суд з прав людини",
      en: "European Court of Human Rights",
    },
    seat: { uk: "Страсбург", en: "Strasbourg" },
    category: "international",
    phase1: true,
    order: 2,
  },
  {
    id: "icc",
    abbr: { uk: "ICC", en: "ICC" },
    name: {
      uk: "Міжнародний кримінальний суд",
      en: "International Criminal Court",
    },
    seat: { uk: "Гаага", en: "The Hague" },
    category: "international",
    phase1: true,
    order: 3,
  },
  {
    id: "itlos",
    abbr: { uk: "ITLOS", en: "ITLOS" },
    name: {
      uk: "Міжнародний трибунал з морського права",
      en: "International Tribunal for the Law of the Sea",
    },
    seat: { uk: "Гамбург", en: "Hamburg" },
    category: "international",
    phase1: true,
    order: 4,
  },
  {
    id: "pca",
    abbr: { uk: "PCA", en: "PCA" },
    name: {
      uk: "Постійна палата третейського суду",
      en: "Permanent Court of Arbitration",
    },
    seat: { uk: "Гаага", en: "The Hague" },
    category: "arbitration",
    phase1: true,
    order: 5,
  },
  {
    id: "icao",
    abbr: { uk: "ICAO", en: "ICAO" },
    name: { uk: "Рада ІКАО", en: "ICAO Council" },
    seat: { uk: "Монреаль", en: "Montreal" },
    category: "international",
    phase1: false,
    order: 6,
  },
  {
    id: "scc",
    abbr: { uk: "SCC", en: "SCC" },
    name: {
      uk: "Арбітражний інститут Торгової палати Стокгольма",
      en: "Arbitration Institute of the Stockholm Chamber of Commerce",
    },
    seat: { uk: "Стокгольм", en: "Stockholm" },
    category: "arbitration",
    phase1: false,
    order: 7,
  },
  {
    id: "icc-arb",
    abbr: { uk: "ICC (арб.)", en: "ICC (arb.)" },
    name: {
      uk: "Міжнародний арбітражний суд ICC",
      en: "ICC International Court of Arbitration",
    },
    seat: { uk: "Париж", en: "Paris" },
    category: "arbitration",
    phase1: false,
    order: 8,
  },
  {
    id: "nl",
    abbr: { uk: "NL", en: "NL" },
    name: { uk: "Суди Нідерландів", en: "Courts of the Netherlands" },
    seat: null,
    category: "national",
    phase1: true,
    order: 9,
  },
  {
    id: "fi",
    abbr: { uk: "FI", en: "FI" },
    name: { uk: "Суди Фінляндії", en: "Courts of Finland" },
    seat: null,
    category: "national",
    phase1: true,
    order: 10,
  },
  {
    id: "lt",
    abbr: { uk: "LT", en: "LT" },
    name: { uk: "Суди Литви", en: "Courts of Lithuania" },
    seat: null,
    category: "national",
    phase1: false,
    order: 11,
  },
  {
    id: "eu",
    abbr: { uk: "ЄС", en: "EU" },
    name: {
      uk: "ЄС / Бельгія – виконавчі заходи",
      en: "EU / Belgium – enforcement measures",
    },
    seat: null,
    category: "executive",
    phase1: false,
    order: 12,
  },
];
