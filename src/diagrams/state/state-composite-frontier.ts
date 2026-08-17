/**
 * `Box` ({x,y,width,height}) adapter over `core/svek/FrontierCalculator.ts`
 * for the state engine (mission shared-seam-extraction T5). The algorithm
 * itself — `FrontierCalculator`'s constructor + `ensureMinWidth`, upstream
 * `svek/FrontierCalculator.java` (whole file) + `Cluster.java
 * #manageEntryExitPoint` (:410-436) — now lives ONCE in `core/svek/
 * FrontierCalculator.ts` (shared with the description/component/usecase
 * engines); this file only converts between this engine's own `Box` shape
 * (matching `StateNodeGeo`/`DotLayoutResult['clusters']` entries) and
 * upstream's `RectangleArea` shape the core port operates in — `Cluster
 * .java` itself does the same conversion via `getRectangleArea()`.
 *
 * Kept as a small file (not folded into `state-composite-geo.ts`) purely to
 * stay under this project's 500-line-per-file limit — `state-composite-
 * geo.ts` is its only importer; `state-composite-pass-types.ts`/
 * `state-composite-cluster.ts` reference `frontierCalculator`/`Box` only in
 * doc comments, not imports (mission shared-seam-extraction T5 decision
 * journal).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/FrontierCalculator.java (whole file, 169 lines)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java#manageEntryExitPoint (:410-436)
 */

import {
  frontierCalculator as coreFrontierCalculator,
  ensureMinWidth as coreEnsureMinWidth,
  type RectangleArea,
} from '../../core/svek/FrontierCalculator.js';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export function toRect(b: Box): RectangleArea {
  return { minX: b.x, minY: b.y, maxX: b.x + b.width, maxY: b.y + b.height };
}

export function fromRect(r: RectangleArea): Box {
  return { x: r.minX, y: r.minY, width: r.maxX - r.minX, height: r.maxY - r.minY };
}

/** `Box`-typed wrapper over `core/svek/FrontierCalculator.ts#frontierCalculator`
 *  — see that module for the algorithm itself. */
export function frontierCalculator(
  initial: Box,
  insides: readonly Box[],
  points: readonly Point[],
  rankdir: 'TB' | 'LR',
): Box {
  const core = coreFrontierCalculator(toRect(initial), insides.map(toRect), points, rankdir);
  return fromRect(core);
}

/** `Box`-typed wrapper over `core/svek/FrontierCalculator.ts#ensureMinWidth`
 *  — see that module for the algorithm itself. Parameter order matches this
 *  engine's own prior call sites (`core`, `minWidth`, `initial`); the core
 *  port's own order is `(core, initial, minWidth)`. */
export function ensureMinWidth(core: Box, minWidth: number, initial: Box): Box {
  return fromRect(coreEnsureMinWidth(toRect(core), toRect(initial), minWidth));
}
