/**
 * Bounding box of an SVG path `d`, computed the way `UPath` does.
 *
 * This is NOT a general path-geometry routine and deliberately does not
 * flatten curves. The control-polygon minmax rule now lives in `UPath` --
 * see `UPath#addInternal` (klimt/shape/UPath.ts, porting
 * klimt/UPath.java:82-94) -- so this module is a thin wrapper: parse `d`
 * into a `UPath` via `parseSvgPath` (`SvgPath.ts`, T1) and read that
 * `UPath`'s own `getMinX`/`getMaxX`/`getMinY`/`getMaxY`. The rule itself,
 * preserved here for why it matters:
 *
 *   - for `SEG_ARCTO`, ONLY the arc's endpoint (`coord[5], coord[6]`) — the
 *     bulge is ignored, and the two commented-out `addPoint` lines right
 *     above it show that was a deliberate choice upstream;
 *   - for every other segment, EVERY coordinate pair, Bézier CONTROL points
 *     included.
 *
 * So the box is the control-polygon box. Reproducing that exactly matters
 * because it is what `Footprint#drawPath` (svek/image/Footprint.java:147-150)
 * feeds the use-case ellipse: it adds `(minX, minY)` and `(maxX, maxY)` as the
 * only two points a drawn path contributes. A "better" (true-extrema) box
 * would be wrong here — see `plans/s1l-leaf-sizing/ledger.md` § S1L-k for the
 * jar measurements this reproduces.
 *
 * Command coverage is whatever `parseSvgPath` accepts: the absolute forms
 * `M C Q T L A Z`, with `H`/`V`/`S` shorthands and relative commands
 * normalised inline (see `SvgPath.ts`'s own doc comment).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/UPath.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Footprint.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgPath.java
 */

import { UTranslate } from '../UTranslate.js';
import { parseSvgPath } from './SvgPath.js';

export interface PathBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/** No translation applied — `pathBBox` boxes the path in its own coordinate
 *  space, matching the pre-T5 fold's behaviour. */
const NONE = UTranslate.none();

/**
 * The `UPath`-rule bounding box of one path `d`, or `undefined` when the path
 * contributes no coordinates at all.
 */
export function pathBBox(d: string): PathBox | undefined {
  const path = parseSvgPath(d, NONE);
  if (path.isEmpty()) return undefined;
  return { minX: path.getMinX(), minY: path.getMinY(), maxX: path.getMaxX(), maxY: path.getMaxY() };
}
