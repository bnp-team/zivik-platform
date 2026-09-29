/**
 * Every save rebuilds the staging site – the preview of drafts.
 *
 * The public site is prerendered from published content, so a draft has
 * nowhere to be seen before «Опублікувати». The staging Worker is the same
 * site built with drafts applied (`cf:pull -- --drafts`, docs/STAGING.md);
 * this plugin calls its deploy hook after each save, so an editor saves,
 * waits two minutes, and reads the page as it will look.
 *
 * Silent until the Worker has a STAGING_DEPLOY_HOOK_URL secret. Bursts are
 * fine: Cloudflare drops a hook call while an earlier one is still queued.
 */
import { definePlugin, type PluginContext } from "emdash";
import { requestRebuild } from "./deploy-hook";

type Event = { collection: string; content?: { slug?: string | null; id?: string } };

export function createPlugin() {
  return definePlugin({
    id: "nsv-staging-on-save",
    version: "1.0.0",
    capabilities: ["content:read"],
    hooks: {
      "content:afterSave": async (event: Event, ctx: PluginContext) => {
        const what = `${event.collection}/${event.content?.slug ?? event.content?.id ?? "?"}`;
        await requestRebuild(`saved ${what}`, ctx.log, "STAGING_DEPLOY_HOOK_URL", true);
      },
    },
  });
}

export default createPlugin;
