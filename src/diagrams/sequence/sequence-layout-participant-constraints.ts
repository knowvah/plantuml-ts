/**
 * Sequence diagram layout — the participant-row spacing-constraint scan.
 * Split from sequence-layout-participants.ts (500-line limit); a pure move.
 *
 * Mirrors upstream's `addConstraints` passes: `CommunicationTile#addConstraints`
 * (`teoz/CommunicationTile.java:404-427`) and `CommunicationTileSelf
 * #addConstraints` (`teoz/CommunicationTileSelf.java:166-184`).
 *
 * @see teoz/CommunicationTile.java
 * @see teoz/CommunicationTileSelf.java
 */

import type { FrameEvent, MessageEvent, MessageExoEvent, NoteEvent, Participant, SequenceEvent } from './ast.js';
import { flattenLiveEvents, LiveBoxes, type LiveEvent, type LiveEvents } from './sequence-live-boxes.js';
import { groupClearance } from './sequence-layout-group-clearance.js';
import { parallelDisjoint } from './sequence-layout-parallel-disjoint.js';
import { selfCompWidth } from './sequence-note-anchor.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { ARROW_PADDING_X, LIVE_DELTA_SIZE } from './sequence-layout-shared.js';
import { messagePaint } from './sequence-arrow-paint.js';
import { ARROW_DELTA_X } from './sequence-arrowhead.js';
import { messageLabelWidth, numberTextOf, refBodyLines } from './text-block-geo.js';
import { refComponentWidth, referencePaints } from './ref-body-geo.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import type { Theme } from '../../core/theme.js';
import { noteLiveEntries, notesGroupConstraints } from './sequence-note-width.js';

/**
 * One message's demand on the participant row: the two participant indices it
 * runs between, and the centre-to-centre distance it needs.
 *
 * This IS `CommunicationTile#addConstraints:392-416`, reduced to the part that
 * bears on x. There, `point2.ensureBiggerThan(point1.addFixed(width))` with
 * `width = comp.getPreferredDimension(...).getWidth()` and `point1`/`point2`
 * the two lifeline positions — a constraint between ANY two participants, not
 * only neighbours (D6).
 */
export interface SpanConstraint {
  /** Lower participant index. */
  readonly from: number;
  /** Higher participant index. Always `> from`. */
  readonly to: number;
  /** Required `centre[to] - centre[from]`. */
  readonly span: number;
  /**
   * A create message's created participant (its index): `getPoint2` is that
   * head's near EDGE, `posB`/`posD`, not its centre (`CommunicationTile
   * .java:418-426`), so the demand grows by half that head's width.
   */
  readonly createdIndex?: number;
  /**
   * A `ref`'s demand: `span` is required of `posD[to] - posB[from]`, the
   * EDGES of the two boxes, not their centres --
   * `last.ensureBiggerThan(first.addFixed(dim.getWidth()))`
   * (`teoz/ReferenceTile.java:96-115`).
   */
  readonly edge?: true;
  /**
   * An exo message's demand against the left edge of the drawing space, not
   * against another lifeline: `from === to === ` the participant, and `span`
   * is required of `centre - xOrigin` (`CommunicationExoTile.java:176-181`).
   */
  readonly origin?: true;
}

/**
 * Each message's two live levels, `livingSpace1/2.getLevelAt(this,
 * IGNORE_FUTURE_DEACTIVATE)`, as the event walk measured them. The row is
 * solved before the walk, so these come from a previous pass -- the "third
 * layout pass" `plans/sequence-coordinate-convergence/findings/
 * label-widening.md` names for upstream's deferred `Real` arithmetic.
 */
export type MessageLevels = Map<SequenceEvent, { level1: number; level2: number }>;

interface ScanContext {
  readonly measurer: StringMeasurer;
  readonly levels: MessageLevels | undefined;
  readonly sprites: SpriteRegistry | undefined;
  /** `!pragma sequenceMessageSpan true` (`AbstractCommunicationTile.java
   *  :52-54`): a message tile registers no span constraint at all
   *  (`CommunicationTile.java:405-406`, `CommunicationTileSelf.java:167-168`). */
  readonly messageSpan?: boolean | undefined;
  /** Carries `skinparam noteTextAlignment`, which a note's width depends on
   *  (`Rose.java:100-112`); absent, notes measure with the LEFT default. */
  readonly theme?: Theme | undefined;
}

/** A scan in flight: its {@link ScanContext} and each participant's
 *  `LiveBoxes#getMaxPosition` over the whole diagram. */
