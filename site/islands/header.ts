/**
 * The header's burger, without React – for pages whose only island is the
 * header.
 *
 * On /about, /team, the legal pages, every pending case and the 404, the bar
 * is the one client component on the page, and hydrating it was the only
 * reason those pages loaded the island runtime: react-dom and the rest, about
 * 197 KB of script, to flip one attribute on a <nav>. Everything else the bar
 * does is markup – links, the language switch, the active item – and the
 * server has already rendered all of it with the right pathname. So on those
 * pages Document.astro loads this instead of client.tsx, and the server
 * render of Header.tsx is left as it is: same elements, same ids, same
 * attributes.
 *
 * This has to do exactly what Header.tsx does, no more and no less, because
 * the two are the same control on different pages:
 *
 *   - the burger toggles the drawer: `aria-expanded` on the button,
 *     `data-open="yes" | "no"` on #nsv-mobnav (header.css keys off that);
 *   - while the drawer is open, Escape shuts it and puts focus back on the
 *     burger, rather than leaving it inside a panel that is now display:none;
 *   - following one of the drawer's items shuts it (the support link opens a
 *     new tab, so the page stays and the drawer must not).
 *
 * A page with any other island hydrates the header with React as before –
 * see Document.astro – so there is never a second handler on the button.
 * Under Next the header is always React: the framework's runtime loads on
 * every page regardless, and there is nothing to save.
 *
 * Keep this in step with Header.tsx until the Next app is retired.
 */
const burger = document.querySelector<HTMLButtonElement>("button.nsv-burger");
const drawer = document.getElementById("nsv-mobnav");

if (burger && drawer) {
  let open = false;

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    set(false);
    burger.focus();
  };

  function set(next: boolean) {
    if (next === open) return;
    open = next;
    burger!.setAttribute("aria-expanded", String(open));
    drawer!.dataset.open = open ? "yes" : "no";
    /* Listening only while open, as the React effect does: a closed drawer
       has no business taking Escape from anything else on the page. */
    if (open) document.addEventListener("keydown", onKey);
    else document.removeEventListener("keydown", onKey);
  }

  burger.addEventListener("click", () => set(!open));
  /* The drawer's own items – the page links and the support ask, which sit
     directly in it. The language switch nested inside it has no handler in
     Header.tsx either, so it has none here. */
  drawer.addEventListener("click", (e) => {
    if ((e.target as Element | null)?.closest("a")?.parentElement === drawer) set(false);
  });
}
