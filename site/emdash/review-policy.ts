/**
 * Review before publish: editors write, an administrator publishes.
 *
 * Every save in the admin can end in «Опублікувати», and a publish is live in
 * two minutes – on a site whose readers are lawyers citing it. EmDash's own
 * roles let an Editor publish anything; nothing between a draft and the
 * public page asked a second person to look. So publishing, unpublishing and
 * scheduling are held to a minimum role, and anyone below it gets a clear
 * refusal that says what to do instead: save the draft and ask for review.
 *
 * The threshold is the build variable PUBLISH_MIN_ROLE (EmDash role levels:
 * 20 Contributor, 30 Author, 40 Editor, 50 Admin); unset, it is 50 – only an
 * administrator publishes. Set it to 40 to let Editors publish directly.
 *
 * Only people are checked. A publish the scheduler carries out was allowed
 * when it was scheduled – and scheduling is checked here too – and the
 * system's and plugins' own actions are not an editor's decision.
 */
import { definePlugin, type PluginContext } from "emdash";

declare const __NSV_PUBLISH_MIN_ROLE__: number;

type Origin = { source: string };
type PolicyEvent = { collection: string; origin: Origin; actor?: { role: number } };

const ROLE_NAMES: Record<number, string> = { 40: "редактор", 50: "адміністратор" };

function decide(action: string) {
  return async (event: PolicyEvent, ctx: PluginContext) => {
    const human = ["api", "mcp", "visual-editor"].includes(event.origin.source);
    if (!human) return;
    const min = __NSV_PUBLISH_MIN_ROLE__;
    const role = event.actor?.role ?? 0;
    if (role >= min) return;
    ctx.log.info(`${action} refused (${event.collection}): role ${role} < ${min}`);
    return {
      cancel: true as const,
      reason:
        `${action[0].toUpperCase()}${action.slice(1)} може лише ${ROLE_NAMES[min] ?? `роль ${min}+`}. ` +
        "Збережіть чернетку й попросіть перевірити й опублікувати.",
    };
  };
}

export function createPlugin() {
  return definePlugin({
    id: "nsv-review-policy",
    version: "1.0.0",
    capabilities: ["hooks.content-policy:register"],
    hooks: {
      "content:beforePublish": decide("публікувати"),
      "content:beforeUnpublish": decide("знімати з публікації"),
      "content:beforeSchedule": decide("планувати публікацію"),
    },
  });
}

export default createPlugin;
