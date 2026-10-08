/**
 * Sequence diagram layout — participant column geometry (Step 1 of
 * layoutSequence). Extracted from layout.ts to keep file size and per-function
 * complexity within limits; see layout.ts for the overall pipeline.
 *
 * @see .../sequencediagram/SequenceDiagram.java (upstream lays out
 * participants left-to-right by first-appearance order)
 */

import type { Participant, ParticipantGeo, ParticipantType, SequenceDiagramAST, SequenceEvent } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { ARROW_PADDING_X, arrowFontSpecOf, fontSpecOf, LIVE_DELTA_SIZE, TOP_MARGIN } from './sequence-layout-shared.js';
import { COLLECTIONS_DELTA } from './renderer-participant-symbol.js';
import { symbolPreferredHeight, symbolPreferredWidth } from './sequence-layout-participant-sizing.js';
import { ARROW_DELTA_X } from './sequence-arrowhead.js';
import { displayLines } from './text-block-geo.js';
import {
  anyBadgeFor,
  BADGE_GAP,
  buildLabelRuns,
  labelRows,
  resolveParticipantBackground,
  resolveParticipantBorder,
  visibleStereotypeLines,
  type ParticipantLayoutCtx,
} from './sequence-layout-participant-label.js';
import { sequenceLineWidth } from './sequence-creole.js';

/**
 * The playing space's left border — where the participant row starts, and
 * what `DividerTile#drawU` calls `border1`. Exported because `layout.ts`
 * needs the SAME value to span a divider's band; upstream reads one
 * `tileArguments.getBorder1()` for both.
 *
 * 10, and it is two fives. `TextBlockExporter:173` translates the whole
 * diagram by `(margin.left, margin.top)`, which for a Teoz sequence is
 * `ClockwiseTopRightBottomLeft.same(5)`
 * (`SequenceDiagram#getDefaultMargins:624-628`); inside that,
 * `SequenceDiagramFileMakerTeoz#getTextBlock`'s `drawU` applies its own
 * `new UTranslate(5, 5)` (`:132`) before shifting by `dx(-min1)`, landing the
 * body's leftmost extent at 0 in block coordinates. 5 + 5 = 10, where
 * `jobadi-87-jegi648`'s first box sits, and every other golden's.
 */
export const LEFT_MARGIN = 10;

export interface ParticipantLayoutResult {
  sortedParticipants: Participant[];
  participantGeos: ParticipantGeo[];
  participantMap: Map<string, ParticipantGeo>;
  participantIndex: Map<string, number>;
  maxParticipantHeight: number;
}

/** Compute participant column geometry: x/width/height/centerX for every
 *  participant, sorted into first-appearance order. */
