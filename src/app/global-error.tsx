"use client";

/**
 * Last-resort boundary: catches errors thrown by the root layout itself, where
 * a normal `error.tsx` cannot reach. It replaces the root layout when active,
 * so it has to bring its own <html> and <body> – and it gets no stylesheet,
 * which is why everything here is inline and literal rather than tokenized.
 *
 * Bilingual on purpose: at this level nothing is left to tell us who the
 * reader is, and showing both is better than guessing wrong.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="uk">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 18,
          padding: "clamp(32px, 8vw, 96px)",
          background: "#17110f",
          color: "#f3e8e2",
          font: "16px/1.6 'Fira Sans', system-ui, sans-serif",
        }}
      >
        <h1
          style={{
            fontFamily: "'Charis SIL', Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(26px, 5vw, 44px)",
            lineHeight: 1.15,
            margin: 0,
            maxWidth: "20ch",
          }}
        >
          Щось пішло не так
          <br />
          <span style={{ color: "#c9afa8", fontSize: "0.62em" }}>
            Something went wrong
          </span>
        </h1>

        <p style={{ margin: 0, color: "#c9afa8", maxWidth: "54ch" }}>
          Сторінку не вдалося показати. Спробуйте ще раз – якщо не допоможе,
          напишіть нам на louis.sohn.center@ucu.edu.ua.
          <br />
          <span style={{ color: "#8e736c" }}>
            The page could not be rendered. Try again, and write to us at
            louis.sohn.center@ucu.edu.ua if it keeps failing.
          </span>
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6 }}>
          <button
            type="button"
            onClick={unstable_retry}
            style={{
              font: "700 11px 'Fira Sans', sans-serif",
              letterSpacing: ".07em",
              textTransform: "uppercase",
              padding: "13px 22px",
              background: "#c23b32",
              color: "#fff",
              border: 0,
              cursor: "pointer",
            }}
          >
            Спробувати ще раз · Try again
          </button>
          {/* A plain <a>, not next/link, on purpose: this boundary is what
              catches a root-layout failure, so the client router is exactly
              the thing we cannot rely on here. A full page load is the point. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/uk"
            style={{
              display: "inline-flex",
              alignItems: "center",
              font: "700 11px 'Fira Sans', sans-serif",
              letterSpacing: ".07em",
              textTransform: "uppercase",
              padding: "13px 22px",
              textDecoration: "none",
              border: "2px solid rgba(240,221,168,.5)",
              color: "#f0dda8",
            }}
          >
            На головну · Home
          </a>
        </div>

        {/* The digest is the only handle on the server-side log for this
            failure. Without it a report is "the site broke sometimes". */}
        {error.digest && (
          <p
            style={{
              margin: "10px 0 0",
              font: "12px ui-monospace, monospace",
              color: "#6e574f",
            }}
          >
            {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
