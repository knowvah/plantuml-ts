/**
 * A sequence note's tile: `NoteTile` (teoz) over the three `ComponentRoseNote*`
 * components -- the component's padding, the tile's x, and the extent the
 * note contributes to the document. Pure arithmetic; the event handler that
 * measures the body and pushes the geometry is `sequence-layout-note.ts`.
 *
 * Teoz is the only sequence path (`cli/GlobalConfig.java:47 FORCE_TEOZ`).
 *
 * The three styles differ in the text padding handed to
 * `AbstractTextualComponent` (`topRightBottomLeft(top, right, bottom, left)`):
 *
 * - `note`  -> `ComponentRoseNote.java:66-70`: `(5, 15, 5, 6)`, or `(5, 15, 5,
 *   15)` when the text alignment is CENTER.
 * - `rnote` -> `ComponentRoseNoteBox.java:58`, `(4, 4, 4, 4)`.
 * - `hnote` -> `ComponentRoseNoteHexagonal.java:58`, `(4, 12, 4, 12)`.
 *
 * `getTextWidth` is the block plus those two (`AbstractTextualComponent
 * .java:100-108`); the component's `getPreferredWidth` adds `2 * getPaddingX()`
 * (`ComponentRoseNote.java:83-87` and `...NoteBox.java:67-70`,
 * `...NoteHexagonal.java:67-70`), 5 for all three (`Rose.java:65`,
 * `...NoteBox.java:73`, `...NoteHexagonal.java:73`), and `note` also the delta
 * shadow. `AbstractComponent#drawU:140-141` translates the drawing by that
 * `getPaddingX()`, so the box starts 5 right of the tile.
 */
import type { NoteEvent, ParticipantGeo } from './ast.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { LIVE_DELTA_SIZE } from './sequence-layout-shared.js';

/** `Rose.paddingX` (`Rose.java:65`) and the literal `5` of the other two
 *  components' `getPaddingX()`: the tile-to-box inset. */
export const NOTE_COMPONENT_PADDING_X = 5;

/** `Rose.paddingY` (`Rose.java:66`, passed at `:115`) and the literal `5` of
 *  the other two components' `getPaddingY()`: the tile-to-box inset below the
 *  tile top, and again below the box in `getPreferredHeight`. */
export const NOTE_COMPONENT_PADDING_Y = 5;

