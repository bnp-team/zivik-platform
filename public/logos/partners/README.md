# Partner logos

Drop a partner's own logo file here – **SVG preferred**, otherwise a PNG with a
transparent background at 3× the display height (the row renders marks at 34px,
so ≥ 102px tall). Name the file after the partner's id in `src/content/partners.ts`:
`ifa.svg`, `uku.svg`.

Then add the path to that partner's entry:

    {
      id: "ifa",
      name: { uk: "Інститут зовнішніх зв’язків (ifa)", en: "Institut für Auslandsbeziehungen (ifa)" },
      url: "https://www.ifa.de",
      logo: "/logos/partners/ifa.svg",
    },

`logo` is optional: an entry without one renders the partner's name as text,
which is what all four currently do.

**Use the file the partner supplies.** A logo is a trademark – do not redraw,
recolour, crop or re-letter it. Most organisations publish a press kit with the
permitted variants and the minimum clear space; take the file from there.

Funders often also require a specific funding statement in prescribed wording
next to their mark. That wording has to come from them; it is not something to
paraphrase.
