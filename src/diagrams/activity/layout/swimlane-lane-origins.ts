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
}

/**
 * The trailing "special" divider (the `i === n` empty lane closing the
 * last real lane's span): its content and minX are both 0
 * (`MinMax.getEmpty(true)`), so `xx_n` reduces to `xpos + dividerWidth_n +
 * min / 2` and the divider itself to `xpos + x1_n + min / 2` (`min`
 * already resolved, never negative -- see `resolveSwimlaneMinWidth`, so
 * this is `Math.max(min, 0) / 2`). Split from {@link computeDividers} only
 * to keep that function's own NLOC under the file's limit.
 */
function trailingDivider(
  laneNames: readonly string[],
  inputs: readonly LaneWidthInput[],
  min: number,
  xpos: number,
): { dividerX: number; reservation: DividerReservation } {
  const x1n = halfMissingSpace(laneNames.length, inputs, min);
  const x2n = halfMissingSpace(laneNames.length + 1, inputs, min);
  return { dividerX: xpos + x1n + min / 2, reservation: { x: xpos, width: x1n + x2n } };
}

/**
 * The origin loop itself (`Swimlanes.java:416-431`), split from {@link
 * computeLaneOrigins} only to keep both under the file's function-length
 * limit -- `dividerX`/`contentLeft` are two views of the SAME loop
 * variable, never independently meaningful, so returning them as a pair
 * rather than merging further is the natural seam. `dividerReservations`
 * is each boundary's `LaneDivider#drawU` `UEmpty(x1+x2, 1)`
 * (`LaneDivider.java:85-97`), at its own `xpos` -- BEFORE this divider's
 * own `x1` padding -- matching `Swimlanes.java:347-348`'s `ug.apply
 * (UTranslate.dx(xpos - dividerWith))` composed with `LaneDivider#drawU`'s
 * own local `UEmpty` at (0, 0).
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
    dividerReservations.push({ x: xpos, width: dividerWidth });
    xpos += w.width + dividerWidth;
  }
  const trailing = trailingDivider(laneNames, inputs, min, xpos);
  dividerX.push(trailing.dividerX);
  dividerReservations.push(trailing.reservation);
  return { dividerX, contentLeft, dividerReservations };
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
  min: number,
  blockOriginX: number,
): LaneOrigins {
  const inputs: LaneWidthInput[] = laneNames.map((name) => {
    const w = widths.get(name)!;
    return { contentWidth: w.contentWidth, titleWidth: w.titleWidth };
  });
  const { dividerX, contentLeft, dividerReservations } = computeDividers(laneNames, widths, inputs, min, blockOriginX);

  const origins = new Map<string, LaneOrigin>();
  for (let i = 0; i < laneNames.length; i++) {
    const name = laneNames[i]!;
    const w = widths.get(name)!;
    const width = dividerX[i + 1]! - dividerX[i]!;
    origins.set(name, buildLaneOrigin(name, w, dividerX[i]!, width, contentLeft[i]!));
  }
  return { origins, dividerReservations };
}
