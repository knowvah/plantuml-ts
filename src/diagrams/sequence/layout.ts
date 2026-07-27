/**
 * Sequence diagram layout engine.
 *
 * Pure function: SequenceDiagramAST + Theme + StringMeasurer → SequenceGeometry.
 * No DOM, no SVG, no async. All coordinates are absolute pixels.
 *
 * Split across sibling modules to keep file size and per-function complexity
 * within limits (one-way DAG: this file imports the leaf helpers below;
 * nothing in those files imports back from here):
 *   - sequence-layout-shared.ts       — fontSpecOf (shared leaf util)
 *   - sequence-layout-participants.ts — Step 1: participant column geometry
 *   - sequence-layout-events.ts       — Step 2: event geometry
 */

import type {
  BoxGeo,
  BoxGroup,
  DividerGeo,
  EventGeo,
  ParticipantGeo,
  SequenceDiagramAST,
  SequenceGeometry,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import {
  computeParticipantLayout,
  type ParticipantLayoutResult,
} from './sequence-layout-participants.js';
import {
  processEvents,
  type EventProcessingContext,
} from './sequence-layout-events.js';
import { fontSpecOf } from './sequence-layout-shared.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function layoutSequence(
  ast: SequenceDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): SequenceGeometry {
  if (ast.participants.length === 0) {
    return emptyGeometry();
  }

  const participantLayout = computeParticipantLayout(ast, theme, measurer);
  const eventLayout = runEventLayout(ast, theme, measurer, participantLayout);

  return assembleGeometry(ast, participantLayout, eventLayout, theme, measurer);
}

interface EventLayoutResult {
  eventGeos: EventGeo[];
  dividerGeos: DividerGeo[];
  currentY: number;
}

/**
 * Assemble the final SequenceGeometry from the participant and event layout
 * results: compute totals (Step 3), back-fill divider width, and compute box
 * background geometries (Step 4).
 */
function assembleGeometry(
  ast: SequenceDiagramAST,
  participantLayout: ParticipantLayoutResult,
  eventLayout: EventLayoutResult,
  theme: Theme,
  measurer: StringMeasurer,
): SequenceGeometry {
  const { participantGeos, maxParticipantHeight } = participantLayout;
  const { eventGeos, dividerGeos, currentY } = eventLayout;

  const { lifelineEndY, footerShapeY, totalHeight } =
    computeVerticalTotals(participantGeos, maxParticipantHeight, currentY, theme);
  const totalWidth = computeTotalWidth(participantGeos, eventGeos, theme, measurer);
  backfillDividerWidth(dividerGeos, totalWidth);
  const boxGeos = computeBoxGeos(ast.boxes, participantGeos, totalHeight);

  return {
    totalWidth,
    totalHeight,
    participants: participantGeos,
    events: eventGeos,
    lifelineEndY,
    footerShapeY,
    boxes: boxGeos,
  };
}

/**
 * Run Step 2 (event geometry): build the shared processing context from the
 * already-computed participant layout, then walk the event list.
 */
