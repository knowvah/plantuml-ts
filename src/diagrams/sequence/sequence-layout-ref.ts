/**
 * A `ref over` frame's geometry: `ReferenceTile` drawing `ComponentRoseReference`
 * (unwind2-S9b). It used to borrow `GroupingTile`'s geometry -- a frame from
 * the leftmost lifeline centre minus `MARGINX` across the whole diagram,
 * between `EXTERNAL_MARGINY` margins -- which is a different tile.
 *
 * Upstream, read off the two classes:
 *
 * - `ReferenceTile#init` (`teoz/ReferenceTile.java:96-115`): `first` is the
 *   leftmost referenced participant's `posB`, `last` the rightmost's `posD`,
 *   pushed until the component's preferred width fits (the participant-row
 *   constraint lives in `sequence-layout-participants.ts#refConstraint`).
 *   `drawU` hands the component `Area(last - first, preferredHeight)` at
 *   `dx(first)` (`:125-133`).
 * - `ReferenceTile`'s `YGauge` is the component's preferred height and
 *   nothing else (`:73,153-157`): no margins above or below.
 * - `ComponentRoseReference#drawInternalU` (`skin/rose/ComponentRoseReference
 *   .java:83-137`): the body rect at `dx(xMargin)`, `area - 2 * xMargin -
 *   deltaShadow` wide and `area height - heightFooter` tall; the corner tab
 *   at `dx(xMargin)`, `(int) headerWidth` by `(int) headerHeight`; the `ref`
 *   keyword at `(15, 2)`; the body text block centred in the AREA at
 *   `getOldPaddingY() + (int) headerHeight`.
 *
 * Jar-verified: `tests/fixtures/unwind2-S9b/r-*.svg`.
 */
import type { FrameEvent, FrameGeo, NoteEvent, ParticipantGeo } from './ast.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { alignedBlockRuns } from './sequence-block-align.js';
import { offsetRun } from './sequence-creole-sheet.js';
import type { SequencePaint } from './sequence-skin-param.js';
import {
  REF_HEADER_TEXT,
  REF_HEIGHT_FOOTER,
  REF_PADDING,
  REF_X_MARGIN,
  refBodyBlock,
  refBodyHeight,
  refTextInk,
  type ReferencePaints,
  refBodyLines,
  refComponentWidth,
  refHeaderHeight,
  refHeaderWidth,
  referencePaints,
} from './ref-body-geo.js';
import { layoutRefNotes } from './sequence-layout-ref-notes.js';
import type { EventCursor, EventProcessingContext } from './sequence-layout-events.js';

/** `textHeader.drawU(ug.apply(new UTranslate(15, 2)))`
 *  (`ComponentRoseReference.java:126`). */
const REF_HEADER_TEXT_DX = 15;
const REF_HEADER_TEXT_DY = 2;

/** `[first, last]` of `ReferenceTile#init`: the leftmost referenced box's
 *  left edge and the rightmost's right edge, by lifeline centre. */
function refSpan(event: FrameEvent, ctx: EventProcessingContext): { first: number; last: number } {
  const ids = event.participants ?? [...ctx.participantMap.keys()];
  const geos = ids.map((id) => ctx.participantMap.get(id)).filter((g): g is ParticipantGeo => g !== undefined);
  const byCentre = [...geos].sort((a, b) => a.centerX - b.centerX);
  const left = byCentre[0];
  const right = byCentre.at(-1);
  if (left === undefined || right === undefined) return { first: 0, last: 0 };
  return { first: left.x, last: right.x + right.width };
}

/**
 * The body block's x inside the area, by the body style's alignment
 * (`position = getHorizontalAlignment()`, `ComponentRoseReference.java:76,
 * 127-136`): centred in the area; flush right less `getOldPaddingX2()` and
 * `xMargin`; or `getOldPaddingX1() + xMargin` from the left.
 */
