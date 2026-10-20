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
import type { ElseGeo, FrameEvent, FrameGeo, ParticipantGeo, SequenceEvent, TextRun } from './ast.js';
import type { HColor } from '../../core/style/Value.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { noteTileExtent } from './sequence-layout-note.js';
import { displayLines } from './text-block-geo.js';
import { sequenceAtomContext, sequenceCreoleRuns, type SequenceAtomContext } from './sequence-creole.js';
import { atomFontSpec } from './sequence-creole-text-atom.js';
import { alignedBlockRuns } from './sequence-block-align.js';
import { groupingHeaderDisplay, HEADER_PADDING } from './frame-style.js';
import { groupingStyle, paintOf, type SequencePaint } from './sequence-skin-param.js';
import { handleRefEvent } from './sequence-layout-ref.js';
import { processEvents, type EventCursor, type EventProcessingContext } from './sequence-layout-events.js';
import { TRANSPARENT_SVG } from './text-block-geo.js';

/** A frame's two paints: its body (`style`) and its header (`styleHeader`). */
export interface FramePaints {
  readonly paint: SequencePaint;
  readonly headerPaint: SequencePaint;
}

/**
 * A `COLORS` capture as the command resolves it -- `colorSet.getColor(color)`,
 * `null` where none was written (`CommandGrouping.java:132-133,161-165`;
 * `CommandReferenceOverSeveral.java:119`).
 */
export function groupingColor(raw: string | undefined): HColor | undefined {
  return raw === undefined ? undefined : HColorSet.instance().getColor(raw);
}

/**
 * `GroupingStart#getUsedStyles` (`GroupingStart.java:63-69`,
 * `Grouping.java:98-102`): the body style with the general colour as its
 * `BackGroundColor`, the header (`groupHeader` under the nested
 * `group { header }`, `Grouping.java:83-96`) with the element colour.
 */
export function groupingPaints(event: FrameEvent): FramePaints {
  const set = HColorSet.instance();
  const builder = event.styleBuilder;
  return {
    paint: paintOf(groupingStyle(builder, 'START', false, groupingColor(event.backColorGeneral)), set),
    headerPaint: paintOf(groupingStyle(builder, 'START', true, groupingColor(event.backColorElement)), set),
  };
}

/**
 * The style `ElseTile#getComponent` hands `ComponentRoseGroupingElse`
 * (`ElseTile.java:92-101`): the leaf's `getUsedStyles()[0]`, merged from its
 * own builder, its `BackGroundColor` its own general colour or the opener's
 * (`GroupingLeaf.java:63-69`).
 */
function elsePaint(event: FrameEvent, index: number): SequencePaint {
  const builder = event.branchStyleBuilders[index] ?? event.styleBuilder;
  const back = groupingColor(event.branchColors?.[index] ?? event.backColorGeneral);
  return paintOf(groupingStyle(builder, 'ELSE', false, back), HColorSet.instance());
}

/** `HColor#toSvg` of a transparent colour (`HColor.java:76`): the bridge
 *  reads a transparent font colour as `null` (`FontConfigurationBridge.ts`). */

/**
 * What a frame text block's creole needs to draw a `<$sprite>` (unwind2-S9b):
 * the sprites and the text's own `FontColor`, which `AtomSprite` tints a
 * monochrome sprite by (`StripeSimple.java:228-235`). `ComponentRoseGroupingHeader
 * #drawInternalU` fills the corner through a DERIVED `ug` (`:142`) and draws
 * the text on one that never had a back applied (`:144,151`), so there is
 * none -- jar-verified white on `tests/fixtures/unwind2-S7/s-group.svg`.
 */
function atomsOf(paint: SequencePaint, ctx: EventProcessingContext): SequenceAtomContext | undefined {
  return sequenceAtomContext(ctx.sprites, paint.font.color ?? TRANSPARENT_SVG);
}

/** `ComponentRoseGroupingElse`'s own padding, `topRightBottomLeft(1, 5, 1, 5)`
 *  (`:65-67`) — left and top respectively. */
const ELSE_PADDING_X1 = 5;
const ELSE_PADDING_Y = 1;
/** The teoz arm's extra `+ 2` (`ComponentRoseGroupingElse.java:110`). This
 *  engine is teoz-only, so the non-teoz arm has no reader here. */
