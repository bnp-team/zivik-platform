/**
 * Publishing in the admin rebuilds the site.
 *
 * Pages are prerendered from a snapshot of published content taken at build
 * time (site/content/), so an edit reaches readers through a build – which is
 * also where src/content's invariants run and can refuse it. This plugin is
 * the trigger: whenever the set of published entries changes, it POSTs the
 * Workers Builds deploy hook in the `DEPLOY_HOOK_URL` secret.
 *
 * Bursts are fine. Cloudflare drops a hook call that arrives while an earlier
 * one is still queued, so publishing ten entries in a row costs one build.
 *
 * Without the secret (local dev, a preview) it logs and does nothing. A hook
 * that cannot be reached, or a malformed secret, is logged with its cause and
 * never thrown: a failed rebuild must not read as a failed publish.
 */
import { definePlugin, type PluginContext } from "emdash";
import { requestRebuild } from "./deploy-hook";

const rebuild = (reason: string, ctx: PluginContext) => requestRebuild(reason, ctx.log);

type Event = { collection: string; id?: string; content?: { slug?: string | null; id?: string } };
const on = (what: string) => async (event: Event, ctx: PluginContext) => {
  await rebuild(`${what} ${event.collection}/${event.content?.slug ?? event.content?.id ?? event.id ?? "?"}`, ctx);
};

export function createPlugin() {
  return definePlugin({
    id: "nsv-rebuild-on-publish",
    version: "1.0.0",
    capabilities: ["content:read"],
    hooks: {
      "content:afterPublish": on("published"),
      "content:afterUnpublish": on("unpublished"),
      "content:afterDelete": on("deleted"),
      "content:afterRestore": on("restored"),
    },
  });
}

export default createPlugin;
