/**
 * Sequence diagram document width (the right edge of the drawing space).
 *
 * Mirrors the width half of upstream `PlayingSpace`: its constructor maxes
 * every tile's `getMaxX` (plus each living space's `getPosD`/`getPosC2`) to
 * place the right border.
 *
 * @see teoz/PlayingSpace.java:75-104
 */

import type { EventGeo, MessageEvent, MessageGeo, ParticipantGeo, SequenceEvent } from './ast.js';
import { REF_X_MARGIN } from './ref-body-geo.js';
import { DIVIDER_WIDTH_ALLOWANCE } from './divider-style.js';
import { delayContentRight } from './sequence-delay.js';
import { exoRightExtent } from './sequence-layout-exo.js';
import { FRAME_EXTERNAL_MARGIN_X2 } from './sequence-frame-metrics.js';
import { flattenLiveEvents, LiveBoxes } from './sequence-live-boxes.js';
import { selfCompWidth } from './sequence-note-anchor.js';
import type { MessageLabelEnv } from './text-block-geo.js';

/**
 * The gap kept between the rightmost content and the document edge. Upstream
 * keeps it outside the drawing space -- `getBorder2()` is the content edge
 * and the image margin lies beyond it -- so an exo arrow anchored on the
 * border stops here, not at `totalWidth`.
 *
 * 10, and symmetric with `LEFT_MARGIN` because both halves are:
 * `TextBlockExporter:201-202` grows the image by `margin.left + margin.right`
 * = 5 + 5, and `SequenceDiagramFileMakerTeoz#getTextBlock`'s
 * `calculateDimension` returns `body + 10` (`:157`) for its own inner 5 each
 * side. So the image is the content span plus 20, 10 on each side.
 */
export const RIGHT_MARGIN = 10;

/** What {@link computeTotalWidth} reads beyond the label environment. */
export interface WidthEnv extends MessageLabelEnv {
  /** The diagram's top-level events: the `LiveBoxes` of every living space
   *  (`LivingSpace.java:148`) and every self message's tile are built on
   *  them. Without it neither the `posC2` nor the self-message term applies. */
  readonly events?: readonly SequenceEvent[];
}

/**
 * Total diagram width: the rightmost `PlayingSpace` bound, `max` over every
 * tile's `getMaxX` and each living space's `getPosD` and `getPosC2`
 * (`teoz/PlayingSpace.java:93-101`), plus the right margin.
 *
 * There is no label term: a normal message's `CommunicationTile#getMaxX`
 * (`:453-460`) is `max(rightPoint, leftPoint + compWidth)`, which
 * `addConstraints` (`:404-427`) has already made `rightPoint`.
 */
export function computeTotalWidth(participantGeos: ParticipantGeo[], eventGeos: EventGeo[], env: WidthEnv): number {
  // Safe: participantGeos is non-empty (guarded by the early return above)
  const lastParticipant = participantGeos[participantGeos.length - 1]!;
  const totalWidth = Math.max(
    lastParticipant.x + lastParticipant.width + RIGHT_MARGIN,
    exoContentRight(eventGeos) + RIGHT_MARGIN,
    liveContentRight(participantGeos, env) + RIGHT_MARGIN,
  );

  return Math.max(
    totalWidth,
    dividerContentRight(eventGeos),
    delayContentRight(eventGeos, RIGHT_MARGIN),
    refContentRight(eventGeos) + RIGHT_MARGIN,
    groupContentRight(eventGeos) + RIGHT_MARGIN,
    noteContentRight(eventGeos) + RIGHT_MARGIN,
  );
}

/** The message events of `events`, frame branches flattened in place. */
function messageEventsOf(events: readonly SequenceEvent[]): MessageEvent[] {
  return events.flatMap((e) => {
    if (e.kind === 'message') return [e];
    return e.kind === 'frame' ? e.branches.flatMap(messageEventsOf) : [];
  });
}

/** Each living space's `LiveBoxes#getMaxPosition` (`LiveBoxes.java:367-372`),
 *  all built on the one flat event list (`LivingSpace.java:148`). */
function maxPositions(participantGeos: readonly ParticipantGeo[], env: WidthEnv): ReadonlyMap<string, number> {
  const list = flattenLiveEvents(env.events ?? []).events;
  return new Map(participantGeos.map((g) => [g.id, new LiveBoxes(g.id, list).getMaxPosition()] as const));
}

/** The rightmost `CommunicationTileSelf#getMaxX` (`:272-277`) over every
 *  self message: `posC2 + getCompWidth()`, a loop on the last participant
 *  reaching past its `posD` and so widening the document (`:93-96`). A
 *  reverse loop's (`A <- A`) is `posC2` itself (`:273-275`), which
 *  {@link liveContentRight} has already maxed in. */
