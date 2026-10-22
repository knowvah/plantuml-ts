/**
 * A grouping frame's geometry and paint (sdd1 T3a): `GroupingTile` drawing
 * `ComponentRoseGroupingHeader`, and each `ElseTile` drawing
 * `ComponentRoseGroupingElse`. Split out of `sequence-layout-events.ts`
 * (500-line cap) when the family moved onto the style seam. A `ref` is its
 * own tile (`sequence-layout-ref.ts`).
 *
 * Every grouping style is merged in its event's constructor from the builder
 * current at the command (D2): `Grouping.java:104-113`, for the opener
 * (`SequenceDiagram.java:427-428`) and for each `else` leaf (`:431-432`).
 * The style reads, per component:
 *
 * - `ComponentRoseGroupingHeader(teoz, style, styleHeader, …)`
 *   (`ComponentRoseGroupingHeader.java:74-92`): `styleHeader`'s font and
 *   alignment for the title (`AbstractTextualComponent.java:78-91`);
 *   `style`'s `RoundCorner` (`:79`) and symbol context (`:81`, stroke and
 *   line colour of both rects, `:128,144`); `styleHeader`'s symbol context
 *   for the corner tab (`:82,142`); `style`'s font for the `[comment]`
 *   (`:84,90`). Under teoz the background is transparent (`:80`).
 * - `ComponentRoseGroupingElse(teoz, style, …)` (`ComponentRoseGroupingElse
 *   .java:64-72`): the leaf style's font and alignment, `LineColor` (`:70`).
 * - `GroupingTile#drawBackground` (`GroupingTile.java:308-316`): the body
 *   style's `BackGroundColor` and `RoundCorner` for the `Blotter`.
 */
import type { ElseGeo, FrameEvent, FrameGeo, TextRun } from './ast.js';
import { atomFontSpec } from './sequence-creole-text-atom.js';
import { alignedBlockRuns } from './sequence-block-align.js';
import type { SequencePaint } from './sequence-skin-param.js';
import {
  atomsOf,
  buildTabRuns,
  computeHeaderTab,
  conditionLines,
  ELSE_PADDING_X1,
  elseComponentWidth,
  elsePaint,
  groupingPaints,
  headerWidth,
  type FramePaints,
  type HeaderTab,
} from './sequence-frame-metrics.js';
import { handleRefEvent } from './sequence-layout-ref.js';
import { processEvents, type EventCursor, type EventProcessingContext } from './sequence-layout-events.js';
import {
  childTileSpans,
  frameXOrigin,
  registerGroupTile,
  resolveFrameSpan,
  type XSpan,
} from './sequence-layout-frame-extent.js';

const ELSE_PADDING_Y = 1;
/** The teoz arm's extra `+ 2` (`ComponentRoseGroupingElse.java:110`). This
 *  engine is teoz-only, so the non-teoz arm has no reader here. */
const ELSE_TEOZ_DY = 2;
/** The teoz arm's `+ 4` (`ComponentRoseGroupingElse#getPreferredHeight:
 *  115-121`), on top of the component's own `getTextHeight`. */
const ELSE_TEOZ_DELTA_H = 4;

/**
 * Vertical room an `else` separator plus its bracketed condition occupies.
 * `ElseTile:80` reserves the component's `getPreferredHeight`, whose teoz arm
 * is `getTextHeight + 4` (`ComponentRoseGroupingElse:115-121`) over padding
 * `topRightBottomLeft(1, 5, 1, 5)` (`:65-67`) — so `blockH + 6`, 17 for an
 * 11px condition. `blockH` is **0** for a bare `else`: the constructor takes
 * `comment == null ? null : "[" + comment + "]"`, so a conditionless branch
 * has no display. Jar-verified on `cazusa-73-masi168`, whose bare rule at 311
 * chains the next frame at 316 and whose labelled rule at 496 chains it at 512.
 * The block is at the leaf style's font (`AbstractTextualComponent.java:78`).
 */
function separatorHeight(label: string, paint: SequencePaint, ctx: EventProcessingContext): number {
  const lines = conditionLines(label);
  const blockH = lines.length * ctx.measurer.measure('M', atomFontSpec(paint.font)).height;
  return blockH + 2 * ELSE_PADDING_Y + ELSE_TEOZ_DELTA_H;
}

/**
 * An `else` branch's bracketed condition, as placed and measured runs (A5),
 * at the leaf style's font and alignment. `drawInternalU`'s teoz arm draws
 * the block at `UTranslate(getOldPaddingX1(), getOldPaddingY() + 2)`, i.e.
 * `(5, 3)` (`ComponentRoseGroupingElse.java:109-112`). Jar-verified on
 * `bovugo-63-lazo401`, whose `else sinon` puts `[sinon]` at x=18.469 against
 * a frame at x=13.469.
 */
