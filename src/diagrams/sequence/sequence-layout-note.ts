/**
 * The `note` event handler: measure the body, resolve the tile
 * (`sequence-note-tile.ts`), push the `NoteGeo`. Split out of
 * `sequence-layout-events.ts`.
 */
import type { EventGeo, MessageEvent, MessageExoEvent, NoteEvent, NoteGeo, TextRun } from './ast.js';
import { Colors } from '../../core/abel/Colors.js';
import { ColorType } from '../../core/abel/ColorType.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import { noteStyle, paintOf, type SequencePaint } from './sequence-skin-param.js';
import { atomFontSpec } from './sequence-creole-text-atom.js';
import { offsetRun, sequenceAtomContext, sequenceCreoleRuns } from './sequence-creole.js';
import { activationLevel, blockWidthOf } from './sequence-layout-events.js';
import type { EventProcessingContext } from './sequence-layout-events.js';
import { wrapGauge, type TileMetrics, type YGauge } from './sequence-y-gauge.js';
import { messageExtent, noteAnchor } from './sequence-note-anchor.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { legacyOverTile, noteTile, notePadding, NOTE_COMPONENT_PADDING_Y } from './sequence-note-tile.js';
import type { NotePadding, NoteTile, NoteTileInput } from './sequence-note-tile.js';

/**
 * A note body's lines, as placed and measured runs -- one run per creole atom
 * (C6), RELATIVE to the block's own top-left. `back` is the note fill the
 * component applies before drawing the text (`ComponentRoseNote.java:121,136`),
 * a sprite's tint start.
 *
 * Every stripe inherits the sheet alignment and `SheetBlock1#initMap`
 * (`SheetBlock1.java:155-193`) shifts it by `(maxWidth - width) / coef`, coef
 * 2 = CENTER, 1 = RIGHT, 0 = LEFT.
 */
function noteBodyRuns(
  lines: readonly string[],
  paint: SequencePaint,
  ctx: EventProcessingContext,
  align: HorizontalAlignment,
): TextRun[] {
  const font = paint.font;
  const spec = atomFontSpec(font);
  const lineHeight = ctx.measurer.measure('M', spec).height;
  const ascent = lineHeight - ctx.measurer.getDescent(spec, 'M');
  const atoms = sequenceAtomContext(ctx.sprites, fontColorOf(font), paint.fill);
  const rows = lines.map((l, i) =>
    sequenceCreoleRuns(l, font, { leftX: 0, baselineY: ascent + i * lineHeight }, ctx.measurer, atoms),
  );
  const widths = rows.map((r) => (r.length === 0 ? 0 : r[r.length - 1]!.x + r[r.length - 1]!.textWidth));
  const maxWidth = Math.max(0, ...widths);
  const coef = align === HorizontalAlignment.CENTER ? 2 : align === HorizontalAlignment.RIGHT ? 1 : 0;
  return rows.flatMap((r, i) => (coef === 0 ? r : r.map((run) => offsetRun(run, (maxWidth - widths[i]!) / coef, 0))));
}

/** The font colour `StripeSimple#addSprite` tints a sprite with
 *  (`StripeSimple.java:234`). Every skin sets `root { FontColor }`
 *  (`plantuml.skin:9`; `TitledDiagram.loadSkin` refuses one without root), so
 *  a null colour is a broken skin, not a case to draw. */
function fontColorOf(font: FontConfiguration): string {
  if (font.color === null) throw new Error('note style resolved no FontColor');
  return font.color;
}

/**
 * The note's `Colors` as its command built them: `ColorParser.simpleColor
 * (BACK)` -> `new Colors(data, set, BACK)` (`FactorySequenceNoteCommand
 * .java:234`, `...OverSeveralCommand.java:239`, `...AcrossCommand.java:218`);
 * a note on an arrow takes the whole string as its BACK colour
 * (`FactorySequenceNoteOnArrowCommand.java:223-225`).
 */
function noteColors(event: NoteEvent): Colors | undefined {
  if (event.color === undefined) return undefined;
  const set = HColorSet.instance();
  if (event.onMessage === true) return Colors.empty().add(ColorType.BACK, set.getColor(event.color));
  return Colors.parse(event.color, set, ColorType.BACK);
}

/**
 * The note's paint, resolved at use time from the builder captured at its
 * command: `Note#getUsedStyles` (`Note.java:75-82`) -- the keyword's
 * signature (`NoteStyle.java:66-74`) merged with the stereotype's styles,
 * then `eventuallyOverride(colors)` -- read off the HTML colour set
 * (`AbstractComponent.java:81-83`).
 */
export function notePaint(event: NoteEvent): SequencePaint {
  const style = noteStyle(
    event.styleBuilder,
    event.style ?? 'note',
    Stereotype.build(event.stereotype),
    noteColors(event),
  );
  return paintOf(style, HColorSet.instance());
}

/** The note's text alignment: `skinparam noteTextAlignment`, else
 *  `defaulttextalignment`, else LEFT (`SkinParam.java:722-727`). `explicit` is
 *  whether either was written (`Rose.java:100-112`). */
