/**
 * A group frame's horizontal extent (sdd2 T3c), split out of
 * `sequence-layout-frame.ts` (500-line cap).
 *
 * `GroupingTile`'s constructor (`teoz/GroupingTile.java:186-225`) bounds the
 * frame by its OWN child tiles -- each one's `getDrawnMinX() - MARGINX` and
 * `getDrawnMaxX() + MARGINX` -- then by each else tile's `getMaxX` and by
 * `min + headerWidth + 16`. Else tiles and `|||` spaces are not children for
 * that fold (`:190-203`). The frame is therefore known only once its branches
 * are walked; `handleFrameEvent` back-fills it.
 *
 * A child's span comes from one of two places:
 *
 * - its EVENT, for the tiles the port draws from participant positions alone:
 *   a message (`CommunicationTile`, `CommunicationTileSelf`), an exo message
 *   (`CommunicationExoTile`) and every `LifeEventTile`;
 * - its GEOMETRY, for the tiles whose extent the walk resolves: a note (and a
 *   note on a message, through its wrapper), a delay, a divider, a newpage, a
 *   `ref`, and a nested group, which {@link registerGroupTile} records with
 *   the slice of `eventGeos` its own walk produced.
 */
import type { EventGeo, FrameEvent, FrameGeo, MessageEvent, MessageExoEvent, SequenceEvent } from './ast.js';
import type { EventProcessingContext } from './sequence-layout-events.js';
import type { LiveLifeEvent } from './sequence-live-boxes.js';
import { messagePaint } from './sequence-arrow-paint.js';
import { ARROW_DELTA_X } from './sequence-arrowhead.js';
import { DIVIDER_WIDTH_ALLOWANCE } from './divider-style.js';
import { REF_X_MARGIN } from './ref-body-geo.js';
import { SELF_ARROW_X_RIGHT } from './sequence-layout-message-self.js';
import { ARROW_PADDING_X, LIVE_DELTA_SIZE } from './sequence-layout-shared.js';
import { messageExtent, selfMinX } from './sequence-note-anchor.js';
import { messageLabelWidth, numberTextOf } from './text-block-geo.js';
import { FRAME_EXTERNAL_MARGIN_X1, FRAME_EXTERNAL_MARGIN_X2, FRAME_MARGIN_X } from './sequence-frame-metrics.js';

/** The literal in `max2.add(this.min.addFixed(width + 16))` (`:224`). */
const HEADER_MARGIN = 16;

/** A tile's `[min, max]` on the x axis. */
export interface XSpan {
  readonly min: number;
  readonly max: number;
}

/** What {@link resolveFrameSpan} folds. */
export interface FrameSpanInput {
  /** Each child tile's drawn span (`getDrawnMinX`/`getDrawnMaxX`). */
  readonly children: readonly XSpan[];
  /** Each else tile's component width (`ElseTile.java:157-161`). */
  readonly elseWidths: readonly number[];
  /** The header component's preferred width (`dim1.getWidth()`, `:216`). */
  readonly headerWidth: number;
  /** `tileArgumentsOriginal.getXOrigin()`, the empty group's min (`:217-218`). */
  readonly xOrigin: number;
  /** `getNotesWidth(LEFT)` (`:1015-1021`): the width of the notes written
   *  after the group's `end` on its left. */
  readonly notesLeft: number;
}

/**
 * The frame's `min`/`max` (`GroupingTile.java:211-225`). Each else tile's
 * `getMaxX` is `parent.getMinX() + width` (`ElseTile.java:153-161`), and the
 * parent's `getMinX` is `min - EXTERNAL_MARGINX1 - getNotesWidth(LEFT)`
 * (`GroupingTile.java:984-986`).
 */
