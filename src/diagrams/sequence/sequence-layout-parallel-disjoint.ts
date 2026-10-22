/**
 * `PlayingSpace#addParallelSiblingDisjointConstraints` (sdd2 T3c2,
 * `teoz/PlayingSpace.java:162-292`): a top-level `&` tile and every tile of
 * its cluster are pushed apart in x -- whichever starts further right clears
 * the other's whole footprint, `bMin.ensureBiggerThan(aMax)`. A `& group`
 * beside another group is the case that moves participants (`codeti-52`).
 *
 * The footprints are `getMinX`/`getMaxX`: `RealMin`/`RealMax` over candidate
 * points. `ensureBiggerThan` on a `RealMin` pushes every candidate
 * (`RealMin.java:81-85`), and a lower bound of `RealMax` is a lower bound of
 * each candidate, so one footprint pair becomes one {@link SpanConstraint}
 * per candidate pair. Split out of `sequence-layout-group-clearance.ts`
 * (500-line cap); every import is a leaf, as there.
 */
import type { FrameEvent, MessageEvent, MessageExoEvent, Participant, SequenceEvent } from './ast.js';
import type { Scan, SpanConstraint } from './sequence-layout-participant-constraints.js';
import {
  elseComponentWidth,
  elsePaint,
  FRAME_EXTERNAL_MARGIN_X1,
  FRAME_EXTERNAL_MARGIN_X2,
  FRAME_MARGIN_X,
  groupHeaderWidth,
} from './sequence-frame-metrics.js';
import { selfDrawnWidth } from './sequence-layout-frame-extent.js';
import { messagePaint } from './sequence-arrow-paint.js';
import { ARROW_DELTA_X } from './sequence-arrowhead.js';
import { ARROW_PADDING_X, LIVE_DELTA_SIZE } from './sequence-layout-shared.js';
import { selfCompWidth } from './sequence-note-anchor.js';
import { messageLabelWidth, numberTextOf } from './text-block-geo.js';
import {
  indexOf,
  lifeReach,
  messageLifeReaches,
  tilesOf,
  wrapperOf,
  type GroupTiles,
  type Reach,
} from './sequence-layout-group-clearance.js';

/** The literal `16` of `max2.add(this.min.addFixed(width + 16))`
 *  (`GroupingTile.java:224`). */
const HEADER_MARGIN = 16;

/** A point relative to one participant: its `posB`, `posC` or `posD`, plus
 *  `offset`. */
interface Anchor {
  readonly index: number;
  readonly offset: number;
  readonly at: 'B' | 'C' | 'D';
}

/** A footprint's candidates: `getMinX` is the least of `mins`, `getMaxX` the
 *  greatest of `maxs`. `undefined` where a candidate is not reachable from the
 *  participant row (a note's width, the x origin, a delay's middle). */
interface Footprint {
  readonly mins: readonly Anchor[] | undefined;
  readonly maxs: readonly Anchor[] | undefined;
}

const UNREACHABLE: Footprint = { mins: undefined, maxs: undefined };

function anchorOf(reach: Reach): Anchor {
  return { index: reach.index, offset: reach.offset, at: reach.edge === true ? 'B' : 'C' };
}

function shift(anchors: readonly Anchor[] | undefined, by: number): Anchor[] | undefined {
  return anchors?.map((a) => ({ ...a, offset: a.offset + by }));
}

/** The arrow component's preferred width, `getTextWidth + getArrowDeltaX`
 *  (`ComponentRoseArrow.java:347-349`). */
function arrowWidth(ev: MessageEvent | MessageExoEvent, scan: Scan): number {
  const font = messagePaint(ev.styleBuilder, ev.stereotype, ev.arrow, false).font;
  return messageLabelWidth(ev.label, numberTextOf(ev), font, scan) + 2 * ARROW_PADDING_X + ARROW_DELTA_X;
}

/**
 * `CommunicationTile#getMinX`/`#getMaxX` (`:445-460`): `point1` is `posC` of
 * the sender, `point2` `posC` of the receiver -- `posB`, or reversed `posD`,
 * of a created head (`:435-443`); the max is the right point or the left one
 * plus the arrow width.
 */
function messageFootprint(ev: MessageEvent, from: number, to: number, scan: Scan): Footprint {
  const reverse = from > to;
  const point1: Anchor = { index: from, offset: 0, at: 'C' };
  const point2: Anchor = { index: to, offset: 0, at: ev.create === true ? (reverse ? 'D' : 'B') : 'C' };
  const [left, right] = reverse ? [point2, point1] : [point1, point2];
  return { mins: [left], maxs: [right, { ...left, offset: left.offset + arrowWidth(ev, scan) }] };
}

