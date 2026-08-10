/**
 * Whether a `<rect>` carries `rx`/`ry` at all.
 *
 * `SvgGraphics#svgRectangle` guards both attributes behind a single
 * `if (rx > 0 && ry > 0)` (`SvgGraphics.java:580-583`), so a rectangle with no
 * corner radius carries NO `rx`/`ry` rather than carrying zeros — and either
 * axis being absent or non-positive suppresses both.
 *
 * That is the difference between `<style> … RoundCorner: 0` rendering as the
 * jar does and emitting a spurious `rx="0" ry="0"` on every node, which is
 * what this port did across the json family's `<style>` fixtures.
 *
 * Its own module rather than a helper inside `svg-shapes.ts` only because that
 * file is already over this repo's 500-line cap; the logic belongs beside
 * `rect`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java#svgRectangle
 */

/**
 * `rx`/`ry` attribute pairs for `attrs()`, dropping any axis that is present
 * and non-positive.
 *
 * ## Why per-axis, where upstream's guard is joint
 *
 * Upstream writes `if (rx > 0 && ry > 0)` — both or neither — because its
 * caller CANNOT express one without the other: `DriverRectangleSvg:78` always
 * passes `rx / 2, ry / 2` off a single `URectangle`. This port's `rect()` takes
 * them as two independent optional fields, and callers do use that: activity's
 * `renderAction` (`activity-renderer-shapes.ts:117`) passes `rx: ACTION_RX`
 * alone, relying on SVG's rule that `ry` defaults to `rx`.
 *
 * Applying the joint guard literally would therefore have silently squared off
 * every activity action box — a shape upstream never produces and this port
 * does. Absent means "this caller did not specify an axis", which is not the
 * same as upstream's zero, so only an explicitly non-positive value is dropped.
 */
export function roundedCornerAttrs(
  rx: number | undefined,
  ry: number | undefined,
): ReadonlyArray<readonly [string, number]> {
  const out: Array<readonly [string, number]> = [];
  if (rx !== undefined && rx > 0) out.push(['rx', rx]);
  if (ry !== undefined && ry > 0) out.push(['ry', ry]);
  return out;
}
