/**
 * Two ways around «an administrator publishes» (review-policy.ts) that the
 * publish hooks never see.
 *
 * A scheduled entry. EmDash schedules an entry and a time, not a revision:
 * whoever saves the entry afterwards changes what the scheduler publishes,
 * and the scheduler's publish is not checked again. So once an entry is
 * scheduled, only someone who may publish – and never the assistant – may
 * save it. Anyone else is told to ask for the schedule to be cancelled.
 *
 * A published entry in the trash. Moving it to the trash takes its page off
 * the site at the next build, exactly as unpublishing does, but EmDash's
 * delete hook carries no user to check. So a published entry cannot be
 * trashed at all: unpublish it first, which is checked.
 */
import { definePlugin, type PluginContext } from "emdash";

declare const __NSV_PUBLISH_MIN_ROLE__: number;

type Actor = { role: number; source?: string };

export function createPlugin() {
  return definePlugin({
    id: "nsv-live-guard",
    version: "1.0.0",
    capabilities: ["content:write"],
    hooks: {
      "content:beforeSave": {
        errorPolicy: "abort",
        handler: async (
          event: { collection: string; id?: string; actor?: Actor },
          ctx: PluginContext,
        ) => {
          if (!event.id || !event.actor) return;
          const { role, source } = event.actor;
          if (source !== "mcp" && role >= __NSV_PUBLISH_MIN_ROLE__) return;
          const item = await ctx.content?.get(event.collection, event.id);
          if (!item?.scheduledAt) return;
          ctx.log.info(`save refused (${event.collection}/${event.id}): scheduled, role ${role}${source === "mcp" ? ", assistant" : ""}`);
          throw new Error(
            "Не збережено: запис заплановано на публікацію, і в ньому вийде саме те, що збережено останнім. " +
              "Попросіть адміністратора скасувати розклад або внести правку.",
          );
        },
      },
      "content:beforeDelete": async (event: { collection: string; id: string }, ctx: PluginContext) => {
        const item = await ctx.content?.get(event.collection, event.id);
        if (item?.status !== "published" && !item?.scheduledAt) return;
        ctx.log.info(`delete refused (${event.collection}/${event.id}): published or scheduled – unpublish first`);
        return false;
      },
    },
  });
}

export default createPlugin;