/**
 * `CommunicationTileSelf#getMinX`/`#getMaxX` (`:263-277`) or, `drawn`, the
 * drawn extent (`:293-307`): `posC` to `posC2 + width` forward; `posC - width
 * - adjustment` to `posC2` reverse, `width` the component's `getCompWidth` or
 * `getDrawnWidth`.
 */
function selfFootprint(ev: MessageEvent, index: number, scan: Scan, drawn: boolean): Footprint {
  const width = drawn ? selfDrawnWidth(ev, scan) : selfCompWidth(ev, scan);
  // `index` was found in the row, and every row participant has a max position.
  const posC2 = scan.maxPosition.get(ev.from)!;
  if (ev.arrow.reverseDefine !== true) {
    return { mins: [{ index, offset: 0, at: 'C' }], maxs: [{ index, offset: posC2 + width, at: 'C' }] };
  }
  const live = scan.live.ofSource.get(ev);
  const level = live === undefined ? 0 : (scan.boxes.get(ev.from)?.getLevelAt(live, 'IGNORE_FUTURE_ACTIVATE') ?? 0);
  const adjust = level > 0 ? LIVE_DELTA_SIZE : 0;
  return { mins: [{ index, offset: -width - adjust, at: 'C' }], maxs: [{ index, offset: posC2, at: 'C' }] };
}

/**
 * A message's outermost tile (`TileBuilder.java:86-122`): the wrapper of its
 * last folded note keeps the inner tile's min (`NoteRight`, `NoteTop`/
 * `Bottom`) or max (`NoteLeft`) and reaches a note's width on the other side,
 * which the participant row cannot measure.
 */
function wrappedFootprint(inner: Footprint, wrapper: ReturnType<typeof wrapperOf>): Footprint {
  if (wrapper === undefined) return inner;
  return wrapper === 'left' ? { mins: undefined, maxs: inner.maxs } : { mins: inner.mins, maxs: undefined };
}

function messageTile(ev: MessageEvent, tiles: GroupTiles, sorted: readonly Participant[], scan: Scan, drawn: boolean) {
  const from = indexOf(sorted, ev.from);
  const to = indexOf(sorted, ev.to);
  if (from < 0 || to < 0) return undefined;
  const inner = from === to ? selfFootprint(ev, from, scan, drawn) : messageFootprint(ev, from, to, scan);
  return wrappedFootprint(inner, wrapperOf(ev, tiles));
}

/** `CommunicationExoTile#getMinX`/`#getMaxX` (`:206-240`). */
function exoTile(ev: MessageExoEvent, tiles: GroupTiles, sorted: readonly Participant[], scan: Scan) {
  const index = indexOf(sorted, ev.participant);
  if (index < 0) return undefined;
  const width = arrowWidth(ev, scan);
  const right = ev.exoType === 'FROM_RIGHT' || ev.exoType === 'TO_RIGHT';
  const inner: Footprint = right
    ? { mins: [{ index, offset: 0, at: 'C' }], maxs: [{ index, offset: width, at: 'C' }] }
    : { mins: [{ index, offset: -width, at: 'C' }], maxs: [{ index, offset: 0, at: 'C' }] };
  return wrappedFootprint(inner, wrapperOf(ev, tiles));
}

/** `ReferenceTile#getMinX`/`#getMaxX` (`:163-180`): `first`, the leftmost
 *  participant's `posB`, and `last`, the rightmost's `posD`. */
function refTile(ev: FrameEvent, sorted: readonly Participant[]): Footprint {
  const indices = (ev.participants ?? []).map((id) => indexOf(sorted, id)).filter((i) => i >= 0);
  if (indices.length === 0) return UNREACHABLE;
  return {
    mins: [{ index: Math.min(...indices), offset: 0, at: 'B' }],
    maxs: [{ index: Math.max(...indices), offset: 0, at: 'D' }],
  };
}

/** No candidate at all: a tile skipped for an unknown participant. */
const EMPTY: Footprint = { mins: [], maxs: [] };

/** A message's tile and the `LifeEventTile`s it brings
 *  (`messageLifeReaches`). */
function messageChild(ev: MessageEvent, tiles: GroupTiles, sorted: readonly Participant[], scan: Scan): Footprint[] {
  const lives = (side: 'min' | 'max'): Anchor[] => messageLifeReaches(ev, side, sorted, scan).map(anchorOf);
  return [messageTile(ev, tiles, sorted, scan, true) ?? EMPTY, { mins: lives('min'), maxs: lives('max') }];
}

/** An `activate`/`deactivate`'s `LifeEventTile`. */
function lifeChild(ev: SequenceEvent, sorted: readonly Participant[], scan: Scan): Footprint[] {
  const live = scan.live.ofSource.get(ev);
  if (live?.kind !== 'life') return [];
  const reach = (side: 'min' | 'max'): Anchor[] => lifeReach(live, side, sorted, scan).map(anchorOf);
  return [{ mins: reach('min'), maxs: reach('max') }];
}

