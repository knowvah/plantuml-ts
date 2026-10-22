/**
 * The participant row's group-frame clearance (sdd2 T3c2) --
 * `GroupingTile#addConstraints` (`teoz/GroupingTile.java:367-373`): the
 * participants either side of a group are pushed clear of its frame, which a
 * child tile alone does not reserve (issue #2788). Split out of
 * `sequence-layout-participant-constraints.ts` (500-line cap); every demand
 * is a {@link SpanConstraint} the same left-to-right sweep solves.
 *
 * Every import here is a leaf: the participant row is laid out before the
 * event walk, and that module may not reach `sequence-layout-events.ts`.
 */
import type { FrameEvent, MessageEvent, NoteEvent, Participant, SequenceEvent } from './ast.js';
import type { LiveLifeEvent } from './sequence-live-boxes.js';
import type { Scan, SpanConstraint } from './sequence-layout-participant-constraints.js';
import { FRAME_EXTERNAL_MARGIN_X2, FRAME_MARGIN_X, groupHeaderWidth } from './sequence-frame-metrics.js';
import { selfDrawnWidth } from './sequence-layout-frame-extent.js';
import { notesOnMessages, type NoteOwner } from './sequence-note-folding.js';
import { LIVE_DELTA_SIZE } from './sequence-layout-shared.js';

/** `MARGINX + EXTERNAL_MARGINX2` (`GroupingTile.java:425,479`): how far a
 *  neighbour stands clear of a group's footprint, grown by the same again per
 *  nesting level (`:512,614`). */
const FRAME_CLEARANCE = FRAME_MARGIN_X + FRAME_EXTERNAL_MARGIN_X2;

/** The literal `16` of `width + 16 - MARGINX - MARGINX - overhang + margin`
 *  (`GroupingTile.java:665`), the header's own `max2` term (`:224`). */
const TITLE_HEADER_MARGIN = 16;

/**
 * A point a tile's edge sits at, relative to one participant: its centre
 * (`posC`) plus `offset`, or -- `edge` -- its box's left edge (`posB`).
 * Margins are not modelled, so `posA` is `posB` (`LivingSpace.java:293-295`).
 */
export interface Reach {
  readonly index: number;
  readonly offset: number;
  readonly edge?: true;
}

/** A group's tiles: its branch events (else tiles carry no x of their own
 *  here) and the notes `TileBuilder` folds into each message's wrappers. */
export interface GroupTiles {
  readonly events: readonly SequenceEvent[];
  readonly folded: ReadonlyMap<NoteOwner, readonly NoteEvent[]>;
}

export function tilesOf(group: Pick<FrameEvent, 'branches'>): GroupTiles {
  const folded = new Map<NoteOwner, NoteEvent[]>();
  for (const branch of group.branches) for (const [owner, notes] of notesOnMessages(branch)) folded.set(owner, notes);
  return { events: group.branches.flat(), folded };
}

export function indexOf(sorted: readonly Participant[], id: string): number {
  return sorted.findIndex((p) => p.id === id);
}

/**
 * `collectTouchedLivingSpaces` (`GroupingTile.java:725-760`): the participants
 * a group's tiles touch, nested groups included -- a message's two, an exo
 * message's one, a life event's, a note's (all of them for a note on none,
 * `:691-700`) and a reference's. A note on a message is no event of its own.
 */
export function touchedOf(
  events: readonly SequenceEvent[],
  sorted: readonly Participant[],
  touched: Set<number>,
): void {
  const add = (id: string): void => {
    const i = indexOf(sorted, id);
    if (i >= 0) touched.add(i);
  };
  for (const ev of events) {
    if (ev.kind === 'message') [ev.from, ev.to].forEach(add);
    else if (ev.kind === 'messageExo') add(ev.participant);
    else if (ev.kind === 'activate' || ev.kind === 'deactivate') add(ev.participantId);
    else if (ev.kind === 'note' && ev.onMessage !== true) noteTouched(ev, add);
    else if (ev.kind === 'frame') frameTouched(ev, sorted, touched, add);
  }
}

