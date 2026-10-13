/*
 * Хітмапи PostHog – див. src/lib/analytics.ts. Підключається лише тоді,
 * коли збірка має NEXT_PUBLIC_POSTHOG_KEY; ключ приходить з data-key.
 * Без cookie і localStorage, без записів сесій.
 *
 * Збирається рівно те, що названо в політиці конфіденційності
 * (src/content/legal.ts): адреса сторінки й сторінки переходу, місця
 * натискань, глибина прокрутки. Тексти й атрибути елементів маскуються,
 * з адрес відкидаються параметри запиту й фрагмент (у них бувають пошукові
 * запити й мітки кампаній), а autocapture слухає лише натискання – не
 * зміни полів і не надсилання форм.
 */
(() => {
  const me = document.currentScript;
  const key = me && me.dataset.key;
  if (!key) return;
  const URL_PROPS = ["$current_url", "$referrer", "$initial_referrer", "$prev_pageview_url", "$initial_current_url"];
  const bare = (v) => {
    try {
      const u = new URL(v);
      return u.origin + u.pathname;
    } catch {
      return v.split(/[?#]/)[0];
    }
  };
  const lib = document.createElement("script");
  lib.src = "https://eu-assets.i.posthog.com/static/array.js";
  lib.async = true;
  lib.onload = () => {
    if (!window.posthog || typeof window.posthog.init !== "function") return;
    window.posthog.init(key, {
      api_host: "https://eu.i.posthog.com",
      ui_host: "https://eu.posthog.com",
      persistence: "memory",
      person_profiles: "identified_only",
      disable_session_recording: true,
      disable_surveys: true,
      autocapture: { dom_event_allowlist: ["click"] },
      enable_heatmaps: true,
      capture_pageview: true,
      capture_pageleave: true,
      mask_all_text: true,
      mask_all_element_attributes: true,
      before_send: (event) => {
        if (!event || !event.properties) return event;
        for (const k of URL_PROPS) {
          const v = event.properties[k];
          if (typeof v === "string") event.properties[k] = bare(v);
        }
        return event;
      },
    });
  };
  document.head.append(lib);

  /* Named click events (plan in the SEO audit, 13.10.2026). One listener
     classifies a link by where it goes; every property is a controlled
     value – a slug from this site's own path, a hostname, a language. */
  const SUPPORT_HOST = "supporting.ucu.edu.ua";
  const send = (event, props) => {
    if (window.posthog && typeof window.posthog.capture === "function") {
      window.posthog.capture(event, Object.assign({ locale: document.documentElement.lang || "uk" }, props));
    }
  };
  const here = location.pathname.split("/").filter(Boolean);
  const caseSlug = here[1] === "cases" ? here[2] || "" : "";
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!a) return;
      let u;
      try {
        u = new URL(a.href, location.href);
      } catch {
        return;
      }
      const pageType = here[1] || "home";
      if (u.hostname === SUPPORT_HOST) {
        send("support_click", { place: a.closest("footer") ? "footer" : a.closest("header") ? "header" : "page", page_type: pageType });
        return;
      }
      if (u.origin === location.origin) {
        const to = u.pathname.split("/").filter(Boolean);
        if (to[0] && here[0] && to[0] !== here[0] && to.slice(1).join("/") === here.slice(1).join("/")) {
          send("language_switch", { from: here[0], to: to[0], page_type: pageType });
        } else if (here[1] === "registry" && to[1] === "cases" && to[2]) {
          send("case_open", { case_slug: to[2], from: "registry" });
        }
        return;
      }
      if (caseSlug) {
        const pdf = /\.pdf$/i.test(u.pathname);
        send(pdf ? "decision_pdf_click" : "source_open", { case_slug: caseSlug, domain: u.hostname });
      }
    },
    { capture: true },
  );
})();
