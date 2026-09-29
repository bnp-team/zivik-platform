/**
 * Where a place is on the map, from its latitude and longitude.
 *
 * The drawing in src/content/europe-map.json is a Mercator projection fitted to
 * seven corner points (`scripts/europe-map.mjs`): these three numbers are the
 * result of that fit, so a city an editor adds in the admin lands exactly where
 * the generator would have put it – checked against the Hague, Kyiv, Crimea
 * and Stockholm markers already in the file, which agree to a tenth of a unit.
 * If the generator's frame ever changes, so must these.
 */
const SCALE = 926.2816529046138;
const TX = 252.41671015398265;
const TY = 1235.0180725636178;

/** The frame of the drawing, in the same units. */
export const MAP_WIDTH = 1200;
export const MAP_HEIGHT = 460;

const round = (n: number) => Math.round(n * 10) / 10;

export function projectPoint(lon: number, lat: number): [number, number] {
  const lam = (lon * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  return [round(SCALE * lam + TX), round(TY - SCALE * Math.log(Math.tan(Math.PI / 4 + phi / 2)))];
}
