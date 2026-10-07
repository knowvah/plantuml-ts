import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileComposite } from './tile.js';
import type { StringBounder, Tile } from './tile.js';
import { measureOpaleText } from './gtile-note.js';

/** `TextBlockUtils.withMargin(opale, 10, 10)` -- a UNIFORM 10px margin on
 *  every side of each note's own Opale box, layered OUTSIDE Opale's own
 *  marginX1/X2/marginY.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWithNotes.java:134 */
const NOTE_STACK_MARGIN = 10;

/** One note's position in {@link ActivityNote}/{@link IfOwnNote} shape --
 *  deliberately narrower than importing `ActivityNote` so a caller can
 *  adapt ANY note-shaped source (a raw AST node, or a previously-built
 *  {@link GtileNote}'s own `text`/`side` fields) without a conversion
 *  object. */
export interface WithNotesEntry {
  readonly text: string;
  readonly position: 'left' | 'right';
}

/** One note's geometry within its own side's vertical stack -- the OUTER
 *  (marged) box's own top-left is `(0, y)` relative to the stack's own
 *  origin; the Opale box itself sits inset by {@link NOTE_STACK_MARGIN}. */
export interface StackedNote {
  readonly text: string;
  readonly opaleWidth: number;
  readonly opaleHeight: number;
  readonly outerWidth: number;
  readonly outerHeight: number;
  readonly y: number;
}

export interface NoteStack {
  readonly width: number;
  readonly height: number;
  readonly notes: readonly StackedNote[];
}

/** `TextBlockVertical#calculateDimensionSlow`/`drawU` (`:68-74,78-98`):
 *  width = max across the stack, height = sum, each block flush (no
 *  gap), centred horizontally within the stack's own max width --
 *  `XDimension2D#mergeTB` (`:94-98`), stacked top-to-bottom. `null` for
 *  an empty side (`FtileWithNotes.java:150-154`'s own `TextBlockUtils
 *  .empty(0, 0)`). */
function buildStack(notes: readonly WithNotesEntry[], bounder: StringBounder, fontSize: number): NoteStack | null {
  if (notes.length === 0) return null;
  let y = 0;
  let width = 0;
  const stacked: StackedNote[] = [];
  for (const note of notes) {
    const opale = measureOpaleText(note.text, bounder, fontSize);
    const outerWidth = opale.width + 2 * NOTE_STACK_MARGIN;
    const outerHeight = opale.height + 2 * NOTE_STACK_MARGIN;
    stacked.push({ text: note.text, opaleWidth: opale.width, opaleHeight: opale.height, outerWidth, outerHeight, y });
    width = Math.max(width, outerWidth);
    y += outerHeight;
  }
  return { width, height: y, notes: stacked };
}

interface WithNotesPlacement {
  readonly width: number;
  readonly height: number;
  readonly tileOffsetX: number;
  readonly tileOffsetY: number;
  readonly leftOffsetY: number;
  readonly rightOffsetX: number;
  readonly rightOffsetY: number;
}

/** Every derived field {@link GtileWithNotes}'s own constructor needs,
 *  pure-computed from the tile's own size plus its two (possibly `null`)
 *  stacks -- split out purely to keep the constructor's own CCN under
 *  the file's limit (matches `gtile-if-with-links.ts#computePlacement`'s
 *  own precedent: a dumb field-assignment constructor, all arithmetic in
 *  a pure function).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWithNotes.java:158-192,213-219 */
function computeWithNotesPlacement(tile: Tile, left: NoteStack | null, right: NoteStack | null): WithNotesPlacement {
  const leftWidth = left?.width ?? 0;
  const rightWidth = right?.width ?? 0;
  const leftHeight = left?.height ?? 0;
  const rightHeight = right?.height ?? 0;
  const width = tile.width + leftWidth + rightWidth;
  const height = Math.max(leftHeight, rightHeight, tile.height);
  return {
    width,
    height,
    tileOffsetX: leftWidth,
    tileOffsetY: (height - tile.height) / 2,
    leftOffsetY: (height - leftHeight) / 2,
    rightOffsetX: width - rightWidth,
    rightOffsetY: (height - rightHeight) / 2,
  };
}

/**
 * `FtileWithNotes` (`ftile/vcompact/FtileWithNotes.java:73-226`): wraps a
 * tile with ZERO OR MORE notes stacked on its LEFT and/or RIGHT, each its
 * own no-spike Opale box (`withLink=false` unconditionally, `:133`) plus
 * a 10px margin on every side (`:134`). Two distinct callers, same
 * class: `FtileWithNoteOpale.create`'s own `notes.size() > 1` arm (family
 * NOTE-MULTI -- a SECOND note on one instruction replaces the first
 * note's spiked `GtileNoteOpale` wrap entirely, never nests) and
 * `InstructionGroup#createFtile` (family GROUPNOTE -- always this shape,
 * even for exactly one note). No gap between the tile and either stack
 * (`suppSpace` is declared, `FtileWithNoteOpale.java:81`-adjacent, but
 * dead code in THIS class -- never read by `calculateDimensionInternal`,
 * confirmed by inspection). Vertical alignment is always CENTER (every
 * known caller passes it; no cohort row exercises TOP).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWithNotes.java
 */
export class GtileWithNotes extends TileComposite {
  readonly kind = 'gtile-with-notes' as const;
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];
  readonly left: NoteStack | null;
  readonly right: NoteStack | null;
  readonly tileOffsetX: number;
  readonly tileOffsetY: number;
  readonly leftOffsetY: number;
  readonly rightOffsetX: number;
  readonly rightOffsetY: number;

  constructor(tile: Tile, notes: readonly WithNotesEntry[], bounder: StringBounder, fontSize: number) {
    super();
    this.children = [tile];
    this.left = buildStack(notes.filter((n) => n.position === 'left'), bounder, fontSize);
    this.right = buildStack(notes.filter((n) => n.position === 'right'), bounder, fontSize);
    const placement = computeWithNotesPlacement(tile, this.left, this.right);
    this.width = placement.width;
    this.height = placement.height;
    this.tileOffsetX = placement.tileOffsetX;
    this.tileOffsetY = placement.tileOffsetY;
    this.leftOffsetY = placement.leftOffsetY;
    this.rightOffsetX = placement.rightOffsetX;
    this.rightOffsetY = placement.rightOffsetY;
    // `getSwimlaneIn`/`getSwimlaneOut` (`:87-97`) delegate to the wrapped
    // tile verbatim.
    if (tile.swimlane !== undefined) this.swimlane = tile.swimlane;
    if (tile.swimlaneOut !== undefined) this.swimlaneOut = tile.swimlaneOut;
  }

  getCoord(hook: HookName): GPoint {
    const tile = this.children[0]!;
    const left = tile.getCoord(NORTH_HOOK).x + this.tileOffsetX;
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: left, y: tile.getCoord(NORTH_HOOK).y + this.tileOffsetY };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: left, y: tile.getCoord(SOUTH_HOOK).y + this.tileOffsetY };
      case EAST_HOOK:
        return { x: this.width, y: this.height / 2 };
      case WEST_HOOK:
        return { x: 0, y: this.height / 2 };
      /* c8 ignore next 3 */
      default: {
        const _exhaustive: never = hook;
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /** `calculateDimensionFtile`'s own `if (orig.hasPointOut())` branch
   *  (`:206-210`): passes through the wrapped tile's out state unchanged. */
  hasPointOut(): boolean {
    return this.children[0]!.hasPointOut();
  }
}
