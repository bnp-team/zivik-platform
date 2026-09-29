import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Brand slogan divider – Charis SIL, uppercase, wide tracking, in the UCU
 * brand red, framed by hairline rules (echoes UCU's "гасла" treatment).
 */
export default function Slogan({ dict }: { dict: Dictionary }) {
  return (
    <div className="nsv-slogan">
      <span className="rule" />
      <span className="motto">{dict.slogan}</span>
      <span className="rule r2" />
    </div>
  );
}