const ELSE_TEOZ_DY = 2;
/** The teoz arm's `+ 4` (`ComponentRoseGroupingElse#getPreferredHeight:
 *  115-121`), on top of the component's own `getTextHeight`. */
const ELSE_TEOZ_DELTA_H = 4;

/** The `else` component's text: `"[" + comment + "]"` through
 *  `Display.getWithNewlines` (`ComponentRoseGroupingElse.java:65-66`,
 *  `AbstractTextualComponent.java:60-63`); none for a bare `else`. */
function conditionLines(label: string): readonly string[] {
  const condition = label.trim();
  return condition === '' ? [] : displayLines(`[${condition}]`);
}

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

/** `GroupingTile.MARGINX` (`teoz/GroupingTile.java:90`) — how far a group's
 *  frame reaches beyond the tiles it contains, on each side. */
const FRAME_MARGIN_X = 16;

/**
 * Compute the bounding centerX range across all participants.
 * Returns [0, 0] when the map is empty (only possible in degenerate inputs
 * since layoutSequence returns early for empty participants).
 */
function participantCenterXBounds(participantMap: Map<string, ParticipantGeo>): { minCx: number; maxCx: number } {
  const centerXs = [...participantMap.values()].map((g) => g.centerX);
  if (centerXs.length === 0) return { minCx: 0, maxCx: 0 };
  return { minCx: Math.min(...centerXs), maxCx: Math.max(...centerXs) };
}

/** A group frame's x and width -- participant column bounds only, so
 *  `handleFrameEvent` resolves them BEFORE the branch walk (D2). */
function computeFrameBody(event: FrameEvent, ctx: EventProcessingContext): { x: number; width: number } {
  const { minCx, maxCx } = participantCenterXBounds(ctx.participantMap);
  // A note inside the group is a child tile like any other: `min2.add(tile
  // .getDrawnMinX().addFixed(-MARGINX))` and its max (`GroupingTile.java
  // :211-214`), so one that reaches past the lifelines widens the frame.
  const notes = groupNoteExtents(event, ctx);
  const lo = Math.min(minCx, ...notes.map((n) => n.minX + FRAME_MARGIN_X));
  const hi = Math.max(maxCx, ...notes.map((n) => n.maxX - FRAME_MARGIN_X));
  // Jar-verified on `bovugo-63-lazo401`: its `opt` frame is `x="13.469"`
  // against a leftmost lifeline centre of 29.469 -- `MARGINX`, 16.
  return { x: lo - FRAME_MARGIN_X, width: hi - lo + 2 * FRAME_MARGIN_X };
}

/** The extent of every note in `event`'s branches, nested groups included. */
function groupNoteExtents(event: FrameEvent, ctx: EventProcessingContext): { minX: number; maxX: number }[] {
  const notes: { minX: number; maxX: number }[] = [];
  const visit = (events: readonly SequenceEvent[]): void => {
    for (const e of events) {
      if (e.kind === 'note') notes.push(noteTileExtent(e, ctx));
      else if (e.kind === 'frame') for (const branch of e.branches) visit(branch);
    }
  };
  for (const branch of event.branches) visit(branch);
  return notes;
}

/** A creole line's total advance: its LAST run's right edge, never a sum of
 *  widths -- a non-text atom advances x without producing a run. */
function creoleLineWidth(runs: readonly TextRun[]): number {
  const last = runs.at(-1);
  return last === undefined ? 0 : last.x + last.textWidth;
}

/** The header tab's fields `FrameGeo` carries. */
interface HeaderTab {
  readonly tabText: string;
  readonly tabComment?: string;
  readonly tabTextWidth: number;
  readonly tabWidth: number;
  readonly tabHeight: number;
}

/**
 * The title's display lines. An empty title (`group [c]`, whose rewritten
 * title is `""`) is a `TextBlockEmpty`, no line at all
 * (`AbstractTextualComponent.java:87-88`), so its tab is its padding alone.
 */
function titleLinesOf(tabText: string): readonly string[] {
  return tabText === '' ? [] : displayLines(tabText);
}

/**
 * The header tab's `Display`, split by `groupingHeaderDisplay`
 * (`GroupingTile.java:127-128`), then measured at `styleHeader`'s font --
 * `ComponentRoseGroupingHeader.java:107-123` / `AbstractTextualComponent
 * .java:100-114`, with `getSuppHeightForComment` and `commentMargin * 2`
 * both 0. An empty `branchLabels[0]` is "no comment", as `groupingCommand`
 * defaults a conditionless frame's label to `''`.
 */
