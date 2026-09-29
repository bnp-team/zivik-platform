"use client";

import { useEffect, useState } from "react";

/**
 * The way back to the masthead.
 *
 * It was the tail of `PageNav`, which also drew the page's map twice – a
 * dark pill fixed in the left margin above 1700px and a sideways-scrolling
 * bar of chips below it. The map is `CaseToc` now, a column in the page, and
 * this is what was left: a control that belongs to the page rather than to
 * any navigation, in the corner, with the whole viewport's corner to itself.
 *
 * It only exists once there is something to return from; offered at the top
 * of the page it would be a button that does nothing. An arrow and nothing
 * else, so it is named for anyone who cannot see which way it points. It
 * sits below the map's fullscreen layer on purpose – a reader who has taken
 * the map full-screen is not looking for the top of the page underneath it.
 */
export default function ToTop({ label }: { label: string }) {
  const [deep, setDeep] = useState(false);

  useEffect(() => {
    const update = () => setDeep(window.scrollY > window.innerHeight * 1.5);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const toTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <button
      type="button"
      className="totop"
      data-show={deep ? "yes" : "no"}
      onClick={toTop}
      tabIndex={deep ? 0 : -1}
      aria-hidden={deep ? undefined : true}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path
          d="M12 19V6M12 6l-6 6M12 6l6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