/** A standalone note's width, a divider's or newpage's x origin and a
 *  delay's middle are out of the row's reach; a note on a message is its
 *  wrapper's, and a `|||` counts for nothing (`GroupingTile.java:202-203`). */
function otherChild(ev: SequenceEvent): Footprint[] {
  if (ev.kind === 'space' || (ev.kind === 'note' && ev.onMessage === true)) return [];
  return [UNREACHABLE];
}

/** The footprints `event` contributes as a child of a group, drawn
 *  (`Tile#getDrawnMinX`/`#getDrawnMaxX`, `GroupingTile.java:211-214`). An
 *  else tile carries none (`:188-193`). */
function childFootprints(
  ev: SequenceEvent,
  tiles: GroupTiles,
  sorted: readonly Participant[],
  scan: Scan,
): Footprint[] {
  switch (ev.kind) {
    case 'message':
      return messageChild(ev, tiles, sorted, scan);
    case 'messageExo':
      return [exoTile(ev, tiles, sorted, scan) ?? EMPTY];
    case 'activate':
    case 'deactivate':
      return lifeChild(ev, sorted, scan);
    case 'frame':
      return [ev.frameType === 'ref' ? refTile(ev, sorted) : groupTile(ev, sorted, scan)];
    default:
      return otherChild(ev);
  }
}

/**
 * The least of `anchors`, as `RealMin` resolves it. Participants are placed
 * left to right in index order and every candidate here sits within its own
 * participant's column, so the lowest index wins; within one participant,
 * `posB` before `posC` before `posD`, then the offset.
 */
function leastOf(anchors: readonly Anchor[]): Anchor {
  const rank = { B: 0, C: 1, D: 2 } as const;
  return [...anchors].sort((a, b) => a.index - b.index || rank[a.at] - rank[b.at] || a.offset - b.offset)[0]!;
}

/** Every candidate of every child, or `undefined` once one is unreachable. */
function gather(footprints: readonly Footprint[], side: 'mins' | 'maxs'): Anchor[] | undefined {
  const all: Anchor[] = [];
  for (const f of footprints) {
    const anchors = f[side];
    if (anchors === undefined) return undefined;
    all.push(...anchors);
  }
  return all;
}

/**
 * A group's `getMinX`/`getMaxX` (`GroupingTile.java:984-990`) over its frame
 * (`:207-225`): each child's drawn min less `MARGINX`, its drawn max plus;
 * each else tile's `getMaxX`, `min - EXTERNAL_MARGINX1 + width`
 * (`ElseTile.java:153-161`); `min + headerWidth + 16`. An empty group starts
 * at the x origin (`:217-218`), which the row cannot reach.
 */
function groupTile(group: FrameEvent, sorted: readonly Participant[], scan: Scan): Footprint {
  const tiles = tilesOf(group);
  const children = tiles.events.flatMap((ev) => childFootprints(ev, tiles, sorted, scan));
  const mins = shift(gather(children, 'mins'), -FRAME_MARGIN_X);
  if (mins === undefined || mins.length === 0) return UNREACHABLE;
  const min = leastOf(mins);
  const elses = group.branchLabels
    .slice(1)
    .map((label, i) => elseComponentWidth(label, elsePaint(group, i + 1), scan))
    .map((w) => ({ ...min, offset: min.offset - FRAME_EXTERNAL_MARGIN_X1 + w }));
  const header = { ...min, offset: min.offset + groupHeaderWidth(group, scan) + HEADER_MARGIN };
  const maxs = shift(gather(children, 'maxs'), FRAME_MARGIN_X);
  return {
    mins: shift(mins, -FRAME_EXTERNAL_MARGIN_X1),
    maxs: maxs === undefined ? undefined : shift([...maxs, ...elses, header], FRAME_EXTERNAL_MARGIN_X2),
  };
}

/** A top-level tile's `getMinX`/`getMaxX` (not drawn): the footprint
 *  `ensureDisjoint` compares (`PlayingSpace.java:240-243`). */
function tileFootprint(ev: SequenceEvent, tiles: GroupTiles, sorted: readonly Participant[], scan: Scan): Footprint {
  if (ev.kind === 'message') return messageTile(ev, tiles, sorted, scan, false) ?? UNREACHABLE;
  if (ev.kind === 'messageExo') return exoTile(ev, tiles, sorted, scan) ?? UNREACHABLE;
  if (ev.kind === 'frame' && ev.frameType !== 'ref') return groupTile(ev, sorted, scan);
  return UNREACHABLE;
}

