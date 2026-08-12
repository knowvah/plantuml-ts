/**
 * `skinparam minClassWidth` floor — SHARED by object/map/json (`kind:'object'`
 * boxed leaves) in the class diagram layout engine (./layout.ts). The
 * `kind:'object'`-SPECIFIC field/body sizing (the former bulk of this file)
 * now lives in the sibling ./class-object-sizing.ts (S1 — pure relocation to
 * keep both files under the repo's 500-line-per-file cap) and the header-row
 * math SHARED by object/map/json (`titleDimension`/`measureStereo`/
 * `headerRows`/`baselineOffsetFor`) lives in the sibling
 * ./class-object-map-header.ts (earlier split, same motivation). Both are
 * re-exported below so every existing `./class-object-map-sizing.js` import
 * site keeps working unchanged. `kind:'map'` sizing lives in the sibling
 * ./class-map-sizing.ts (G3/O1 split, same 500-line-cap motivation).
 */

import type { Theme } from '../../core/theme.js';
import { resolveElementMinimumWidth } from '../../core/theme.js';

export type { Dim } from './class-object-map-header.js';
export { titleDimension, measureStereo, headerRows, baselineOffsetFor } from './class-object-map-header.js';

// ---------------------------------------------------------------------------
// object
// ---------------------------------------------------------------------------

/**
 * B25/M27: `skinparam minClassWidth` floors the BOX width of every boxed
 * class-family leaf, not just `class`.
 *
 * It is registered as `addConvert("MinClassWidth", PName.MinimumWidth)` with
 * NO `SName` varargs (`style/FromSkinparamToStyle.java:241`; `addConvert` at
 * `:414-422` stores an empty name array), and an empty style signature is a
 * subset of every element's signature — so the value matches every element
 * and the `Class` in the skinparam's name is a historical misnomer. All four
 * boxed images read it and clamp with character-identical arithmetic:
 * `EntityImageClass.java:103-105`, `EntityImageObject.java:150-153`,
 * `EntityImageMap.java:127-130`, `EntityImageJson.java:127-132`.
 *
 * Applied to the box width AFTER the content-vs-title max and BEFORE the
 * height computation, exactly as upstream orders it, so the floored width is
 * what `drawU` then hands the header layout as `dimTotal.getWidth()` — which
 * is why `headerRows`'s `boxWidth` must receive the floored value, not the
 * natural one.
 *
 * `class-layout-helpers.ts#resolveMinClassWidth` gates the SAME floor on
 * `LIKE_CLASS_KINDS`. That gate is right for its two other tenants
 * (`sameClassWidth` and the `groupInheritance` wrap ARE `EntityImageClass`-
 * only); `MinimumWidth` was swept in with them and object/map/json got no
 * floor at all.
 */
export function floorAtMinimumWidth(width: number, theme: Theme, sname: string): number {
  return Math.max(width, resolveElementMinimumWidth(theme, sname) ?? 0);
}