export function resolveFrameSpan(input: FrameSpanInput): XSpan {
  const { children, elseWidths, headerWidth, xOrigin, notesLeft } = input;
  const min = children.length === 0 ? xOrigin : Math.min(...children.map((c) => c.min - FRAME_MARGIN_X));
  const max = Math.max(
    ...children.map((c) => c.max + FRAME_MARGIN_X),
    ...elseWidths.map((w) => min - FRAME_EXTERNAL_MARGIN_X1 - notesLeft + w),
    min + headerWidth + HEADER_MARGIN,
  );
  return { min, max };
}

/**
 * Each nested group's frame geo, the end of the `eventGeos` slice its walk
 * produced, and its tile span `getMinX`/`getMaxX` (`GroupingTile.java:984-990`)
 * -- the span a parent group reads as that child's drawn extent (`Tile
 * #getDrawnMinX` defaults to `getMinX`, `Tile.java:85-91`). Keyed by geo
 * object, so each layout pass reads only its own entries.
 */
const groupTiles = new WeakMap<FrameGeo, { readonly end: number; readonly tile: XSpan }>();

/** The widths of the notes written after a group's `end`, per side
 *  (`GroupingTile#getNotesWidth`, `:1015-1021`). */
export interface EndNotesWidth {
  readonly left: number;
  readonly right: number;
}

/** Record `geo`, a resolved group frame whose descendants end at `end`:
 *  `getMinX`/`getMaxX` (`GroupingTile.java:984-990`) add the end notes' widths
 *  past the margins. */
export function registerGroupTile(geo: FrameGeo, end: number, notes: EndNotesWidth): void {
  geo.endNotesWidth = notes;
  const tile = {
    min: geo.x - FRAME_EXTERNAL_MARGIN_X1 - notes.left,
    max: geo.x + geo.width + FRAME_EXTERNAL_MARGIN_X2 + notes.right,
  };
  groupTiles.set(geo, { end, tile });
}

/**
 * `tileArguments.getXOrigin()`, which `DividerTile`, `NewpageTile` and an
 * empty group read (`DividerTile.java:111-119`, `NewpageTile.java:110-116`,
 * `GroupingTile.java:217-218`): the layout's own origin.
 */
export function frameXOrigin(ctx: EventProcessingContext): number {
  return ctx.originX;
}

/** The drawn span of every child tile of `event` whose geometry the walk
 *  pushed at `[start, ctx.eventGeos.length)`. */
export function childTileSpans(event: FrameEvent, start: number, ctx: EventProcessingContext): XSpan[] {
  const spans: XSpan[] = [];
  for (const e of event.branches.flat()) spans.push(...eventSpans(e, ctx));
  return [...spans, ...geoSpans(ctx.eventGeos, start, frameXOrigin(ctx))];
}

/** The tiles an event builds whose span is its participants' positions. */
function eventSpans(event: SequenceEvent, ctx: EventProcessingContext): XSpan[] {
  switch (event.kind) {
    case 'message':
      return messageSpans(event, ctx);
    case 'messageExo':
      return exoSpans(event, ctx);
    case 'activate':
    case 'deactivate': {
      const life = ctx.activationStart.live.list.ofSource.get(event);
      return life?.kind === 'life' ? lifeSpans([life], ctx) : [];
    }
    default:
      return [];
  }
}

/**
 * A message's tile and the `LifeEventTile`s of its own `++`/`--`/`!!`, which
 * `SequenceDiagram#activate` adds as events of their own (`:367-373`). A
 * message on an unknown participant builds no tile here.
 *
 * A `**` (or `create`) files a CREATE life event too (`CommandArrow.java:
 * 397-398`, `CommandParticipant.java:195`), whose `LifeEventTile` spans the
 * created lifeline's `posC`: its level is the participant's before it exists,
 * 0 (`LifeEventTile.java:143-158`). The port's live list drops CREATE
 * (`sequence-live-events.ts`), so it is built here.
 */
