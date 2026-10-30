/**
 * Where the jar puts each json node: `SmetanaForJson#drawMe`'s `max` and
 * `#getPosition`, over the engine's raw node frame.
 *
 * That frame is `DotLayoutResult#engineNodes` — graphviz's `ND_coord` centre,
 * native y-up, engine size in points, no shift and no flip.
 *
 * The graph was solved TOP-TO-BOTTOM with every node's width and height
 * swapped (`SmetanaForJson.java:236-244`), so the engine's y axis (ranks) is
 * the diagram's x axis and the engine's x axis (in-rank) is the diagram's y.
 * Upstream reads it back as:
 *
 *     double getMaxX() {                                  // :97-102
 *       final double height = data.height * 72;
 *       double y = data.coord.y;
 *       return y + height / 2;
 *     }
 *     double max = 0;                                     // :160-164
 *     for (InternalNode node : nodes)
 *       max = Math.max(max, node.getMaxX());
 *     xMirror = new Mirror(max);
 *     …
 *     final double width = data.width * 72;               // :203-209
 *     final double height = data.height * 72;
 *     double x = data.coord.x;
 *     double y = data.coord.y;
 *     return new UTranslate(x - width / 2, xMirror.inv(y + height / 2)).sym();
 *
 * `sym()` swaps the two components (`klimt/UTranslate.java:111-113`), so the
 * diagram origin is `(max - (cy + h/2), cx - w/2)`. `max` is over NODES only —
 * no edge point enters it — and there is no min-shift.
 *
 * Only the ORIGIN comes from here: upstream draws `node.block` (the measured
 * `TextBlockJson`) at this translation, never the engine's box.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/SmetanaForJson.java
 */

import type { DotLayoutResult } from '../../core/graph-layout.js';
import { Mirror } from './Mirror.js';

/** One node of the engine's raw frame (`DotLayoutResult.engineNodes`). */
export type JsonEngineNode = NonNullable<DotLayoutResult['engineNodes']>[number];

/**
 * A node's diagram-frame placement: `x`/`y` are `getPosition`'s translation;
 * `width`/`height` are the ENGINE box transposed into the diagram frame
 * (`data.height*72` across, `data.width*72` down) — what the jar positions
 * against, not what it draws (that is the measured block's size).
 */
export interface JsonNodePosition {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface JsonNodePositions {
  /** Keyed by node id. */
  readonly positions: ReadonlyMap<string, JsonNodePosition>;
  /** `new Mirror(max)` (`:164`) — the edges go through the same one (`:212-215`). */
  readonly xMirror: Mirror;
}

/** @see SmetanaForJson.java:97-102 (`InternalNode#getMaxX`) */
function getMaxX(n: JsonEngineNode): number {
  return n.cy + n.height / 2;
}

/** @see SmetanaForJson.java:203-209 (`getPosition`, then `UTranslate#sym`) */
function getPosition(n: JsonEngineNode, xMirror: Mirror): JsonNodePosition {
  return { x: xMirror.inv(n.cy + n.height / 2), y: n.cx - n.width / 2, width: n.height, height: n.width };
}

/**
 * `drawMe`'s `max` and every node's `getPosition`.
 * @see SmetanaForJson.java:160-168
 */
export function jsonNodePositions(engineNodes: ReadonlyArray<JsonEngineNode>): JsonNodePositions {
  let max = 0;
  for (const n of engineNodes) max = Math.max(max, getMaxX(n));
  const xMirror = new Mirror(max);
  const positions = new Map<string, JsonNodePosition>();
  for (const n of engineNodes) positions.set(n.id, getPosition(n, xMirror));
  return { positions, xMirror };
}
