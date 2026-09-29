/**
 * The Centre's own page, on the Faculty of Law's site.
 *
 * One constant, because three surfaces point at it and they must point at the
 * same place: the card in «Про проєкт», the Centre's name inside that page's
 * prose, and the support ask that the top bar, the drawer and the footer all
 * share. It lived as a private `FACULTY_URL` in about/page.tsx while the
 * support ask was a `mailto:`; the moment the ask became this address too,
 * keeping it in one file stopped being tidiness and became the only way the
 * two cannot drift.
 *
 * The address is the owner's own, given twice: «це посилання на центр луї
 * зона на сайті» and, for the support ask,
 * «law.ucu.edu.ua/doslidnyczkyj-czentr-luyi-zona». It refuses automated
 * requests – a security-verification interlude rather than an error – so it
 * cannot be checked from here and is taken on her word.
 */
export const CENTRE_URL = "https://law.ucu.edu.ua/doslidnyczkyj-czentr-luyi-zona";
