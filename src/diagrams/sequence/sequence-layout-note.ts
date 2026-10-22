/**
 * The `note` event handler: measure the body, resolve the tile
 * (`sequence-note-tile.ts`), push the `NoteGeo`. Split out of
 * `sequence-layout-events.ts`.
 */
import type { EventGeo, MessageEvent, MessageExoEvent, NoteEvent, NoteGeo, TextRun } from './ast.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { paintOf, type SequencePaint } from './sequence-skin-param.js';
import { offsetRun, type LabelBlock } from './sequence-creole-sheet.js';
import { noteBodyBlock, notePaint } from './sequence-note-width.js';
import { activationLevel } from './sequence-layout-events.js';
import type { EventProcessingContext } from './sequence-layout-events.js';
import { wrapGauge, type TileMetrics, type YGauge } from './sequence-y-gauge.js';
import { messageExtent, noteAnchor } from './sequence-note-anchor.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { legacyOverTile, noteTile, notePadding, NOTE_COMPONENT_PADDING_Y } from './sequence-note-tile.js';
import type { NotePadding, NoteTile, NoteTileInput } from './sequence-note-tile.js';

export { notePaint };

/** The alignment that picks the padding and the position: `skinparam
 *  noteTextAlignment`, else `defaulttextalignment`, else LEFT
 *  (`SkinParam.java:722-727`), from the legacy params only (`Rose.java:110`).
 *  `explicit` is whether either was written (`Rose.java:100-112`). */
function noteAlignment(event: NoteEvent): { align: HorizontalAlignment; explicit: boolean } {
  const set = event.legacyTextAlignment;
  return { align: set ?? HorizontalAlignment.LEFT, explicit: set !== undefined };
}

/** The live level at the note: for a note written under a message,
 *  `getLevelAt(message tile, IGNORE_FUTURE_DEACTIVATE)`
 *  (`CommunicationTileNoteRight.java:105`, the level its own `--` has not yet
 *  lowered); for a `NoteTile`, the level after the events before it
 *  (`LiveBoxes.java:93-117`). */
function noteLevel(event: NoteEvent, ctx: EventProcessingContext): number {
  const anchor = event.participants[0];
  if (anchor === undefined) return 0;
  if (event.onMessage === true)
    return ctx.lastMessageLevels?.get(anchor) ?? activationLevel(ctx.activationStart, anchor);
  // `NoteTile.getX`: `getLevelAt(this, IGNORE_FUTURE_DEACTIVATE)`
  // (`NoteTile.java:160`), which adds the activates written after the note and
  // bound to a message (`LiveBoxes.java:184-204`).
  const { live } = ctx.activationStart;
  const entry = live.list.ofSource.get(event);
  const boxes = live.boxes.get(anchor);
  if (entry === undefined || boxes === undefined) return activationLevel(ctx.activationStart, anchor);
  return boxes.getLevelAt(entry, 'IGNORE_FUTURE_DEACTIVATE');
}

/** `top`/`bottom` under a message are `over` here; see `legacyOverTile`. */
function isUnderMessage(event: NoteEvent): boolean {
  return event.onMessage === true && event.position === 'over';
}

/** The note component a tile builds -- `NoteTile.getNoteComponentType`
 *  (`NoteTile.java:117-125`) of the note's keyword, except where the wrapper
 *  always builds a `ComponentType.NOTE`: under a message
 *  (`CommunicationTileNoteBottomTopAbstract.java:108`) and beside a self
 *  message (`CommunicationTileSelfNoteRight.java:102`, `...SelfNoteLeft`). */
type NoteComponent = NonNullable<NoteEvent['style']>;

/**
 * How a note-on-message wrapper re-reads the note it draws: the side it is
 * drawn on (after an exo arrow every wrapper takes note 0's,
 * `TileBuilder.java:129`) and whether its component is forced to
 * `ComponentType.NOTE` (a self message's wrappers).
 */
interface NotePlacement {
  readonly position: 'left' | 'right';
  readonly forceNote: boolean;
  /** See {@link NoteTileInput.rightX}. */
  readonly rightX?: number;
  /** See {@link NoteTileInput.originX}. */
  readonly originX?: number;
}

function componentOf(event: NoteEvent, placement: NotePlacement | undefined): NoteComponent {
  if (placement?.forceNote === true || isUnderMessage(event)) return 'note';
  return event.style ?? 'note';
}

