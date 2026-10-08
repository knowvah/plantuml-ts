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
import type { Theme } from '../../../core/theme.js';
import { activityFontSize } from '../activity-style-defaults.js';
import { edgeLabelBlockSize } from './compress/edge-label-anchor.js';
import { TITLE_ASCENT_FRACTION } from './swimlane-placement.js';
import type { Reservation } from './hexagon-reservations.js';
import { pushLaneReservation } from './swimlane-reservation-lane.js';

/** One pending `-> label;`, carried from the `arrow-label` node that set
 *  it to whichever tile consumes it next ({@link Tile.inLabel}'s own
 *  doc, `tiles/tile.ts`). `label` is `''` for a style-only arrow
 *  (`-[#red]->`); `color` is `CommandArrow3`'s COLOR group verbatim, the
 *  next arrow's `Rainbow` definition (`CommandArrow3.java:99-103`). */
export type PendingInLabel = { label: string; color?: string };

/**
 * `CommandArrow3#executeArg` (`CommandArrow3.java:96-110`): the COLOR group
 * sets the next arrow's rainbow (`setColorNextArrow`), a non-empty LABEL
 * its label (`setLabelNextArrow`, `ActivityDiagram3.java:456-465`). Both
 * absent ("plain arrow, with no effect", `:92`) -> `undefined`. An empty
 * label never becomes a drawn `Text` (`Snake.java:124-136`); see
 * {@link applyInLabel}.
 */
export function consumeArrowLabel(node: ActivityArrowLabel): PendingInLabel | undefined {
  if (node.style === undefined) return node.label === '' ? undefined : { label: node.label };
  return { label: node.label, color: node.style };
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
 * T1d: the SAME "mutate in place, return for chaining" pattern as
 * {@link withInLabel}, for {@link Tile.outLabel} -- a trailing `->
 * label;` a branch/case body's own `tileNodes` call never consumed
 * (`TileNodesResult.trailing`, `tile-layout.ts`). Threaded by each
 * compound builder onto the branch/case tile IT owns, not by
 * `tileNodes` itself (unlike {@link withInLabel}, which `tileNodes`
 * applies generically to whichever tile comes next -- the trailing
 * value instead needs the CALLER's own branch-tile reference, which
 * only the compound builder has).
 */
export function withOutLabel<T extends { outLabel?: PendingInLabel | undefined }>(
  tile: T,
  outLabel: PendingInLabel | undefined,
): T {
  if (outLabel !== undefined) tile.outLabel = outLabel;
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
  theme: Theme,
): Reservation {
  // add4-T3j: the drawn block (`edgeLabelBlockSize`, `Snake.java:247`) at
  // the theme's arrow font places the label; each `UText` sits inside
  // `SheetBlock1`'s padding (`SheetBlock1.java:209-210`), stacked one font
  // size apart (`SheetBlock1.java:146-148`) -- the same box as
  // `canvas-origin-text-ink.ts#extendForEdgeLabelText`.
  const lines = inLabel.label.split('\n');
  const fontSize = activityFontSize(theme, 'arrow');
  const pad = theme.padding ?? 0;
  const dim = edgeLabelBlockSize(inLabel.label, theme);
  const position = getTextBlockPosition(points, dim, align);
  const baselineY = position.y + pad + fontSize * TITLE_ASCENT_FRACTION;
  const top = baselineY - (fontSize - 1.5);
  const bottom = baselineY + fontSize * (lines.length - 1) + 1.5;
  return { x: position.x + pad, y: top, width: dim.width - 2 * pad, height: bottom - top };
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
  applyPendingLabelToLastEdge(out, tile.inLabel, align);
}

/**
 * {@link applyInLabel}'s OUT-side mirror, for {@link Tile.outLabel} --
 * attaches a branch/case's own trailing label (`Branch#special`/
 * `InstructionList#outlinkRendering`, {@link withOutLabel}'s own
 * citations) to the edge the caller just pushed for that tile's OWN
 * outgoing connection (`ConnectionVerticalOut`/`ConnectionLastElseOut`/
 * `ConnectionOut`/`ConnectionVerticalBottom`-equivalent push sites).
 */
export function applyOutLabel(out: Out, tile: { readonly outLabel?: PendingInLabel }, align: SnakeTextAlign): void {
  applyPendingLabelToLastEdge(out, tile.outLabel, align);
}

/** The body {@link applyInLabel}/{@link applyOutLabel} share: both sides
 *  read a DIFFERENT field off the SAME kind of pending value and attach
 *  it to the most-recently-pushed edge identically. */
function applyPendingLabelToLastEdge(out: Out, pending: PendingInLabel | undefined, align: SnakeTextAlign): void {
  if (pending === undefined) return;
  const edge = out.edges[out.edges.length - 1]!;
  if (pending.color !== undefined) edge.color = pending.color;
  if (pending.label === '') return;
  edge.label = pending.label;
  edge.labelAlign = align;
  const r = inLabelReservation(edge.points, pending, align, out.theme);
  pushLaneReservation(out.reservations, r, labelLane(out.edgeMeta[out.edgeMeta.length - 1]!));
}

/**
 * The lane whose pass draws a same-lane connection's Snake label: the gate
 * passes in lane L when each end tile is null or in L
 * (`UGraphicInterceptorOneSwimlane.java:93-104`). A cross-lane connection
 * draws in the `Cross` pass through `drawTranslate`, with no single lane
 * frame (`Swimlanes.java:184-199`), so it stays untagged.
 */
function labelLane(meta: {
  readonly lane1: string | undefined;
  readonly lane2: string | undefined;
}): string | undefined {
  if (meta.lane1 !== undefined && meta.lane2 !== undefined && meta.lane1 !== meta.lane2) return undefined;
  return meta.lane1 ?? meta.lane2;
}
