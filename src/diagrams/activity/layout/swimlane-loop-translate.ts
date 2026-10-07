/**
 * D2 (`plans/activity-loop-lane-translate/decisions.md`): the tagged union
 * of quantities each cross-lane loop connector shape needs from its own
 * tile -- `getP1`/`getP2` UNTRANSLATED, plus the widths/heights
 * `calculateDimension()` and the diamonds' own `inY`/`outY`/`width`/
 * `height` return. Never a tile reference or a closure: `routeLoopTranslate`
 * supplies the two lane translates (`dx1`, `dx2`) separately, exactly as
 * `ConnectionCross#drawU` binds `swimlane1.getTranslate()`/
 * `swimlane2.getTranslate()` late, at draw time
 * (`ftile/ConnectionCross.java:47-63`).
 *
 * T1 (this task) wires the dispatch seam only -- every per-kind function in
 * `swimlane-loop-translate-while.ts`/`-repeat.ts` is a STUB returning the
 * same generic middle-Y elbow `swimlane-placement.ts#routeEdge`'s
 * `'default'` case computes today. T2/T3 replace those bodies with the
 * real ported shapes; this module's union and dispatcher do not change.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/ConnectionCross.java:47-63
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:277-308
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:275-331,333-404,537-606,608-683
 */

import type { ActivityEdgeGeo } from '../activity-geometry.types.js';
import type { GPoint } from '../tiles/points.js';
import type { Reservation } from './hexagon-reservations.js';
import { HEXAGON_HALF_SIZE } from './hexagon-reservations.js';
import { routeWhileBack } from './swimlane-loop-translate-while.js';
import {
  routeRepeatOut,
  routeRepeatSimple1,
  routeRepeatSimple2,
  routeRepeatComplex1,
  routeRepeatBackward1,
  routeRepeatBackward2,
} from './swimlane-loop-translate-repeat.js';
import {
  routeSwitchHorizontalThenVertical,
  routeSwitchVerticalThenHorizontal,
} from './swimlane-loop-translate-switch.js';
import {
  routeIfLinksHThenV,
  routeIfLinksVThenH,
  routeIfLinksVThenHDirect,
} from './swimlane-loop-translate-if-links.js';

/** `Hexagon.hexagonHalfSize`, re-exported so callers of this module never
 *  need a second import from `hexagon-reservations.ts` for the one
 *  constant every translate shape's `y1bis`/elbow math cites.
 *  @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
export { HEXAGON_HALF_SIZE };

/**
 * `FtileWhile.ConnectionBackSimple#drawTranslate` (`:277-308`): `p1`/`p2`
 * are that method's own `ap1`/`ap2` (the UNTRANSLATED `getP1`/`getP2`),
 * `dimTotalWidth` is `calculateDimension(stringBounder).getWidth()`, and
 * `diamond` is `diamond1.calculateDimension(stringBounder)`'s own
 * `inY`/`outY`/`width` -- exactly the fields `:287-293` reads.
 *
 * add4-T1b: `originX` is the while tile's own pass-1 left edge. `xx`
 * (`:298`) is computed in the tile's LOCAL frame -- `Swimlanes$Cross#draw`
 * reaches `drawTranslate` through `tile.drawU(this)` (`Swimlanes.java:
 * 186-189`), so the Cross `ug` already carries every parent's translate to
 * the tile -- while `p1`/`p2` here are pass-1 absolute; `originX` puts
 * `xx` in that same frame.
 */
export interface WhileBackLoop {
  readonly kind: 'while-back';
  readonly p1: GPoint;
  readonly p2: GPoint;
  readonly originX: number;
  readonly dimTotalWidth: number;
  readonly diamond: { readonly inY: number; readonly outY: number; readonly width: number };
}

/**
 * `FtileRepeat.ConnectionOut#drawTranslate` (`:309-331`): `p1`/`p2` are the
 * untranslated `getP1`/`getP2`; `label` is the `tbout` text passed to
 * `withLabel` on the second (arrowed) snake.
 */
export interface RepeatOutLoop {
  readonly kind: 'repeat-out';
  readonly p1: GPoint;
  readonly p2: GPoint;
  readonly label?: string;
}

