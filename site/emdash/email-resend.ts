/**
 * Email for the admin: sign-in links, access recovery, invitations.
 *
 * EmDash sends none of these until a plugin provides `email:deliver`, and
 * until now none did – «Увійти за посиланням на пошту» answered
 * EMAIL_NOT_CONFIGURED, a lost passkey could only be replaced by another
 * admin, and an invitation was a link to copy by hand.
 *
 * This provider posts to Resend's HTTP API (https://resend.com): one fetch, no
 * SDK, and a free tier far above what an editorial team sends. It is
 * registered only when the build sets EMAIL_PROVIDER=resend (astro.config.mjs),
 * because a registered provider is what makes the admin offer email sign-in –
 * offering it before the key exists would show editors a button that fails.
 *
 * Runtime settings (Worker → Settings → Variables and Secrets):
 *   RESEND_API_KEY – Secret; a sending-only key.
 *   EMAIL_FROM     – the sender, on a domain verified in Resend, e.g.
 *                    «НаСвітло <admin@nasvitlo.org>».
 * Neither is logged; a failure is logged with Resend's status and message.
 */
import { definePlugin, type PluginContext } from "emdash";
import { env } from "cloudflare:workers";

type Message = {
  to: string;
  cc?: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
};

async function deliver(event: { message: Message; source: string }, ctx: PluginContext) {
  const vars = env as unknown as Record<string, string | undefined>;
  const key = vars.RESEND_API_KEY?.trim();
  const from = vars.EMAIL_FROM?.trim();
  if (!key || !from) {
    ctx.log.error(
      `email not sent (${event.source}): ${!key ? "RESEND_API_KEY" : "EMAIL_FROM"} is not set on the Worker`,
    );
    throw new Error("Пошта не налаштована: бракує RESEND_API_KEY або EMAIL_FROM у Worker.");
  }
  const { message } = event;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [message.to],
      ...(message.cc?.length ? { cc: message.cc } : {}),
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    }),
  });
  if (!res.ok) {
    const body = (await res.text().catch(() => "")).slice(0, 300);
    ctx.log.error(`email not sent (${event.source}): Resend ${res.status} ${body}`);
    throw new Error(`Лист не надіслано: Resend відповів ${res.status}.`);
  }
  ctx.log.info(`email sent (${event.source})`);
}

export function createPlugin() {
  return definePlugin({
    id: "nsv-email-resend",
    version: "1.0.0",
    capabilities: ["email:provide"],
    hooks: {
      "email:deliver": { exclusive: true, handler: deliver },
    },
  });
}

export default createPlugin;
