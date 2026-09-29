import type { Localized } from "./types";

/**
 * Cities named on the map for orientation – a dot and a name, nothing to
 * press. Not courts and not proceedings; those are `map_courts` and
 * `map_events`. An editor adds a city with its name and coordinates, and the
 * code places it (`src/lib/map-projection.ts`).
 */
export interface MapPlace {
  /** Stable id, latin, e.g. "kyiv". */
  key: string;
  city: Localized;
  /** Degrees east. */
  lon: number;
  /** Degrees north. */
  lat: number;
}

export const mapPlaces: MapPlace[] = [
  { key: "kyiv", city: { uk: "Київ", en: "Kyiv" }, lon: 30.52, lat: 50.45 },
  { key: "lviv", city: { uk: "Львів", en: "Lviv" }, lon: 24.03, lat: 49.84 },
];
