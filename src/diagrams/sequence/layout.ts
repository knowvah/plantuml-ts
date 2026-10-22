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
 *   - sequence-layout-width.ts        — document width (PlayingSpace)
 */

import type {
  BoxGeo,
  DividerGeo,
  EventGeo,
  MessageGeo,
  NewpageGeo,
  ParticipantGeo,
  SequenceDiagramAST,
  SequenceGeometry,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import { REF_X_MARGIN } from './ref-body-geo.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import {
  computeParticipantLayout,
  type MessageLevels,
  type ParticipantLayoutResult,
} from './sequence-layout-participants.js';
import type { EngloberLayout, ParticipantRow } from './sequence-dolls.js';
import {
  flushOpenActivations,
  newActivationStack,
  processEvents,
  type ActivationStack,
  type EventProcessingContext,
} from './sequence-layout-events.js';
import { BOTTOM_MARGIN, PLAYING_SPACE_STARTING_Y, PLAYING_SPACE_TAIL_Y, TOP_MARGIN } from './sequence-layout-shared.js';
import { DIVIDER_LABEL_DELTA_X } from './divider-style.js';
import { LEFT_MARGIN } from './sequence-layout-participants.js';
import { cutActivationsAtDelays } from './sequence-delay.js';
import { endOfParseStyleBuilder, lifelinesOf } from './sequence-layout-lifeline.js';
import { clampDestroySteps } from './sequence-layout-life-event.js';
import { anchorExoBorders } from './sequence-layout-exo.js';
import { boxLabelRuns, boxPaint } from './sequence-layout-box.js';
import { layoutLinkAnchors } from './sequence-layout-link-anchor.js';
import type { LinkAnchorGeo } from './geo.js';
import { computeTotalWidth, messageGeosOf, RIGHT_MARGIN } from './sequence-layout-width.js';
import { FRAME_EXTERNAL_MARGIN_X1 } from './sequence-frame-metrics.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function layoutSequence(ast: SequenceDiagramAST, theme: Theme, measurer: StringMeasurer): SequenceGeometry {
  if (ast.participants.length === 0) {
    return emptyGeometry();
  }

  // The participant row needs each message's live LEVELS (`CommunicationTile
  // #addConstraints:404-416`), which only the event walk computes: walk once
  // to record them, then lay out again with them (`MessageLevels`).
  const levels: MessageLevels = new Map();
  const measured = layoutFrom(ast, theme, measurer, LEFT_MARGIN, { record: levels });
  const anyLive = [...levels.values()].some((l) => l.level1 > 0 || l.level2 > 0);
  const first = anyLive ? layoutFrom(ast, theme, measurer, LEFT_MARGIN, { use: levels }) : measured;
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
  return layoutFrom(ast, theme, measurer, LEFT_MARGIN + overhang, anyLive ? { use: levels } : {});
}

/** One layout pass with the participant row starting at `originX`. */
function layoutFrom(
  ast: SequenceDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
  originX: number,
  levels: { record?: MessageLevels; use?: MessageLevels },
): SequenceGeometry {
  const participantLayout = computeParticipantLayout(ast, theme, measurer, originX, levels.use);
  const eventLayout = runEventLayout(ast, { theme, measurer, originX }, participantLayout, levels.record);
  return assembleGeometry(ast, participantLayout, eventLayout, theme, measurer, originX);
}

/** What one layout pass hands the event walk beyond the AST. */
interface EventEnv {
  readonly theme: Theme;
  readonly measurer: StringMeasurer;
  /** The participant row's x origin, `TileArguments#getXOrigin`. */
  readonly originX: number;
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
  /** The `{a} <-> {b}` links, resolved against the finished tiles. */
  linkAnchors: readonly LinkAnchorGeo[];
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
  const { participantGeos, maxParticipantHeight, englobers } = participantLayout;
  const { dividerGeos, newpageGeos, currentY } = eventLayout;

