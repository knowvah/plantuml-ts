/**
 * The `...` / `...text...` DELAY: its tile, and the two cuts it makes in the
 * drawing around it.
 *
 * Upstream a delay is a `DelayTile` that draws a `DELAY_TEXT` component and,
 * while drawing, registers its span on every living space
 * (`tileArguments.getLivingSpaces().delayOn(ypos, dim.getHeight())`,
 * `teoz/DelayTile.java:108`). Two readers consume that span:
 *
 *   - `MutingLine#drawLine` (`teoz/MutingLine.java:73-92`) cuts each lifeline
 *     into `PARTICIPANT_LINE` / `DELAY_LINE` pieces -- {@link lifelineSegments};
 *   - `LiveBoxesDrawer#doDrawing` (`teoz/LiveBoxesDrawer.java:105-121`) cuts
 *     each activation bar with `Segment#cutSegmentIfNeed` and draws the
 *     pieces open at the cut -- {@link cutActivationsAtDelays}.
 *
 * The registration happens in the BACKGROUND pass too
 * (`PlayingSpace#drawBackground` calls every tile's `drawU`, `:109-112`),
 * which runs before `drawLifeLines` (`PlayingSpaceWithParticipants.java:
 * 218-221`), so every lifeline sees every delay.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/DelayTile.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseDelayText.java
 */

import type { ActivationGeo, DelayGeo, EventGeo, LifelineSegment, ParticipantGeo } from './ast.js';
import type { DelayEvent } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { TextRun } from './text-block-geo.js';
import { displayLines } from './text-block-geo.js';
import { sequenceCreoleFont, sequenceCreoleRuns } from './sequence-creole.js';

/** `ComponentRoseDelayText#getPreferredHeight` (`:72-75`): text height + 20. */
const DELAY_HEIGHT_ALLOWANCE = 20;
/** `ComponentRoseDelayText:54` -- `topRightBottomLeft(4, 0, 4, 0)`. */
const DELAY_PADDING_Y = 4;
/** `delay { FontSize 11 }` (`plantuml.skin:300-305`). */
export const DELAY_FONT_SIZE = 11;
/** `delay { LineStyle 1-4 }` (`plantuml.skin:304`). */
export const DELAY_LINE_DASH = 1;
export const DELAY_LINE_GAP = 4;

/** A `[y1, y2]` span on the y axis -- upstream's `Segment`. */
interface Span {
  readonly y1: number;
  readonly y2: number;
}

function delayFontSpec(theme: Theme): FontSpec {
  return { family: theme.fontFamily, size: DELAY_FONT_SIZE };
}

/** A creole line's advance: its last run's right edge. */
function lineWidthOf(runs: readonly TextRun[]): number {
  const last = runs.at(-1);
  return last === undefined ? 0 : last.x + last.textWidth;
}

/**
 * `ComponentRoseDelayText#drawInternalU` (`:62-70`): the block is centred in
 * an area exactly its own width, at `ypos = (height - textHeight) / 2` plus
 * `getOldPaddingY()`; `delay { HorizontalAlignment center }` centres each
 * line inside the block.
 */
function placeLabel(
  lines: readonly string[],
  top: number,
  left: number,
  blockWidth: number,
  ctx: DelayContext,
): TextRun[] {
  const { spec, measurer } = ctx;
  const font = sequenceCreoleFont(spec);
  const lineHeight = measurer.measure('M', spec).height;
  const ascent = lineHeight - measurer.getDescent(spec, 'M');
  return lines.flatMap((line, i) => {
    const width = lineWidthOf(sequenceCreoleRuns(line, font, { leftX: 0, baselineY: 0 }, measurer));
    const origin = { leftX: left + (blockWidth - width) / 2, baselineY: top + ascent + i * lineHeight };
    return [...sequenceCreoleRuns(line, font, origin, measurer)];
  });
}

interface DelayContext {
  readonly spec: FontSpec;
  readonly measurer: StringMeasurer;
}

/**
 * The text block's lines. `Display.empty()` for a bare `...`
 * (`CommandDelay.java:83-84`), and NO lines either for `......`, whose one
 * empty line `AbstractTextualComponent` turns into a `TextBlockEmpty`
 * (`skin/AbstractTextualComponent.java:86-87`).
 */
function delayLines(event: DelayEvent): readonly string[] {
  if (event.text === undefined) return [];
  const lines = displayLines(event.text);
  return lines.length === 1 && lines[0] === '' ? [] : lines;
}

/**
 * The `DelayTile` at `y`. `participants` is in living-space order: the tile
 * is centred between the FIRST and the LAST lifeline (`DelayTile.java:79-83`,
 * `TileArguments#getFirstLivingSpace`/`#getLastLivingSpace`).
 */