function computeHeaderTab(event: FrameEvent, headerPaint: SequencePaint, ctx: EventProcessingContext): HeaderTab {
  const rawComment = event.branchLabels[0];
  const comment = rawComment === undefined || rawComment === '' ? undefined : rawComment;
  // `start.getTitle()`: the rewritten `group T [c]` title, else the keyword.
  const { tabText, tabComment } = groupingHeaderDisplay(event.title ?? event.frameType, comment);
  const font = headerPaint.font;
  // `getPureTextWidth`/`getTextHeight` over the title's own text BLOCK; the
  // corner is drawn at exactly those (`ComponentRoseGroupingHeader.java:
  // 138-142`), so the tab grows with the TITLE's escaped newlines, never with
  // the comment beside it. C5: at the title's own CREOLE width --
  // `groupingHeaderDisplay` makes a `group`'s comment its TITLE.
  const titleLines = titleLinesOf(tabText);
  const measured = ctx.measurer.measure(tabText, atomFontSpec(font));
  const atoms = atomsOf(headerPaint, ctx);
  const tabTextWidth = Math.max(
    0,
    ...titleLines.map((l) =>
      creoleLineWidth(sequenceCreoleRuns(l, font, { leftX: 0, baselineY: 0 }, ctx.measurer, atoms)),
    ),
  );
  const tabWidth = HEADER_PADDING.left + tabTextWidth + HEADER_PADDING.right;
  const tabHeight = titleLines.length * measured.height + HEADER_PADDING.top + HEADER_PADDING.bottom;
  return { tabText, ...(tabComment !== undefined ? { tabComment } : {}), tabTextWidth, tabWidth, tabHeight };
}

/**
 * The header tab's title and its optional `[comment]`, as placed and measured
 * runs (A4), one run per creole atom (C5). Two text blocks at two styles:
 * the title at `styleHeader`'s font and alignment, drawn at
 * `(getOldPaddingX1(), getOldPaddingY())` (`ComponentRoseGroupingHeader
 * .java:151`); the comment at `style`'s `smallFont2`, LEFT, at
 * `(getOldPaddingX1() + textWidth, getOldPaddingY() + 1)` (`:84,89-90,
 * 153-158`), the brackets wrapping the whole block. Jar-verified on
 * `bepipo-37-fego336` (`loop` x=28, `[forever]` x=97.619) and on
 * `cedeti-10-bufu072` (a url inside the comment).
 */
function buildTabRuns(tab: HeaderTab, paints: FramePaints, x: number, y: number, ctx: EventProcessingContext) {
  const left = x + HEADER_PADDING.left;
  const top = y + HEADER_PADDING.top;
  const { headerPaint, paint } = paints;
  const title = alignedBlockRuns(titleLinesOf(tab.tabText), headerPaint.font, { leftX: left, top }, headerPaint.align, {
    measurer: ctx.measurer,
    atoms: atomsOf(headerPaint, ctx),
  }).runs;
  if (tab.tabComment === undefined) return title;
  const commentAt = { leftX: left + tab.tabWidth, top: top + 1 };
  const comment = alignedBlockRuns(
    displayLines(`[${tab.tabComment}]`),
    paint.font,
    commentAt,
    HorizontalAlignment.LEFT,
    { measurer: ctx.measurer, atoms: atomsOf(paint, ctx) },
  ).runs;
  return [...title, ...comment];
}

/**
 * One `ElseTile` (`ElseTile.java:74-81`), at the y the cursor reached: pushed
 * into the event stream where it falls among the group's child tiles
 * (`GroupingTile.java:162-170`), so it is drawn in their order
 * (`GroupingTile#drawU:280-281`), and recorded on the frame for the
 * `Blotter`, which reads each else tile's top and general colour
 * (`GroupingTile.java:318-347`). The colour is index-aligned with
 * `branchLabels` (`event.branchColors`, T2 D10); `renderer-frame-blotter.ts`
 * falls back to the group colour when a band has none (`:333-339`).
 */
