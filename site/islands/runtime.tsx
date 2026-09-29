/**
 * Server half of the island runtime. See vite-plugin.mjs for the why.
 *
 * `island(Component, key)` stands in for a client component while the page
 * renders. It leaves an empty <nsv-island> placeholder in the page and records
 * the component and its props; `renderIslands` then renders every recorded
 * island as a React root of its own and splices it into its placeholder.
 *
 * Each island is its own root on the server because it is its own root in the
 * browser. `useId` derives ids from a component's position in its tree, so an
 * island rendered inside the page and hydrated alone gets different ids on
 * the two sides (the registry's filter buttons pointed at `_R_a_` in the HTML
 * and `_R_0_` after hydration). Rendered alone, with the same
 * `identifierPrefix` the browser uses, the two match by construction.
 *
 * Props must survive JSON, which is the contract a Server → Client boundary
 * already imposes under Next. The one exception RSC allows – JSX passed as a
 * prop, like LampShell's children or TakingsGrid's `note` – is rendered into
 * an <nsv-slot>, and the browser hands the component that slot's existing
 * HTML instead of re-rendering it. Islands inside a slot are islands of their
 * own. `display: contents` (site/styles/islands.css) keeps both wrappers out
 * of layout.
 */
import {
  createContext,
  createElement,
  isValidElement,
  useContext,
  type ComponentType,
  type ReactNode,
} from "react";
import { renderToReadableStream } from "react-dom/server";
import { PathnameContext } from "../shims/navigation";

interface Pending {
  Component: ComponentType<Record<string, unknown>>;
  props: Record<string, unknown>;
}

/** Islands recorded during one page render, in placeholder order. */
export class IslandCollector {
  readonly pending: Pending[] = [];
}

export const CollectorContext = createContext<IslandCollector | null>(null);
const InsideIsland = createContext(false);

function isNode(v: unknown): boolean {
  if (isValidElement(v)) return true;
  return Array.isArray(v) && v.some(isNode);
}

function Slot({ index, children }: { index: number; children: ReactNode }) {
  return (
    <nsv-slot data-s={index}>
      <InsideIsland.Provider value={false}>{children}</InsideIsland.Provider>
    </nsv-slot>
  );
}

export const islandPrefix = (n: number) => `i${n}-`;

export function island<P extends object>(Component: ComponentType<P>, key: string) {
  if (typeof Component !== "function" && typeof Component !== "object") return Component;

  function Island(props: P) {
    const collector = useContext(CollectorContext);
    /* A client component rendered by another client component is part of the
       parent's tree and hydrates with it. Outside a page render (no
       collector) there is nothing to hydrate into, so render it plainly. */
    if (useContext(InsideIsland) || !collector) return <Component {...props} />;

    const serial: Record<string, unknown> = {};
    const live: Record<string, unknown> = {};
    let slot = 0;
    for (const [name, value] of Object.entries(props)) {
      if (isNode(value)) {
        serial[name] = { $slot: slot };
        live[name] = <Slot index={slot}>{value as ReactNode}</Slot>;
        slot += 1;
      } else {
        serial[name] = value;
        live[name] = value;
      }
    }

    const n = collector.pending.length;
    collector.pending.push({
      Component: Component as ComponentType<Record<string, unknown>>,
      props: live,
    });
    return <nsv-island data-k={`${key}#default`} data-n={n} data-p={JSON.stringify(serial)} />;
  }
  Island.displayName = `Island(${key})`;
  return Island;
}

async function renderRoot(node: ReactNode, identifierPrefix?: string): Promise<string> {
  let failure: unknown;
  const stream = await renderToReadableStream(node, {
    identifierPrefix,
    onError(err) {
      failure ??= err;
    },
  });
  await stream.allReady;
  const html = await new Response(stream).text();
  if (failure) throw failure;
  return html;
}

const PLACEHOLDER = /<nsv-island([^>]*?) data-n="(\d+)"([^>]*)><\/nsv-island>/g;

/**
 * Render `page` and every island in it. Errors thrown anywhere – including
 * `notFound()` from inside an island's server render – reject the promise.
 */
export async function renderIslands(page: ReactNode, pathname: string): Promise<string> {
  const collector = new IslandCollector();
  const withContext = (node: ReactNode) =>
    createElement(
      CollectorContext.Provider,
      { value: collector },
      createElement(PathnameContext.Provider, { value: pathname }, node),
    );

  let html = await renderRoot(withContext(page));
  const done = new Map<number, string>();

  for (;;) {
    const todo = [...html.matchAll(PLACEHOLDER)].map((m) => Number(m[2])).filter((n) => !done.has(n));
    if (todo.length === 0) break;
    for (const n of todo) {
      const { Component, props } = collector.pending[n];
      done.set(
        n,
        await renderRoot(
          withContext(createElement(InsideIsland.Provider, { value: true }, createElement(Component, props))),
          islandPrefix(n),
        ),
      );
    }
    html = html.replace(PLACEHOLDER, (whole, before: string, n: string, after: string) => {
      const inner = done.get(Number(n));
      return inner === undefined ? whole : `<nsv-island${before} data-n="${n}"${after}>${inner}</nsv-island>`;
    });
  }
  return html;
}