function tileOf(input: NoteTileInput): NoteTile {
  return isUnderMessage(input.event) ? legacyOverTile(input) : noteTile(input);
}

/** The text block's height plus both paddings: `getTextHeight`
 *  (`AbstractTextualComponent.java:110-114`). */
function textHeightOf(block: LabelBlock, pad: NotePadding): number {
  return block.height + pad.top + pad.bottom;
}

/** A note measured and placed: everything {@link emitNote} draws and
 *  {@link noteTileExtent} reports. */
export interface ResolvedNote {
  readonly paint: SequencePaint;
  readonly rows: readonly TextRun[];
  /** The note component's text block (`sequence-note-width.ts#noteBodyBlock`). */
  readonly block: LabelBlock;
  readonly tile: NoteTile;
  readonly padding: NotePadding;
  readonly shadow: number;
  readonly reserve: number;
  /** The component drawn, {@link componentOf}. */
  readonly component: NoteComponent;
}

export function resolveNote(
  event: NoteEvent,
  ctx: EventProcessingContext,
  placement?: NotePlacement,
  group?: NoteTileInput['group'],
): ResolvedNote {
  const paint = notePaint(event);
  const { align, explicit } = noteAlignment(event);
  const component = componentOf(event, placement);
  const padding = notePadding(component, align);
  // ONE measurement, the component's text block -- `getTextWidth` reads
  // `textBlock.calculateDimension` plus the padding (`AbstractTextualComponent
  // .java:100-108`), so `<b>bold</b>` reserves the width of `bold` (jar:
  // `moxope-92-roco972`). The participant row reads the same block.
  const block = noteBodyBlock(event, component, ctx, padding);
  // `symbolContext.getDeltaShadow()` (`Style.java:277-280`): `note` RESERVES
  // it in its preferred size (`ComponentRoseNote.java:83-91`); `rnote` and
  // `hnote` only draw it (`ComponentRoseNoteBox.java:101`,
  // `ComponentRoseNoteHexagonal.java:109`).
  const shadow = paint.shadowing;
  const reserve = component === 'note' ? shadow : 0;
  // The tile reads the position and component the wrapper chose.
  const tileEvent: NoteEvent =
    placement === undefined ? event : { ...event, position: placement.position, style: component };
  const tile = tileOf({
    event: tileEvent,
    blockWidth: block.width,
    padding,
    reserve,
    level: noteLevel(event, ctx),
    participantMap: ctx.participantMap,
    explicitAlign: explicit ? align : undefined,
    align,
    ...(group !== undefined ? { group } : {}),
    ...(placement?.rightX !== undefined ? { rightX: placement.rightX } : {}),
    ...(placement?.originX !== undefined ? { originX: placement.originX } : {}),
  });
  return { paint, rows: block.primitives, block, tile, padding, shadow, reserve, component };
}

/**
 * The extent `NoteTile#getMinX`/`#getMaxX` give a note, for a caller that
 * needs it before the note is laid out: a `GroupingTile` folds every child
 * tile's extent into its frame (`teoz/GroupingTile.java:204-207`).
 */
export function noteTileExtent(event: NoteEvent, ctx: EventProcessingContext): { minX: number; maxX: number } {
  const { tile } = resolveNote(event, ctx);
  return { minX: tile.minX, maxX: tile.maxX };
}

/** `getTextHeight`; the box is drawn `(int)` of it (`ComponentRoseNote:104`,
 *  `...NoteBox:56`, `...NoteHexagonal:56`). */
function noteTextHeight(note: ResolvedNote): number {
  return textHeightOf(note.block, note.padding);
}

/** The component's preferred height, which is the whole tile's
 *  (`NoteTile#getPreferredHeight:175-180`, no spacing either side):
 *  `getTextHeight + 2 * getPaddingY + deltaShadow` (`ComponentRoseNote:88-91`,
 *  `...NoteBox:62-65`; the shadow only for `note`, see `reserve` in
 *  {@link resolveNote}). */
function notePreferredHeight(note: ResolvedNote): number {
  return noteTextHeight(note) + NOTE_COMPONENT_PADDING_Y * 2 + note.reserve;
}

