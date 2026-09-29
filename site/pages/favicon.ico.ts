/**
 * Browsers ask for /favicon.ico whatever the <link> says – and so does every
 * bot, on every visit.
 *
 * This was a 301 to the hashed file, answered by the Worker: each request ran
 * EmDash's middleware and seven D1 queries (~800 ms) to say «look elsewhere».
 * Prerendered, it is a file in the build output, served by the asset server
 * without the Worker. Not in public/: the Next build has src/app/favicon.ico,
 * and Next refuses a public file and an app route at one path.
 */
import type { APIRoute } from "astro";
// `?inline`, not `fs`: the prerender runs inside workerd, which has no disk.
import icon from "@/app/favicon.ico?inline";

export const prerender = true;

export const GET: APIRoute = () => {
  const bytes = Uint8Array.from(atob(icon.slice(icon.indexOf(",") + 1)), (c) => c.charCodeAt(0));
  return new Response(bytes, { headers: { "content-type": "image/x-icon" } });
};