/** A component's text padding. */
export interface NotePadding {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

/** The component's text padding for `style` under `align` (see the header).
 *  Only `note` consults the alignment (`ComponentRoseNote.java:66-70`). */
export function notePadding(style: NoteEvent['style'], align: HorizontalAlignment): NotePadding {
  if (style === 'rnote') return { top: 4, bottom: 4, left: 4, right: 4 };
  if (style === 'hnote') return { top: 4, bottom: 4, left: 12, right: 12 };
  return { top: 5, bottom: 5, left: align === HorizontalAlignment.CENTER ? 15 : 6, right: 15 };
}

/** Everything {@link noteTile} needs, resolved by the caller. */
export interface NoteTileInput {
  readonly event: NoteEvent;
  /** The creole block's width (`textBlock.calculateDimension`). */
  readonly blockWidth: number;
  readonly padding: NotePadding;
  /** The `note` style's delta shadow, reserved by `getPreferredWidth`. */
  readonly reserve: number;
  /** `livingSpace1.getLevelAt(...)`, the live level at the note. */
  readonly level: number;
  readonly participantMap: ReadonlyMap<string, ParticipantGeo>;
  /** The text alignment `Rose.createComponentNote` resolved (`Rose.java
   *  :100-112`) when it was set explicitly (skinparam), else `undefined`. */
  readonly explicitAlign: HorizontalAlignment | undefined;
  /** The alignment with its LEFT default applied. */
  readonly align: HorizontalAlignment;
}

/** The horizontal facts of one note tile. */
export interface NoteTile {
  /** The drawn box's x: tile x + `getPaddingX()`. */
  readonly x: number;
  /** The drawn box's width (`x2`, `...Note.java:109-115`). */
  readonly width: number;
  /** Where the text block starts, relative to the box. */
  readonly textDx: number;
  readonly minX: number;
  readonly maxX: number;
}

/** A participant's `posB`/`posC`/`posD` as this port holds them. 0 for an id
 *  with no participant (the pre-existing fallback). */
function posOf(map: ReadonlyMap<string, ParticipantGeo>, id: string | undefined): [number, number, number] {
  const p = id === undefined ? undefined : map.get(id);
  return p === undefined ? [0, 0, 0] : [p.x, p.centerX, p.x + p.width];
}

/**
 * `posD(2) - posB(1)` as it stands BEFORE the x line is solved.
 *
 * `PlayingSpace`'s constructor (`teoz/PlayingSpace.java:94-95`) takes the
 * tile's `getMinX()`/`getMaxX()` while the participants still sit at their
 * initial values, and `getMinX` -> `getX().addFixed(-getUsedWidth() / 2)`
 * bakes the width in as a plain number. A participant row starts as
 * `xcurrent = posD.addAtLeast(0)` (`SequenceDiagramFileMakerTeoz.java:96`), so
 * each `posB` begins at the previous `posD` -- the head widths laid end to
 * end, no gaps, no message room -- and the span a `note over` two
 * participants sees there is the sum of the head widths from the first
 * through the second. Everything the document extent is built from
 * (`SequenceDiagramFileMakerTeoz.java:82`, `PlayingSpace.java:94-95`) carries
 * THAT width; only the drawing (`NoteTile#drawU:127-138`), which calls
 * `getX` again after the solve, sees the final one.
 * Jar-verified: a 23-wide head over a 253-wide one draws its note from x=5
 * yet places the first head at x=62.509, the offset of the stale span
 * (`tests/fixtures/isw-T2b-seq/note-stale-span.svg`).
 */
function initialSpan(map: ReadonlyMap<string, ParticipantGeo>, first: string | undefined, last: string | undefined) {
  const widths = [...map.values()].map((p) => p.width);
  const ids = [...map.keys()];
  const sum = (to: number): number => widths.slice(0, to).reduce((acc, w) => acc + w, 0);
  const i1 = first === undefined ? -1 : ids.indexOf(first);
  const i2 = last === undefined ? -1 : ids.indexOf(last);
  return sum(i2 + 1) - sum(i1);
}

/** `NoteTile#getX` (`:155-173`). */
function tileX(event: NoteEvent, used: number, level: number, c1: number, c2: number): number {
  switch (event.position) {
    case 'left':
      return c1 - used;
    case 'right':
      return c1 + level * LIVE_DELTA_SIZE;
    case 'over':
      return event.participants.length > 1 ? (c1 + c2) / 2 - used / 2 : c1 - used / 2;
  }
}

/** The inputs of {@link noteExtent}. */
interface ExtentInput {
  readonly preferred: number;
  readonly x: number;
  readonly used: number;
  readonly c1: number;
  readonly c2: number;
  readonly b1: number;
  readonly d2: number;
}

/** `NoteTile#getMinX/getMaxX` (`:278-296`). Only `over` two participants
 *  differs from the drawn tile, by the stale width of {@link initialSpan}. */
function noteExtent(
  event: NoteEvent,
  i: ExtentInput,
  map: ReadonlyMap<string, ParticipantGeo>,
): { minX: number; maxX: number } {
  if (!isSeveral(event)) return { minX: i.x, maxX: i.x + i.used };
  const stale = Math.max(i.preferred, initialSpan(map, event.participants[0], event.participants.at(-1)));
  const x = (i.c1 + i.c2) / 2 - stale / 2;
  return { minX: Math.min(x, i.b1), maxX: Math.max(x + stale, i.d2) };
}

/** `NotePosition.OVER_SEVERAL`: `over` with a second participant. */
function isSeveral(event: NoteEvent): boolean {
  return event.position === 'over' && event.participants.length > 1;
}

/**
 * Where the text block starts, relative to the drawn box.
 * `ComponentRoseNote#drawInternalU:128-136` branches on the resolved
 * `position` alignment; `...NoteBox:105` and `...NoteHexagonal` always take
 * the CENTER arm, `getOldPaddingX1() + diffX / 2`. `position` is the text
 * alignment, except `OVER_SEVERAL` forces CENTER unless the skin set one
 * (`Rose.java:100-112`).
 */
function textOffset(i: NoteTileInput, used: number, preferred: number, textWidth: number): number {
  const centred = i.padding.left + (used - preferred) / 2;
  if (i.event.style === 'rnote' || i.event.style === 'hnote') return centred;
  const position = isSeveral(i.event) && i.explicitAlign === undefined ? HorizontalAlignment.CENTER : i.align;
  if (position === HorizontalAlignment.LEFT) return i.padding.left;
  if (position === HorizontalAlignment.RIGHT) return used - textWidth;
  return centred;
}

/** Port of `NoteTile` + the component's draw arithmetic. */
export function noteTile(input: NoteTileInput): NoteTile {
  const { event, blockWidth, padding, reserve, level, participantMap } = input;
  const textWidth = blockWidth + padding.left + padding.right;
  const preferred = textWidth + 2 * NOTE_COMPONENT_PADDING_X + reserve;
  const several = isSeveral(event);
  const [b1, c1] = posOf(participantMap, event.participants[0]);
  const [, c2, d2] = posOf(participantMap, several ? event.participants.at(-1) : undefined);
  // `NoteTile#getUsedWidth` (`:140-153`).
  const used = several ? Math.max(preferred, d2 - b1) : preferred;
  const x = tileX(event, used, level, c1, c2);
  // `...Note.java:105-108,112-115`: `(int) getTextWidth`, or `(int) (area -
  // 2 * getPaddingX())` once the area is wider than preferred.
  const width = Math.trunc(used > preferred ? used - 2 * NOTE_COMPONENT_PADDING_X : textWidth);
  return {
    x: x + NOTE_COMPONENT_PADDING_X,
    width,
    textDx: textOffset(input, used, preferred, textWidth),
    ...noteExtent(event, { preferred, x, used, c1, c2, b1, d2 }, participantMap),
  };
}

/**
 * A note written under a message, `top`/`bottom` (`over` here): upstream's
 * `CommunicationTileNoteTop`/`...Bottom` (`teoz/CommunicationTileNoteBottomTopAbstract
 * .java`), which stack the note beside the message tile and connect it with a
 * dashed line. NOT ported: the box keeps the placement this port gave every
 * `over` note before `NoteTile` was ported -- 10 either side of the span of
 * the message's two lifelines, text 10 in -- and contributes no extent.
 */
export function legacyOverTile(input: NoteTileInput): NoteTile {
  const { event, participantMap } = input;
  const centers = event.participants.map((id) => posOf(participantMap, id)[1]);
  const lo = Math.min(...centers);
  const hi = Math.max(...centers);
  return { x: lo - 10, width: Math.trunc(hi - lo + 20), textDx: 10, minX: lo - 10, maxX: lo - 10 };
}