/**
 * A `NoteTile`'s gauge inputs (`NoteTile.java:72-74,92-97`): the preferred
 * height, and a contact point at half of it -- the note's vertical centre is
 * what a `&` note aligns on the arrow line.
 */
export function noteTileMetrics(event: NoteEvent, ctx: EventProcessingContext): TileMetrics {
  const height = notePreferredHeight(resolveNote(event, ctx));
  return { contactRelative: height / 2, height };
}

/** Push one note's geometry with its tile top at `top`: the box is drawn
 *  `getPaddingY` BELOW it -- `Rose.paddingY` = 5, applied by
 *  `AbstractComponent#drawU:142-143`. On `metano-36-gevu843` the jar's box is
 *  at y=52 against a tile top of 47. */
export function emitNote(event: NoteEvent, note: ResolvedNote, top: number, ctx: EventProcessingContext): void {
  const { paint, rows, tile, padding, shadow } = note;
  const boxY = top + NOTE_COMPONENT_PADDING_Y;
  const noteGeo: NoteGeo = {
    paint,
    kind: 'note',
    x: tile.x,
    y: boxY,
    width: tile.width,
    height: Math.trunc(noteTextHeight(note)),
    text: event.text,
    textRuns: rows.map((r) => offsetRun(r, tile.x + tile.textDx, boxY + padding.top)),
    minX: tile.minX,
    maxX: tile.maxX,
    ...(event.color !== undefined ? { color: event.color } : {}),
    // The shape is the keyword's only where the component is (see
    // `componentOf`); a forced `ComponentType.NOTE` draws the Opale shape.
    ...(event.shape !== undefined && note.component === event.style ? { shape: event.shape } : {}),
    ...(shadow > 0 ? { shadow } : {}),
  };
  ctx.eventGeos.push(noteGeo);
}

/** Lay a `NoteTile` (or a stacked note under a message, `legacyOverTile`)
 *  out on the gauge `TileBuilder` placed it on (`TileBuilder.java:138-147`). */
export function handleNoteEvent(event: NoteEvent, gauge: YGauge, ctx: EventProcessingContext): void {
  emitNote(event, resolveNote(event, ctx), gauge.min, ctx);
}

/** `NotePosition` as `Note#getPosition` reports it: an `over` two
 *  participants is `OVER_SEVERAL`, a distinct value (`Note.java:93-95`). */
function samePosition(a: NoteEvent, b: NoteEvent): boolean {
  return a.position === b.position && a.participants.length > 1 === b.participants.length > 1;
}

/**
 * The members of a `Notes` group (`/ note`), each placed by `NotesTile`:
 * `getStackingOffset` (`NotesTile.java:180-190`) sums the widths of the earlier
 * members with the same position and participant, so they sit side by side.
 */
function resolveGroup(members: readonly NoteEvent[], ctx: EventProcessingContext): ResolvedNote[] {
  const resolved: ResolvedNote[] = [];
  for (const [i, note] of members.entries()) {
    let stacking = 0;
    for (const [j, other] of members.slice(0, i).entries()) {
      if (samePosition(other, note) && other.participants[0] === note.participants[0])
        stacking += resolved[j]!.tile.maxX - resolved[j]!.tile.minX;
    }
    resolved.push(resolveNote(note, ctx, undefined, { stacking }));
  }
  return resolved;
}

/** A `NotesTile`'s gauge inputs: the tallest member's height, a contact
 *  point at half of it (`NotesTile.java:72-75,192-200`). */
export function notesGroupMetrics(members: readonly NoteEvent[], ctx: EventProcessingContext): TileMetrics {
  const height = Math.max(...resolveGroup(members, ctx).map((r) => notePreferredHeight(r)));
  return { contactRelative: height / 2, height };
}

/** Lay a `Notes` group out: every member drawn at the SAME top, the gauge's
 *  min (`NotesTile#drawU:124-138`, one `dy(getYGauge().getMin())`). */
export function handleNotesGroup(members: readonly NoteEvent[], gauge: YGauge, ctx: EventProcessingContext): void {
  for (const [i, resolved] of resolveGroup(members, ctx).entries()) emitNote(members[i]!, resolved, gauge.min, ctx);
}

/** The tile a note wrapper wraps: its gauge and `getPreferredHeight`, the
 *  contact offset it propagates, and where its geometry starts in
 *  `ctx.eventGeos` (a `top` wrapper moves it, see {@link wrapTopBottom}). */