function bodyTextPos(align: HorizontalAlignment | undefined, area: number, textWidth: number): number {
  if (align === HorizontalAlignment.CENTER) return (area - textWidth) / 2;
  if (align === HorizontalAlignment.RIGHT) return area - textWidth - REF_PADDING - REF_X_MARGIN;
  return REF_PADDING + REF_X_MARGIN;
}

/** The body text block (`getTextBlock()`, built at the body style's font and
 *  alignment, `AbstractTextualComponent.java:78-91`), drawn on the `ug` the
 *  body's symbol context was applied to (`ComponentRoseReference.java:95,
 *  124,137`), at `getOldPaddingY() + (int) textHeaderHeight` below the top. */
function bodyRuns(body: readonly string[], paints: ReferencePaints, place: BodyPlace, ctx: EventProcessingContext) {
  const env = { measurer: ctx.measurer, sprites: ctx.sprites };
  const block = refBodyBlock(body, paints, { leftX: 0, top: place.top }, env);
  const dx = place.first + bodyTextPos(paints.paint.align, place.area, block.width);
  return block.runs.map((r) => offsetRun(r, dx, 0));
}

/** Where the body block goes: the area's left edge and width, and its top. */
interface BodyPlace {
  readonly first: number;
  readonly area: number;
  readonly top: number;
}

/** `ComponentRoseReference#getHeaderWidth`/`getHeaderHeight` (`:139-148`),
 *  truncated as `drawInternalU` reads them (`:86-87`), and the `ref` keyword
 *  at `styleHeader`'s font, LEFT, at `(15, 2)` from the component origin
 *  (`:75,78,126`). */
function headerOf(headerPaint: SequencePaint, first: number, y: number, ctx: EventProcessingContext) {
  const width = refHeaderWidth(headerPaint, ctx.measurer);
  const at = { leftX: first + REF_HEADER_TEXT_DX, top: y + REF_HEADER_TEXT_DY };
  const ink = refTextInk(headerPaint);
  const block = alignedBlockRuns([REF_HEADER_TEXT], headerPaint.font, at, HorizontalAlignment.LEFT, {
    measurer: ctx.measurer,
    sprites: ctx.sprites,
    ink,
  });
  return {
    tabText: REF_HEADER_TEXT,
    tabTextWidth: block.width,
    tabWidth: Math.trunc(width),
    tabHeight: Math.trunc(refHeaderHeight(headerPaint, ctx.measurer)),
    tabRuns: block.runs,
  };
}

/** Lay out one `ref over` tile at the cursor and advance it by the tile's
 *  preferred height. `area` carries the body style's delta shadow, which the
 *  renderer takes back off the drawn rect (`renderer-frame-header.ts
 *  #renderBodyRect`, `ComponentRoseReference.java:89`). */
export function handleRefEvent(
  event: FrameEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
  notes: readonly NoteEvent[],
): void {
  const paints = referencePaints(event);
  const body = refBodyLines(event.frameType, event.label);
  const { first, last } = refSpan(event, ctx);
  const area = Math.max(last - first, refComponentWidth(body, paints, ctx.measurer, ctx.sprites));
  const height = refBodyHeight(body, paints, ctx.measurer, ctx.sprites);
  const y = cursor.y;
  const header = headerOf(paints.headerPaint, first, y, ctx);
  const frameGeo: FrameGeo = {
    ...paints,
    kind: 'frame',
    frameType: event.frameType,
    label: event.label,
    x: first + REF_X_MARGIN,
    y,
    width: area - 2 * REF_X_MARGIN,
    height: height - REF_HEIGHT_FOOTER,
    branchSeparators: [],
    refBody: bodyRuns(body, paints, { first, area, top: y + REF_PADDING + header.tabHeight }, ctx),
    ...header,
  };
  ctx.eventGeos.push(frameGeo);
  layoutRefNotes(notes, { first, last: first + area }, y, ctx);
  cursor.y = y + height;
  ctx.lastMessageParticipants = undefined;
}