function noteTouched(note: NoteEvent, add: (id: string) => void): void {
  // A note on no participant touches all of them (`:691-700`); the port's
  // `note across` already lists every participant (`command-note-factory.ts`).
  note.participants.forEach(add);
}

function frameTouched(
  frame: FrameEvent,
  sorted: readonly Participant[],
  touched: Set<number>,
  add: (id: string) => void,
): void {
  if (frame.frameType === 'ref') (frame.participants ?? []).forEach(add);
  else touchedOf(frame.branches.flat(), sorted, touched);
}

/** The outermost tile class a message builds (`TileBuilder.java:86-122`): the
 *  wrapper of its LAST folded note, else the message tile itself. */
export function wrapperOf(owner: NoteOwner, tiles: GroupTiles): 'left' | 'right' | 'topBottom' | undefined {
  const last = tiles.folded.get(owner)?.at(-1);
  if (last === undefined) return undefined;
  return last.position === 'over' ? 'topBottom' : last.position;
}

/**
 * `LifeEventTile#getMinX`/`#getMaxX` (`:143-158`) as reaches: `posC - 5` when
 * live, `posC + level * 5`, the level `getLevelAt(this, IGNORE_FUTURE_ACTIVATE)`.
 */
export function lifeReach(
  life: LiveLifeEvent,
  side: 'min' | 'max',
  sorted: readonly Participant[],
  scan: Scan,
): Reach[] {
  const index = indexOf(sorted, life.participant);
  const boxes = scan.boxes.get(life.participant);
  if (index < 0 || boxes === undefined) return [];
  const level = boxes.getLevelAt(life, 'IGNORE_FUTURE_ACTIVATE');
  if (side === 'max') return [{ index, offset: level * LIVE_DELTA_SIZE }];
  return [{ index, offset: level > 0 ? -LIVE_DELTA_SIZE : 0 }];
}

/** The `LifeEventTile`s a message brings: its own `++`/`--`/`!!`
 *  (`SequenceDiagram.java:367-373`) and a `**`'s CREATE, level 0 on the
 *  created lifeline (`CommandArrow.java:397-398`). */
export function messageLifeReaches(
  ev: MessageEvent,
  side: 'min' | 'max',
  sorted: readonly Participant[],
  scan: Scan,
): Reach[] {
  // `ownOf` holds every message of the scanned list (`sequence-live-events.ts`).
  const own = scan.live.ownOf.get(ev)!.flatMap((life) => lifeReach(life, side, sorted, scan));
  const created = ev.create === true ? indexOf(sorted, ev.to) : -1;
  return created < 0 ? own : [...own, { index: created, offset: 0 }];
}

/**
 * `stableMaxX` (`GroupingTile.java:538-555`) for one event's tiles: the
 * whitelisted kinds whose right edge is a plain offset from a lifeline. A
 * bare self message's `getDrawnMaxX` (`CommunicationTileSelf.java:303-307`),
 * each `LifeEventTile`'s. A `NoteTile`, a `ReferenceTile`, a `DividerTile`
 * and the right-note wrappers are whitelisted too but not reachable here
 * (hand-back: note widths, `posD`, the x origin).
 */
function rightReaches(ev: SequenceEvent, tiles: GroupTiles, sorted: readonly Participant[], scan: Scan): Reach[] {
  if (ev.kind === 'activate' || ev.kind === 'deactivate') {
    const life = scan.live.ofSource.get(ev);
    return life?.kind === 'life' ? lifeReach(life, 'max', sorted, scan) : [];
  }
  if (ev.kind !== 'message') return [];
  const lives = messageLifeReaches(ev, 'max', sorted, scan);
  const index = indexOf(sorted, ev.from);
  if (ev.from !== ev.to || index < 0 || wrapperOf(ev, tiles) !== undefined) return lives;
  // Forward: `posC2 + getDrawnWidth`; reverse: `getMaxX`, `posC2` (`:304-305`).
  const loop = ev.arrow.reverseDefine === true ? 0 : selfDrawnWidth(ev, scan);
  // `index` was found in the row, and every row participant has a max position.
  return [...lives, { index, offset: scan.maxPosition.get(ev.from)! + loop }];
}

