/**
 * The `note` event handler: measure the body, resolve the tile
 * (`sequence-note-tile.ts`), push the `NoteGeo`. Split out of
 * `sequence-layout-events.ts`.
 */
import type { NoteEvent, NoteGeo, TextRun } from './ast.js';
import type { FontSpec } from '../../core/measurer.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { noteShadowGeometry } from './sequence-layout-note-shadow.js';
import { noteFontSpecOf } from './sequence-layout-shared.js';
import { offsetRun, sequenceAtomContext, sequenceCreoleFont, sequenceCreoleRuns } from './sequence-creole.js';
import { activationLevel, blockWidthOf } from './sequence-layout-events.js';
import type { EventCursor, EventProcessingContext } from './sequence-layout-events.js';
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
  spec: FontSpec,
  ctx: EventProcessingContext,
  opts: { back: string; align: HorizontalAlignment },
): TextRun[] {
  const font = sequenceCreoleFont(spec);
  const lineHeight = ctx.measurer.measure('M', spec).height;
  const ascent = lineHeight - ctx.measurer.getDescent(spec, 'M');
  const atoms = sequenceAtomContext(ctx.sprites, ctx.theme.colors.text, opts.back);
  const rows = lines.map((l, i) =>
    sequenceCreoleRuns(l, font, { leftX: 0, baselineY: ascent + i * lineHeight }, ctx.measurer, atoms),
  );
  const widths = rows.map((r) => (r.length === 0 ? 0 : r[r.length - 1]!.x + r[r.length - 1]!.textWidth));
  const maxWidth = Math.max(0, ...widths);
  const coef = opts.align === HorizontalAlignment.CENTER ? 2 : opts.align === HorizontalAlignment.RIGHT ? 1 : 0;
  return rows.flatMap((r, i) => (coef === 0 ? r : r.map((run) => offsetRun(run, (maxWidth - widths[i]!) / coef, 0))));
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

function tileOf(input: NoteTileInput): NoteTile {
  return isUnderMessage(input.event) ? legacyOverTile(input) : noteTile(input);
}

/** The text block's height plus both paddings: `getTextHeight`
 *  (`AbstractTextualComponent.java:110-114`). */
function textHeightOf(lineCount: number, lineHeight: number, pad: NotePadding): number {
  return lineCount * lineHeight + pad.top + pad.bottom;
}

/** A note measured and placed: everything {@link handleNoteEvent} draws and
 *  {@link noteTileExtent} reports. */
interface ResolvedNote {
  readonly rows: TextRun[];
  readonly tile: NoteTile;
  readonly padding: NotePadding;
  readonly shadow: number;
  readonly reserve: number;
  readonly lineHeight: number;
}

function resolveNote(event: NoteEvent, ctx: EventProcessingContext): ResolvedNote {
  // `note { FontSize 13 }` (`plantuml.skin:312-316`), NOT the ambient font --
  // the box and its text must be sized from one measurement.
  const fontSpec = noteFontSpecOf(ctx.theme);
  const { align, explicit } = noteAlignment(ctx);
  // C6: that ONE measurement is the CREOLE block's -- `getTextWidth` reads
  // `textBlock.calculateDimension` plus the padding (`AbstractTextualComponent
  // .java:100-108`) over the block `create0` built (`:89-92`), so `<b>bold</b>`
  // reserves the width of `bold` (jar: `moxope-92-roco972`).
  const back = event.color ?? ctx.theme.colors.noteBackground;
  const rows = noteBodyRuns(event.text.split('\n'), fontSpec, ctx, { back, align });
  const { shadow, reserve } = noteShadowGeometry(event, ctx.theme);
  // `...NoteBottomTopAbstract.java:92` always builds a `ComponentType.NOTE`.
  const padding = notePadding(isUnderMessage(event) ? 'note' : event.style, align);
  const tile = tileOf({
    event,
    blockWidth: blockWidthOf(rows),
    padding,
    reserve,
    level: noteLevel(event, ctx),
    participantMap: ctx.participantMap,
    explicitAlign: explicit ? align : undefined,
    align,
  });
  return { rows, tile, padding, shadow, reserve, lineHeight: ctx.measurer.measure('M', fontSpec).height };
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

export function handleNoteEvent(event: NoteEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  const { rows, tile, padding, shadow, reserve, lineHeight } = resolveNote(event, ctx);
  // `getTextHeight`; the box is drawn `(int)` of it (`ComponentRoseNote:104`,
  // `...NoteBox:56`, `...NoteHexagonal:56`) and `getPaddingY` BELOW the tile
  // top -- `Rose.paddingY` = 5, applied by `AbstractComponent#drawU:142-143`.
  // On `metano-36-gevu843` the jar's box is at y=52 against a tile top of 47.
  const textHeight = textHeightOf(event.text.split('\n').length, lineHeight, padding);
  const boxY = cursor.y + NOTE_COMPONENT_PADDING_Y;
  const noteGeo: NoteGeo = {
    kind: 'note',
    x: tile.x,
    y: boxY,
    width: tile.width,
    height: Math.trunc(textHeight),
    text: event.text,
    textRuns: rows.map((r) => offsetRun(r, tile.x + tile.textDx, boxY + padding.top)),
    minX: tile.minX,
    maxX: tile.maxX,
    ...(event.color !== undefined ? { color: event.color } : {}),
    ...(event.shape !== undefined ? { shape: event.shape } : {}),
    ...(shadow > 0 ? { shadow } : {}),
  };
  ctx.eventGeos.push(noteGeo);
  // `NoteTile#getPreferredHeight:175-180` is the component's height and
  // nothing else -- no spacing either side -- and that is `getTextHeight +
  // 2 * getPaddingY + deltaShadow` (`ComponentRoseNote:88-91`,
  // `...NoteBox:62-65`; the shadow only for `note`, see
  // `sequence-layout-note-shadow.ts`).
  cursor.y += textHeight + NOTE_COMPONENT_PADDING_Y * 2 + reserve;
}