/**
 * `FtileRepeat.ConnectionBackSimple1#drawTranslate` (`:579-606`): `p1`/`p2`
 * untranslated; `repeatWidth` is `repeat.calculateDimension().getWidth()`
 * (the `xmax` term); `diamond1` needs only `height` (`:594`'s `y2`),
 * `diamond2` needs `width` and `height` (`:592,597`'s `y1`/`xmax`).
 */
export interface RepeatSimple1Loop {
  readonly kind: 'repeat-simple1';
  readonly p1: GPoint;
  readonly p2: GPoint;
  readonly repeatWidth: number;
  readonly diamond1: { readonly height: number };
  readonly diamond2: { readonly width: number; readonly height: number };
  readonly label?: string;
}

/**
 * `FtileRepeat.ConnectionBackSimple2#drawTranslate` (`:651-676`): `p1`/`p2`
 * untranslated; both diamonds need `width` (`:660,663-664`'s `x1`/`x2a`/
 * `x2b`) and `height` (`:661,668`'s `y1`/`y2`). No `repeatWidth` here --
 * `drawTranslate`'s `xmax` (unlike `drawU`'s) never reads `dimTotal`.
 */
export interface RepeatSimple2Loop {
  readonly kind: 'repeat-simple2';
  readonly p1: GPoint;
  readonly p2: GPoint;
  readonly diamond1: { readonly width: number; readonly height: number };
  readonly diamond2: { readonly width: number; readonly height: number };
  readonly label?: string;
}

/**
 * `FtileRepeat.ConnectionBackComplex1#drawTranslate` (`:357-404`): `p1`/`p2`
 * untranslated; `repeatWidth` is `repeat.calculateDimension().getWidth()`
 * (the `x1_b` term); both diamonds need `width` and `height`. No label --
 * this connection never calls `withLabel`.
 */
export interface RepeatComplex1Loop {
  readonly kind: 'repeat-complex1';
  readonly p1: GPoint;
  readonly p2: GPoint;
  readonly repeatWidth: number;
  readonly diamond1: { readonly width: number; readonly height: number };
  readonly diamond2: { readonly width: number; readonly height: number };
}

/**
 * `FtileSwitchWithManyLinks.ConnectionHorizontalThenVerticalCrossSwimlane
 * #drawTranslate` (`:318-339`): `p1`/`p2` are that method's own untranslated
 * `getP1`/`getP2` (diamond1's `getPointOut()`, the case tile's
 * `getPointIn()`); `diamond1` needs `width`/`height` (`:328`'s
 * `dimDiamond1`, read for the half-width/half-height offsets at `:330-336`).
 * Mission `activity-divergence-drive-2` T1p-e.
 */
export interface SwitchHorizontalThenVerticalCrossLoop {
  readonly kind: 'switch-h-then-v-cross';
  readonly p1: GPoint;
  readonly p2: GPoint;
  readonly diamond1: { readonly width: number; readonly height: number };
}

/**
 * `FtileSwitchWithManyLinks.ConnectionVerticalThenHorizontalCrossSwimlane
 * #drawTranslate` (`:363-393`): `p1`/`p2` untranslated (the origin tile's
 * `getPointOut()`, diamond2's `getPointIn()`); `diamond2` needs
 * `width`/`height` (`:368`'s `dimDiamond2`, read at `:384,387,389`). No
 * label -- this connection never calls `withLabel`. Mission
 * `activity-divergence-drive-2` T1p-e.
 */
export interface SwitchVerticalThenHorizontalCrossLoop {
  readonly kind: 'switch-v-then-h-cross';
  readonly p1: GPoint;
  readonly p2: GPoint;
  readonly diamond2: { readonly width: number; readonly height: number };
}