/**
 * `stableMinX` (`GroupingTile.java:577-590`) for one event's tiles: a bare
 * self message's `getDrawnMinX` (`CommunicationTileSelf.java:293-300`) --
 * `posC`, or for a reverse loop `posC - getDrawnWidth - adjustment` -- each
 * `LifeEventTile`'s, and a `ReferenceTile`'s `first`, its leftmost
 * participant's `posB` (`ReferenceTile.java:163-171`). Note widths are not
 * reachable here (hand-back).
 */
function leftReaches(ev: SequenceEvent, tiles: GroupTiles, sorted: readonly Participant[], scan: Scan): Reach[] {
  if (ev.kind === 'activate' || ev.kind === 'deactivate') {
    const life = scan.live.ofSource.get(ev);
    return life?.kind === 'life' ? lifeReach(life, 'min', sorted, scan) : [];
  }
  if (ev.kind === 'frame' && ev.frameType === 'ref') return refLeftReach(ev, sorted);
  if (ev.kind !== 'message') return [];
  const lives = messageLifeReaches(ev, 'min', sorted, scan);
  const index = indexOf(sorted, ev.from);
  if (ev.from !== ev.to || index < 0 || wrapperOf(ev, tiles) !== undefined) return lives;
  return [...lives, { index, offset: -reverseLoopReach(ev, scan) }];
}

/** How far left of `posC` a self loop's drawn extent starts: 0 forward;
 *  reverse, `getDrawnWidth + (getLevelAt(this, IGNORE_FUTURE_ACTIVATE) > 0 ?
 *  LIVE_DELTA_SIZE : 0)` (`CommunicationTileSelf.java:294-298`). */
function reverseLoopReach(ev: MessageEvent, scan: Scan): number {
  if (ev.arrow.reverseDefine !== true) return 0;
  const message = scan.live.ofSource.get(ev);
  const level =
    message === undefined ? 0 : (scan.boxes.get(ev.from)?.getLevelAt(message, 'IGNORE_FUTURE_ACTIVATE') ?? 0);
  return selfDrawnWidth(ev, scan) + (level > 0 ? LIVE_DELTA_SIZE : 0);
}

function refLeftReach(ev: FrameEvent, sorted: readonly Participant[]): Reach[] {
  const indices = (ev.participants ?? []).map((id) => indexOf(sorted, id)).filter((i) => i >= 0);
  return indices.length === 0 ? [] : [{ index: Math.min(...indices), offset: 0, edge: true }];
}

/** Every group's clearance, nested ones through their own `scanFrame`. */
export function groupClearance(group: FrameEvent, sorted: Participant[], scan: Scan): SpanConstraint[] {
  if (group.frameType === 'ref') return [];
  const touched = new Set<number>();
  touchedOf(group.branches.flat(), sorted, touched);
  if (touched.size === 0) return [];
  return [
    ...followingClearance(group, Math.max(...touched), sorted, scan),
    ...precedingClearance(group, Math.min(...touched), sorted, scan),
  ];
}

/**
 * `ensureFollowingParticipantClearsFrame` (`GroupingTile.java:411-440`): the
 * participant after the rightmost one touched has its `posA` pushed
 * `MARGINX + EXTERNAL_MARGINX2` past that one's `posC`, and past every right
 * edge the frame is built on (`ensureClearsFrameOf`, `:602-620`). Each push is
 * a left-edge demand: `posB[next] >= reach + margin`, which the solver reads
 * as a centre demand plus `next`'s half width ({@link SpanConstraint.createdIndex}
 * is exactly "the `to` end is its `posB`").
 */
