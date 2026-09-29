import { registryProceedings } from "./cases";
import type { Stat } from "./types";

/**
 * Headline figures.
 *
 * Nothing renders these at the moment: the content brief takes the tile row
 * off the home page. The data stays because it is content, not layout, and
 * the repository still serves it – if the figures return somewhere, this is
 * where they come from.
 */
export const stats: Stat[] = [
  /* Counted, not typed. Both figures were literals – "39" and "12" – and the
     first was already wrong by six the moment the ICC warrants stopped being
     rows of the library. A headline figure that a reader can check by
     counting the list has to come from the list. */
  {
    value: String(registryProceedings.length),
    label: { uk: "проваджень", en: "proceedings" },
    gilt: true,
  },
  {
    value: String(
      new Set(registryProceedings.map((c) => c.institutionId)).size,
    ),
    label: { uk: "інстанцій", en: "institutions" },
  },
];