function messageSpans(event: MessageEvent, ctx: EventProcessingContext): XSpan[] {
  const from = ctx.participantMap.get(event.from);
  const to = ctx.participantMap.get(event.to);
  if (from === undefined || to === undefined) return [];
  const tile = event.from === event.to ? selfDrawnSpan(event, from.centerX, ctx) : spanOf(messageExtent(event, ctx));
  const create = event.create === true ? [{ min: to.centerX, max: to.centerX }] : [];
  return [tile, ...create, ...lifeSpans(ctx.activationStart.live.list.ownOf.get(event) ?? [], ctx)];
}

function spanOf(extent: { readonly minX: number; readonly maxX: number }): XSpan {
  return { min: extent.minX, max: extent.maxX };
}

/** `ComponentRoseSelfArrow#getDrawnWidth` (`:348-352`): `max(xRight (42),
 *  labelReach)`, `labelReach = getOldPaddingX1() (7) + pureTextWidth`, or 0
 *  when the label is empty. */
export function selfDrawnWidth(
  event: MessageEvent,
  env: Pick<EventProcessingContext, 'measurer' | 'sprites' | 'padder'>,
): number {
  const paint = messagePaint(event.styleBuilder, event.stereotype, event.arrow, true);
  const pure = messageLabelWidth(event.label, numberTextOf(event), paint.font, env, paint.wrapWidth);
  const labelReach = pure === 0 ? 0 : ARROW_PADDING_X + pure;
  return Math.max(SELF_ARROW_X_RIGHT, labelReach);
}

/**
 * `CommunicationTileSelf#getDrawnMinX`/`#getDrawnMaxX` (`:293-307`): `posC`
 * to `posC2 + getDrawnWidth`, where `ComponentRoseSelfArrow#getDrawnWidth`
 * (`:348-352`) is `max(xRight, labelReach)`, `xRight = 42` and `labelReach =
 * getOldPaddingX1() (7) + pureTextWidth`, or 0 with no label. `posC2 - posC`
 * is `LiveBoxes#getMaxPosition` (`LivingSpace.java:235-238`). A reverse
 * (`A <- A`) loop is `posC - getDrawnWidth - adjustment` to `getMaxX`,
 * `posC2` (`:293-307`).
 */
export function selfDrawnSpan(event: MessageEvent, centerX: number, ctx: EventProcessingContext): XSpan {
  const maxPosition = ctx.activationStart.live.boxes.get(event.from)?.getMaxPosition() ?? 0;
  const drawnWidth = selfDrawnWidth(event, ctx);
  const reverse = event.arrow.reverseDefine === true;
  return {
    min: selfMinX(event, centerX, ctx, drawnWidth),
    max: centerX + maxPosition + (reverse ? 0 : drawnWidth),
  };
}

/**
 * `CommunicationExoTile#getMinX`/`#getMaxX` (`:234-240`): `getPoint1` to
 * `getPoint2` (`:206-218`) -- `posC` and `posC + width` on the right border,
 * `posC - width` and `posC` otherwise, `width` the arrow component's
 * preferred width, `getTextWidth + getArrowDeltaX` (`ComponentRoseArrow
 * .java:347-349`), as `sequence-layout-participant-constraints.ts` reads it.
 */
function exoSpans(event: MessageExoEvent, ctx: EventProcessingContext): XSpan[] {
  const geo = ctx.participantMap.get(event.participant);
  if (geo === undefined) return [];
  const paint = messagePaint(event.styleBuilder, event.stereotype, event.arrow, false);
  const width =
    messageLabelWidth(event.label, numberTextOf(event), paint.font, ctx, paint.wrapWidth) +
    2 * ARROW_PADDING_X +
    ARROW_DELTA_X;
  const right = event.exoType === 'FROM_RIGHT' || event.exoType === 'TO_RIGHT';
  return [right ? { min: geo.centerX, max: geo.centerX + width } : { min: geo.centerX - width, max: geo.centerX }];
}