function followingClearance(group: FrameEvent, rightmost: number, sorted: Participant[], scan: Scan): SpanConstraint[] {
  const next = rightmost + 1;
  if (next >= sorted.length) return [];
  const reaches: { reach: Reach; margin: number }[] = [
    { reach: { index: rightmost, offset: 0 }, margin: FRAME_CLEARANCE },
  ];
  clearsFrameOf(group, FRAME_CLEARANCE, { sorted, scan, reaches });
  return reaches.map(({ reach, margin }) => ({
    from: reach.index,
    to: next,
    span: reach.offset + margin,
    createdIndex: next,
  }));
}

interface ReachSink {
  readonly sorted: Participant[];
  readonly scan: Scan;
  readonly reaches: { reach: Reach; margin: number }[];
}

/** `ensureClearsFrameOf` (`:602-620`): the title, each tile's right edges,
 *  and each nested group with the margin grown by its own frame (`:614`). */
function clearsFrameOf(group: FrameEvent, margin: number, sink: ReachSink): void {
  clearsTitleOf(group, margin, sink);
  const tiles = tilesOf(group);
  for (const ev of tiles.events) {
    if (ev.kind === 'frame' && ev.frameType !== 'ref') clearsFrameOf(ev, margin + FRAME_CLEARANCE, sink);
    else for (const reach of rightReaches(ev, tiles, sink.sorted, sink.scan)) sink.reaches.push({ reach, margin });
  }
}

/**
 * `ensureClearsTitleOf` (`:637-666`): `posC` of the group's leftmost touched
 * participant plus `width + 16 - MARGINX - MARGINX - overhang + margin`, the
 * header component's width. `overhang` is a left/over note's on that lifeline
 * (`:658-661`); note widths are not reachable here, so it is 0 (hand-back).
 */
function clearsTitleOf(group: FrameEvent, margin: number, sink: ReachSink): void {
  const touched = new Set<number>();
  touchedOf(group.branches.flat(), sink.sorted, touched);
  if (touched.size === 0) return;
  const width = groupHeaderWidth(group, sink.scan);
  const offset = width + TITLE_HEADER_MARGIN - 2 * FRAME_MARGIN_X;
  sink.reaches.push({ reach: { index: Math.min(...touched), offset }, margin });
}

/**
 * `ensurePrecedingParticipantClearsFrame` (`GroupingTile.java:465-490`): the
 * leftmost touched participant's `posC` clears the previous one's by
 * `MARGINX + EXTERNAL_MARGINX2`, and so does every left edge the frame is
 * built on (`ensureClearsFrameOfLeft`, `:507-518`) -- each pushed right of
 * `previous.posC + margin`.
 */
function precedingClearance(group: FrameEvent, leftmost: number, sorted: Participant[], scan: Scan): SpanConstraint[] {
  const previous = leftmost - 1;
  if (previous < 0) return [];
  const reaches: { reach: Reach; margin: number }[] = [
    { reach: { index: leftmost, offset: 0 }, margin: FRAME_CLEARANCE },
  ];
  clearsFrameOfLeft(group, FRAME_CLEARANCE, { sorted, scan, reaches });
  return reaches.map(({ reach, margin }) => ({
    from: previous,
    to: reach.index,
    span: margin - reach.offset,
    ...(reach.edge === true ? { createdIndex: reach.index } : {}),
  }));
}

/** `ensureClearsFrameOfLeft` (`:507-518`): each tile's left edges, each
 *  nested group with the margin grown by its own frame (`:512`). */
function clearsFrameOfLeft(group: FrameEvent, margin: number, sink: ReachSink): void {
  const tiles = tilesOf(group);
  for (const ev of tiles.events) {
    if (ev.kind === 'frame' && ev.frameType !== 'ref') clearsFrameOfLeft(ev, margin + FRAME_CLEARANCE, sink);
    else for (const reach of leftReaches(ev, tiles, sink.sorted, sink.scan)) sink.reaches.push({ reach, margin });
  }
}
