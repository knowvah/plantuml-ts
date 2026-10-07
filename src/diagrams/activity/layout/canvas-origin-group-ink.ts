/**
 * add4-T3c: `FtileGroup#getInnerMinMax` (`ftile/vcompact/FtileGroup.java:
 * 150-158`) -- the frame replays its inner tile's `drawU` through a
 * `LimitFinder` (wrapped in a fresh `UGraphicForSnake`, so the inner
 * snakes merge and lose touching end decorations first) and widens itself
 * when that ink overruns the tile's own declared width
 * (`getInnerDimensionSlow`, `:178-186`). A loop's back connector is the
 * usual culprit: `FtileWhile.ConnectionBackSimple` runs its vertical at
 * `xx = dimTotal.getWidth()` (`FtileWhile.java:266-268`) and emphasizes it
 * with an `asToUp` arrowhead (`.emphasizeDirection(Direction.UP)`, `:262`;
 * `Worm.java:138-139,178-181`), a `UPolygon` spanning `xx +- 4`
 * (`ArrowsRegular.java:42-53`) that `LimitFinder#drawUPolygon` pads by a
 * further `HACK_X_FOR_POLYGON = 10` (`LimitFinder.java:169-177`): ink
 * `maxX = width + 14`.
 *
 * Emulated by walking the body alone at the origin -- the same `walkTile`
 * the real layout runs, so every draw call the jar would replay is
 * recorded -- then {@link mergeSnakes} (the `UGraphicForSnake` flush,
 * `UGraphicForSnake.java:159-165`) and {@link inkBoundsOf}. No lane
 * placement runs: `getInnerMinMax` draws on a bare `LimitFinder`, never
 * through `Swimlanes`' per-lane interceptor.
 */
import type { Tile } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import { walkTile, type Out } from './tile-coordinates.js';
import { mergeSnakes } from './snake-merge.js';
import { inkBoundsOf } from './canvas-origin.js';

function freshOut(): Out {
  let idCounter = 0;
  return {
    nodes: [],
    edges: [],
    edgeMeta: [],
    reservations: [],
    nextId: (prefix: string) => `ink-${prefix}-${++idCounter}`,
  };
}

/**
 * The ink `maxX` of `body` drawn at the origin, or `undefined` when it
 * draws nothing -- `LimitFinder#getMinMax` then returns `MinMax.getEmpty
 * (true)`, all zero (`LimitFinder.java:247-252`), which `GtileGroup` must
 * not shift by the `FtileMarged` margin.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileGroup.java:150-158
 */
export function groupInnerInkMaxX(body: Tile, theme: Theme): number | undefined {
  const out = freshOut();
  walkTile(body, 0, 0, { kindHint: null, lane: undefined }, out);
  const merged = mergeSnakes(out.edges, out.edgeMeta);
  const ink = inkBoundsOf({ nodes: out.nodes, edges: merged.edges, reservations: out.reservations }, theme);
  return Number.isFinite(ink.maxX) ? ink.maxX : undefined;
}