function runEventLayout(
  ast: SequenceDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
  participantLayout: ParticipantLayoutResult,
): EventLayoutResult {
  const eventGeos: EventGeo[] = [];
  const dividerGeos: DividerGeo[] = [];
  const ctx: EventProcessingContext = {
    theme,
    measurer,
    participantMap: participantLayout.participantMap,
    participantIndex: participantLayout.participantIndex,
    activationStart: new Map(),
    eventGeos,
    dividerGeos,
  };
  const startY = participantLayout.maxParticipantHeight + theme.sequence.messageSpacing;
  const currentY = processEvents(ast.events, startY, ctx);

  return { eventGeos, dividerGeos, currentY };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emptyGeometry(): SequenceGeometry {
  return {
    totalWidth: 0,
    totalHeight: 0,
    participants: [],
    events: [],
    lifelineEndY: 0,
    footerShapeY: 0,
    boxes: [],
  };
}

interface VerticalTotals {
  lifelineEndY: number;
  footerShapeY: number;
  totalHeight: number;
}

/**
 * Compute the lifeline end, footer shape, and total diagram height.
 * Non-rectangular footer shapes (actor, database) get their label above the
 * shape, so a label-height zone is reserved between the lifeline end and the
 * shape.
 */
function computeVerticalTotals(
  participantGeos: ParticipantGeo[],
  maxParticipantHeight: number,
  currentY: number,
  theme: Theme,
): VerticalTotals {
  const lifelineEndY = currentY + theme.sequence.lifelineExtension;
  const hasNonRectFooter = participantGeos.some(
    (p) => p.type === 'actor' || p.type === 'database',
  );
  const footerLabelH = hasNonRectFooter ? theme.fontSize + 8 : 0;
  const footerShapeY = lifelineEndY + footerLabelH;
  const BOTTOM_MARGIN = 5;
  const totalHeight = footerShapeY + maxParticipantHeight + BOTTOM_MARGIN;

  return { lifelineEndY, footerShapeY, totalHeight };
}

/**
 * Compute total diagram width: the rightmost participant edge, expanded if
 * any message label overflows it. Labels are rendered centered at midX with
 * text-anchor="middle", so the right edge of the label is midX + labelWidth/2.
 * A long label on a rightward message near the last participant can clip
 * without this check.
 */
function computeTotalWidth(
  participantGeos: ParticipantGeo[],
  eventGeos: EventGeo[],
  theme: Theme,
  measurer: StringMeasurer,
): number {
  const fontSpec = fontSpecOf(theme);
  // Safe: participantGeos is non-empty (guarded by the early return above)
  const lastParticipant = participantGeos[participantGeos.length - 1]!;
  const RIGHT_MARGIN = 30;
  let totalWidth = lastParticipant.x + lastParticipant.width + RIGHT_MARGIN;

  for (const geo of eventGeos) {
    if (geo.kind !== 'message') continue;
    const labelText =
      geo.sequenceNumber !== undefined
        ? `${geo.sequenceNumber}: ${geo.label}`
        : geo.label;
    const labelWidth = measurer.measure(labelText, fontSpec).width;
    const midX =
      geo.arrowDirection === 'self'
        ? geo.fromX + 20
        : (geo.fromX + geo.toX) / 2;
    const labelRightEdge = midX + labelWidth / 2 + RIGHT_MARGIN;
    if (labelRightEdge > totalWidth) {
      totalWidth = labelRightEdge;
    }
  }

  return totalWidth;
}

/** Fill in totalWidth on all DividerGeo entries once it's known (Step 3). */
function backfillDividerWidth(dividerGeos: DividerGeo[], totalWidth: number): void {
  for (const d of dividerGeos) {
    d.totalWidth = totalWidth;
  }
}

/**
 * Compute box background geometries (Step 4). Each box spans from
 * x = leftmost participant edge - 8 to rightmost + 8, y = 0,
 * height = totalHeight (covers the full diagram height).
 */
function computeBoxGeos(
  boxes: BoxGroup[],
  participantGeos: ParticipantGeo[],
  totalHeight: number,
): BoxGeo[] {
  const BOX_PAD = 8;
  const boxGeos: BoxGeo[] = [];

  for (const box of boxes) {
    if (box.participantIds.length === 0) continue;
    const contained = box.participantIds
      .map((id) => participantGeos.find((g) => g.id === id))
      .filter((g): g is ParticipantGeo => g !== undefined);
    if (contained.length === 0) continue;
    const leftEdge = Math.min(...contained.map((g) => g.x));
    const rightEdge = Math.max(...contained.map((g) => g.x + g.width));
    boxGeos.push({
      x: leftEdge - BOX_PAD,
      y: 0,
      width: rightEdge - leftEdge + BOX_PAD * 2,
      height: totalHeight,
      label: box.label,
      color: box.color,
    });
  }

  return boxGeos;
}