function selfContentRight(
  participantGeos: readonly ParticipantGeo[],
  position: ReadonlyMap<string, number>,
  env: WidthEnv,
): number {
  const byId = new Map(participantGeos.map((g) => [g.id, g]));
  let right = Number.NEGATIVE_INFINITY;
  for (const m of messageEventsOf(env.events ?? [])) {
    const geo = m.from === m.to && m.arrow.reverseDefine !== true ? byId.get(m.from) : undefined;
    if (geo !== undefined) right = Math.max(right, geo.centerX + (position.get(geo.id) ?? 0) + selfCompWidth(m, env));
  }
  return right;
}

/** The rightmost `LivingSpace#getPosC2` (`LivingSpace.java:235-238`), `posC`
 *  plus the max position, which `PlayingSpace` maxes in (`:98-101`), and the
 *  rightmost self-message tile ({@link selfContentRight}). */
function liveContentRight(participantGeos: readonly ParticipantGeo[], env: WidthEnv): number {
  const position = maxPositions(participantGeos, env);
  let right = selfContentRight(participantGeos, position, env);
  for (const g of participantGeos) right = Math.max(right, g.centerX + (position.get(g.id) ?? 0));
  return right;
}

/** The rightmost `NoteTile#getMaxX` (`teoz/NoteTile.java:288-296`), which
 *  `PlayingSpace` maxes with every other tile's to place the right border
 *  (`teoz/PlayingSpace.java:75-96`). A note reaching past the last participant
 *  widens the document. */
function noteContentRight(eventGeos: readonly EventGeo[]): number {
  let right = Number.NEGATIVE_INFINITY;
  for (const e of eventGeos) if (e.kind === 'note') right = Math.max(right, e.maxX);
  return right;
}

/** The rightmost `ReferenceTile#getMaxX` -- `last`, the component area's
 *  right edge, `xMargin` beyond the drawn box (`teoz/ReferenceTile.java
 *  :173-180`). A `ref` wider than its participants widens the document
 *  (`tests/fixtures/unwind2-S9b/r-single.svg`). */
function refContentRight(eventGeos: readonly EventGeo[]): number {
  let right = Number.NEGATIVE_INFINITY;
  for (const e of eventGeos) {
    if (e.kind === 'frame' && e.frameType === 'ref') right = Math.max(right, e.x + e.width + REF_X_MARGIN);
  }
  return right;
}

/** The rightmost `GroupingTile#getMaxX` -- `max + EXTERNAL_MARGINX2` (9)
 *  past the frame's right border (`teoz/GroupingTile.java:988-990`; the
 *  group-end notes it also adds are drawn by the port as notes of their own,
 *  which {@link noteContentRight} reads). `PlayingSpace` maxes it in
 *  (`:93-96`), so a frame reaching past the last lifeline widens the
 *  document. */
function groupContentRight(eventGeos: readonly EventGeo[]): number {
  let right = Number.NEGATIVE_INFINITY;
  for (const e of eventGeos) {
    if (e.kind === 'frame' && e.frameType !== 'ref') right = Math.max(right, e.x + e.width + FRAME_EXTERNAL_MARGIN_X2);
  }
  return right;
}

/**
 * How far right a divider forces the drawing space.
 *
 * `DividerTile#getMaxX` is `xorigin.addFixed(dim.getWidth())` where `dim` is
 * the component's `getPreferredDimension`, i.e.
 * `ComponentRoseDivider#getPreferredWidth = getTextWidth + 30` (`:131-133`) --
 * so a divider whose label is wider than the participant row widens the whole
 * diagram, exactly as an exo message does above. `PlayingSpace` maxes every
 * tile's `getMaxX` to place the right border
 * (`teoz/PlayingSpace.java:75-96`).
 *
 * `geo.textWidth` IS `getTextWidth`, resolved in layout from the divider's
 * OWN font (`separator { FontSize 13, FontStyle bold }`) -- re-measuring it
 * here with the diagram font would reintroduce the sizer/renderer split this
 * feature was built to avoid. `0` when there is no divider, which never
 * lowers the max.
 */
function dividerContentRight(eventGeos: EventGeo[]): number {
  let right = 0;
  for (const geo of eventGeos) {
    if (geo.kind !== 'divider') continue;
    const extent = geo.textWidth + DIVIDER_WIDTH_ALLOWANCE + RIGHT_MARGIN;
    if (extent > right) right = extent;
  }
  return right;
}

/** The message geos, in one place, for the exo passes below. */
export function messageGeosOf(eventGeos: EventGeo[]): MessageGeo[] {
  return eventGeos.filter((g): g is MessageGeo => g.kind === 'message');
}

/**
 * How far right an exo message forces the drawing space. `PlayingSpace` maxes
 * every tile's `getMaxX` to place the right border
 * (`teoz/PlayingSpace.java:75-96`), and a right-border exo's is
 * `posC + preferredWidth` -- so a document holding one is wider than the same
 * document without it. `0` when there is none, which never lowers the max.
 */
function exoContentRight(eventGeos: EventGeo[]): number {
  let right = 0;
  for (const geo of messageGeosOf(eventGeos)) {
    const extent = exoRightExtent(geo);
    if (extent !== undefined && extent > right) right = extent;
  }
  return right;
}