function branchConditionRuns(
  label: string,
  paint: SequencePaint,
  origin: { readonly frameX: number; readonly separatorY: number },
  ctx: EventProcessingContext,
): readonly TextRun[] {
  const at = { leftX: origin.frameX + ELSE_PADDING_X1, top: origin.separatorY + ELSE_PADDING_Y + ELSE_TEOZ_DY };
  return alignedBlockRuns(conditionLines(label), paint.font, at, paint.align, {
    measurer: ctx.measurer,
    atoms: atomsOf(paint, ctx),
  }).runs;
}

/** An else tile pushed during the walk, its x extent still to be filled. */
interface PendingElse {
  readonly geo: ElseGeo;
  readonly label: string;
  /** Its component's preferred width (`ElseTile.java:157-161`). */
  readonly width: number;
}

/**
 * One `ElseTile` (`ElseTile.java:74-81`), at the y the cursor reached: pushed
 * into the event stream where it falls among the group's child tiles
 * (`GroupingTile.java:162-170`), so it is drawn in their order
 * (`GroupingTile#drawU:280-281`), and recorded on the frame for the
 * `Blotter`, which reads each else tile's top and general colour
 * (`GroupingTile.java:318-347`). The colour is index-aligned with
 * `branchLabels` (`event.branchColors`, T2 D10); `renderer-frame-blotter.ts`
 * falls back to the group colour when a band has none (`:333-339`). Its x,
 * width and runs are the frame's, filled by {@link resolveFrame}.
 */
function pushElseTile(
  event: FrameEvent,
  i: number,
  frameGeo: FrameGeo,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): PendingElse {
  const paint = elsePaint(event, i);
  const branchColor = event.branchColors?.[i];
  const label = event.branchLabels[i] ?? '';
  const y = cursor.y;
  frameGeo.branchSeparators.push({
    y,
    label,
    ...(branchColor !== undefined ? { backColorGeneral: branchColor } : {}),
  });
  // x, width and runs are placeholders -- filled by `resolveFrame`.
  const geo: ElseGeo = { paint, kind: 'else', x: 0, width: 0, y, runs: [] };
  ctx.eventGeos.push(geo);
  cursor.y += separatorHeight(label, paint, ctx);
  return { geo, label, width: elseComponentWidth(label, paint, ctx) };
}

/** Every branch in turn: an `else` tile before each branch after the first,
 *  then the branch's own events. */
function walkBranches(
  event: FrameEvent,
  frameGeo: FrameGeo,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): PendingElse[] {
  const elses: PendingElse[] = [];
  event.branches.forEach((branch, i) => {
    if (i > 0) elses.push(pushElseTile(event, i, frameGeo, cursor, ctx));
    cursor.y = processEvents(branch, cursor.y, ctx);
  });
  return elses;
}

/**
 * The frame's x extent, once its children are laid out
 * (`GroupingTile.java:186-225`), written back onto the frame, its tab runs and
 * every else tile -- which draws across the frame's own `getFrameMinX`/
 * `getFrameMaxX` (`ElseTile.java:117-131`) -- then recorded for a parent group.
 */
function resolveFrame(
  pending: { readonly event: FrameEvent; readonly frameGeo: FrameGeo; readonly start: number },
  elses: readonly PendingElse[],
  paints: FramePaints,
  ctx: EventProcessingContext,
): void {
  const { event, frameGeo, start } = pending;
  const tab: HeaderTab = frameGeo;
  const span: XSpan = resolveFrameSpan({
    children: childTileSpans(event, start, ctx),
    elseWidths: elses.map((e) => e.width),
    headerWidth: headerWidth(tab, paints.paint, ctx),
    xOrigin: frameXOrigin(ctx),
  });
  frameGeo.x = span.min;
  frameGeo.width = span.max - span.min;
  frameGeo.tabRuns = buildTabRuns(tab, paints, span.min, frameGeo.y, ctx);
  for (const { geo, label } of elses) {
    geo.x = span.min;
    geo.width = frameGeo.width;
    geo.runs = branchConditionRuns(label, geo.paint, { frameX: span.min, separatorY: geo.y }, ctx);
  }
  registerGroupTile(frameGeo, ctx.eventGeos.length);
}

/** The frame's geo as `handleFrameEvent` reserves its slot: everything the
 *  walk cannot change, and placeholders for what {@link resolveFrame} and the
 *  walk fill (see the mutation contract below). */
