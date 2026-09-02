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
  TextRun,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import {
  computeParticipantLayout,
  type ParticipantLayoutResult,
} from './sequence-layout-participants.js';
import {
  flushOpenActivations,
  processEvents,
  type ActivationStack,
  type EventProcessingContext,
} from './sequence-layout-events.js';
import {
  BOTTOM_MARGIN,
  fontSpecOf,
  PLAYING_SPACE_STARTING_Y,
  PLAYING_SPACE_TAIL_Y,
  TOP_MARGIN,
} from './sequence-layout-shared.js';
import { DIVIDER_WIDTH_ALLOWANCE, DIVIDER_LABEL_DELTA_X } from './divider-style.js';
import { LEFT_MARGIN } from './sequence-layout-participants.js';
import { anchorExoBorders, exoRightExtent } from './sequence-layout-exo.js';
import { sequenceCreoleFont, sequenceCreoleRuns } from './sequence-creole.js';

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

  const first = layoutFrom(ast, theme, measurer, LEFT_MARGIN);
  // Upstream does not lay out from a fixed left edge: it solves an origin and
  // then draws the body shifted by `dx(-min1)`, where `min1` is
  // `body.getMinX()` (`SequenceDiagramFileMakerTeoz.java:82,135-136`). Whatever
  // reaches furthest left -- an exo arrow anchored on the border, a note left
  // of the first participant -- lands ON the margin, and the participant row
  // starts to the right of it by however much it overhangs.
  //
  // Two passes rather than a constraint solve: the overhang is measured from a
  // finished layout and the layout is redone with the row pushed right by it.
  // 87 of 1124 corpus fixtures overhang, and without this they render with
  // negative coordinates -- content off the left of the canvas.
  const overhang = LEFT_MARGIN - minContentX(first);
  if (overhang <= 0) return first;
  return layoutFrom(ast, theme, measurer, LEFT_MARGIN + overhang);
}

/** One layout pass with the participant row starting at `originX`. */
function layoutFrom(
  ast: SequenceDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
  originX: number,
): SequenceGeometry {
  const participantLayout = computeParticipantLayout(ast, theme, measurer, originX);
  const eventLayout = runEventLayout(ast, theme, measurer, participantLayout);
  return assembleGeometry(ast, participantLayout, eventLayout, theme, measurer, originX);
}