export function layoutDelay(
  event: DelayEvent,
  y: number,
  participants: readonly ParticipantGeo[],
  theme: Theme,
  measurer: StringMeasurer,
): DelayGeo {
  const ctx: DelayContext = { spec: delayFontSpec(theme), measurer };
  const lines = delayLines(event);
  const font = sequenceCreoleFont(ctx.spec);
  const widths = lines.map((l) => lineWidthOf(sequenceCreoleRuns(l, font, { leftX: 0, baselineY: 0 }, measurer)));
  const textWidth = Math.max(0, ...widths);
  const textHeight = lines.length * measurer.measure('M', ctx.spec).height + 2 * DELAY_PADDING_Y;
  const height = textHeight + DELAY_HEIGHT_ALLOWANCE;
  const first = participants[0]!;
  const last = participants[participants.length - 1]!;
  const middleX = (first.centerX + last.centerX) / 2;
  const top = y + (height - textHeight) / 2 + DELAY_PADDING_Y;
  const labelRuns = placeLabel(lines, top, middleX - textWidth / 2, textWidth, ctx);
  return { kind: 'delay', y, height, middleX, textWidth, labelRuns };
}

/** The delay spans of a finished layout, in tile order. */
export function delaySpansOf(events: readonly EventGeo[]): Span[] {
  return events.filter((e): e is DelayGeo => e.kind === 'delay').map((d) => ({ y1: d.y, y2: d.y + d.height }));
}

/**
 * `MutingLine#drawLine` (`:73-92`). Only delays wholly inside
 * `[start, end]` cut the line (`:82`); `drawInternal` skips a zero-length
 * piece (`:96-97`), which is how two back-to-back delays leave no solid
 * line between them.
 */
export function lifelineSegments(start: number, end: number, delays: readonly Span[]): LifelineSegment[] {
  const sorted = [...delays].sort((a, b) => a.y1 - b.y1);
  const out: LifelineSegment[] = [];
  const push = (y1: number, y2: number, delay: boolean): void => {
    if (y2 !== y1) out.push({ y1, y2, delay });
  };
  let y = start;
  for (const d of sorted) {
    if (d.y1 < start || d.y2 > end) continue;
    push(y, d.y1, false);
    push(d.y1, d.y2, true);
    y = d.y2;
  }
  push(y, end, false);
  return out;
}

/**
 * Every participant's pieces: `LivingSpace#drawLineAndLiveboxes`
 * (`teoz/LivingSpace.java:150-167`) draws the line from `aliveSince` -- the
 * create y, else 0 (this port's `headHeight`). The field is absent when no
 * participant needs more than the one plain line.
 */
export function lifelineSegmentsByParticipant(
  participants: readonly ParticipantGeo[],
  headHeight: number,
  end: number,
  delays: readonly Span[],
): { lifelineSegments?: Record<string, LifelineSegment[]> } {
  if (delays.length === 0 && participants.every((p) => p.createY === undefined)) return {};
  const pieces = participants.map((p) => [p.id, lifelineSegments(p.createY ?? headHeight, end, delays)] as const);
  return { lifelineSegments: Object.fromEntries(pieces) };
}

/** `DelayTile#getMaxX` (`:126-129`), `middle + preferredWidth / 2`, maxed
 *  into the right border like every tile's (`PlayingSpace.java:75-96`). */
export function delayContentRight(eventGeos: readonly EventGeo[], rightMargin: number): number {
  let right = 0;
  for (const geo of eventGeos) {
    if (geo.kind === 'delay') right = Math.max(right, geo.middleX + geo.textWidth / 2 + rightMargin);
  }
  return right;
}

/** `Segment#cutSegmentIfNeed` (`sequencediagram/graphic/Segment.java:99-127`),
 *  including its `0.001` tolerance and its early return past `pos2`. */
export function cutSegmentIfNeed(full: Span, delays: readonly Span[]): Span[] {
  const sorted = [...delays].sort((a, b) => a.y1 - b.y1);
  const result: Span[] = [];
  let pendingStart = full.y1;
  for (const pause of sorted) {
    if (Math.abs(pause.y1 - pendingStart) < 0.001) {
      pendingStart = pause.y2;
      continue;
    }
    if (pause.y1 < pendingStart) continue;
    if (pause.y1 > full.y2) break;
    if (pause.y1 >= full.y1 && pause.y2 <= full.y2) {
      result.push({ y1: pendingStart, y2: pause.y1 });
      pendingStart = pause.y2;
    }
  }
  if (pendingStart < full.y2) result.push({ y1: pendingStart, y2: full.y2 });
  return result;
}

/**
 * `LiveBoxesDrawer#doDrawing` (`:105-121`): one piece is
 * `ACTIVATION_BOX_CLOSE_CLOSE`; several are `CLOSE_OPEN`, then `OPEN_OPEN`,
 * then `OPEN_CLOSE`.
 */
function cutActivation(a: ActivationGeo, delays: readonly Span[]): ActivationGeo[] {
  const pieces = cutSegmentIfNeed({ y1: a.y, y2: a.y + a.height }, delays);
  if (pieces.length === 1) return [{ ...a, y: pieces[0]!.y1, height: pieces[0]!.y2 - pieces[0]!.y1 }];
  return pieces.map((s, i) => ({
    ...a,
    y: s.y1,
    height: s.y2 - s.y1,
    open: { closeUp: i === 0, closeDown: i === pieces.length - 1 },
  }));
}

/** Every activation bar cut at the delays, in place. Returns `events` itself
 *  when there is no delay. */
export function cutActivationsAtDelays(events: EventGeo[]): EventGeo[] {
  const delays = delaySpansOf(events);
  if (delays.length === 0) return events;
  return events.flatMap<EventGeo>((e) => (e.kind === 'activation' ? cutActivation(e, delays) : [e]));
}
