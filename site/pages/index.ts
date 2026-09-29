/**
 * `/` → `/uk` or `/en` by Accept-Language – what src/proxy.ts does under Next.
 */
import type { APIRoute } from "astro";
import { defaultLocale, isLocale } from "@/i18n/config";

export const GET: APIRoute = ({ request, redirect }) => {
  let locale: string = defaultLocale;
  for (const part of (request.headers.get("accept-language") ?? "").split(",")) {
    const tag = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(tag)) {
      locale = tag;
      break;
    }
  }
  return redirect(`/${locale}`, 307);
};
