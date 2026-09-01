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
  MessageGeo,
  NewpageGeo,
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
import { DIVIDER_WIDTH_ALLOWANCE } from './divider-style.js';
import { LEFT_MARGIN } from './sequence-layout-participants.js';
import { anchorExoBorders, exoRightExtent } from './sequence-layout-exo.js';

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
  newpageGeos: NewpageGeo[];
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
  const { eventGeos, dividerGeos, newpageGeos, currentY } = eventLayout;

  const showFootbox = isShowFootbox(ast, theme);
  const { lifelineEndY, footerShapeY, totalHeight } =
    computeVerticalTotals(participantGeos, maxParticipantHeight, currentY, theme, showFootbox);
  const totalWidth = computeTotalWidth(participantGeos, eventGeos, theme, measurer);
  backfillDividerWidth(dividerGeos, totalWidth);
  backfillNewpageWidth(newpageGeos, totalWidth);
  anchorExoBorders(messageGeosOf(eventGeos), totalWidth - RIGHT_MARGIN);
  const boxGeos = computeBoxGeos(ast.boxes, participantGeos, totalHeight);

  return {
    totalWidth,
    totalHeight,
    participants: participantGeos,
    events: eventGeos,
    headHeight: maxParticipantHeight,
    lifelineEndY,
    footerShapeY,
    showFootbox,
    boxes: boxGeos,
    ...(ast.scale !== undefined ? { scale: ast.scale } : {}),
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
  const newpageGeos: NewpageGeo[] = [];
  const ctx: EventProcessingContext = {
    theme,
    measurer,
    participantMap: participantLayout.participantMap,
    participantIndex: participantLayout.participantIndex,
    activationStart: new Map(),
    eventGeos,
    dividerGeos,
    newpageGeos,
  };
  const startY = participantLayout.maxParticipantHeight + theme.sequence.messageSpacing;
  const currentY = processEvents(ast.events, startY, ctx);

  return { eventGeos, dividerGeos, newpageGeos, currentY };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** The gap kept between the rightmost content and the document edge. Upstream
 *  keeps it outside the drawing space -- `getBorder2()` is the content edge
 *  and the image margin lies beyond it -- so an exo arrow anchored on the
 *  border stops here, not at `totalWidth`. */
const RIGHT_MARGIN = 30;

function emptyGeometry(): SequenceGeometry {
  return {
    totalWidth: 0,
    totalHeight: 0,
    participants: [],
    events: [],
    headHeight: 0,
    lifelineEndY: 0,
    footerShapeY: 0,
    showFootbox: true,
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
  showFootbox: boolean,
): VerticalTotals {
  const lifelineEndY = currentY + theme.sequence.lifelineExtension;
  const BOTTOM_MARGIN = 5;
  // No footer row: reserve nothing for it. Upstream does not lay one out
  // either, so the document ends just past the lifelines.
  if (!showFootbox)
    return { lifelineEndY, footerShapeY: lifelineEndY, totalHeight: lifelineEndY + BOTTOM_MARGIN };

  const hasNonRectFooter = participantGeos.some(
    (p) => p.type === 'actor' || p.type === 'database',
  );
  const footerLabelH = hasNonRectFooter ? theme.fontSize + 8 : 0;
  const footerShapeY = lifelineEndY + footerLabelH;
  const totalHeight = footerShapeY + maxParticipantHeight + BOTTOM_MARGIN;

  return { lifelineEndY, footerShapeY, totalHeight };
}

/**
 * `SequenceDiagram#isShowFootbox` (`SequenceDiagram.java:474-486`), ported in
 * upstream's own precedence order:
 *
 *   1. `skinparam style strictuml` suppresses it outright, before anything
 *      else is consulted (`:475-476`);
 *   2. otherwise `skinparam footbox` decides if present -- "hide" (compared
 *      case-insensitively) suppresses, and ANY other value shows, which is
 *      what lets `skinparam footbox show` override a `hide footbox` command
 *      (`:478-485`);
 *   3. otherwise the `hide footbox` command's own flag, default show
 *      (`:480-481`, `:488`).
 */
function isShowFootbox(ast: SequenceDiagramAST, theme: Theme): boolean {
  if (theme.strictUml === true) return false;
  const footbox = theme.footbox;
  if (footbox === undefined) return !ast.options.hideFootbox;
  return footbox.toLowerCase() !== 'hide';
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
  let totalWidth = Math.max(
    lastParticipant.x + lastParticipant.width + RIGHT_MARGIN,
    exoContentRight(eventGeos) + RIGHT_MARGIN,
  );

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

  return Math.max(totalWidth, dividerContentRight(eventGeos));
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
function messageGeosOf(eventGeos: EventGeo[]): MessageGeo[] {
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

/**
 * Fill in each divider's band span once `totalWidth` is known (Step 3).
 *
 * `DividerTile#drawU` spans `border1 … border2` (`teoz/DividerTile.java`), the
 * playing space's own borders — so this port uses its own equivalents,
 * `LEFT_MARGIN` and `RIGHT_MARGIN`, rather than 0 and the document width. The
 * band used to run edge to edge, which is wider than the jar's on every
 * fixture.
 */
function backfillDividerWidth(dividerGeos: DividerGeo[], totalWidth: number): void {
  for (const d of dividerGeos) {
    d.bandX = LEFT_MARGIN;
    d.bandWidth = Math.max(0, totalWidth - LEFT_MARGIN - RIGHT_MARGIN);
  }
}

/**
 * Fill in each newpage separator's span, alongside the dividers above.
 *
 * `NewpageTile#drawU` and `DividerTile#drawU` build their `Area` the same
 * way -- `border2 - border1 - xorigin` wide, translated by `border1`
 * (`NewpageTile.java:83-90`) -- so the separator spans exactly the band a
 * divider does, and this port uses the same `LEFT_MARGIN`/`RIGHT_MARGIN`
 * equivalents. Jar-verified on `digula-66-dipe776`: its separator is
 * `x1="44.959" x2="190.003"`, the same left edge as its own participant row
 * and the same right edge its widest message reaches.
 */
function backfillNewpageWidth(newpageGeos: NewpageGeo[], totalWidth: number): void {
  for (const n of newpageGeos) {
    n.bandX = LEFT_MARGIN;
    n.bandWidth = Math.max(0, totalWidth - LEFT_MARGIN - RIGHT_MARGIN);
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
