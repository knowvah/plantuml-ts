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

import type { ActivityEdgeGeo } from '../activity-layout-types.js';
import type { GPoint } from '../tiles/points.js';
import type { Reservation } from './hexagon-reservations.js';
import { HEXAGON_HALF_SIZE } from './hexagon-reservations.js';
import { routeWhileBack } from './swimlane-loop-translate-while.js';
import {
  routeRepeatOut,
  routeRepeatSimple1,
  routeRepeatSimple2,
  routeRepeatComplex1,
} from './swimlane-loop-translate-repeat.js';

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
 */
export interface WhileBackLoop {
  readonly kind: 'while-back';
  readonly p1: GPoint;
  readonly p2: GPoint;
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

export type LoopTranslate = WhileBackLoop | RepeatOutLoop | RepeatSimple1Loop | RepeatSimple2Loop | RepeatComplex1Loop;

/** D3/D4: every translate shape may emit more than one edge (the repeat
 *  exit's unarrowed-then-arrowed pair) and its own hexagon reservations,
 *  mirroring `PlacementResult`'s own two arrays. */
export interface LoopRouteResult {
  readonly edges: ActivityEdgeGeo[];
  readonly reservations: Reservation[];
}

/**
 * D1: the one dispatch site `swimlane-placement.ts#routeEdge` calls for any
 * edge whose `EdgeMeta.loop` is set and whose two lanes differ -- `dx1`/
 * `dx2` are that pair's own lane deltas (`ConnectionCross#drawU`'s
 * `swimlane1.getTranslate()`/`swimlane2.getTranslate()`, both `UTranslate
 * .dx(xx)` so X-only, same as `routeEdge`'s existing `d1`/`d2`).
 */
export function routeLoopTranslate(
  loop: LoopTranslate,
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
  }
}
