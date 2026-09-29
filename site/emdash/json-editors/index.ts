/**
 * Form editors for the summaries' JSON fields – a plugin with no server side.
 *
 * All it contributes is its admin module (./admin.tsx, `adminEntry` in
 * astro.config.mjs): EmDash hands a field whose `widget` is
 * "nsv-json-editors:<name>" to that module's `fields[name]`. The fields are
 * marked in site/content/collections.ts and applied to the running admin by
 * `cf:content -- schema`.
 */
import { definePlugin } from "emdash";

export function createPlugin() {
  return definePlugin({
    id: "nsv-json-editors",
    version: "1.0.0",
    capabilities: [],
    hooks: {},
  });
}

export default createPlugin;