function noteAlignment(ctx: EventProcessingContext): { align: HorizontalAlignment; explicit: boolean } {
  const set =
    ctx.theme.colors.elements?.['note']?.horizontalAlignment ?? ctx.theme.colors.elements?.root?.horizontalAlignment;
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
  return activationLevel(ctx.activationStart, anchor);
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
function textHeightOf(lineCount: number, lineHeight: number, pad: NotePadding): number {
  return lineCount * lineHeight + pad.top + pad.bottom;
}

/** A note measured and placed: everything {@link emitNote} draws and
 *  {@link noteTileExtent} reports. */
interface ResolvedNote {
  readonly paint: SequencePaint;
  readonly rows: TextRun[];
  readonly tile: NoteTile;
  readonly padding: NotePadding;
  readonly shadow: number;
  readonly reserve: number;
  readonly lineHeight: number;
  /** The component drawn, {@link componentOf}. */
  readonly component: NoteComponent;
}

function resolveNote(
  event: NoteEvent,
  ctx: EventProcessingContext,
  placement?: NotePlacement,
  group?: NoteTileInput['group'],
): ResolvedNote {
  const paint = notePaint(event);
  const { align, explicit } = noteAlignment(ctx);
  // C6: ONE measurement, the CREOLE block's, at the note style's font --
  // `getTextWidth` reads `textBlock.calculateDimension` plus the padding
  // (`AbstractTextualComponent.java:100-108`) over the block `create3` built
  // with `getFontConfiguration()` (`:80,89`), so `<b>bold</b>` reserves the
  // width of `bold` (jar: `moxope-92-roco972`).
  const rows = noteBodyRuns(event.text.split('\n'), paint, ctx, align);
  // `symbolContext.getDeltaShadow()` (`Style.java:277-280`): `note` RESERVES
  // it in its preferred size (`ComponentRoseNote.java:83-91`); `rnote` and
  // `hnote` only draw it (`ComponentRoseNoteBox.java:101`,
  // `ComponentRoseNoteHexagonal.java:109`).
  const shadow = paint.shadowing;
  const component = componentOf(event, placement);
  const reserve = component === 'note' ? shadow : 0;
  const padding = notePadding(component, align);
  // The tile reads the position and component the wrapper chose.
  const tileEvent: NoteEvent =
    placement === undefined ? event : { ...event, position: placement.position, style: component };
  const tile = tileOf({
    event: tileEvent,
    blockWidth: blockWidthOf(rows),
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
  const lineHeight = ctx.measurer.measure('M', atomFontSpec(paint.font)).height;
  return { paint, rows, tile, padding, shadow, reserve, lineHeight, component };
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
function noteTextHeight(event: NoteEvent, note: ResolvedNote): number {
  return textHeightOf(event.text.split('\n').length, note.lineHeight, note.padding);
}

/** The component's preferred height, which is the whole tile's
 *  (`NoteTile#getPreferredHeight:175-180`, no spacing either side):
 *  `getTextHeight + 2 * getPaddingY + deltaShadow` (`ComponentRoseNote:88-91`,
 *  `...NoteBox:62-65`; the shadow only for `note`, see `reserve` in
 *  {@link resolveNote}). */
function notePreferredHeight(event: NoteEvent, note: ResolvedNote): number {
  return noteTextHeight(event, note) + NOTE_COMPONENT_PADDING_Y * 2 + note.reserve;
}

/**
 * A `NoteTile`'s gauge inputs (`NoteTile.java:72-74,92-97`): the preferred
 * height, and a contact point at half of it -- the note's vertical centre is
 * what a `&` note aligns on the arrow line.
 */
export function noteTileMetrics(event: NoteEvent, ctx: EventProcessingContext): TileMetrics {
  const height = notePreferredHeight(event, resolveNote(event, ctx));
  return { contactRelative: height / 2, height };
}

/** Push one note's geometry with its tile top at `top`: the box is drawn
 *  `getPaddingY` BELOW it -- `Rose.paddingY` = 5, applied by
 *  `AbstractComponent#drawU:142-143`. On `metano-36-gevu843` the jar's box is
 *  at y=52 against a tile top of 47. */
function emitNote(event: NoteEvent, note: ResolvedNote, top: number, ctx: EventProcessingContext): void {
  const { paint, rows, tile, padding, shadow } = note;
  const boxY = top + NOTE_COMPONENT_PADDING_Y;
  const noteGeo: NoteGeo = {
    paint,
    kind: 'note',
    x: tile.x,
    y: boxY,
    width: tile.width,
    height: Math.trunc(noteTextHeight(event, note)),
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
  const height = Math.max(...resolveGroup(members, ctx).map((r, i) => notePreferredHeight(members[i]!, r)));
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
  const noteHeight = notePreferredHeight(anchored, resolved);
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
  const height = Math.max(chain.height, notePreferredHeight(anchored, resolved));
  const extent = position === 'left' ? { minX: resolved.tile.minX } : { maxX: resolved.tile.maxX };
  return { ...chain, ...extent, height, gauge: wrapGauge(chain.gauge, height) };
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
 * After an exo arrow every note takes note 0's position and only LEFT/RIGHT
 * build a wrapper (`TileBuilder.java:128-136`): a `top`/`bottom` note 0 leaves
 * every note on that arrow undrawn.
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
    const position = owner.kind === 'messageExo' ? notes[0]!.position : note.position;
    if (position !== 'over') chain = wrapSide(owner, note, position, chain, ctx);
    else if (owner.kind === 'message' && note.side !== undefined)
      chain = wrapTopBottom(owner, note, note.side, chain, inner.firstGeo, ctx);
  }
  return chain.gauge;
}
