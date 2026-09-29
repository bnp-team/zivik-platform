"use client";

import geometry from "@/content/europe-map.json";

/**
 * The map, as the ground the lamp lights.
 *
 * Not a second copy of `EventsMap`. That component is the archive's map – pan,
 * zoom, three framings, court cards, a legend – and none of it belongs on a
 * first screen, where the reader has not asked a question yet. This is the
 * same geometry with everything that answers a question taken out: no
 * markers, no labels, no legend, nothing to press. Six countries and Ukraine,
 * and that is the whole drawing.
 *
 * Why it is here at all: the owner's note is that the map should be the
 * background of the first section and appear when the light comes on. That
 * turns the hero's metaphor into a sentence the page can actually say – the
 * lamp is lit, and what it shows is the countries where this war is being
 * judged. Pull the chain and they go dark with everything else.
 *
 * It joins the family of things the lamp lights (`.bcone`, `.bpool`, the lit
 * wordmark): same `--lit` fade on scroll, same disappearance at
 * `[data-on="no"]`, same z-index 1 under the text at 3. Nothing here is a new
 * behaviour; it is one more surface the existing switch already governs.
 *
 * Marked "use client" despite having no interactivity, and the reason is
 * weight rather than behaviour. As a server component its 68 outlines
 * travelled twice in every home page – once as the markup that draws them and
 * again inside the flight payload, because that payload carries a server
 * component's rendered output. Measured: 136 occurrences of `hmap-ctx` in a
 * document that draws 68, and 60.2 kB gzipped for a page that had been 26.6.
 *
 * A client component is serialized as a reference and its props, not its
 * output, so the paths are in the HTML once and the geometry rides in a JS
 * chunk the browser caches and shares with the map's own page. It still
 * server-renders, so the light has something to fall on in the first frame –
 * a background that pops in after hydration is worse than no background.
 */
interface HeroGeometry {
  viewBox: string;
  /** Every country in the frame, as the outlines that make this read as a map. */
  context: string[];
  /** Meridians and parallels – the lines a tilted plane is read from. */
  grid: string;
  ukraine: string;
  forums: Record<string, string>;
}

const geo = geometry as HeroGeometry;

/**
 * The drawing's frame, with room on every side of it.
 *
 * The generator's frame is 1200x460 – a strip cut to hold Europe and nothing
 * else. A background cannot use it as-is: the hero is 2.2:1 on a desktop and
 * near square on a narrow window, and fitting either one means the continent
 * is drawn at whatever size is left over. Covering a square section with the
 * bare strip left 40% of the map's width; padding it only vertically fixed
 * that and left the desktop case drawing Europe edge to edge, at a scale where
 * the countries read as slabs rather than as a map.
 *
 * So the frame is padded on both axes – half again as wide, twice as tall –
 * and Europe sits inside it at about two thirds of the width, with room around
 * it for the crop to eat. Derived from the committed viewBox rather than
 * written out, so a regenerated frame brings its padding with it.
 */
const [vx, vy, vw, vh] = geo.viewBox.split(" ").map(Number);
const PAD_X = vw * 0.25;
const PAD_Y = (vw * 1.5) / 1.8 / 2 - vh / 2;
const framed = `${vx - PAD_X} ${vy - PAD_Y} ${vw + PAD_X * 2} ${vh + PAD_Y * 2}`;

export default function HeroMap() {
  return (
    <span className="hmap" aria-hidden="true">
      <svg
        viewBox={framed}
        /* Cover. The map is the section's ground, so it fills it.

           This went the other way first – `meet`, so the whole frame fitted –
           because with only the six lit shapes on it, cropping left countries
           a reader could not place. The continent is drawn now, so there is
           always geography under the crop and the drawing reads as a map at
           any size the section takes. */
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {/* Meridians and parallels, under everything.

            They are the reason the tilt is visible. The rotation was applied,
            measured and still invisible, because perspective is read from
            parallel lines converging and a map has none – irregular coastlines
            just come out slightly squashed. The graticule gives the eye the
            straight lines it needs, and it is the honest thing to draw on a
            map lying on a table. */}
        <path className="hmap-grid" d={geo.grid} />
        {/* The continent, so the lit six are countries rather than shapes.

            The first version left this out – the note was "only the lit
            countries" – and it was right about the ink and wrong about the
            reading: six glowing forms with nothing around them are a
            constellation, not a map, and the owner said so on seeing it. The
            outlines carry no fill and almost no weight; they are there to be
            recognised, not looked at. */}
        {geo.context.map((d, i) => (
          <path key={`c${i}`} className="hmap-ctx" d={d} />
        ))}
        {Object.entries(geo.forums).map(([name, d]) => (
          <path key={name} className="hmap-state" d={d} />
        ))}
        {/* Ukraine, outlined rather than filled – the same division of labour
            the archive's own map makes, where the gold stroke is what says
            "this is the subject" and the fill says "this one is lit". Six lit
            countries with nothing between them would be a constellation
            nobody could read; with Ukraine drawn they are a sentence about
            where its road is being lit from. */}
        <path className="hmap-ua" d={geo.ukraine} />
      </svg>
    </span>
  );
}