/**
 * `FtileRepeat.ConnectionBackBackward1#drawTranslate` (`:432-438`, shared
 * `drawSnake` at `:440-459`): `p1` is `getP1` (`:416-418`,
 * `getTranslateDiamond2().getTranslated(0,0)` -- diamond2's own untranslated
 * ORIGIN, this walker's own `condX`/`condY`); `p2` is `getP2` (`:420-423`,
 * `dim.getLeft(), dim.getOutY()` -- backward's own untranslated SOUTH hook,
 * this walker's own `backSouth`); `diamond2` carries `width`/`height` for
 * the post-translate left/right side re-decision (`:447-449`) -- recomputed
 * from the TRANSLATED `p1`/`p2`, never the untranslated ones T1c's own
 * `walk-repeat-backward.ts#backward1Points` side-check used (this is the
 * cross-lane analogue T1a's census flagged as missing). No `label` field:
 * unlike `repeat-out`'s elbow+drop split, this shape is always exactly ONE
 * edge, so `routeRepeatBackward1` rebuilds it as `{...edge, points}` --
 * the base edge's own `label`/`labelAlign` (set by `applyBackwardLabel` at
 * the SAME push site this loop record comes from) carries through the
 * spread unchanged.
 */
export interface RepeatBackward1Loop {
  readonly kind: 'repeat-backward1';
  readonly p1: GPoint;
  readonly p2: GPoint;
  readonly diamond2: { readonly width: number; readonly height: number };
}

/**
 * `FtileRepeat.ConnectionBackBackward2#drawTranslate` (`:482-511`): `p1` is
 * `getP1` (`:473-476`, `dim.getLeft(), dim.getInY()` -- backward's own
 * untranslated NORTH hook, this walker's own `backNorth`); `p2` is `getP2`
 * (`:478-480`, diamond1's own untranslated ORIGIN, this walker's own
 * `entryX`/`entryY`); `diamond1` carries `width` for the post-translate
 * `x2 < x1` wraparound (`:495-497`) and `height` for the `y2` elbow
 * (`:498`). No `label` field, same reason as {@link RepeatBackward1Loop}.
 */
export interface RepeatBackward2Loop {
  readonly kind: 'repeat-backward2';
  readonly p1: GPoint;
  readonly p2: GPoint;
  readonly diamond1: { readonly width: number; readonly height: number };
}

/**
 * `FtileIfWithLinks.ConnectionHorizontalThenVertical#drawTranslate`
 * (`:148-173`): `p1` is diamond1's own untranslated D/B point (`getP1`,
 * `:121-132`); `p2` is the branch's own untranslated point-in (`getP2`,
 * `:134-136`) -- `walk-if-with-links.ts#pushInConnectors`'s own `p1`/
 * `in1To`/`in2To`. `diamond1` carries `height` for the direction-flip
 * detour snake's `y + height*.75` term (`:163`).
 */
export interface IfLinksHThenVLoop {
  readonly kind: 'if-links-h-then-v';
  readonly p1: GPoint;
  readonly p2: GPoint;
  readonly diamond1: { readonly height: number };
}

/**
 * `FtileIfWithLinks.ConnectionVerticalThenHorizontal#drawTranslate`
 * (`:237-285`): `p1` is the branch's own untranslated point-out (`getP1`'s
 * `geo.translate(translate).getPointOut()`, identical to `drawU`'s own
 * `p1` -- `walk-if-with-links.ts#pushOutConnectorsBoth`'s own `out1From`/
 * `out2From`); `p2` is the merge diamond's own untranslated D/B point
 * (`getP2`, `:214-225`) -- that function's own `mergeD`/`mergeB`. No
 * extra dims: every elbow term (`delta`, `middle`) derives from `p1`/`p2`
 * themselves plus the module-level `HEXAGON_HALF_SIZE` constant.
 */
export interface IfLinksVThenHLoop {
  readonly kind: 'if-links-v-then-h';
  readonly p1: GPoint;
  readonly p2: GPoint;
}

/**
 * `FtileIfWithLinks.ConnectionVerticalThenHorizontalDirect#drawTranslate`
 * (`:327-354`): `p1` is the branch's own untranslated point-out (same
 * value as {@link IfLinksVThenHLoop}'s `p1`, `walk-if-with-links.ts
 * #pushDirectConnector`'s own `p1`); `p2` is the if-tile's own untranslated
 * bottom-left corner (`:308`'s `new XPoint2D(dimTotal.getLeft(),
 * dimTotal.getHeight())`, `drawU`'s own `p2` -- that function's own `p2`
 * unchanged) -- `routeIfLinksVThenHDirect` derives the translate-only
 * `dimTotal.getHeight() - Hexagon.hexagonHalfSize` midpoint Y (`:337`)
 * from this SAME `p2.y`, never a second field, since `drawTranslate` never
 * recomputes `dimTotal` from a different source than `drawU` does.
 */
