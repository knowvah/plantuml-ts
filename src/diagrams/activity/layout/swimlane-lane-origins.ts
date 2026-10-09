/**
 * The per-lane origin loop, split out of `swimlane-placement.ts` (this
 * file's own 500-line hook -- mission `activity-loop-lane-translate` T1,
 * same pure-move precedent as `swimlane-lanes.ts`, whose own header notes
 * why: existing importers stay untouched via a re-export). Pure move, no
 * behavior change: every symbol below is exactly as it read in
 * `swimlane-placement.ts` before this split.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:416-431
 *   -- `computeSizeInternal`'s origin loop, ported below as
 *   {@link computeLaneOrigins}.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/LaneDivider.java:85-97
 *   -- `LaneDivider#drawU`'s `UEmpty(x1+x2, 1)`, ported as
 *   {@link computeDividers}'s `dividerReservations`.
 */

import type { SwimlaneGeo } from '../activity-geometry.types.js';
import { halfMissingSpace, type LaneWidth, type LaneWidthInput } from './swimlane-context.js';

interface LaneOrigin {
  readonly delta: number;
  readonly geo: SwimlaneGeo;
}

export interface LaneOrigins {
  readonly origins: Map<string, LaneOrigin>;
  readonly dividerReservations: DividerReservation[];
}

/** One divider's `UEmpty(x1+x2, 1)` reservation, in block-relative X only
 *  -- `placeSwimlanes` adds `y: baseY` and `height: 1`. */
export interface DividerReservation {
  readonly x: number;
  readonly width: number;
}

interface LaneDividers {
  readonly dividerX: number[];
  readonly contentLeft: number[];
  readonly dividerReservations: DividerReservation[];
  /** `getHalfMissingSpace(n + 1)`: the special lane's own half-space. */
  readonly trailingX2: number;
}

/** `computeSizeInternal`'s resolved `min` (`Swimlanes.java:399-403`) and
 *  the special lane's title width (`swimlane-title.ts`). */
export interface LaneSizing {
  readonly min: number;
  readonly specialTitleWidth: number;
}

/**
 * The trailing "special" divider (the `i === n` empty lane closing the
 * last real lane's span): its content and minX are both 0
 * (`MinMax.getEmpty(true)`), so `xx_n` reduces to `xpos + dividerWidth_n +
 * min / 2` and the divider itself to `xpos + x1_n + min / 2` (`min`
 * already resolved, never negative -- see `resolveSwimlaneMinWidth`, so
 * this is `Math.max(min, 0) / 2`). Its `UEmpty` sits at that SAME
 * content-left minus the divider's width (add4-T1b, see {@link
 * computeDividers}): `xpos + min / 2`. Split from {@link computeDividers}
 * only to keep that function's own NLOC under the file's limit.
 */
function trailingDivider(
  laneNames: readonly string[],
  inputs: readonly LaneWidthInput[],
  min: number,
  xpos: number,
): { dividerX: number; reservation: DividerReservation; x2n: number } {
  const x1n = halfMissingSpace(laneNames.length, inputs, min);
  const x2n = halfMissingSpace(laneNames.length + 1, inputs, min);
  return { dividerX: xpos + x1n + min / 2, reservation: { x: xpos + min / 2, width: x1n + x2n }, x2n };
}

/**
 * The origin loop itself (`Swimlanes.java:416-431`), split from {@link
 * computeLaneOrigins} only to keep both under the file's function-length
 * limit -- `dividerX`/`contentLeft` are two views of the SAME loop
 * variable, never independently meaningful, so returning them as a pair
 * rather than merging further is the natural seam. `dividerReservations`
 * is each boundary's `LaneDivider#drawU` `UEmpty(x1+x2, 1)`
 * (`LaneDivider.java:85-97`), drawn by `drawWhenSwimlanes` at
 * `ug.apply(UTranslate.dx(xpos - dividerWith))` (`Swimlanes.java:345-346`)
 * where THAT `xpos` is `swimlane.getTranslate().getDx() + swimlane
 * .getMinMax().getMinX()` (`:331`) -- the lane's CONTENT left (`left`
 * below), not the origin loop's running `xpos`. The two coincide only
 * when the lane is exactly content-wide; a `skinparam swimlaneWidth` floor
 * (`:399-409`) centres the content and leaves the whole padding to the
 * divider's RIGHT, where `CompressionXorYBuilder`'s `smaller(5)` gap
 * (`klimt/compress/CompressionXorYBuilder.java:66`) collapses it -- jar
 * A/B fixtures `tests/fixtures/activity/add4-T1b/swimw-*.puml` (100, 400,
 * 9000 and `same` render byte-identical in the jar for exactly this
 * reason).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/LaneDivider.java:85-97
 */
