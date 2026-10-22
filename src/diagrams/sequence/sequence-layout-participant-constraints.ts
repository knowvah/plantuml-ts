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

import type { FrameEvent, Participant, SequenceEvent } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { ARROW_PADDING_X, LIVE_DELTA_SIZE } from './sequence-layout-shared.js';
import { messagePaint } from './sequence-arrow-paint.js';
import { ARROW_DELTA_X } from './sequence-arrowhead.js';
import { messageLabelWidth, numberTextOf, refBodyLines } from './text-block-geo.js';
import { refComponentWidth, referencePaints } from './ref-body-geo.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';

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
 * Collect every message's span constraint. Recurses into frame branches.
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
  for (const ev of events) {
    if (ev.kind === 'message' && ev.from !== ev.to) {
      const fi = sortedParticipants.findIndex((p) => p.id === ev.from);
      const ti = sortedParticipants.findIndex((p) => p.id === ev.to);
      if (fi >= 0 && ti >= 0 && fi !== ti) {
        // The component is `createComponentArrow(message.getUsedStyles(), …)`
        // (`CommunicationTile.java:153-166`): its block is in the arrow style's font.
        const font = messagePaint(ev.styleBuilder, ev.stereotype, ev.arrow, false).font;
        const labelWidth = messageLabelWidth(ev.label, numberTextOf(ev), font, scan);
        out.push({
          from: Math.min(fi, ti),
          to: Math.max(fi, ti),
          // `ComponentRoseArrow#getPreferredWidth:347-349` —
          // `getTextWidth + getArrowDeltaX`, and `getTextWidth` is the block
          // plus both paddings. The same formula `sequence-layout-exo.ts`
          // already uses for an exo message's demand.
          span: labelWidth + 2 * ARROW_PADDING_X + ARROW_DELTA_X + liveDelta(scan.levels?.get(ev), fi > ti),
          ...(ev.create === true ? { createdIndex: ti } : {}),
        });
      }
    } else if (ev.kind === 'messageExo') {
      // Deliberately skipped, not overlooked (D3). This scan widens the gap
      // between a PAIR of lifelines; an exo message has one endpoint and the
      // diagram border for the other, so there is no pair to widen. Its extent
      // reaches the diagram through `MessageExoArrow#getRightEndInternal`'s
      // `Math.max(maxX, ...)`, i.e. total width -- a different quantity.
      // @see sequencediagram/graphic/MessageExoArrow.java
      continue;
    } else if (ev.kind === 'frame') {
      scanFrame(ev, sortedParticipants, scan, out);
    }
  }
}

/** A frame's own demand (a `ref`'s, {@link refConstraint}) and its
 *  branches' messages. */
function scanFrame(ev: FrameEvent, sorted: Participant[], scan: ScanContext, out: SpanConstraint[]): void {
  out.push(...refConstraint(ev, sorted, scan));
  for (const branch of ev.branches) scanMessageLabels(branch, sorted, scan, out);
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