interface EventLayoutResult {
  eventGeos: EventGeo[];
  dividerGeos: DividerGeo[];
  newpageGeos: NewpageGeo[];
  /** Activations the event walk left open — closed at `lifelineEndY` by
   *  {@link flushOpenActivations}, which needs a total the walk does not
   *  have yet. */
  openActivations: ActivationStack;
  /** The participant geometry that flush needs to place those bars. */
  participantMap: Map<string, ParticipantGeo>;
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
  originX: number,
): SequenceGeometry {
  const { participantGeos, maxParticipantHeight } = participantLayout;
  const { eventGeos, dividerGeos, newpageGeos, currentY } = eventLayout;

  const showFootbox = isShowFootbox(ast, theme);
  const { lifelineEndY, footerShapeY, totalHeight } =
    computeVerticalTotals(maxParticipantHeight, currentY, showFootbox);
  flushOpenActivations(
    eventLayout.openActivations, lifelineEndY, eventLayout.participantMap, eventGeos,
  );
  const totalWidth = computeTotalWidth(participantGeos, eventGeos, theme, measurer);
  backfillDividerWidth(dividerGeos, totalWidth, originX);
  backfillNewpageWidth(newpageGeos, totalWidth, originX);
  anchorExoBorders(messageGeosOf(eventGeos), totalWidth - RIGHT_MARGIN);
  const boxGeos = computeBoxGeos(ast.boxes, participantGeos, totalHeight, theme, measurer);

  return {
    totalWidth,
    totalHeight,
    participants: participantGeos,
    events: eventGeos,
    // The ABSOLUTE y the lifelines start at, which is the head BAND's height
    // dropped by the document's top margin: `10 + headHeight` in
    // `findings/vertical-terms.md` §0's landmark table. Every consumer
    // (`renderer-lifeline.ts:95`, `sequence-page.ts:320`) already reads it as
    // an absolute coordinate.
    headHeight: TOP_MARGIN + maxParticipantHeight,
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
  const activationStart: ActivationStack = new Map();
  const ctx: EventProcessingContext = {
    theme,
    measurer,
    participantMap: participantLayout.participantMap,
    participantIndex: participantLayout.participantIndex,
    activationStart,
    eventGeos,
    dividerGeos,
    newpageGeos,
  };
  // `PlayingSpace:55,89` — the body's first tile sits `startingY` below the
  // head row, and NOT one `messageSpacing`: teoz has no such term at all
  // (`findings/vertical-terms.md` §1.4).
  const startY =
    TOP_MARGIN + participantLayout.maxParticipantHeight + PLAYING_SPACE_STARTING_Y;
  const currentY = processEvents(ast.events, startY, ctx);

  return {
    eventGeos,
    dividerGeos,
    newpageGeos,
    openActivations: activationStart,
    participantMap: participantLayout.participantMap,
    currentY,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** `GroupingTile.EXTERNAL_MARGINX1` (`teoz/GroupingTile.java:82`) — the slack
 *  a group's footprint keeps outside its own drawn frame, on the left. */
const FRAME_EXTERNAL_MARGIN_X1 = 3;

/**
 * The leftmost x any content in a finished layout reaches — this port's
 * `body.getMinX()` (`SequenceDiagramFileMakerTeoz.java:82`).
 *
 * Only the fields that can reach left of the participant row are consulted,
 * and every geo kind that has one is here: a message's two endpoints (an exo
 * arrow anchored on the left border starts at `posC - preferredWidth`, which
 * is what goes negative), a note's box, a frame's box, an activation bar, and
 * a divider's or separator's band. Heights and y-coordinates cannot move the
 * left edge and are not read.
 *
 * The participant row itself is included, which makes this total rather than a
 * correction: on a diagram with nothing overhanging, the minimum IS the first
 * box and the second pass is skipped.
 */
function minContentX(geo: SequenceGeometry): number {
  let min = Number.POSITIVE_INFINITY;
  for (const p of geo.participants) min = Math.min(min, p.x);
  for (const e of geo.events) min = Math.min(min, minEventX(e));
  return Number.isFinite(min) ? min : LEFT_MARGIN;
}

/** One event's leftmost x, or `+Infinity` for a kind that has none. */
function minEventX(event: EventGeo): number {
  switch (event.kind) {
    case 'message':
      return Math.min(event.fromX, event.toX);
    case 'note':
      return event.x;
    case 'frame':
      // A group reserves `EXTERNAL_MARGINX1` beyond its own frame:
      // `GroupingTile#getMinX:697-698` is
      // `min.addFixed(-EXTERNAL_MARGINX1 - notesWidth(LEFT))` with
      // `EXTERNAL_MARGINX1 = 3` (`:82`). The frame's `x` is the border it
      // draws; the tile's footprint starts 3 further left. (The left-note term
      // is not modelled here -- see `findings/document-margins.md`.)
      return event.x - FRAME_EXTERNAL_MARGIN_X1;
    case 'activation':
      return event.lifelineX;
    case 'divider':
    case 'newpage':
      return event.bandX;
    default:
      return Number.POSITIVE_INFINITY;
  }
}

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
const RIGHT_MARGIN = 10;

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
 * The document's vertical close-out — `findings/vertical-terms.md` §0, read
 * bottom-up:
 *
 * ```
 * pageHeight = max(inkHeight, startingY + SUM(tileHeight)) + 10
 *                                    PlayingSpace#getPreferredHeight:154-161
 * pswpHeight = pageHeight + (footbox ? 2 : 1) * headHeight
 *                        PlayingSpaceWithParticipants#calculateDimension:74-87
 * svgHeight  = pswpHeight + 10 (block inset) + 10 (exporter margins)
 *                     SequenceDiagramFileMakerTeoz#getTextBlock:132,150-158;
 *                     TextBlockExporter:199-203
 * ```
 *
 * `currentY` is the last tile's gauge max, so `currentY + PLAYING_SPACE_TAIL_Y`
 * is the top of the foot row — and the foot band is the SAME `headHeight` as
 * the head band, drawn flush at `dy(pageHeight + headHeight)`
 * (`PlayingSpaceWithParticipants#drawU:224-225`).
 *
 * There is NO footer label zone. This port reserved `theme.fontSize + 8`
 * between the lifeline end and an actor/database foot; upstream's tail
 * component puts the label above its own stickman INSIDE its own height
 * (`LivingSpaces#drawHeads:135-141`) and reserves nothing extra, which is why
 * `footerShapeY` is now just `lifelineEndY`. `renderFooterBox` already draws
 * from `lifelineEndY` and derives each kind's glyph offset itself, so the
 * field survives only for `sequence-page.ts`/`scale-geo.ts`.
 */
function computeVerticalTotals(
  maxParticipantHeight: number,
  currentY: number,
  showFootbox: boolean,
): VerticalTotals {
  const lifelineEndY = currentY + PLAYING_SPACE_TAIL_Y;
  // `factor` in `calculateDimensionSlow:83-84` — 2 with a footbox, 1 without.
  const footBand = showFootbox ? maxParticipantHeight : 0;
  return {
    lifelineEndY,
    footerShapeY: lifelineEndY,
    totalHeight: lifelineEndY + footBand + BOTTOM_MARGIN,
  };
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
function backfillDividerWidth(
  dividerGeos: DividerGeo[],
  totalWidth: number,
  originX: number,
): void {
  for (const d of dividerGeos) {
    // `originX`, not `LEFT_MARGIN`: `border1` is the playing space's own left
    // border, which upstream shifts along with everything else when the body
    // is translated by `dx(-min1)`. On a diagram with nothing overhanging to
    // the left the two are the same number.
    d.bandX = originX;
    d.bandWidth = Math.max(0, totalWidth - originX - RIGHT_MARGIN);
    // A5: the label runs were built relative to the label BOX's own top-left
    // (`sequence-layout-events.ts#dividerLabelRuns`); the box itself is
    // centred in the band, so its origin is only knowable here.
    // `ComponentRoseDivider#drawInternalU:76-77`:
    //   xpos = (width - textWidth - deltaX) / 2
    //   ypos = (height - textHeight) / 2
    const boxX = d.bandX + (d.bandWidth - d.textWidth - DIVIDER_LABEL_DELTA_X) / 2;
    const boxY = d.y + (d.height - d.textHeight) / 2;
    d.labelRuns = d.labelRuns.map((r) => ({ ...r, x: boxX + r.x, y: boxY + r.y }));
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
function backfillNewpageWidth(
  newpageGeos: NewpageGeo[],
  totalWidth: number,
  originX: number,
): void {
  for (const n of newpageGeos) {
    n.bandX = originX;
    n.bandWidth = Math.max(0, totalWidth - originX - RIGHT_MARGIN);
  }
}

/**
 * Compute box background geometries (Step 4). Each box spans from
 * x = leftmost participant edge - 8 to rightmost + 8, y = 0,
 * height = totalHeight (covers the full diagram height).
 */
/**
 * A `box` group's label as a placed, measured run (A5).
 *
 * The x and the baseline are exactly where `renderBoxBackground` put them
 * before -- `box.x + padding` and `box.y + fontSize + padding` -- so this
 * moves nothing; what it adds is the measured width the emitter needs.
 *
 * DIVERGENCE, recorded not fixed: the jar draws a box label at `box {
 * FontSize 13, FontStyle bold }` (`plantuml.skin:162-167`), emitting
 * `font-size="13" font-weight="700"` -- `binupo-93-begi656` is the reference.
 * This port uses 11 plain. Correcting it also moves the label's x and reopens
 * how nested boxes lay out, which that same fixture exercises and this engine
 * does not yet port, so it is a task of its own rather than a side effect of
 * routing the text through the emitter.
 */
function boxLabelRuns(
  label: string,
  boxX: number,
  theme: Theme,
  measurer: StringMeasurer,
): readonly TextRun[] {
  const font: FontSpec = { family: theme.fontFamily, size: BOX_LABEL_FONT_SIZE };
  // C6: `ComponentRoseEnglober` extends `AbstractTextualComponent` and builds
  // its label through the same `create0` every other sequence text uses
  // (`~/git/plantuml/.../skin/rose/ComponentRoseEnglober.java:57-60`), so the
  // label goes through the same seam. Measured reach today is zero -- all 59
  // `box` declarations in the corpus carry a plain label -- so this closes the
  // last text kind for CONSISTENCY, not for a number; measurement identity
  // means every one of those 59 renders byte-identically.
  return sequenceCreoleRuns(
    label,
    sequenceCreoleFont(font),
    {
      leftX: boxX + BOX_LABEL_PADDING,
      baselineY: BOX_LABEL_FONT_SIZE + BOX_LABEL_PADDING,
    },
    measurer,
  );
}

/** `renderer.ts`'s own box-label style, mirrored here so the measurement and
 *  the drawing share one number. See {@link boxLabelRun}'s divergence note. */
const BOX_LABEL_FONT_SIZE = 11;
const BOX_LABEL_PADDING = 4;

function computeBoxGeos(
  boxes: BoxGroup[],
  participantGeos: ParticipantGeo[],
  totalHeight: number,
  theme: Theme,
  measurer: StringMeasurer,
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
      labelRuns:
        box.label === '' ? [] : boxLabelRuns(box.label, leftEdge - BOX_PAD, theme, measurer),
    });
  }

  return boxGeos;
}