export interface IfLinksVThenHDirectLoop {
  readonly kind: 'if-links-v-then-h-direct';
  readonly p1: GPoint;
  readonly p2: GPoint;
}

export type LoopTranslate =
  | WhileBackLoop
  | RepeatOutLoop
  | RepeatSimple1Loop
  | RepeatSimple2Loop
  | RepeatComplex1Loop
  | RepeatBackward1Loop
  | RepeatBackward2Loop
  | SwitchHorizontalThenVerticalCrossLoop
  | SwitchVerticalThenHorizontalCrossLoop
  | IfLinksHThenVLoop
  | IfLinksVThenHLoop
  | IfLinksVThenHDirectLoop;

/** D3/D4: every translate shape may emit more than one edge (the repeat
 *  exit's unarrowed-then-arrowed pair) and its own hexagon reservations,
 *  mirroring `PlacementResult`'s own two arrays. */
export interface LoopRouteResult {
  readonly edges: ActivityEdgeGeo[];
  readonly reservations: Reservation[];
}

type RepeatOrWhileLoop =
  | WhileBackLoop
  | RepeatOutLoop
  | RepeatSimple1Loop
  | RepeatSimple2Loop
  | RepeatComplex1Loop
  | RepeatBackward1Loop
  | RepeatBackward2Loop;

/** The `while`/`repeat` half of {@link routeLoopTranslate}'s own dispatch,
 *  split out purely to keep that function's own CCN under the file's
 *  limit -- no behavior change, same `switch` body moved verbatim. */
function routeLoopTranslateRepeat(
  loop: RepeatOrWhileLoop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  switch (loop.kind) {
    case 'while-back':
      return routeWhileBack(loop, edge, dx1, dx2);
    case 'repeat-out':
      return routeRepeatOut(loop, edge, dx1, dx2);
    case 'repeat-simple1':
      return routeRepeatSimple1(loop, edge, dx1, dx2);
    case 'repeat-simple2':
      return routeRepeatSimple2(loop, edge, dx1, dx2);
    case 'repeat-complex1':
      return routeRepeatComplex1(loop, edge, dx1, dx2);
    case 'repeat-backward1':
      return routeRepeatBackward1(loop, edge, dx1, dx2);
    case 'repeat-backward2':
      return routeRepeatBackward2(loop, edge, dx1, dx2);
  }
}

/**
 * D1: the one dispatch site `swimlane-placement.ts#routeEdge` calls for any
 * edge whose `EdgeMeta.loop` is set and whose two lanes differ -- `dx1`/
 * `dx2` are that pair's own lane deltas (`ConnectionCross#drawU`'s
 * `swimlane1.getTranslate()`/`swimlane2.getTranslate()`, both `UTranslate
 * .dx(xx)` so X-only, same as `routeEdge`'s existing `d1`/`d2`). Delegates
 * the `while`/`repeat` family to {@link routeLoopTranslateRepeat} to stay
 * under the file's own CCN limit.
 */
export function routeLoopTranslate(
  loop: LoopTranslate,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  switch (loop.kind) {
    case 'switch-h-then-v-cross':
      return routeSwitchHorizontalThenVertical(loop, edge, dx1, dx2);
    case 'switch-v-then-h-cross':
      return routeSwitchVerticalThenHorizontal(loop, edge, dx1, dx2);
    case 'if-links-h-then-v':
      return routeIfLinksHThenV(loop, edge, dx1, dx2);
    case 'if-links-v-then-h':
      return routeIfLinksVThenH(loop, edge, dx1, dx2);
    case 'if-links-v-then-h-direct':
      return routeIfLinksVThenHDirect(loop, edge, dx1, dx2);
    default:
      return routeLoopTranslateRepeat(loop, edge, dx1, dx2);
  }
}