function pushElseTile(
  event: FrameEvent,
  i: number,
  frameGeo: FrameGeo,
  cursor: EventCursor,
  ctx: EventProcessingContext,
) {
  const paint = elsePaint(event, i);
  const branchColor = event.branchColors?.[i];
  const branchLabel = event.branchLabels[i] ?? '';
  const y = cursor.y;
  frameGeo.branchSeparators.push({
    y,
    label: branchLabel,
    ...(branchColor !== undefined ? { backColorGeneral: branchColor } : {}),
  });
  const elseGeo: ElseGeo = {
    paint,
    kind: 'else',
    x: frameGeo.x,
    width: frameGeo.width,
    y,
    runs: branchConditionRuns(branchLabel, paint, { frameX: frameGeo.x, separatorY: y }, ctx),
  };
  ctx.eventGeos.push(elseGeo);
  cursor.y += separatorHeight(branchLabel, paint, ctx);
}

/** Every branch in turn: an `else` tile before each branch after the first,
 *  then the branch's own events. */
function walkBranches(event: FrameEvent, frameGeo: FrameGeo, cursor: EventCursor, ctx: EventProcessingContext): void {
  event.branches.forEach((branch, i) => {
    if (i > 0) pushElseTile(event, i, frameGeo, cursor, ctx);
    cursor.y = processEvents(branch, cursor.y, ctx);
  });
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
 * `x`, `width`, the tab fields, the paints and `y` are resolved BEFORE the
 * push: none of them can change during the branch walk. Only `height` and
 * `branchSeparators` depend on where the branches leave the cursor, so those
 * start as placeholders (`0` and `[]`) and are filled by direct mutation once
 * the branches have been walked -- upstream's construct-then-resolve-gauge
 * split (the `Real`/`YGauge` chain is built at construction, read once solved).
 */
export function handleFrameEvent(event: FrameEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  // A `ref` is a `ReferenceTile`, not a `GroupingTile` (`sequence-layout-ref.ts`).
  if (event.frameType === 'ref') return handleRefEvent(event, cursor, ctx);
  // `frameStartY` is the GAUGE MIN -- the chaining point, NOT the drawn
  // frame's top; a parallel (`&`) sibling chains on it (`:145-154`).
  const frameStartY = cursor.y;
  const paints = groupingPaints(event);
  const { x, width } = computeFrameBody(event, ctx);
  const tab = computeHeaderTab(event, paints.headerPaint, ctx);
  // `h = dim1.getHeight() + MARGINY_MAGIC / 2 + EXTERNAL_MARGINY` (`:157`).
  cursor.y = frameStartY + tab.tabHeight + FRAME_MARGINY_MAGIC / 2 + FRAME_EXTERNAL_MARGINY;
  // `getFrameY()` (`:247-249`) -- the drawn border, one top margin below.
  const frameDrawnY = frameStartY + FRAME_EXTERNAL_MARGINY;
  const frameGeo: FrameGeo = {
    ...paints,
    kind: 'frame',
    frameType: event.frameType,
    label: event.label,
    x,
    y: frameDrawnY,
    width,
    height: 0, // placeholder -- filled below once the branch walk resolves frameEndY
    ...(event.backColorElement !== undefined ? { backColorElement: event.backColorElement } : {}),
    ...(event.backColorGeneral !== undefined ? { backColorGeneral: event.backColorGeneral } : {}),
    branchSeparators: [], // placeholder -- populated by `walkBranches`
    refBody: [],
    ...tab,
    tabRuns: buildTabRuns(tab, paints, x, frameDrawnY, ctx),
  };
  ctx.eventGeos.push(frameGeo);
  walkBranches(event, frameGeo, cursor, ctx);
  // `getTotalHeight = bodyHeight + dimIfEmpty.getHeight() + MARGINY_MAGIC / 2`
  // (`:349-352`), which `cursor.y - frameDrawnY` is exactly.
  frameGeo.height = cursor.y - frameDrawnY;
  // `getPreferredHeight` (`:355-365`) leaves `EXTERNAL_MARGINY +
  // MARGINY_MAGIC / 2` of slack below the drawn border.
  cursor.y += FRAME_EXTERNAL_MARGINY + FRAME_MARGINY_MAGIC / 2;
  // `grouping(... GroupingType.END ...)` sets `lastEventWithDeactivate` to the
  // `GroupingLeaf` (`SequenceDiagram.java:438`), which is not an
  // `AbstractMessage` -- so a `destroy` straight after `end` is standalone.
  ctx.lastMessageParticipants = undefined;
}
