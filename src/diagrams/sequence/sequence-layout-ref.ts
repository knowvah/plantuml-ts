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
import type { FontSpec } from '../../core/measurer.js';
import type { FrameEvent, FrameGeo, ParticipantGeo, TextRun } from './ast.js';
import { sequenceCreoleFont, sequenceCreoleRuns } from './sequence-creole.js';
import {
  REF_HEADER_EXTRA_WIDTH,
  REF_HEADER_TEXT,
  REF_HEIGHT_FOOTER,
  REF_PADDING,
  REF_X_MARGIN,
  refBodyFontSpecOf,
  refBodyHeight,
  refBodyLines,
  refBodyWidth,
  refHeaderFontSpecOf,
} from './ref-body-geo.js';
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

/** One block of text at `font`, its lines placed from `(0, top)` --
 *  `TextBlockSimple#drawU` stacking stripes by their measured height. */
function blockRuns(lines: readonly string[], spec: FontSpec, top: number, ctx: EventProcessingContext): TextRun[] {
  const lineHeight = ctx.measurer.measure('M', spec).height;
  const ascent = lineHeight - ctx.measurer.getDescent(spec, 'M');
  const font = sequenceCreoleFont(spec);
  return lines.flatMap((line, i) => [
    ...sequenceCreoleRuns(line, font, { leftX: 0, baselineY: top + ascent + i * lineHeight }, ctx.measurer),
  ]);
}

/** The body block centred in the area, each line centred in the block
 *  (`reference { HorizontalAlignment center }`, `plantuml.skin:157`); a
 *  line's own run offsets are kept, so its atoms stay adjacent. */
function bodyRuns(body: readonly string[], first: number, area: number, top: number, ctx: EventProcessingContext) {
  const spec = refBodyFontSpecOf(ctx.theme);
  const lineHeight = ctx.measurer.measure('M', spec).height;
  return body.flatMap((line, i) => {
    const runs = blockRuns([line], spec, top + i * lineHeight, ctx);
    const width = runs.reduce((w, r) => Math.max(w, r.x + r.textWidth), 0);
    const dx = first + (area - width) / 2;
    return runs.map((r) => ({ ...r, x: r.x + dx }));
  });
}

/** `ComponentRoseReference#getHeaderWidth`/`getHeaderHeight` (`:139-148`),
 *  and the `ref` keyword's runs at `(15, 2)` from the component origin. */
function headerOf(first: number, y: number, ctx: EventProcessingContext) {
  const spec = refHeaderFontSpecOf(ctx.theme);
  const dim = ctx.measurer.measure(REF_HEADER_TEXT, spec);
  const runs = blockRuns([REF_HEADER_TEXT], spec, y + REF_HEADER_TEXT_DY, ctx);
  return {
    tabText: REF_HEADER_TEXT,
    tabTextWidth: dim.width,
    tabWidth: Math.trunc(dim.width + REF_HEADER_EXTRA_WIDTH),
    tabHeight: Math.trunc(dim.height + 2),
    tabRuns: runs.map((r) => ({ ...r, x: r.x + first + REF_HEADER_TEXT_DX })),
  };
}

/** Lay out one `ref over` tile at the cursor and advance it by the tile's
 *  preferred height. `area` carries the body style's delta shadow, which the
 *  renderer takes back off the drawn rect (`renderer-frame-header.ts
 *  #renderBodyRect`, `ComponentRoseReference.java:89`). */
export function handleRefEvent(event: FrameEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  const body = refBodyLines(event.frameType, event.label);
  const { first, last } = refSpan(event, ctx);
  const area = Math.max(last - first, refBodyWidth(body, ctx.theme, ctx.measurer));
  const height = refBodyHeight(body, ctx.theme, ctx.measurer);
  const y = cursor.y;
  const header = headerOf(first, y, ctx);
  const frameGeo: FrameGeo = {
    kind: 'frame',
    frameType: event.frameType,
    label: event.label,
    x: first + REF_X_MARGIN,
    y,
    width: area - 2 * REF_X_MARGIN,
    height: height - REF_HEIGHT_FOOTER,
    branchSeparators: [],
    refBody: bodyRuns(body, first, area, y + REF_PADDING + header.tabHeight, ctx),
    ...header,
  };
  ctx.eventGeos.push(frameGeo);
  cursor.y = y + height;
  ctx.lastMessageParticipants = undefined;
}