export function computeParticipantLayout(
  ast: SequenceDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
  originX: number = LEFT_MARGIN,
  levels?: MessageLevels,
): ParticipantLayoutResult {
  const sortedParticipants = [...ast.participants].sort((a, b) => a.order - b.order);
  const constraints: SpanConstraint[] = [];
  scanMessageLabels(ast.events, sortedParticipants, { theme, measurer, levels }, constraints);

  const ctx: ParticipantLayoutCtx = { theme, measurer, sprites: ast.sprites };
  const participantWidths = computeParticipantWidths(sortedParticipants, ctx);
  const { participantGeos, participantMap, participantIndex, maxParticipantHeight } = positionParticipants(
    sortedParticipants,
    participantWidths,
    constraints,
    ctx,
    originX,
  );

  return {
    sortedParticipants,
    participantGeos,
    participantMap,
    participantIndex,
    maxParticipantHeight,
  };
}

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
interface SpanConstraint {
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
  readonly theme: Theme;
  readonly measurer: StringMeasurer;
  readonly levels: MessageLevels | undefined;
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
function scanMessageLabels(
  events: readonly SequenceEvent[],
  sortedParticipants: Participant[],
  scan: ScanContext,
  out: SpanConstraint[],
): void {
  const { theme, measurer } = scan;
  const arrowSpec = arrowFontSpecOf(theme);
  for (const ev of events) {
    if (ev.kind === 'message' && ev.from !== ev.to) {
      const fi = sortedParticipants.findIndex((p) => p.id === ev.from);
      const ti = sortedParticipants.findIndex((p) => p.id === ev.to);
      if (fi >= 0 && ti >= 0 && fi !== ti) {
        const lines = ev.label === '' ? [] : displayLines(ev.label);
        const labelWidth =
          lines.length === 0 ? 0 : Math.max(...lines.map((l) => sequenceLineWidth(l, arrowSpec, measurer)));
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
      for (const branch of ev.branches) {
        scanMessageLabels(branch, sortedParticipants, scan, out);
      }
    }
  }
}

/**
 * Pre-compute each participant's column width.
 *
 * A `database` participant is sized by upstream's own rule,
 * `ComponentRoseDatabase#getPreferredWidth` (`:102-105`):
 * `max(stickman.getWidth(), getTextWidth())`, where the stickman is
 * `USymbols.DATABASE.asSmall(null, empty(16,17), empty(0,0), …)` (`:70`) and
 * therefore a fixed 36 wide. It replaced a fitted `DB_MIN_WIDTH = 40`. The
 * two halves must land together: `renderer-participant-shapes.ts` draws the
 * glyph and this reserves the column (`planning/sizer-renderer-parity.md`).
 */
function computeParticipantWidths(sortedParticipants: Participant[], ctx: ParticipantLayoutCtx): number[] {
  const { theme } = ctx;
  const fontSpec = fontSpecOf(theme);
  return sortedParticipants.map((p) => {
    const badge = anyBadgeFor(p, ctx, resolveParticipantBackground(p, theme));
    // A head is a text BLOCK: `getPureTextWidth` is its WIDEST LINE
    // (`AbstractTextualComponent.java:106-108`), never the raw display -- and
    // C4: never the raw LINE either. `SheetBlock1#initMap` maxes `sea
    // .getWidth()` per stripe (`:145-149`), and a stripe's width is its PARSED
    // atoms', so `""MySubTitle""` reserves 70.087 and not the 90.038 its four
    // quotes measure (`jozomu-87-tajo507`, jar box width 84.087).
    const rows = [...visibleStereotypeLines(p, theme), ...displayLines(p.display)];
    const textW = Math.max(...labelRows(rows, fontSpec, ctx).map((r) => r.width));
    // `TextBlockSprited#calculateDimension`: the badge widens the block by its
    // own width plus the 6px gap (`:57-67`).
    const lw = badge === undefined ? textW : textW + badge.width + BADGE_GAP;
    const symbolW = symbolPreferredWidth(p.type, lw, theme);
    if (symbolW !== undefined) return symbolW;
    // `PARTICIPANT_HEAD` / `COLLECTIONS_HEAD` both reach
    // `ComponentRoseParticipant`, differing only by `getDeltaCollection()`
    // (`:114-124`). `getTextWidth = getPureTextWidth + padding.left + padding.right`
    // (`AbstractTextualComponent.java:106-108`) IS the drawn box
    // (`ComponentRoseParticipant#drawInternalU:100-104`), with no floor under
    // it: `getPureTextWidth`'s `max(..., minWidth)` (`:140-142`) takes
    // `minWidth` from `Rose#getMinClassWidth` (`Rose.java:275-278`), whose
    // `PName.MinimumWidth` is in no skin file and resolves to
    // `ValueNull#asDouble()` = 0 (`ValueNull.java:57-59`). Verified on 3570
    // corpus boxes to within 0.0005px (`findings/participant-width.md`).
    const plain = lw + theme.sequence.participantPadding * 2;
    return p.type === 'collections' ? plain + COLLECTIONS_DELTA : plain;
  });
}

/**
 * The gap between a head's painted shape and the bottom of the AREA it
 * reserves — one pixel, and only for the two kinds that reach
 * `ComponentRoseParticipant`.
 *
 * `ComponentRoseParticipant#getPreferredHeight:129-132` is
 * `getTextHeight + margin.top + margin.bottom + deltaShadow + 1 +
 * getDeltaCollection()`, and margin and shadow are both zero for a participant
 * (`findings/participant-width.md` §6), so its reserved area is exactly one
 * pixel taller than the rectangle it paints.
 *
 * Every other head component's `getPreferredHeight` is its glyph plus
 * `getTextHeight`, with no constant term at all — read one at a time:
 * `ComponentRoseActor:89-92`, `ComponentRoseDatabase:96-99`,
 * `ComponentRoseBoundary:90-93`, `ComponentRoseControl:91-94`,
 * `ComponentRoseEntity:91-94`, `ComponentRoseQueue:82-85`. Hence 0 for those.
 */
export function headSlackOf(type: ParticipantType): number {
  return type === 'participant' || type === 'collections' ? 1 : 0;
}

interface ParticipantColumnResult {
  participantGeos: ParticipantGeo[];
  participantMap: Map<string, ParticipantGeo>;
  participantIndex: Map<string, number>;
  maxParticipantHeight: number;
}

/** Lay out participant boxes left-to-right, then bottom-align their headers. */
function positionParticipants(
  sortedParticipants: Participant[],
  participantWidths: number[],
  constraints: readonly SpanConstraint[],
  ctx: ParticipantLayoutCtx,
  originX: number,
): ParticipantColumnResult {
  const { theme } = ctx;
  const participantGeos: ParticipantGeo[] = [];
  const participantMap = new Map<string, ParticipantGeo>();
  const participantIndex = new Map<string, number>();
  const xs = solveParticipantXs(participantWidths, constraints, theme, originX);

  for (let i = 0; i < sortedParticipants.length; i++) {
    const p = sortedParticipants[i]!;
    const geo = buildParticipantGeo(p, participantWidths[i]!, xs[i]!, ctx);

    participantGeos.push(geo);
    participantMap.set(p.id, geo);
    participantIndex.set(p.id, i);
  }

  // Use the tallest reserved head AREA so all lifelines start at the same Y.
  // `LivingSpace#drawHeadOrTail:191-214` draws each head into an `Area` sized
  // by `comp.getPreferredDimension` (`AbstractComponent.java:163-167`), which
  // for a plain participant is one pixel taller than the rectangle
  // `drawInternalU:100-104` paints inside it (`headSlackOf`).
  const areaOf = (g: ParticipantGeo): number => g.height + headSlackOf(g.type);
  const maxParticipantHeight = Math.max(...participantGeos.map(areaOf));
  // Bottom-align the head AREAS, not the boxes: each area ends at
  // `TOP_MARGIN + maxParticipantHeight`, so every lifeline starts there and
  // the box is painted at the TOP of its area with the slack below it --
  // which puts `jobadi-87-jegi648`'s box at [10, 38) with its lifeline at 39.
  // C3: `TOP_MARGIN` is the row's own y, the way `originX` is its own x.
  for (const g of participantGeos) {
    g.y = TOP_MARGIN + maxParticipantHeight - areaOf(g);
    // AFTER the bottom-align, never before: the runs carry an absolute
    // baseline, and `g.y` is what it is measured from.
    g.labelRuns = buildLabelRuns(g, ctx);
  }

  return { participantGeos, participantMap, participantIndex, maxParticipantHeight };
}

/** Build the geometry for a single participant column at a given x offset. */
function buildParticipantGeo(
  p: Participant,
  width: number,
  currentX: number,
  ctx: ParticipantLayoutCtx,
): ParticipantGeo {
  const { theme } = ctx;
  const fontSpec = fontSpecOf(theme);
  const stereoLines = visibleStereotypeLines(p, theme);
  const background = resolveParticipantBackground(p, theme);
  const badge = anyBadgeFor(p, ctx, background);
  // A visible stereotype is a SECOND row above the name
  // (`CommandParticipant.java:174-181`; the jar draws `«APIGateway»` on its
  // own line in `birocu-87-xubi808`), and so is each line the display's own
  // escaped newlines split it into (`:153`) -- `butali-53-kige134`'s head is
  // the jar's 42 tall, not 28. C4: the SUM of those rows' own line boxes, not
  // one line height times a row count -- `SheetBlock1#initMap` accumulates
  // `y += height` per stripe (`:139-142`), and a `=` heading stripe is 18 tall
  // beside its 14pt neighbours (`bugabo-85-veki716`, jar baselines 31/55.889).
  // Identical arithmetic whenever every row shares the ambient font.
  const rows = [...stereoLines, ...displayLines(p.display)];
  const textHeight = labelRows(rows, fontSpec, ctx).reduce((h, r) => h + r.height, 0);
  // `getTextHeight = textBlock.height + padding.top + padding.bottom`
  // (`AbstractTextualComponent.java:110-114`) IS the painted rectangle
  // (`ComponentRoseParticipant#drawInternalU:100-104`), and `Padding 7`
  // expands to all four sides (`plantuml.skin:186-190`) -- the same 14 the
  // width gets, on the other axis. Verified on 2304 corpus boxes, all 28 tall
  // for a one-line label (`findings/participant-height.md`).
  // `TextBlockSprited#calculateDimension` maxes the badge's own height against
  // the block's (`:57-63`); `blockHeight` is that max WITHOUT the plain box's
  // padding allowance, which is what a glyph kind sizes from (it replaced a
  // fitted `DB_HEIGHT = 80` floor).
  const blockHeight = Math.max(textHeight, badge?.height ?? 0);
  const boxHeight = blockHeight + 2 * theme.sequence.participantPadding;
  const pHeight =
    symbolPreferredHeight(p.type, blockHeight, theme) ??
    (p.type === 'collections' ? boxHeight + COLLECTIONS_DELTA : boxHeight);
  const centerX = currentX + width / 2;

  return {
    id: p.id,
    display: p.display,
    background,
    border: resolveParticipantBorder(p, theme),
    ...(stereoLines.length > 0 ? { stereotypeLines: stereoLines } : {}),
    ...(p.url !== undefined ? { url: p.url } : {}),
    ...(badge !== undefined ? { badge } : {}),
    type: p.type,
    x: currentX,
    y: 0,
    // Both `y` and `labelRuns` are filled in by the bottom-align pass in
    // `computeParticipantLayout`: a run carries an ABSOLUTE baseline, and the
    // head's own y is not known until every column's reserved area is.
    labelRuns: [],
    width,
    height: pHeight,
    centerX,
  };
}

/**
 * Solve every participant's x — the port of `xorigin.compileNow()`
 * (`SequenceDiagramFileMakerTeoz.java:110`), and the D6 decision in code.
 *
 * Upstream builds a `Real` constraint graph and solves it globally. This does
 * NOT reimplement `Real`; it exploits the shape of the constraint set upstream
 * actually produces for the participant row, which is entirely
 * `x[j] >= x[i] + c` with `i < j` in participant order, from two sources and
 * only two:
 *
 *   - `LivingSpaces#addConstraints:61-71`, `nextA >= prevE + 10`, always
 *     between neighbours;
 *   - `CommunicationTile#addConstraints:392-416`, one per message, between the
 *     two participants it runs between — adjacent or not. The reverse branch
 *     (`:402-409`) swaps which endpoint is bounded but demands the same
 *     distance, so it too is a left-to-right edge.
 *
 * A system of difference constraints whose edges all point one way along a
 * total order is a DAG longest-path, so a single left-to-right sweep taking
 * the max of the incoming edges is its EXACT minimal solution -- not an
 * approximation of the solver but, for this constraint set, the solver, at
 * O(participants + messages). It replaced a pairwise pre-scan that widened
 * only ADJACENT gaps (`findings/label-widening.md`).
 */
function solveParticipantXs(
  widths: readonly number[],
  constraints: readonly SpanConstraint[],
  theme: Theme,
  originX: number,
): number[] {
  const xs: number[] = [];
  const centre = (i: number): number => xs[i]! + widths[i]! / 2;
  // Incoming edges, bucketed by their higher endpoint, so the sweep reads each
  // constraint exactly once and never looks ahead.
  const incoming = new Map<number, SpanConstraint[]>();
  for (const c of constraints) {
    const bucket = incoming.get(c.to);
    if (bucket === undefined) incoming.set(c.to, [c]);
    else bucket.push(c);
  }

  for (let i = 0; i < widths.length; i++) {
    // `nextA >= prevE + 10`, the neighbour constraint.
    let x = i === 0 ? originX : xs[i - 1]! + widths[i - 1]! + theme.sequence.participantGap;
    for (const c of incoming.get(i) ?? []) {
      // `centre[i] >= centre[c.from] + c.span`, expressed as a left edge.
      const createdHalf = c.createdIndex === undefined ? 0 : widths[c.createdIndex]! / 2;
      x = Math.max(x, centre(c.from) + c.span + createdHalf - widths[i]! / 2);
    }
    xs.push(x);
  }
  return xs;
}
