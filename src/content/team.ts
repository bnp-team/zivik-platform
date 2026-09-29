import type { Localized } from "./types";

/**
 * The people behind the archive.
 *
 * Roles are given in Ukrainian as the project uses them and in the English of
 * the grant structure the project is staffed under, which is where "Component
 * Lead" and "Research Assistant" come from – those are the titles that appear
 * in the paperwork, so they stay verbatim rather than being re-translated.
 */
export interface TeamMember {
  name: Localized;
  role: Localized;
  /**
   * Portrait, as a path under `/public/team/` – e.g. "/team/denkovych.jpg".
   *
   * Optional on purpose. Photographs arrive one at a time, and a row of
   * placeholder silhouettes next to two real faces looks worse than no faces
   * at all; a member without this field simply renders without a portrait,
   * and the list stays even. Square source, 400×400 or larger.
   */
  photo?: string;
}

export const team: TeamMember[] = [
  {
    name: { uk: "Ольга Денькович", en: "Olha Denkovych" },
    role: { uk: "Координаторка проєкту", en: "Project Coordinator" },
    photo: "/team/denkovych.jpg",
  },
  {
    name: { uk: "Тарас Лешкович", en: "Taras Leshkovych" },
    role: { uk: "Старший дослідник", en: "Component Lead" },
    photo: "/team/leshkovych.jpg",
  },
  {
    name: { uk: "Марта Яциніна", en: "Marta Yatsynina" },
    role: { uk: "Старша дослідниця", en: "Component Lead" },
    photo: "/team/yatsynina.jpg",
  },
  {
    name: { uk: "Марія Грицишин", en: "Mariia Hrytsyshyn" },
    role: { uk: "Асистентка дослідника", en: "Research Assistant" },
  },
  {
    name: { uk: "Ірина Пантелеймонюк", en: "Iryna Panteleimoniuk" },
    role: { uk: "Асистентка дослідника", en: "Research Assistant" },
  },
  {
    name: { uk: "Віола Мартинюк", en: "Viola Martyniuk" },
    role: { uk: "Технічна експертка", en: "Technical Expert" },
    photo: "/team/martyniuk.jpg",
  },
  {
    name: { uk: "Андрій Удовиченко", en: "Andrii Udovychenko" },
    role: { uk: "Технічний експерт", en: "Technical Expert" },
    photo: "/team/udovychenko.jpg",
  },
];

/**
 * The roles as groups, for the «Хто над цим працює» band on /about.
 *
 * Keyed by `role.en`, which is the grant title and is the same string for
 * both holders of a post; the Ukrainian role is gendered – «Старший
 * дослідник» and «Старша дослідниця» are one job – so grouping on it would
 * split every pair the grouping exists to join.
 *
 * The labels are plural where the group has more than one person and are the
 * member's own role where it has one. They live here rather than being made
 * by a rule, because Ukrainian plurals of a gendered noun are a choice about
 * people and not a transformation: both assistants are women, so the label
 * is «Асистентки», and the two technical roles are mixed, so it is the
 * masculine plural the language uses for a mixed set.
 *
 * Order is the order the band reads in, and it is the order `team` is
 * written in; a role missing from this table still renders, under its own
 * name, so adding a person cannot make them disappear.
 */
export const teamGroups: { key: string; label: Localized }[] = [
  {
    key: "Project Coordinator",
    label: { uk: "Координаторка проєкту", en: "Project Coordinator" },
  },
  {
    key: "Component Lead",
    label: { uk: "Старші дослідники", en: "Component Leads" },
  },
  {
    key: "Research Assistant",
    label: { uk: "Асистентки дослідника", en: "Research Assistants" },
  },
  {
    key: "Technical Expert",
    label: { uk: "Технічні експерти", en: "Technical Experts" },
  },
];

/**
 * The roster, in the order the band reads: each group's label, then its
 * people.
 *
 * Here rather than in the page because it is data shaping, not markup – and
 * because `teamGroups` above has exactly one reader, so the table and the
 * walk over it belong in one file where they can be read together.
 *
 * A role the table does not name still renders, under its own name, at the
 * end: adding a person cannot make them disappear from the page because
 * somebody forgot the table.
 */
export function groupTeamByRole(): {
  key: string;
  label: Localized;
  members: TeamMember[];
}[] {
  const byKey = new Map<string, TeamMember[]>();
  for (const m of team) {
    const list = byKey.get(m.role.en);
    if (list) list.push(m);
    else byKey.set(m.role.en, [m]);
  }
  const out: { key: string; label: Localized; members: TeamMember[] }[] = [];
  for (const g of teamGroups) {
    const members = byKey.get(g.key);
    if (!members) continue;
    byKey.delete(g.key);
    out.push({ key: g.key, label: g.label, members });
  }
  for (const [key, members] of byKey) {
    out.push({ key, label: members[0].role, members });
  }
  return out;
}