/**
 * `LifeEventTile#getMinX`/`#getMaxX` (`:143-158`): `posC - 5` when the level
 * is above 0, else `posC`; `posC + level * 5`. The level is `getLevelAt(this,
 * IGNORE_FUTURE_ACTIVATE)`, the prefix count with the event itself applied
 * (`LiveBoxes.java:108-150`).
 */
function lifeSpans(lives: readonly LiveLifeEvent[], ctx: EventProcessingContext): XSpan[] {
  const spans: XSpan[] = [];
  for (const life of lives) {
    const geo = ctx.participantMap.get(life.participant);
    const boxes = ctx.activationStart.live.boxes.get(life.participant);
    if (geo === undefined || boxes === undefined) continue;
    const level = boxes.getLevelAt(life, 'IGNORE_FUTURE_ACTIVATE');
    spans.push({
      min: geo.centerX - (level > 0 ? LIVE_DELTA_SIZE : 0),
      max: geo.centerX + level * LIVE_DELTA_SIZE,
    });
  }
  return spans;
}

/** The spans of the geometry-resolved child tiles in `geos[start..]`, each
 *  nested group read as one tile and its own slice skipped. */
function geoSpans(geos: readonly EventGeo[], start: number, xOrigin: number): XSpan[] {
  const spans: XSpan[] = [];
  for (let i = start; i < geos.length; i++) {
    const geo = geos[i]!;
    const nested = geo.kind === 'frame' ? groupTiles.get(geo) : undefined;
    if (nested !== undefined) {
      spans.push(nested.tile);
      i = nested.end - 1;
      continue;
    }
    const span = geoSpan(geo, xOrigin);
    if (span !== undefined) spans.push(span);
  }
  return spans;
}

/**
 * One geometry-resolved tile's span, `undefined` for geometry that is no
 * child tile of its own (a message's, an activation bar, a destroy cross, an
 * else, a `|||`).
 *
 * - note: `NoteTile#getMinX`/`#getMaxX` (`:279-296`), which the geo carries
 *   (`drawnMaxX` instead of `maxX` for a self message's right note,
 *   `CommunicationTileSelfNoteRight#getDrawnMaxX:154-178`; `drawnMinX` instead
 *   of `minX` for its left note, `CommunicationTileSelfNoteLeft#getDrawnMinX
 *   :170-177`);
 *   a note on a message widens its wrapper by exactly its own extent
 *   (`CommunicationTileNoteRight.java:242-250`, `...NoteLeft:219-225`,
 *   `...NoteBottomTopAbstract:144-155`).
 * - delay: `middle -/+ preferredWidth / 2` (`DelayTile.java:123-131`).
 * - divider: `xorigin` to `xorigin + getPreferredWidth` (`DividerTile.java:
 *   111-119`, `ComponentRoseDivider.java:134-136`); newpage: `xorigin`.
 * - ref: `first`/`last`, `xMargin` outside the drawn box (`ReferenceTile
 *   .java:163-180`).
 */
function geoSpan(geo: EventGeo, xOrigin: number): XSpan | undefined {
  switch (geo.kind) {
    case 'note':
      return { min: geo.drawnMinX ?? geo.minX, max: geo.drawnMaxX ?? geo.maxX };
    case 'delay':
      return { min: geo.middleX - geo.textWidth / 2, max: geo.middleX + geo.textWidth / 2 };
    case 'divider':
      return { min: xOrigin, max: xOrigin + geo.textWidth + DIVIDER_WIDTH_ALLOWANCE };
    case 'newpage':
      return { min: xOrigin, max: xOrigin };
    case 'frame':
      // A ref: every group frame is registered before its parent scans
      // (`handleFrameEvent` resolves it as its own walk ends), and
      // {@link geoSpans} reads those from the registry.
      return { min: geo.x - REF_X_MARGIN, max: geo.x + geo.width + REF_X_MARGIN };
    default:
      return undefined;
  }
}
