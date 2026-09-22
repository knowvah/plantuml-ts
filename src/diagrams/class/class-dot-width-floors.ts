/**
 * cdd-T15: the class DOT-graph builder's two pre-DOT WIDTH FLOORS, split
 * off `./class-dot-graph.ts` when `applyKalWidthFloor` pushed that file
 * past the repo's 500-line cap (a pre-authorised split; the moved code is
 * verbatim, its provenance comments travelled with it). Both mutate the
 * shared `MeasuredClassifier` objects in place, at the point upstream's
 * `EntityImageClass#calculateDimensionSlow` applies them
 * (`svek/image/EntityImageClass.java:100-128`), so the DOT node and the
 * drawn box always agree. Re-exported from `class-dot-graph.ts` so every
 * existing import path keeps working.
 */

import type { Classifier } from './ast.js';
import type { Theme } from '../../core/theme.js';
import { LIKE_CLASS_KINDS, type MeasuredClassifier } from './class-layout-helpers.js';
import { kalWidthByEntity, KAL_WIDTH_FACTOR, type Kal } from './class-kal.js';

/** Same pending-plumbing seam as {@link ThemeGroupInheritance}, for
 *  `skinparam sameClassWidth true|false` (SkinParam.java:994). */
export interface ThemeSameClassWidth {
  sameClassWidth?: boolean;
}

/**
 * A2s F-D mechanism B7: `skinparam sameClassWidth true` floors EVERY
 * like-class box width to the widest like-class box --
 * `GraphvizImageBuilder#printEntityInternal` computes `getMaxWidth()` over
 * all `isLikeClass` leaves and stashes it on the skinparam
 * (GraphvizImageBuilder.java:366-375); `EntityImageClass
 * #calculateDimensionSlow` then floors each box to it (EntityImageClass
 * .java:108-110). Jar evidence: dorafa-63-soba922 emits BOTH nodes at
 * 1.623264in. Mutates the shared `MeasuredClassifier.width` in place so the
 * DOT node builder AND the renderer geos (built after `buildDotGraph`) agree
 * on the floored width. Header-row indents are NOT re-centered against the
 * widened box (bounded SVG-cosmetic gap, F-D report). Inert in production
 * until the {@link ThemeSameClassWidth} plumbing lands.
 */
export function applySameClassWidthFloor(
  classifiers: readonly Classifier[],
  measuredMap: ReadonlyMap<string, MeasuredClassifier>,
  theme: Theme,
): void {
  if ((theme as Theme & ThemeSameClassWidth).sameClassWidth !== true) return;
  const max = maxLikeClassWidth(classifiers, measuredMap);
  for (const c of classifiers) {
    if (!LIKE_CLASS_KINDS.has(c.kind)) continue;
    const m = measuredMap.get(c.id);
    if (m !== undefined && m.width < max) m.width = max;
  }
}

/**
 * cdd-T15 (D6): `EntityImageClass#calculateDimensionSlow`'s LAST width term
 * -- `return new XDimension2D(Math.max(width, getKalWidth() * 1.3), height)`
 * (`svek/image/EntityImageClass.java:113`, `getKalWidth` at `:117-127`).
 * Applied AFTER {@link applySameClassWidthFloor} because upstream applies it
 * after the `minClassWidth`/`paramSameClassWidth` floors in that same method,
 * and mutates the shared `MeasuredClassifier` objects for the same reason
 * that function does -- the DOT node and the drawn box must agree.
 *
 * `EntityImageClass` is only built for an `isLikeClass` leaf
 * (`GraphvizImageBuilder.java:110-116`), the SAME gate
 * `applySameClassWidthFloor` uses. Oracle check: `camuna-58-veca254`'s
 * `svek-1.dot` sizes `Shop` at `134.53375…` = its `103.488` box x 1.3.
 */
export function applyKalWidthFloor(
  kals: readonly Kal[],
  classifiers: readonly Classifier[],
  measuredMap: ReadonlyMap<string, MeasuredClassifier>,
): void {
  if (kals.length === 0) return;
  const widths = kalWidthByEntity(kals);
  for (const c of classifiers) {
    if (!LIKE_CLASS_KINDS.has(c.kind)) continue;
    const kalWidth = widths.get(c.id);
    if (kalWidth === undefined) continue;
    const m = measuredMap.get(c.id);
    if (m !== undefined && m.width < kalWidth * KAL_WIDTH_FACTOR) m.width = kalWidth * KAL_WIDTH_FACTOR;
  }
}

/** `GraphvizImageBuilder#getMaxWidth` (GraphvizImageBuilder.java:385-395):
 *  the widest `isLikeClass` box, measured WITHOUT the sameClassWidth floor
 *  itself (upstream stashes the max before any floor applies). */
function maxLikeClassWidth(
  classifiers: readonly Classifier[],
  measuredMap: ReadonlyMap<string, MeasuredClassifier>,
): number {
  let max = 0;
  for (const c of classifiers) {
    if (LIKE_CLASS_KINDS.has(c.kind)) max = Math.max(max, measuredMap.get(c.id)?.width ?? 0);
  }
  return max;
}
