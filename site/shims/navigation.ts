/**
 * `next/navigation` under Astro – the three calls this codebase makes.
 *
 * `notFound()` throws a marker the route adapter turns into the 404 page.
 * `usePathname()` reads the path from context: the route provides it on the
 * server (see site/lib/render.tsx) and the island runtime provides
 * `location.pathname` in the browser, so the first client render matches the
 * server's HTML.
 */
import { createContext, useContext } from "react";

export class NotFoundError extends Error {
  readonly digest = "NEXT_NOT_FOUND";
  constructor() {
    super("NEXT_NOT_FOUND");
  }
}

export function notFound(): never {
  throw new NotFoundError();
}

export function isNotFound(err: unknown): boolean {
  return err instanceof NotFoundError || (err as { digest?: string })?.digest === "NEXT_NOT_FOUND";
}

export class RedirectError extends Error {
  constructor(readonly location: string, readonly status: number) {
    super(`REDIRECT ${location}`);
  }
}

export function redirect(location: string): never {
  throw new RedirectError(location, 307);
}

export function permanentRedirect(location: string): never {
  throw new RedirectError(location, 308);
}

export const PathnameContext = createContext<string>("/");

export function usePathname(): string {
  return useContext(PathnameContext);
}

export function useRouter() {
  return {
    push: (href: string) => window.location.assign(href),
    replace: (href: string) => window.location.replace(href),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => window.location.reload(),
    prefetch: () => {},
  };
}