export interface Scan extends ScanContext {
  readonly maxPosition: ReadonlyMap<string, number>;
  /** The flat event list every `LiveBoxes` is built on (`LivingSpace.java:148`). */
  readonly live: LiveEvents;
  /** Each participant's `LiveBoxes`, for a tile's `getLevelAt`. */
  readonly boxes: ReadonlyMap<string, LiveBoxes>;
  /** Each standalone note's entry in {@link Scan.live}, for its live level. */
  readonly noteEntries: ReadonlyMap<NoteEvent, LiveEvent>;
}

/**
 * The `LIVE_DELTA_SIZE` terms of `CommunicationTile#addConstraints:404-416`,
 * moved onto the centre-to-centre span: left-to-right only `point2` moves,
 * by `-5` when PART2 is live; right-to-left `point1` moves by `-5` when PART1
 * is live and `point2` by `+5 * level2`.
 */
function liveDelta(levels: { level1: number; level2: number } | undefined, reverse: boolean): number {
  if (levels === undefined) return 0;
  if (!reverse) return levels.level2 > 0 ? LIVE_DELTA_SIZE : 0;
  return (levels.level1 > 0 ? LIVE_DELTA_SIZE : 0) + LIVE_DELTA_SIZE * levels.level2;
}

/**
 * Collect every message's span constraint over the diagram's top-level
 * `events`, recursing into frame branches.
 *
 * Constraints are stored `from < to` regardless of the arrow's direction: the
 * reverse branch of `addConstraints` (`:402-409`) swaps which endpoint is
 * bounded, but demands the same distance. The `LIVE_DELTA_SIZE` adjustments in
 * both branches are {@link liveDelta}'s, from the previous pass's levels.
 */
export function scanMessageLabels(
  events: readonly SequenceEvent[],
  sortedParticipants: Participant[],
  scan: ScanContext,
  out: SpanConstraint[],
): void {
  const live = flattenLiveEvents(events);
  const boxes = new Map(sortedParticipants.map((p) => [p.id, new LiveBoxes(p.id, live.events)] as const));
  const maxPosition = new Map([...boxes].map(([id, b]) => [id, b.getMaxPosition()] as const));
  const full: Scan = { ...scan, maxPosition, live, boxes, noteEntries: noteLiveEntries(events, live) };
  scanEvents(events, sortedParticipants, full, out);
  // `PlayingSpace#addConstraints` (`:162-167`): the top-level `&` runs.
  out.push(...parallelDisjoint(events, sortedParticipants, full));
}

/**
 * A self message's demand on a neighbour. Forward: the NEXT participant,
 * `next.getPosC().ensureBiggerThan(getMaxX())`
 * (`CommunicationTileSelf.java:178-181`), with `getMaxX = livingSpace1
 * .getPosC2() + getCompWidth()` (`:272-277`) and `posC2 = posC +
 * LiveBoxes#getMaxPosition` (`LivingSpace.java:235-238`). Stated on the
 * centre-to-centre span, that is `maxPosition + compWidth`. The last
 * participant has no next (`getNext`, `:250-256`) and binds nothing.
 *
 * Reverse (`A <- A`, `isReverseDefine()`): the PREVIOUS participant instead,
 * `livingSpace1.getPosC().ensureBiggerThan(previous.getPosC2()
 * .addFixed(getCompWidth()))` (`:170-176`) -- the previous one's
 * `maxPosition` plus the loop's width. The first participant has no
 * previous (`getPrevious`, `:236-248`) and binds nothing.
 */
function selfConstraint(ev: MessageEvent, sorted: Participant[], scan: Scan): SpanConstraint[] {
  const index = sorted.findIndex((p) => p.id === ev.from);
  if (index < 0) return [];
  const width = selfCompWidth(ev, scan);
  if (ev.arrow.reverseDefine === true) {
    if (index === 0) return [];
    const previous = sorted[index - 1]!;
    return [{ from: index - 1, to: index, span: (scan.maxPosition.get(previous.id) ?? 0) + width }];
  }
  if (index === sorted.length - 1) return [];
  return [{ from: index, to: index + 1, span: (scan.maxPosition.get(ev.from) ?? 0) + width }];
}