function computeDividers(
  laneNames: readonly string[],
  widths: ReadonlyMap<string, LaneWidth>,
  inputs: readonly LaneWidthInput[],
  min: number,
  blockOriginX: number,
): LaneDividers {
  const dividerX: number[] = [];
  const contentLeft: number[] = [];
  const dividerReservations: DividerReservation[] = [];
  let xpos = blockOriginX;
  for (let i = 0; i < laneNames.length; i++) {
    const w = widths.get(laneNames[i]!)!;
    const x1 = halfMissingSpace(i, inputs, min);
    const x2 = halfMissingSpace(i + 1, inputs, min);
    const dividerWidth = x1 + x2;
    const left = xpos + dividerWidth + (w.width - w.contentWidth) / 2;
    contentLeft.push(left);
    dividerX.push(left - x2);
    dividerReservations.push({ x: left - dividerWidth, width: dividerWidth });
    xpos += w.width + dividerWidth;
  }
  const trailing = trailingDivider(laneNames, inputs, min, xpos);
  dividerX.push(trailing.dividerX);
  dividerReservations.push(trailing.reservation);
  return { dividerX, contentLeft, dividerReservations, trailingX2: trailing.x2n };
}

/** One lane's {@link LaneOrigin}, split from {@link computeLaneOrigins}
 *  only to keep that function's own NLOC under the file's limit. */
function buildLaneOrigin(name: string, w: LaneWidth, x: number, width: number, left: number): LaneOrigin {
  return {
    delta: left - w.contentMinX,
    geo: {
      name,
      x,
      width,
      contentWidth: w.contentWidth,
      titleWidth: w.titleWidth,
      contentMinX: w.contentMinX,
      contentX: left,
    },
  };
}

/**
 * Ports `Swimlanes#computeSizeInternal`'s origin loop
 * (`Swimlanes.java:416-431`) restricted to the real lanes, plus one extra
 * step for the trailing empty "special" lane
 * (`swimlanesSpecial()`, `:116-124`) that closes the last lane's span --
 * upstream loops over all `n + 1` entries uniformly; splitting the loop
 * here avoids threading a synthetic empty `LaneWidth` through the real
 * per-lane map. `blockOriginX` seeds the accumulator at the lane block's
 * own left edge (`xpos = 0` upstream; this diagram's block starts at
 * `baseX`, not `0`) so every returned `delta` is a ready-to-add absolute
 * offset for pass-1's `baseX`-relative node coordinates.
 */
export function computeLaneOrigins(
  laneNames: readonly string[],
  widths: ReadonlyMap<string, LaneWidth>,
  sizing: LaneSizing,
  blockOriginX: number,
): LaneOrigins {
  const { min } = sizing;
  // `swimlanesSpecial()` (`Swimlanes.java:116-123`): the real lanes plus
  // the appended `""` lane, `MinMax.getEmpty(true)` (content width 0),
  // whose title `getHalfMissingSpace(n + 1)` measures (isw-T2-act F3).
  const inputs: LaneWidthInput[] = laneNames.map((name) => {
    const w = widths.get(name)!;
    return { contentWidth: w.contentWidth, titleWidth: w.titleWidth };
  });
  inputs.push({ contentWidth: 0, titleWidth: sizing.specialTitleWidth });
  const dividers = computeDividers(laneNames, widths, inputs, min, blockOriginX);
  const { dividerX, contentLeft, dividerReservations } = dividers;

  const origins = new Map<string, LaneOrigin>();
  for (let i = 0; i < laneNames.length; i++) {
    const name = laneNames[i]!;
    const w = widths.get(name)!;
    const width = dividerX[i + 1]! - dividerX[i]!;
    const origin = buildLaneOrigin(name, w, dividerX[i]!, width, contentLeft[i]!);
    const isLast = i === laneNames.length - 1;
    origins.set(
      name,
      isLast ? { ...origin, geo: { ...origin.geo, trailingHalfMissingSpace: dividers.trailingX2 } } : origin,
    );
  }
  return { origins, dividerReservations };
}