  const showFootbox = isShowFootbox(ast, theme);
  const { lifelineEndY, footerShapeY, totalHeight } = computeVerticalTotals(
    maxParticipantHeight,
    currentY,
    showFootbox,
    englobers.heightEnglober2,
  );
  flushOpenActivations(eventLayout.openActivations, lifelineEndY, eventLayout.participantMap, eventLayout.eventGeos);
  const eventGeos = clampDestroySteps(cutActivationsAtDelays(eventLayout.eventGeos), participantGeos);
  const headHeight = TOP_MARGIN + englobers.heightEnglober1 + maxParticipantHeight;
  const row = participantRowOf(participantGeos);
  const totalWidth = Math.max(
    computeTotalWidth(participantGeos, eventGeos, {
      theme,
      measurer,
      sprites: ast.sprites,
      events: ast.events,
      originX,
    }),
    englobersRight(englobers, row),
  );
  backfillDividerWidth(dividerGeos, totalWidth);
  backfillNewpageWidth(newpageGeos, totalWidth);
  anchorExoBorders(messageGeosOf(eventGeos), totalWidth - RIGHT_MARGIN);
  const boxGeos = computeBoxGeos(englobers, row, totalHeight, measurer, ast.sprites);

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
    headHeight,
    lifelineEndY,
    lifelineSegments: lifelinesOf(ast, participantGeos, { headHeight, end: lifelineEndY, events: eventGeos }),
    footerShapeY,
    showFootbox,
    boxes: boxGeos,
    ...(eventLayout.linkAnchors.length > 0 ? { linkAnchors: eventLayout.linkAnchors } : {}),
    ...(ast.scale !== undefined ? { scale: ast.scale } : {}),
  };
}

/**
 * Run Step 2 (event geometry): build the shared processing context from the
 * already-computed participant layout, then walk the event list.
 */
function runEventLayout(
  ast: SequenceDiagramAST,
  env: EventEnv,
  participantLayout: ParticipantLayoutResult,
  messageLevels?: MessageLevels,
): EventLayoutResult {
  const ctx = eventContext(ast, env, participantLayout, messageLevels);
  // `PlayingSpace:55,89` — the body's first tile sits `startingY` below the
  // head row, and NOT one `messageSpacing`: teoz has no such term at all
  // (`findings/vertical-terms.md` §1.4).
  // `ug.apply(dy(heightEnglober1))` before `body.drawU`
  // (`SequenceDiagramFileMakerTeoz.java:148`).
  const startY =
    TOP_MARGIN +
    participantLayout.englobers.heightEnglober1 +
    participantLayout.maxParticipantHeight +
    PLAYING_SPACE_STARTING_Y;
  const currentY = processEvents(ast.events, startY, ctx);

  return {
    eventGeos: ctx.eventGeos,
    dividerGeos: ctx.dividerGeos,
    newpageGeos: ctx.newpageGeos,
    openActivations: ctx.activationStart,
    participantMap: participantLayout.participantMap,
    currentY,
    linkAnchors: layoutLinkAnchors(ast, ctx),
  };
}

/** The shared processing context the event walk threads. */
function eventContext(
  ast: SequenceDiagramAST,
  env: EventEnv,
  participantLayout: ParticipantLayoutResult,
  messageLevels: MessageLevels | undefined,
): EventProcessingContext {
  return {
    theme: env.theme,
    measurer: env.measurer,
    originX: env.originX,
    sprites: ast.sprites,
    participantMap: participantLayout.participantMap,
    participantIndex: participantLayout.participantIndex,
    activationStart: newActivationStack(ast.participants, ast.events),
    endStyleBuilder: endOfParseStyleBuilder(ast),
    eventGeos: [],
    dividerGeos: [],
    newpageGeos: [],
    ...(messageLevels !== undefined ? { messageLevels } : {}),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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
      return messageMinX(event);
    case 'note':
      // `NoteTile#getMinX` (`teoz/NoteTile.java:278-286`): the tile, which
      // starts `getPaddingX()` left of the drawn box.
      return event.minX;
    case 'frame':
      // A `ref` is a `ReferenceTile`, whose `getMinX` is `first`, the
      // component origin `xMargin` left of its drawn box
      // (`teoz/ReferenceTile.java:163-171`, `sequence-layout-ref.ts`).
      if (event.frameType === 'ref') return event.x - REF_X_MARGIN;
      // A group reserves `EXTERNAL_MARGINX1` beyond its own frame:
      // `GroupingTile#getMinX:984-986` is
      // `min.addFixed(-EXTERNAL_MARGINX1 - notesWidth(LEFT))` with
      // `EXTERNAL_MARGINX1 = 3` (`:83`). The frame's `x` is the border it
      // draws; the tile's footprint starts 3 further left. (The left-note term
      // is not modelled here -- see `findings/document-margins.md`.)
      return event.x - FRAME_EXTERNAL_MARGIN_X1;
    case 'activation':
      return event.lifelineX;
    case 'divider':
    case 'newpage':
      return event.bandX;
    case 'delay':
      // `DelayTile#getMinX` (`:121-124`): `middle - preferredWidth / 2`.
      return event.middleX - event.textWidth / 2;
    default:
      return Number.POSITIVE_INFINITY;
  }
}

/** A message tile's leftmost x: its two ends, or -- a reverse self loop --
 *  its tile's `getMinX`, left of the stroke (`CommunicationTileSelf.java
 *  :263-270`, carried as `tileMinX`). */