function scanEvents(events: readonly SequenceEvent[], sorted: Participant[], scan: Scan, out: SpanConstraint[]): void {
  out.push(...notesGroupConstraints(events, sorted, scan));
  for (const ev of events) {
    if (ev.kind === 'message') out.push(...(scan.messageSpan === true ? [] : messageConstraint(ev, sorted, scan)));
    else if (ev.kind === 'messageExo') out.push(...exoConstraint(ev, sorted, scan));
    else if (ev.kind === 'frame') scanFrame(ev, sorted, scan, out);
  }
}

/** One ordinary or self message's demand, if any. */
function messageConstraint(ev: MessageEvent, sorted: Participant[], scan: Scan): SpanConstraint[] {
  if (ev.from === ev.to) return selfConstraint(ev, sorted, scan);
  const fi = sorted.findIndex((p) => p.id === ev.from);
  const ti = sorted.findIndex((p) => p.id === ev.to);
  if (fi < 0 || ti < 0) return [];
  // The component is `createComponentArrow(message.getUsedStyles(), …)`
  // (`CommunicationTile.java:153-166`): its block is in the arrow style's font.
  const font = messagePaint(ev.styleBuilder, ev.stereotype, ev.arrow, false).font;
  const labelWidth = messageLabelWidth(ev.label, numberTextOf(ev), font, scan);
  return [
    {
      from: Math.min(fi, ti),
      to: Math.max(fi, ti),
      // `ComponentRoseArrow#getPreferredWidth:347-349` --
      // `getTextWidth + getArrowDeltaX`, and `getTextWidth` is the block
      // plus both paddings. The same formula `sequence-layout-exo.ts`
      // already uses for an exo message's demand.
      span: labelWidth + 2 * ARROW_PADDING_X + ARROW_DELTA_X + liveDelta(scan.levels?.get(ev), fi > ti),
      ...(ev.create === true ? { createdIndex: ti } : {}),
    },
  ];
}

/**
 * An exo message's demand. It binds no PAIR of lifelines (D3: one endpoint,
 * the diagram border for the other), except that a message NOT on the right
 * border keeps its lifeline clear of the left edge:
 * `livingSpace.getPosC().ensureBiggerThan(xOrigin.addFixed(width))`
 * (`CommunicationExoTile.java:176-181`), `width` the component's preferred
 * width (`ComponentRoseArrow#getPreferredWidth:347-349`). A right-border
 * message adds nothing here (`:178`); its extent reaches the diagram through
 * the total width instead.
 */
function exoConstraint(ev: MessageExoEvent, sorted: Participant[], scan: Scan): SpanConstraint[] {
  if (ev.exoType === 'FROM_RIGHT' || ev.exoType === 'TO_RIGHT') return [];
  const index = sorted.findIndex((p) => p.id === ev.participant);
  if (index < 0) return [];
  const font = messagePaint(ev.styleBuilder, ev.stereotype, ev.arrow, false).font;
  const width = messageLabelWidth(ev.label, numberTextOf(ev), font, scan) + 2 * ARROW_PADDING_X + ARROW_DELTA_X;
  return [{ from: index, to: index, span: width, origin: true }];
}

/** A frame's own demand (a `ref`'s, {@link refConstraint}) and its
 *  branches' messages. */
function scanFrame(ev: FrameEvent, sorted: Participant[], scan: Scan, out: SpanConstraint[]): void {
  out.push(...refConstraint(ev, sorted, scan), ...groupClearance(ev, sorted, scan));
  for (const branch of ev.branches) scanEvents(branch, sorted, scan, out);
}

/**
 * `ReferenceTile#init` (`teoz/ReferenceTile.java:96-115`): `first` is the
 * leftmost referenced participant's `posB`, `last` the rightmost's `posD`,
 * and `last.ensureBiggerThan(first.addFixed(dim.getWidth()))` pushes the
 * rightmost box until the component's preferred width fits between them.
 * A one-participant `ref` binds nothing: `last.addAtLeast(0)` (`:112-113`)
 * is a fresh variable, so only the frame widens. `dim` is the preferred
 * width of the component the tile draws, off the reference's own styles.
 */
function refConstraint(ev: FrameEvent, sorted: Participant[], scan: ScanContext): SpanConstraint[] {
  if (ev.frameType !== 'ref' || ev.participants === undefined) return [];
  const indices = ev.participants.map((id) => sorted.findIndex((p) => p.id === id)).filter((i) => i >= 0);
  const from = Math.min(...indices);
  const to = Math.max(...indices);
  if (indices.length === 0 || from === to) return [];
  const span = refComponentWidth(refBodyLines(ev.frameType, ev.label), referencePaints(ev), scan.measurer);
  return [{ from, to, span, edge: true }];
}
