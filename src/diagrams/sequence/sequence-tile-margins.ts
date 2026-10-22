/**
 * The margins a TILE grows on its own participant's box (sdd2 T5i, M1d).
 *
 * A `box ... end box` is drawn purely from its first/last participant's
 * `marginBefore`/`marginAfter` (`Doll.getPosA()/getPosE()`), never from a
 * tile's own footprint. So a tile that reaches past its participant grows
 * that participant's margin in `addConstraints`:
 *
 *   - `NoteTile#ensureOwnBoxClearsNote` (`NoteTile.java:204-218`);
 *   - `CommunicationTileSelf#ensureOwnBoxClearsLoop` (`:209-223`);
 *   - `CommunicationTileSelfNoteLeft/Right#ensureOwnBoxClearsNote`
 *     (`CommunicationTileSelfNoteLeft.java:152-160`,
 *     `CommunicationTileSelfNoteRight.java:145-153`).
 *
 * Each reads `getMinX()/getMaxX().getCurrentValue()` at registration time,
 * before `xorigin.compileNow()`, when every `posB` is its creation value
 * (heads laid end to end). Every term but `OVER_SEVERAL`'s is a fixed offset
 * from the same participant's `posB`, so those do not depend on the row.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/NoteTile.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/CommunicationTileSelf.java
 */
import type { MessageEvent, NoteEvent, Participant, SequenceEvent } from './ast.js';
import type { LivingSpaceMargins } from './sequence-dolls.js';
import type { Scan } from './sequence-layout-participant-constraints.js';
import { LiveBoxes, flattenLiveEvents } from './sequence-live-boxes.js';
import { noteComponentWidth, noteLevel, noteLiveEntries, noteTiles } from './sequence-note-width.js';
import { notesOnMessages } from './sequence-note-folding.js';
import { selfCompWidth } from './sequence-note-anchor.js';
import { LIVE_DELTA_SIZE } from './sequence-layout-shared.js';

/** What the scan needs beyond the events: the same context `scanMessageLabels` builds. */
export type TileScanEnv = Omit<Scan, 'maxPosition' | 'live' | 'boxes' | 'noteEntries'>;

/** The row the margins are measured on: head widths in participant order. */
interface Row {
  readonly sorted: readonly Participant[];
  readonly widths: readonly number[];
  /** `posB` as it stands at registration: the heads laid end to end. */
  readonly posB: readonly number[];
  readonly margins: LivingSpaceMargins;
}

/** `if (overflow > 0) livingSpace.ensureMarginBefore(overflow)`. */
function before(row: Row, index: number, overflow: number): void {
  if (overflow > 0) row.margins.ensureMarginBefore(index, overflow);
}

/** `if (overflow > 0) livingSpace.ensureMarginAfter(overflow)`. */
function after(row: Row, index: number, overflow: number): void {
  if (overflow > 0) row.margins.ensureMarginAfter(index, overflow);
}

/** `NotePosition.OVER_SEVERAL`: `over` with a second participant. */
function isSeveral(note: NoteEvent): boolean {
  return note.position === 'over' && note.participants.length > 1;
}

/**
 * `NoteTile#ensureOwnBoxClearsNote` (`NoteTile.java:204-218`) for a one-note
 * tile. `posC = posB + w/2` (`LivingSpace.java:223-228`), `posD = posB + w`
 * (`:240-245`); `getX` per position (`NoteTile.java:109-126`).
 */
function ensureOwnBoxClearsNote(note: NoteEvent, row: Row, scan: Scan): void {
  const i1 = row.sorted.findIndex((p) => p.id === note.participants[0]);
  if (i1 < 0) return;
  const w1 = row.widths[i1]!;
  const noteW = noteComponentWidth(note, scan);
  if (isSeveral(note)) return severalNote(note, i1, noteW, row);
  // x - posB and x + width - posD, in terms of w/2 = posC - posB.
  const x =
    note.position === 'left'
      ? w1 / 2 - noteW
      : note.position === 'right'
        ? w1 / 2 + noteLevel(note, note.participants[0]!, scan) * LIVE_DELTA_SIZE
        : w1 / 2 - noteW / 2;
  before(row, i1, -x);
  after(row, i1, x + noteW - w1);
}

/**
 * `OVER_SEVERAL`: `getUsedWidth` is `max(width, posD2 - posB1)`
 * (`NoteTile.java:131-142`), `getX = middle(posC1, posC2) - used/2`
 * (`:155-158`), `getMinX = min(x, posB1)` and `getMaxX = max(x + used, posD2)`
 * (`:287-306`); the margins are `posB1 - minX` before `ls1`, `maxX - posD2`
 * after `ls2` (the right anchor, `:210-217`).
 */