/**
 * `findAnchorLivingSpace` (`PlayingSpace.java:281-298`): a message's
 * participant1, an exo message's participant, a group's first child that has
 * one; anything else has none.
 */
function anchorIndexOf(ev: SequenceEvent, sorted: readonly Participant[]): number | undefined {
  if (ev.kind === 'message') return indexOrUndefined(sorted, ev.from);
  if (ev.kind === 'messageExo') return indexOrUndefined(sorted, ev.participant);
  if (ev.kind !== 'frame' || ev.frameType === 'ref') return undefined;
  for (const child of ev.branches.flat()) {
    const found = anchorIndexOf(child, sorted);
    if (found !== undefined) return found;
  }
  return undefined;
}

function indexOrUndefined(sorted: readonly Participant[], id: string): number | undefined {
  const index = indexOf(sorted, id);
  return index < 0 ? undefined : index;
}

/** `GroupingTile.isParallel` (`:1150-1152`), `tile.getEvent().isParallel()`:
 *  a `Notes` merge never is (`NotesTile.java:84-91`). */
function isParallel(ev: SequenceEvent): boolean {
  if (ev.kind === 'note') return ev.parallel === true && ev.vmerge !== true;
  if (ev.kind === 'frame') return ev.frameType !== 'ref' && ev.parallel === true;
  return (ev.kind === 'message' || ev.kind === 'messageExo') && ev.parallel === true;
}

/**
 * `lower >= upper`, one candidate pair: `lower` at `posC` or `posB` (the
 * solver's {@link SpanConstraint.createdIndex}, "the `to` end is its `posB`"),
 * `upper` at `posC`, on a participant to its left -- the only shape the
 * left-to-right sweep solves. Any other pair is left out (hand-back).
 */
function pairConstraint(lower: Anchor, upper: Anchor): SpanConstraint | undefined {
  if (lower.at === 'D' || upper.at !== 'C' || upper.index >= lower.index) return undefined;
  const span = upper.offset - lower.offset;
  return { from: upper.index, to: lower.index, span, ...(lower.at === 'B' ? { createdIndex: lower.index } : {}) };
}

/**
 * `ensureDisjoint(a, b)` (`PlayingSpace.java:240-266`): two tiles anchored on
 * the same participant are skipped; otherwise, by declaration order of the
 * anchors, the right one's `getMinX` is pushed past the left one's `getMaxX`.
 */
function disjoint(a: SequenceEvent, b: SequenceEvent, ctx: DisjointContext): SpanConstraint[] {
  const aAnchor = anchorIndexOf(a, ctx.sorted);
  const bAnchor = anchorIndexOf(b, ctx.sorted);
  if (aAnchor === undefined || bAnchor === undefined || aAnchor === bAnchor) return [];
  const [left, right] = aAnchor <= bAnchor ? [a, b] : [b, a];
  const lows = tileFootprint(right, ctx.tiles, ctx.sorted, ctx.scan).mins ?? [];
  const highs = tileFootprint(left, ctx.tiles, ctx.sorted, ctx.scan).maxs ?? [];
  return lows.flatMap((low) => highs.flatMap((high) => pairConstraint(low, high) ?? []));
}

interface DisjointContext {
  readonly tiles: GroupTiles;
  readonly sorted: readonly Participant[];
  readonly scan: Scan;
}

/**
 * `addParallelSiblingDisjointConstraints` (`PlayingSpace.java:188-202`) over
 * the diagram's top-level tiles: a `&` tile is kept disjoint from every tile
 * of the run it joins; any other tile starts a new run. A note on a message
 * is its message's wrapper, not a tile.
 */
export function parallelDisjoint(
  events: readonly SequenceEvent[],
  sorted: readonly Participant[],
  scan: Scan,
): SpanConstraint[] {
  const ctx: DisjointContext = { tiles: tilesOf({ branches: [[...events]] }), sorted, scan };
  const out: SpanConstraint[] = [];
  let cluster: SequenceEvent[] = [];
  for (const ev of events) {
    if (ev.kind === 'note' && ev.onMessage === true) continue;
    if (isParallel(ev)) for (const other of cluster) out.push(...disjoint(other, ev, ctx));
    cluster = closesRun(ev, scan) ? [] : isParallel(ev) ? [...cluster, ev] : [ev];
  }
  return out;
}

/** A message's own `++`/`--`/`!!` are `LifeEventTile`s right after its tile
 *  (`SequenceDiagram.java:367-373`): not `&`, so they close the run, and they
 *  have no anchor (`PlayingSpace.java:281-298`), so the run they open is
 *  never compared. */
function closesRun(ev: SequenceEvent, scan: Scan): boolean {
  // `ownOf` holds every message of the scanned list (`sequence-live-events.ts`).
  return ev.kind === 'message' && scan.live.ownOf.get(ev)!.length > 0;
}
