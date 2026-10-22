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
import type { FrameEvent, MessageEvent, MessageExoEvent, NoteEvent, Participant, SequenceEvent } from './ast.js';
import type { LiveLifeEvent } from './sequence-live-boxes.js';
import type { Scan, SpanConstraint } from './sequence-layout-participant-constraints.js';
import { FRAME_EXTERNAL_MARGIN_X2, FRAME_MARGIN_X, groupHeaderWidth } from './sequence-frame-metrics.js';
import { selfDrawnWidth } from './sequence-layout-frame-extent.js';
import { notesOnMessages, type NoteOwner } from './sequence-note-folding.js';
import { noteComponentWidth, noteLevel, noteTiles } from './sequence-note-width.js';
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
  /** The standalone notes that are a `NoteTile` -- not a member of a `Notes`
   *  group, which `GroupingTile#stableMaxX` does not whitelist. */
  readonly singles: ReadonlySet<NoteEvent>;
  /** A nested group's `end` leaf's notes (`GroupingTile#getNoteComponents`,
   *  `:1023-1041`), which its parent's frame is stretched past. */
  readonly endNotes: ReadonlyMap<FrameEvent, readonly NoteEvent[]>;
}

/**
 * The notes written after a group's `end` (`getLastEventWithNote`,
 * `SequenceDiagram.java:154-158`): the notes on a message that follow it up to
 * the next message, group or `ref` -- an `EventWithNote` that takes them.
 */
function endNotesOf(branch: readonly SequenceEvent[], start: number): NoteEvent[] {
  const notes: NoteEvent[] = [];
  for (const ev of branch.slice(start + 1)) {
    if (ev.kind === 'message' || ev.kind === 'messageExo' || ev.kind === 'frame') break;
    if (ev.kind === 'note' && ev.onMessage === true) notes.push(ev);
  }
  return notes;
}

