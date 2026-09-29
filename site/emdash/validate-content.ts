/**
 * Refuse a save the build would refuse.
 *
 * Eight sections of a decision summary and the map's lists are raw JSON
 * fields (see site/content/collections.ts), and until now the first thing to
 * read them was the build: a missing comma was saved, published, rebuilt –
 * and the build failed on it, left the site on the previous version, and
 * failed again on every later publish until someone found the entry. The
 * editor saw «Опубліковано» the whole time.
 *
 * So the same decoding the build runs (`fromRow`) runs here, on save, and a
 * value it cannot read is refused with the field's own admin label. Drafts
 * too: a draft is where the mistake is cheapest to see.
 *
 * What this cannot catch is a value that parses but has the wrong shape – an
 * object where a list belongs, a key misspelt. The top-level kind is checked
 * (list or object, as the field has always held); the rest still meets the
 * content invariants at build time, which name the entry and the rule.
 */
import { definePlugin, type PluginContext } from "emdash";
import { problems } from "./content-problems";

export function createPlugin() {
  return definePlugin({
    id: "nsv-validate-content",
    version: "1.0.0",
    capabilities: ["content:write"],
    hooks: {
      "content:beforeSave": {
        errorPolicy: "abort",
        handler: async (event: { collection: string; content: Record<string, unknown> }, ctx: PluginContext) => {
          const found = problems(event.collection, event.content);
          if (!found.length) return;
          ctx.log.info(`save refused (${event.collection}): ${found.join("; ")}`);
          throw new Error(`Не збережено – виправте: ${found.join("; ")}`);
        },
      },
    },
  });
}

export default createPlugin;