function messageMinX(event: MessageGeo): number {
  const ends = Math.min(event.fromX, event.toX);
  return event.tileMinX === undefined ? ends : Math.min(ends, event.tileMinX);
}

function emptyGeometry(): SequenceGeometry {
  return {
    totalWidth: 0,
    totalHeight: 0,
    participants: [],
    events: [],
    headHeight: 0,
    lifelineEndY: 0,
    lifelineSegments: {},
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
 * svgHeight  = pswpHeight + heightEnglober1 + heightEnglober2
 *              + 10 (block inset) + 10 (exporter margins)
 *                     SequenceDiagramFileMakerTeoz#getTextBlock:132,150-163;
 *                     TextBlockExporter:199-203
 * ```
 *
 * `heightEnglober1` is already in `currentY` (the body starts that far down);
 * `heightEnglober2` is added here.
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
 * `footerShapeY` (the foot row's top) equals `lifelineEndY` here. The two
 * separate only per page, in `sequence-page.ts`, where upstream's clip lets
 * the lifelines run one pixel past the foot row's top.
 */
function computeVerticalTotals(
  maxParticipantHeight: number,
  currentY: number,
  showFootbox: boolean,
  heightEnglober2: number,
): VerticalTotals {
  const lifelineEndY = currentY + PLAYING_SPACE_TAIL_Y;
  // `factor` in `calculateDimensionSlow:83-84` — 2 with a footbox, 1 without.
  const footBand = showFootbox ? maxParticipantHeight : 0;
  return {
    lifelineEndY,
    footerShapeY: lifelineEndY,
    totalHeight: lifelineEndY + footBand + heightEnglober2 + BOTTOM_MARGIN,
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
    // `LEFT_MARGIN`, not `originX`: `border1` is `PlayingSpace#min`
    // (`PlayingSpace.java:318-320`), the minimum over the origin and every
    // tile's `getMinX`, and the body is translated by `dx(-min1)` with the
    // same value (`SequenceDiagramFileMakerTeoz.java:141-142`), so the band
    // always starts at the left margin. `originX` is pushed right by any left
    // overhang (a left note, an exo) -- `DividerTile.java:92-95`.
    d.bandX = LEFT_MARGIN;
    d.bandWidth = Math.max(0, totalWidth - LEFT_MARGIN - RIGHT_MARGIN);
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
function backfillNewpageWidth(newpageGeos: NewpageGeo[], totalWidth: number): void {
  for (const n of newpageGeos) {
    // Same `border1` as the divider (`NewpageTile.java:97-99`).
    n.bandX = LEFT_MARGIN;
    n.bandWidth = Math.max(0, totalWidth - LEFT_MARGIN - RIGHT_MARGIN);
  }
}

/** `PlayingSpace` maxes `dolls.getMaxX()` into the body's width
 *  (`PlayingSpace.java:81-84`), with the margins as baked then; the document
 *  edge is `RIGHT_MARGIN` beyond it. 0 when there is no box. */
function englobersRight(englobers: EngloberLayout, row: ParticipantRow): number {
  const maxX = englobers.dolls.getMaxX(row, englobers.baked);
  return maxX === undefined ? 0 : maxX + RIGHT_MARGIN;
}

/** The solved row as `Doll` reads it: `posB = x`, `posD = x + width`. */
function participantRowOf(participantGeos: readonly ParticipantGeo[]): ParticipantRow {
  return { xs: participantGeos.map((g) => g.x), widths: participantGeos.map((g) => g.width) };
}

/**
 * Box background geometries (Step 4): `dolls.drawEnglobers(ug, body.h +
 * heightEnglober1 + heightEnglober2 / 2, ...)` from the block origin
 * (`SequenceDiagramFileMakerTeoz.java:138-146`). `totalHeight` is that body
 * plus both englober heights plus the top and bottom margins, so the height
 * handed over is `totalHeight - TOP_MARGIN - BOTTOM_MARGIN - heightEnglober2 / 2`.
 * The paint and the placed title are `Doll`'s (`sequence-layout-box.ts`).
 */
function computeBoxGeos(
  englobers: EngloberLayout,
  row: ParticipantRow,
  totalHeight: number,
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
): BoxGeo[] {
  const height = totalHeight - TOP_MARGIN - BOTTOM_MARGIN - englobers.heightEnglober2 / 2;
  return englobers.dolls.drawEnglobers(row, height, TOP_MARGIN).map(({ englober, ...frame }) => {
    const paint = boxPaint(englober);
    return {
      ...frame,
      paint,
      label: englober.label,
      color: englober.color,
      labelRuns: boxLabelRuns(englober.label, frame, paint, measurer, sprites),
    };
  });
}
