/**
 * T1b pass 2 (`activity-divergence-drive-3`): the generic `-> label;`
 * mechanism, split out of `tile-layout.ts` only to keep that file under
 * the 500-line hook (mission convention, "a sibling module when a file
 * would cross the hook" -- the same reasoning `tile-layout-backward.ts`
 * was already split out for).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:105-106,437-465
 *   -- `setLabelNextArrow` stores the pending `LinkRendering` on
 *   `swimlanes`; every `add*`/`fork`/`start`/`stop`/... method reads
 *   `nextLinkRenderer()` as the NEW instruction's own incoming link,
 *   then resets it to `LinkRendering.none()`. `tileNodes`'s own loop
 *   (`tile-layout.ts`) is this port's equivalent "current instruction
 *   list" walk; {@link consumeArrowLabel}/{@link withInLabel} are its
 *   pending-state and attach-to-next-tile halves.
 */

import type { ActivityArrowLabel } from '../ast.js';
import type { SnakeTextAlign } from './snake-text-position.js';
import { getTextBlockPosition } from './snake-text-position.js';
import type { Out } from './tile-coordinates.js';
import type { Reservation } from './hexagon-reservations.js';
import { centeredFirstBaselineY } from '../activity-renderer-shapes.js';
import { ARROW_LABEL_LAYOUT_FONT_SIZE } from '../activity-layout-constants.js';
import { WidthTableMeasurer } from '../../../core/measurer.js';

/** Measures an in-link label's width at layout time -- `family` is unused
 *  by `WidthTableMeasurer` (it reads only `size`, a universal sans-serif
 *  table), so the module-level instance below needs no `Theme`. */
const LABEL_MEASURER = new WidthTableMeasurer();

/** One pending `-> label;`, carried from the `arrow-label` node that set
 *  it to whichever tile consumes it next ({@link Tile.inLabel}'s own
 *  doc, `tiles/tile.ts`). */
export type PendingInLabel = { label: string; color?: string };

/**
 * `setLabelNextArrow(Display label)` (`ActivityDiagram3.java:456-465`):
 * builds the pending value from one `arrow-label` AST node. Returns
 * `undefined` for an empty label (`ActivityArrowLabel.label === ''`),
 * mirroring `Snake#withLabel(TextBlock, ...)`'s own `textBlock != null`
 * guard (`Snake.java:124-136`) -- an empty `Display` never becomes a
 * drawn `Text` upstream either.
 */
export function consumeArrowLabel(node: ActivityArrowLabel): PendingInLabel | undefined {
  if (node.label === '') return undefined;
  return node.color === undefined ? { label: node.label } : { label: node.label, color: node.color };
}

/**
 * Mirrors `tile-layout.ts#withSwimlane`'s own "mutate in place, return
 * for chaining" pattern for {@link Tile.inLabel} -- the SAME shape
 * every `tileSimpleLeaf`/`tileEarlyLeaf`/compound-builder call already
 * threads a tile through. A no-op when `inLabel` is `undefined` (no
 * pending label), so every existing `withInLabel(tileNode(...), pending)`
 * call site stays correct whether or not a label preceded that node.
 */
export function withInLabel<T extends { inLabel?: PendingInLabel | undefined }>(
  tile: T,
  inLabel: PendingInLabel | undefined,
): T {
  if (inLabel !== undefined) tile.inLabel = inLabel;
  return tile;
}

/**
 * `LimitFinder#drawText`'s own ink box (`klimt/drawing/LimitFinder.java:
 * 216-224`), computed at WALK time (pre-compression) over the edge's own
 * RAW points -- mirrors `canvas-origin-text-ink.ts#extendForEdgeLabelText`'s
 * render-time version of the SAME formula, needed here too because
 * `CompressionXorYBuilder` (`activity-layout-constants.ts
 * #SEQUENTIAL_ASSEMBLY_GAP`'s own doc) would otherwise collapse the
 * height {@link sequentialGap} reserved for this label right back down:
 * compression only protects ink it can SEE, via `out.reservations`
 * (`hexagon-reservations.ts#Reservation`'s own doc -- "threaded into
 * `finalizeGeometry`'s `reservations` param ... for the compressor").
 */
function inLabelReservation(
  points: readonly { x: number; y: number }[],
  inLabel: PendingInLabel,
  align: SnakeTextAlign,
): Reservation {
  const width = LABEL_MEASURER.measure(inLabel.label, { family: '', size: ARROW_LABEL_LAYOUT_FONT_SIZE }).width;
  const dim = { width, height: ARROW_LABEL_LAYOUT_FONT_SIZE };
  const position = getTextBlockPosition(points, dim, align);
  const baselineY = centeredFirstBaselineY(position.y + dim.height / 2, dim.height, 1);
  const top = baselineY - (dim.height - 1.5);
  return { x: position.x, y: top, width, height: dim.height };
}

/**
 * Attaches a tile's {@link Tile.inLabel} (if set) onto the edge most
 * recently pushed onto `out` -- the generic "connection INTO this tile"
 * half of the mechanism, called by every connector push site that
 * builds the edge feeding `tile` (`ConnectionVerticalDown` and every
 * other table-1 row this pass wires). `align` is that SPECIFIC
 * connector class's own `withLabel` alignment argument (e.g.
 * `arrowHorizontalAlignment()` -> `{horizontal: 'LEFT'}`,
 * `VerticalAlignment.CENTER` -> `{vertical: 'CENTER'}`) -- never
 * derived here, since different connector classes pass different
 * alignments for the SAME kind of pending label. Also pushes
 * {@link inLabelReservation} so the space {@link sequentialGap}-style
 * height reservations add for this label survives compression.
 */
export function applyInLabel(out: Out, tile: { readonly inLabel?: PendingInLabel }, align: SnakeTextAlign): void {
  const inLabel = tile.inLabel;
  if (inLabel === undefined) return;
  const edge = out.edges[out.edges.length - 1]!;
  edge.label = inLabel.label;
  edge.labelAlign = align;
  if (inLabel.color !== undefined) edge.color = inLabel.color;
  out.reservations.push(inLabelReservation(edge.points, inLabel, align));
}