function severalNote(note: NoteEvent, i1: number, noteW: number, row: Row): void {
  const i2 = row.sorted.findIndex((p) => p.id === note.participants[1]);
  if (i2 < 0) return;
  const b1 = row.posB[i1]!;
  const d2 = row.posB[i2]! + row.widths[i2]!;
  const used = Math.max(noteW, d2 - b1);
  const c1 = b1 + row.widths[i1]! / 2;
  const c2 = row.posB[i2]! + row.widths[i2]! / 2;
  const x = (c1 + c2) / 2 - used / 2;
  before(row, i1, b1 - Math.min(x, b1));
  after(row, i2, Math.max(x + used, d2) - d2);
}

/** `CommunicationTileSelf#getCompWidth` for the forward / reverse loop and
 *  the live adjustment of `getMinX` (`:263-270`). */
interface LoopGeometry {
  readonly reverse: boolean;
  readonly compWidth: number;
  readonly maxPosition: number;
  readonly liveAdjustment: number;
}

function loopOf(ev: MessageEvent, scan: Scan): LoopGeometry {
  const entry = scan.live.ofSource.get(ev);
  const level = entry === undefined ? 0 : (scan.boxes.get(ev.from)?.getLevelAt(entry, 'IGNORE_FUTURE_ACTIVATE') ?? 0);
  return {
    reverse: ev.arrow.reverseDefine === true,
    compWidth: selfCompWidth(ev, scan),
    maxPosition: scan.maxPosition.get(ev.from) ?? 0,
    liveAdjustment: level > 0 ? LIVE_DELTA_SIZE : 0,
  };
}

/**
 * A self message and the notes written on it. `getMinX`/`getMaxX` relative to
 * `posC` (`CommunicationTileSelf.java:263-277`): forward `[0, maxPosition +
 * compWidth]`, reverse `[-compWidth - adjustment, maxPosition]`; a left note
 * moves the min out by its own width, a right note the max
 * (`CommunicationTileSelfNoteLeft.java:132-138`, `...NoteRight.java:131-137`).
 * The loop's own check runs unless `sequenceMessageSpan` skips the tile's
 * `addConstraints` (`CommunicationTileSelf.java:167-168`).
 */
function ensureOwnBoxClearsSelf(ev: MessageEvent, notes: readonly NoteEvent[], row: Row, scan: Scan): void {
  const index = row.sorted.findIndex((p) => p.id === ev.from);
  if (index < 0) return;
  const half = row.widths[index]! / 2;
  const loop = loopOf(ev, scan);
  const minX = loop.reverse ? -loop.compWidth - loop.liveAdjustment : 0;
  const maxX = loop.reverse ? loop.maxPosition : loop.maxPosition + loop.compWidth;
  if (scan.messageSpan !== true) {
    if (loop.reverse) before(row, index, -(half + minX));
    else after(row, index, maxX - half);
  }
  for (const note of notes) {
    const width = noteComponentWidth(note, scan, 'note');
    if (note.position === 'left') before(row, index, -(half + minX - width));
    else if (note.position === 'right') after(row, index, maxX + width - half);
  }
}

/** A frame's branches (a `ref` has none). */
function branchesOf(ev: SequenceEvent): readonly (readonly SequenceEvent[])[] {
  return ev.kind === 'frame' && ev.frameType !== 'ref' ? ev.branches : [];
}

/** Every tile of `events` that grows a margin, frames' branches included. */
function visit(events: readonly SequenceEvent[], row: Row, scan: Scan): void {
  const notesOf = notesOnMessages(events);
  for (const ev of events) {
    if (ev.kind === 'message' && ev.from === ev.to) ensureOwnBoxClearsSelf(ev, notesOf.get(ev) ?? [], row, scan);
    for (const branch of branchesOf(ev)) visit(branch, row, scan);
  }
  for (const tile of noteTiles(events)) if (tile.length === 1) ensureOwnBoxClearsNote(tile[0]!, row, scan);
}

/**
 * Run every tile's `ensureOwnBoxClears*` over the row, growing `margins`.
 * Called after `dolls.addConstraints` has baked its margins and before the
 * row is solved (`SequenceDiagramFileMakerTeoz.java:112-115`: tiles register
 * in `mainTile.addConstraints()`, after `PlayingSpace` captured the dolls).
 */
export function addTileMargins(
  events: readonly SequenceEvent[],
  sorted: readonly Participant[],
  widths: readonly number[],
  margins: LivingSpaceMargins,
  env: TileScanEnv,
): void {
  const live = flattenLiveEvents(events);
  const boxes = new Map(sorted.map((p) => [p.id, new LiveBoxes(p.id, live.events)] as const));
  const maxPosition = new Map([...boxes].map(([id, b]) => [id, b.getMaxPosition()] as const));
  const scan: Scan = { ...env, maxPosition, live, boxes, noteEntries: noteLiveEntries(events, live) };
  const posB: number[] = [];
  let x = 0;
  for (const width of widths) {
    posB.push(x);
    x += width;
  }
  visit(events, { sorted, widths, posB, margins }, scan);
}