export interface WrappedTile {
  readonly gauge: YGauge;
  readonly height: number;
  readonly contactRelative: number;
  readonly firstGeo: number;
}

/** The wrapper chain so far: what the next wrapper reads off the tile it
 *  wraps -- `getYGauge`, `getPreferredHeight`, `getContactPointRelative`,
 *  `getMinX`, `getMaxX`. */
interface Chain {
  readonly gauge: YGauge;
  readonly height: number;
  readonly contactRelative: number;
  readonly minX: number;
  readonly maxX: number;
}

/** `NoteTop`/`NoteBottom`'s `spacey` (`CommunicationTileNoteBottomTopAbstract
 *  .java:98`). */
const TOP_BOTTOM_SPACEY = 10;

/** `Rose.paddingY`, the connector's end offset inside the note
 *  (`CommunicationTileNoteBottom.java:76`, `...Top.java:74`). */
const CONNECTOR_PADDING_Y = 5;

/** Move what a tile drew from `start` on down by `dy`: `CommunicationTileNoteTop
 *  #drawU` draws the wrapped tile under `UTranslate.dy(note height + spacey)`
 *  (`:60`). Messages and the notes of earlier wrappers are all it draws. */
function shiftDrawn(geos: EventGeo[], start: number, dy: number): void {
  for (let i = start; i < geos.length; i++) {
    const geo = geos[i]!;
    if (geo.kind === 'message') {
      geo.y += dy;
      geo.labelLines = geo.labelLines.map((r) => offsetRun(r, 0, dy));
      if (geo.labelNumber !== undefined) geo.labelNumber = offsetRun(geo.labelNumber, 0, dy);
      if (geo.createdHead !== undefined) geo.createdHead = { ...geo.createdHead, y: geo.createdHead.y + dy };
    } else if (geo.kind === 'note') {
      geo.y += dy;
      geo.textRuns = geo.textRuns.map((r) => offsetRun(r, 0, dy));
      if (geo.connector !== undefined)
        geo.connector = { ...geo.connector, y1: geo.connector.y1 + dy, y2: geo.connector.y2 + dy };
    }
  }
}

/**
 * `CommunicationTileNoteBottom`/`...Top` around the chain (`TileBuilder.java
 * :117-120`): the note stacks BELOW (`bottom`) or ABOVE (`top`) the wrapped
 * tile, `getPreferredHeight = tile + note + spacey`
 * (`CommunicationTileNoteBottomTopAbstract.java:134-138`), at the wrapped
 * tile's `getMinX()` (`:99-102`), with a dashed line from the message to the
 * note's middle (`bottom`: `CommunicationTileNoteBottom.java:59-77`, `top`:
 * `CommunicationTileNoteTop.java:59-75`). The wrapper's `getMaxX` is the
 * wider of the tile's and the note's (`:147-155`).
 */
function wrapTopBottom(
  owner: MessageEvent,
  note: NoteEvent,
  side: 'top' | 'bottom',
  chain: Chain,
  start: number,
  ctx: EventProcessingContext,
): Chain {
  const anchored: NoteEvent = { ...note, participants: [owner.from] };
  const resolved = resolveNote(anchored, ctx, { position: 'right', forceNote: true, originX: chain.minX });
  const noteHeight = notePreferredHeight(resolved);
  const noteWidth = resolved.tile.maxX - resolved.tile.minX;
  const min = chain.gauge.min;
  const middleMsg = (chain.minX + chain.maxX) / 2;
  const endX = chain.minX + noteWidth / 2;
  const below = side === 'bottom';
  if (!below) shiftDrawn(ctx.eventGeos, start, noteHeight + TOP_BOTTOM_SPACEY);
  const noteTop = below ? min + chain.height + TOP_BOTTOM_SPACEY : min;
  const from = min + chain.contactRelative + (below ? 0 : noteHeight + TOP_BOTTOM_SPACEY);
  const to = below ? chain.height + TOP_BOTTOM_SPACEY + CONNECTOR_PADDING_Y : noteHeight - 2 * CONNECTOR_PADDING_Y;
  emitNote(anchored, resolved, noteTop, ctx);
  const geo = ctx.eventGeos.at(-1) as NoteGeo;
  geo.connector = { x1: middleMsg, y1: from, x2: endX, y2: min + to, paint: connectorPaint(ctx) };
  const height = chain.height + noteHeight + TOP_BOTTOM_SPACEY;
  return {
    ...chain,
    gauge: wrapGauge(chain.gauge, height),
    height,
    maxX: Math.max(chain.maxX, chain.minX + noteWidth),
  };
}