export function tilesOf(group: Pick<FrameEvent, 'branches'>): GroupTiles {
  const folded = new Map<NoteOwner, NoteEvent[]>();
  const singles = new Set<NoteEvent>();
  const endNotes = new Map<FrameEvent, NoteEvent[]>();
  for (const branch of group.branches) {
    for (const [owner, notes] of notesOnMessages(branch)) folded.set(owner, notes);
    for (const tile of noteTiles(branch)) if (tile.length === 1) singles.add(tile[0]!);
    branch.forEach((ev, i) => {
      if (ev.kind === 'frame' && ev.frameType !== 'ref') endNotes.set(ev, endNotesOf(branch, i));
    });
  }
  return { events: group.branches.flat(), folded, singles, endNotes };
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

type Side = 'min' | 'max';

/**
 * `stableMaxX` (`GroupingTile.java:538-555`) for one event's tiles: the
 * whitelisted kinds whose right edge is a plain offset from a lifeline. A
 * bare self message's `getDrawnMaxX` (`CommunicationTileSelf.java:303-307`),
 * each `LifeEventTile`'s, a `NoteTile`'s ({@link noteTileReach}) and the
 * right-note wrappers' ({@link wrapperReach}). A `ReferenceTile` and a
 * `DividerTile` are whitelisted too but not reachable here (hand-back:
 * `posD`, the x origin).
 */
function rightReaches(ev: SequenceEvent, tiles: GroupTiles, sorted: readonly Participant[], scan: Scan): Reach[] {
  return reachesOf(ev, 'max', tiles, sorted, scan);
}

/**
 * `stableMinX` (`GroupingTile.java:577-590`) for one event's tiles: a bare
 * self message's `getDrawnMinX` (`CommunicationTileSelf.java:293-300`) --
 * `posC`, or for a reverse loop `posC - getDrawnWidth - adjustment` -- each
 * `LifeEventTile`'s, a `NoteTile`'s and the left-note wrappers' (`getMinX`),
 * and a `ReferenceTile`'s `first`, its leftmost participant's `posB`
 * (`ReferenceTile.java:163-171`).
 */
function leftReaches(ev: SequenceEvent, tiles: GroupTiles, sorted: readonly Participant[], scan: Scan): Reach[] {
  if (ev.kind === 'frame' && ev.frameType === 'ref') return refLeftReach(ev, sorted);
  return reachesOf(ev, 'min', tiles, sorted, scan);
}

function reachesOf(
  ev: SequenceEvent,
  side: Side,
  tiles: GroupTiles,
  sorted: readonly Participant[],
  scan: Scan,
): Reach[] {
  if (ev.kind === 'activate' || ev.kind === 'deactivate') {
    const life = scan.live.ofSource.get(ev);
    return life?.kind === 'life' ? lifeReach(life, side, sorted, scan) : [];
  }
  if (ev.kind === 'note') return tiles.singles.has(ev) ? noteTileReach(ev, side, sorted, scan) : [];
  if (ev.kind === 'messageExo') return wrapperReach(ev, side, tiles, sorted, scan);
  return ev.kind === 'message' ? messageReaches(ev, side, tiles, sorted, scan) : [];
}

function messageReaches(ev: MessageEvent, side: Side, tiles: GroupTiles, sorted: readonly Participant[], scan: Scan) {
  const lives = messageLifeReaches(ev, side, sorted, scan);
  const index = indexOf(sorted, ev.from);
  if (ev.from !== ev.to || index < 0 || wrapperOf(ev, tiles) !== undefined)
    return [...lives, ...wrapperReach(ev, side, tiles, sorted, scan)];
  return [...lives, { index, offset: selfLoopOffset(ev, side, scan) }];
}

/** A bare self message's drawn edge from `posC`: right, `posC2 +
 *  getDrawnWidth` (reverse: `getMaxX`, `posC2`; `:304-305`); left, see
 *  {@link reverseLoopReach}. */
function selfLoopOffset(ev: MessageEvent, side: Side, scan: Scan): number {
  if (side === 'min') return -reverseLoopReach(ev, scan);
  const loop = ev.arrow.reverseDefine === true ? 0 : selfDrawnWidth(ev, scan);
  // A self message's participant is in the row, and every one has a max position.
  return scan.maxPosition.get(ev.from)! + loop;
}

/**
 * `NoteTile#getStableMaxX`/`#getStableMinX` (`NoteTile.java:254-274`) for a
 * standalone note that is no member of a `Notes` group: `getX()` and
 * `getX() + getUsedWidth()`, `x` being `posC - width` (`left`), `posC +
 * level * 5` (`right`) or `posC - width / 2` (`over`) (`:155-173`). An
 * `OVER_SEVERAL` note's x is `middle(posC1, posC2)` -- two lifelines -- so only
 * its `posB(1)` left edge (`:272-273`) is a reach; its right edge and `posD(2)`
 * (`:254-261`) are not (hand-back).
 */
function noteTileReach(note: NoteEvent, side: Side, sorted: readonly Participant[], scan: Scan): Reach[] {
  const id = note.participants[0];
  const index = id === undefined ? -1 : indexOf(sorted, id);
  if (index < 0) return [];
  if (note.position === 'over' && note.participants.length > 1)
    return side === 'min' ? [{ index, offset: 0, edge: true }] : [];
  const width = noteComponentWidth(note, scan);
  const level = note.position === 'right' ? noteLevel(note, id!, scan) * LIVE_DELTA_SIZE : 0;
  const min = note.position === 'left' ? -width : note.position === 'right' ? level : -width / 2;
  return [{ index, offset: side === 'min' ? min : min + width }];
}

/** The side a wrapper's note is drawn on: after an exo arrow every note takes
 *  note 0's (`TileBuilder.java:128-136`). */
function wrapperSide(ev: MessageEvent | MessageExoEvent, notes: readonly NoteEvent[], note: NoteEvent): string {
  return ev.kind === 'messageExo' ? notes[0]!.position : note.position;
}

/**
 * The outermost note wrapper a message builds, as a `getMaxX`/`getMinX`
 * reach. `CommunicationTileNoteRight` is `posC(ls) + level * 5 + width`
 * (`:112-122,246-250`) with `ls = reverse ? ls1 : ls2` (`TileBuilder.java
 * :113-115`); `CommunicationTileNoteLeft` is `posC(ls) - width` (`:112-116,
 * 219-221`) with `ls = reverse ? ls2 : ls1`. A self message's wrappers add
 * their width to the loop's drawn extent (`CommunicationTileSelfNoteRight
 * .java:174-178`, `...SelfNoteLeft.java:174-178`), cumulatively down the
 * chain. A right note on a `create` message starts at `posD`
 * (`CommunicationTileNoteRight.java:122-124`), which is not a reach (hand-back).
 */
function wrapperReach(
  ev: MessageEvent | MessageExoEvent,
  side: Side,
  tiles: GroupTiles,
  sorted: readonly Participant[],
  scan: Scan,
): Reach[] {
  const notes = tiles.folded.get(ev);
  const outer = notes?.at(-1);
  if (notes === undefined || outer === undefined) return [];
  const wanted = side === 'max' ? 'right' : 'left';
  if (wrapperSide(ev, notes, outer) !== wanted) return [];
  if (ev.kind === 'message' && ev.from === ev.to) {
    const onSide = notes.filter((n) => wrapperSide(ev, notes, n) === wanted);
    const total = onSide.reduce((sum, n) => sum + noteComponentWidth(n, scan, 'note'), 0);
    return selfWrapperReach(ev, side, total, sorted, scan);
  }
  return plainWrapperReach(ev, side, outer, sorted, scan);
}

function plainWrapperReach(
  ev: MessageEvent | MessageExoEvent,
  side: Side,
  outer: NoteEvent,
  sorted: readonly Participant[],
  scan: Scan,
): Reach[] {
  const id = wrapperAnchor(ev, side, sorted);
  const index = indexOf(sorted, id);
  if (index < 0 || (side === 'max' && ev.kind === 'message' && ev.create === true)) return [];
  const width = noteComponentWidth(outer, scan);
  if (side === 'min') return [{ index, offset: -width }];
  return [{ index, offset: wrapperLevel(ev, id, scan) * LIVE_DELTA_SIZE + width }];
}

/** The lifeline a wrapper hangs its note from: `right` is `reverse ? ls1 :
 *  ls2`, `left` `reverse ? ls2 : ls1` (`TileBuilder.java:108-115`); an exo
 *  message has the one (`:128-136`). `reverse` is `posC(ls1) > posC(ls2)` at
 *  build time, i.e. by the participants' initial order (`:97`). */
function wrapperAnchor(ev: MessageEvent | MessageExoEvent, side: Side, sorted: readonly Participant[]): string {
  if (ev.kind === 'messageExo') return ev.participant;
  const reverse = indexOf(sorted, ev.from) > indexOf(sorted, ev.to);
  return (side === 'max') === reverse ? ev.from : ev.to;
}

/** `livingSpace.getLevelAt(wrapper, IGNORE_FUTURE_DEACTIVATE)`
 *  (`CommunicationTileNoteRight.java:125`): the message's own level. */
function wrapperLevel(ev: MessageEvent | MessageExoEvent, id: string, scan: Scan): number {
  const live = scan.live.ofSource.get(ev);
  return live === undefined ? 0 : (scan.boxes.get(id)?.getLevelAt(live, 'IGNORE_FUTURE_DEACTIVATE') ?? 0);
}

/** A self message's wrapper: the loop's drawn extent (`getDrawnMaxX`, or
 *  `getDrawnMinX`) plus the `total` width of the wrappers on that side. */
function selfWrapperReach(
  ev: MessageEvent,
  side: Side,
  total: number,
  sorted: readonly Participant[],
  scan: Scan,
): Reach[] {
  const index = indexOf(sorted, ev.from);
  if (index < 0) return [];
  const loop = selfLoopOffset(ev, side, scan);
  return [{ index, offset: side === 'min' ? loop - total : loop + total }];
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

/**
 * `GroupingTile#getNotesWidth(position)` (`:1015-1021`): the summed
 * preferred widths of the nested group's `end` notes on one side -- `left` is
 * `NotePosition.LEFT`, everything else the right (`:1031`). Added to the
 * margin of the recursion into that group (`:511,613`).
 */
function endNotesWidth(group: FrameEvent, side: 'left' | 'right', tiles: GroupTiles, scan: Scan): number {
  const notes = tiles.endNotes.get(group) ?? [];
  return notes
    .filter((n) => (n.position === 'left') === (side === 'left'))
    .reduce((sum, n) => sum + noteComponentWidth(n, scan), 0);
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
    if (ev.kind === 'frame' && ev.frameType !== 'ref')
      clearsFrameOf(ev, margin + FRAME_CLEARANCE + endNotesWidth(ev, 'right', tiles, sink.scan), sink);
    else for (const reach of rightReaches(ev, tiles, sink.sorted, sink.scan)) sink.reaches.push({ reach, margin });
  }
}

/**
 * `ensureClearsTitleOf` (`:637-666`): `posC` of the group's leftmost touched
 * participant plus `width + 16 - MARGINX - MARGINX - overhang + margin`, the
 * header component's width. `overhang` is a left/over note's on that lifeline
 * (`:658-661`).
 */
function clearsTitleOf(group: FrameEvent, margin: number, sink: ReachSink): void {
  const touched = new Set<number>();
  touchedOf(group.branches.flat(), sink.sorted, touched);
  if (touched.size === 0) return;
  const leftmost = Math.min(...touched);
  const width = groupHeaderWidth(group, sink.scan);
  const offset = width + TITLE_HEADER_MARGIN - 2 * FRAME_MARGIN_X - leftOverhang(group, leftmost, sink);
  sink.reaches.push({ reach: { index: leftmost, offset }, margin });
}

/**
 * `NoteTile#getLeftOverhang` (`NoteTile.java:243-251`) of the group's own
 * `NoteTile`s anchored on `leftmost` (`getLeftAnchor`, `GroupingTile.java
 * :658-661`): the width of a `left` note, half of an `over` note's, else 0
 * -- an `OVER_SEVERAL` note's included.
 */
function leftOverhang(group: FrameEvent, leftmost: number, sink: ReachSink): number {
  let overhang = 0;
  for (const note of tilesOf(group).singles) {
    if (indexOf(sink.sorted, note.participants[0] ?? '') !== leftmost) continue;
    if (note.position === 'over' && note.participants.length > 1) continue;
    const width = noteComponentWidth(note, sink.scan);
    if (note.position === 'left') overhang = Math.max(overhang, width);
    else if (note.position === 'over') overhang = Math.max(overhang, width / 2);
  }
  return overhang;
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
    if (ev.kind === 'frame' && ev.frameType !== 'ref')
      clearsFrameOfLeft(ev, margin + FRAME_CLEARANCE + endNotesWidth(ev, 'left', tiles, sink.scan), sink);
    else for (const reach of leftReaches(ev, tiles, sink.sorted, sink.scan)) sink.reaches.push({ reach, margin });
  }
}