function openFrameGeo(event: FrameEvent, paints: FramePaints, tab: HeaderTab, y: number): FrameGeo {
  return {
    ...paints,
    kind: 'frame',
    frameType: event.frameType,
    label: event.label,
    x: 0, // placeholder -- `resolveFrame`
    y,
    width: 0, // placeholder -- `resolveFrame`
    height: 0, // placeholder -- filled once the branch walk resolves frameEndY
    ...(event.backColorElement !== undefined ? { backColorElement: event.backColorElement } : {}),
    ...(event.backColorGeneral !== undefined ? { backColorGeneral: event.backColorGeneral } : {}),
    branchSeparators: [], // placeholder -- populated by `walkBranches`
    refBody: [],
    ...tab,
    tabRuns: [], // placeholder -- `resolveFrame`
  };
}

/** `GroupingTile.EXTERNAL_MARGINY` (`teoz/GroupingTile.java:89`) — vertical
 *  breathing room around a group frame, on each side. Reserved on both in
 *  `getPreferredHeight`; the TOP one is additionally materialised at draw time
 *  through `getFrameY()`. */
const FRAME_EXTERNAL_MARGINY = 4;

/** `GroupingTile.MARGINY_MAGIC` (`teoz/GroupingTile.java:92`) — always read as
 *  a half (`MARGINY_MAGIC / 2`) above the body and again below the border, and
 *  as the whole in the tile's reserved height. */
const FRAME_MARGINY_MAGIC = 20;

/**
 * MUTATION CONTRACT (D2 -- reserve the slot, then fill it).
 *
 * `frameGeo` is pushed into `ctx.eventGeos` BEFORE `event.branches` is
 * walked, so upstream's depth-first PRE-ORDER emission falls out for free,
 * nested groups included: `GroupingTile#drawU:262-282` draws its own
 * component, then recurses into `tiles`, and a nested `handleFrameEvent`
 * call pushes ITS OWN FrameGeo mid-walk.
 *
 * The tab fields, the paints and `y` are resolved BEFORE the push: none of
 * them can change during the branch walk. `x`, `width` and `tabRuns` depend on
 * the child tiles (`GroupingTile.java:186-225`), `height` and
 * `branchSeparators` on where the branches leave the cursor, so those start as
 * placeholders and are filled by direct mutation once the branches have been
 * walked -- upstream's construct-then-resolve split (the `Real`/`YGauge` chain
 * is built at construction, read once solved). Nothing reads a frame's x
 * during its own walk.
 *
 * A parallel (`& group`) frame chains on the previous tile's MIN, and its
 * reserved max is pushed past the previous tile's max (`:145-154,229-236`).
 */
export function handleFrameEvent(event: FrameEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  // A `ref` is a `ReferenceTile`, not a `GroupingTile` (`sequence-layout-ref.ts`).
  if (event.frameType === 'ref') return handleRefEvent(event, cursor, ctx);
  // `previousMax = currentY.getMax()`; `firstY = parallel ? currentY.getMin()
  // : previousMax` (`:145-154`). `frameStartY` is the GAUGE MIN -- the
  // chaining point, NOT the drawn frame's top.
  const previousMax = cursor.y;
  const frameStartY = event.parallel === true ? cursor.gauge.min : previousMax;
  const paints = groupingPaints(event);
  const tab = computeHeaderTab(event, paints.headerPaint, ctx);
  // `h = dim1.getHeight() + MARGINY_MAGIC / 2 + EXTERNAL_MARGINY` (`:157`).
  cursor.y = frameStartY + tab.tabHeight + FRAME_MARGINY_MAGIC / 2 + FRAME_EXTERNAL_MARGINY;
  // `getFrameY()` (`:247-249`) -- the drawn border, one top margin below.
  const frameDrawnY = frameStartY + FRAME_EXTERNAL_MARGINY;
  const frameGeo = openFrameGeo(event, paints, tab, frameDrawnY);
  ctx.eventGeos.push(frameGeo);
  const start = ctx.eventGeos.length;
  const elses = walkBranches(event, frameGeo, cursor, ctx);
  resolveFrame({ event, frameGeo, start }, elses, paints, ctx);
  // `getTotalHeight = bodyHeight + dimIfEmpty.getHeight() + MARGINY_MAGIC / 2`
  // (`:349-352`), which `cursor.y - frameDrawnY` is exactly.
  frameGeo.height = cursor.y - frameDrawnY;
  // `getPreferredHeight` (`:355-365`) leaves `EXTERNAL_MARGINY +
  // MARGINY_MAGIC / 2` of slack below the drawn border; a parallel group's
  // max dominates the previous tile's (`parallelMax.ensureBiggerThan`, `:234-235`).
  cursor.y = Math.max(cursor.y + FRAME_EXTERNAL_MARGINY + FRAME_MARGINY_MAGIC / 2, previousMax);
  // `grouping(... GroupingType.END ...)` sets `lastEventWithDeactivate` to the
  // `GroupingLeaf` (`SequenceDiagram.java:438`), which is not an
  // `AbstractMessage` -- so a `destroy` straight after `end` is standalone.
  ctx.lastMessageParticipants = undefined;
}