/** The line's paint: the sequence root style's `LineColor`, off the builder
 *  current when the tiles are built (`:72-74`). */
function connectorPaint(ctx: EventProcessingContext): SequencePaint {
  const style = StyleSignatureBasic.of('root', 'element', 'sequenceDiagram').getMergedStyle(ctx.endStyleBuilder);
  if (style === undefined) throw new Error('NullPointerException: no root/element/sequenceDiagram style');
  return paintOf(style, HColorSet.instance());
}

/** `CommunicationTileNoteLeft`/`...Right` (and the self variants) around the
 *  chain: the same top, `max(tile, note)` tall, the extent they move. */
function wrapSide(
  owner: MessageEvent | MessageExoEvent,
  note: NoteEvent,
  position: 'left' | 'right',
  chain: Chain,
  ctx: EventProcessingContext,
): Chain {
  const forceNote = owner.kind === 'message' && owner.from === owner.to;
  const { participant, rightX } = noteAnchor(owner, note, position, ctx);
  const anchored: NoteEvent = participant === undefined ? note : { ...note, participants: [participant] };
  const resolved = resolveNote(anchored, ctx, { position, forceNote, ...(rightX !== undefined ? { rightX } : {}) });
  emitNote(anchored, resolved, chain.gauge.min, ctx);
  const height = Math.max(chain.height, notePreferredHeight(resolved));
  const extent = position === 'left' ? { minX: resolved.tile.minX } : { maxX: resolved.tile.maxX };
  return { ...chain, ...extent, height, gauge: wrapGauge(chain.gauge, height) };
}

/** `MessageExo#overrideNotePosition`, applied by `AbstractMessage#addNote` to
 *  every note on the arrow (`MessageExo.java:62-69`, `AbstractMessage.java:224`):
 *  a left border arrow takes its notes on the RIGHT, a right border one on
 *  the LEFT. */
function exoNoteSide(type: MessageExoEvent['exoType']): 'left' | 'right' {
  return type === 'FROM_LEFT' || type === 'TO_LEFT' ? 'right' : 'left';
}

/**
 * The note-on-message wrappers `TileBuilder.buildOne` folds around a message
 * tile, one per note in order (`TileBuilder.java:102-121`, exo `:128-136`).
 *
 * Each wrapper draws the tile it wraps, then its note at the SAME top
 * (`CommunicationTileNoteRight#drawU:129-142`, `...NoteLeft:118-131`,
 * `...SelfNoteRight:112-126`): `dy(getYGauge().getMin())`, the wrapped tile's
 * min. Its height is `Math.max(tile.getPreferredHeight(), note height)`
 * (`CommunicationTileNoteRight.java:144-148`, `...NoteLeft:133-137`,
 * `...SelfNoteRight:128-132`) and its gauge wraps the inner one
 * ({@link wrapGauge}). `top`/`bottom` stack instead ({@link wrapTopBottom}).
 * After an exo arrow every note takes the side the exo forces
 * ({@link exoNoteSide}), whatever it was written with, so every note builds a
 * LEFT/RIGHT wrapper (`TileBuilder.java:128-136`).
 */
export function layoutNotesOnMessage(
  owner: MessageEvent | MessageExoEvent,
  notes: readonly NoteEvent[],
  inner: WrappedTile,
  ctx: EventProcessingContext,
): YGauge {
  const extent = owner.kind === 'message' ? messageExtent(owner, ctx) : { minX: 0, maxX: 0 };
  let chain: Chain = { ...inner, ...extent };
  for (const note of notes) {
    const position = owner.kind === 'messageExo' ? exoNoteSide(owner.exoType) : note.position;
    if (position !== 'over') chain = wrapSide(owner, note, position, chain, ctx);
    else if (owner.kind === 'message' && note.side !== undefined)
      chain = wrapTopBottom(owner, note, note.side, chain, inner.firstGeo, ctx);
  }
  return chain.gauge;
}
