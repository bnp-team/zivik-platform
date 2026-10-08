/*
 * Хітмапи PostHog – див. src/lib/analytics.ts. Підключається лише тоді,
 * коли збірка має NEXT_PUBLIC_POSTHOG_KEY; ключ приходить з data-key.
 * Без cookie і localStorage, без записів сесій.
 */
(() => {
  const me = document.currentScript;
  const key = me && me.dataset.key;
  if (!key) return;
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
      autocapture: true,
      enable_heatmaps: true,
      capture_pageview: true,
      capture_pageleave: true,
      mask_all_element_attributes: false,
    });
  };
  document.head.append(lib);
})();
