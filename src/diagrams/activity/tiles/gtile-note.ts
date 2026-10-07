import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileComposite, TileLeaf } from './tile.js';
import type { StringBounder, Tile } from './tile.js';
import type { ActivityNote } from '../ast.js';
import type { Theme } from '../../../core/theme.js';
import { NOTE_MARGIN_X1, NOTE_MARGIN_X2, NOTE_MARGIN_Y, NOTE_OPALE_GAP } from '../activity-layout-constants.js';
import { activityFontFamily } from '../activity-text-style.js';
import { activityFontSize } from '../activity-style-defaults.js';
import { buildNoteTextBlock, klimtStringBounder, noteTextBlockDimension } from '../activity-creole-sheet.js';
import { measurerAdapterOf } from './gtile-action.js';

export interface OpaleBox {
  readonly width: number;
  readonly height: number;
}

/**
 * `Opale.java:89-96`: `getWidth`/`getHeight` size the note box from
 * `textBlock.calculateDimension`, where `textBlock` is the multi-line
 * creole sheet built over the note's own `Display`
 * (`FtileWithNoteOpale.java:147-150`) -- ONE `TextBlock` line per `\n` in
 * the source, never the whole string measured as a single run.
 *
 * add3-T3d (NOTE-CREOLE): {@link GtileNote} (the flow-attached note leaf)
 * now resolves creole markup (`**bold**`/`""mono""`/`~` escapes/lists) via
 * {@link measureOpaleCreole}, the real `Sheet`. `measureIfOwnNote` (the
 * if-composites' own LEFT/RIGHT Opale boxes, `FtileIfWithDiamonds.java
 * :83-109`, `FtileIfDown.java:116-120`, family IFNOTE) now does too
 * (add3-T3c): `createOpale` (`FtileIfWithDiamonds.java:113-130`) builds
 * the SAME real `Opale` over the real creole `Sheet` as `FtileWithNote
 * Opale`'s own `createOpale` call -- there was never a second, simpler
 * Java-side formula for the if-own note to justify the raw path. The
 * drawing side (`activity-renderer-shapes.ts#renderNote` ->
 * {@link renderNoteLabel}) already recomputes the SAME creole box at draw
 * time and falls back to the old raw renderer only on a size mismatch
 * (`activity-creole-sheet.ts`'s own doc comment); matching the sizer here
 * makes every if-own note take that real-Sheet path with no renderer
 * edit needed, closing the gap T3d's own doc comment (superseded by this
 * one) left for this task.
 */
/** A note the enclosing `if` owns (`ActivityIf.notes`), pre-measured at
 *  tile-building time -- `gtile-if-down.ts`/`gtile-if-with-links.ts` take
 *  this (never raw `bounder`/`theme`) so neither file needs its own font
 *  resolution, matching how both already take pre-built `Tile` children
 *  rather than raw AST. */
export interface IfOwnNote {
  readonly text: string;
  readonly position: 'left' | 'right';
  readonly box: OpaleBox;
}

/** `FtileIfWithDiamonds`/`FtileIfDown`'s own `createOpale` (both read the
 *  SAME note font, `Opale.java`'s `textBlock` built over `note.getDisplay()`
 *  the identical way `FtileWithNoteOpale` does -- `FtileIfWithDiamonds
 *  .java:113-130`, `FtileWithNoteOpale.java:146-150`). */
export function measureIfOwnNote(note: ActivityNote, bounder: StringBounder, theme: Theme): IfOwnNote {
  return { text: note.text, position: note.position, box: measureOpaleCreole(note.text, bounder, theme) };
}

export function measureOpaleText(text: string, bounder: StringBounder, fontSize: number): OpaleBox {
  const lines = text.split('\n');
  // `klimt/drawing/font/StringBounderFromWidthTable.java:71`'s
  // `calculateDimension` height is `size`, unconditionally -- the same
  // per-line advance `activity-renderer-shapes.ts#renderNote`'s
  // `textLines(..., noteSize, ...)` call already draws with.
  const lineHeight = bounder.getDimension('M', fontSize).height;
  const textWidth = Math.max(...lines.map((line) => bounder.getDimension(line, fontSize).width));
  const textHeight = lineHeight * lines.length;
  return { width: textWidth + NOTE_MARGIN_X1 + NOTE_MARGIN_X2, height: textHeight + 2 * NOTE_MARGIN_Y };
}

/**
 * {@link measureOpaleText}'s replacement for every caller that owns a
 * `Theme` (add3-T3d, NOTE-CREOLE): `Opale.calculateDimension` over the
 * REAL creole `Sheet` (`FtileWithNoteOpale.java:147-150`/`FtileNoteAlone
 * .java:114-117`, `activity-creole-sheet.ts#buildNoteTextBlock`) instead
 * of the raw `\n`-split string -- resolves `**bold**`/`""mono""`/`~`
 * escapes/lists, not just literal lines.
 *
 * {@link measureOpaleText} itself is UNCHANGED and still used by `tiles/
 * gtile-with-notes.ts` (NOTE-MULTI family): that file's own `GtileWithNotes`
 * constructor is threaded a bare `fontSize: number` by its two callers in
 * `layout/tile-layout-structural.ts`, which already HAVE a `Theme` in
 * scope there but are outside this task's write-set (`layout/**`) --
 * switching that chain to this function is a follow-on, not this commit.
 */
export function measureOpaleCreole(text: string, bounder: StringBounder, theme: Theme): OpaleBox {
  const font = { family: activityFontFamily(theme, 'note'), size: activityFontSize(theme, 'note') };
  const sheetBounder = klimtStringBounder(measurerAdapterOf(bounder), font);
  const tb = buildNoteTextBlock(text, theme);
  return noteTextBlockDimension(tb, sheetBounder);
}

export class GtileNote extends TileLeaf {
  readonly kind = 'gtile-note' as const;
  readonly width: number;
  readonly height: number;
  readonly text: string;
  readonly side: 'left' | 'right';
  /** add4-T1c: the note's own `#color` (BACK), drawn as the Opale fill by
   *  every wrap that overrides its style with `note.getColors()`
   *  (`FtileWithNoteOpale.java:137-139`, `FtileWithNotes.java:109-111`) --
   *  but NOT by a bare note leaf (`FtileNoteAlone.java:104-106` never
   *  calls `eventuallyOverride`), so `tile-coordinates.ts`'s own
   *  `'gtile-note'` walker deliberately does not read it. */
  readonly color: string | undefined;

  constructor(node: ActivityNote, bounder: StringBounder, theme: Theme) {
    super();
    this.text = node.text;
    this.side = node.position;
    this.color = node.color;
    // The ROOT `note { FontSize 13 }` block (plantuml.skin:323): an activity
    // note resolves `SName.note` under `activityDiagram`
    // (`ftile/vcompact/FtileWithNoteOpale.java:89`,
    // `ftile/vcompact/FtileNoteAlone.java:77`), and `activityDiagram { }`
    // declares no `note` override, so the root value stands. Was
    // `theme.fontSize - 2` = 12, which moved the note the WRONG WAY: the
    // jar's note text is LARGER than its action text, not smaller.
    // add3-T3d (NOTE-CREOLE): the real creole Sheet, not the raw `\n`-split
    // string -- see {@link measureOpaleCreole}'s own doc comment.
    const box = measureOpaleCreole(node.text, bounder, theme);
    this.width = box.width;
    this.height = box.height;
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.width / 2, y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: this.width / 2, y: this.height };
      case EAST_HOOK:
        return { x: this.width, y: this.height / 2 };
      case WEST_HOOK:
        return { x: 0, y: this.height / 2 };
      default: {
        const _exhaustive: never = hook;
        /* c8 ignore next */
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * Has an out point: `tile-layout.ts:79` always builds a `GtileNote` as
   * an in-flow node (this port has no notion of a legend-only note), which
   * corresponds to `NoteType.NOTE` below.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileNoteAlone.java:129-130
   *   -- `calculateDimensionFtile`'s `withOutPoint` branch, five-argument
   *   `FtileGeometry` with `outY = dimTotal.getHeight()`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileFactoryDelegatorAddNote.java:65-68
   *   -- `withOutPoint = note.getType() == NoteType.NOTE`, the default note
   *   kind.
   */
  hasPointOut(): boolean {
    return true;
  }
}

/** `klimt/geom/VerticalAlignment`'s two values a note wrap is ever built
 *  with: `CENTER` (every caller but one) and `TOP` (`InstructionSwitch
 *  .java:125`, the switch's own notes). */
export type NoteVerticalAlignment = 'center' | 'top';

/**
 * `FtileWithNoteOpale` (`ftile/vcompact/FtileWithNoteOpale.java:78-255`):
 * wraps the PRECEDING tile with a note balloon beside it -- never an
 * `Instruction`/AST sibling (`FtileFactoryDelegatorAddNote#addNote`,
 * `:56-71`). `tile-layout.ts#tileNodes` is the seam that builds this
 * instead of appending {@link GtileNote} to the sibling list once a
 * preceding tile exists. Mission `activity-divergence-drive-2` T3g
 * (family NOTE): was `tile-layout.ts` pushing {@link GtileNote} as a
 * plain `GtileTopDown` sibling, with a phantom sibling edge in and out
 * (`.agent-notes/T2b-opale-compress.md`).
 */
export class GtileNoteOpale extends TileComposite {
  readonly kind = 'gtile-note-opale' as const;
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];
  readonly note: GtileNote;
  /** `drawU`'s own `withLink` parameter (`FtileWithNoteOpale.java:125`,
   *  threaded in from `FtileWithNoteOpale.create`'s caller): `true` for
   *  every simple-leaf predecessor (`FtileFactoryDelegatorAddNote
   *  .java:70`, hardcoded `true`); `false` for a fork/merge predecessor
   *  (`InstructionFork.java:129`, hardcoded `false`) -- `tile-layout-
   *  structural.ts#tileNote`'s own `WRAP_NO_LINK_KINDS` decides which.
   *  `false` means no spike is ever drawn (`Opale#drawU`'s own `if
   *  (withLink == false) polygon = getPolygonNormal(...)`, `:109-110`). */
  readonly withLink: boolean;
  /** `getTranslate`'s own `(marge, yForFtile)` (`:155-167`): the wrapped
   *  tile's offset inside this composite. */
  readonly tileOffsetX: number;
  readonly tileOffsetY: number;
  /** `getTranslateForOpale`'s own `(dx, yForNote)` (`:177-193`). */
  readonly noteOffsetX: number;
  readonly noteOffsetY: number;
  /** The spike's far point (`pp2`, `drawU`'s own local `(dimNote.width +
   *  suppSpace, dimNote.height/2)` / `(-suppSpace, dimNote.height/2)`,
   *  `:205-215`), resolved through `getTranslateForOpale` into this
   *  composite's own local frame -- always the x-seam between the note and
   *  the wrapped tile, at the note's own vertical centre. Meaningless when
   *  {@link withLink} is `false` -- `tile-coordinates.ts` only reads it
   *  when `withLink` is `true`. */
  readonly spikeOffsetX: number;
  readonly spikeOffsetY: number;

  constructor(tile: Tile, note: GtileNote, withLink = true, verticalAlignment: NoteVerticalAlignment = 'center') {
    super();
    this.children = [tile];
    this.note = note;
    this.withLink = withLink;
    // `calculateDimensionInternal` (`:235-240`): `height = max(dimNote.h,
    // dimTile.h)`; `width = dimTile.w + dimNote.w + suppSpace`.
    this.height = Math.max(note.height, tile.height);
    this.width = tile.width + note.width + NOTE_OPALE_GAP;
    // `getTranslate` (`:155-167`): `yForFtile = (dimTotal.h - dimTile.h)/2`;
    // `marge = notePosition === LEFT ? dimNote.w + suppSpace : 0`.
    this.tileOffsetY = (this.height - tile.height) / 2;
    this.tileOffsetX = note.side === 'left' ? note.width + NOTE_OPALE_GAP : 0;
    // `getTranslateForOpale` (`:177-193`): `yForNote = (dimTotal.h -
    // dimNote.h) / 2` when CENTER (every simple-leaf predecessor --
    // `InstructionSimple.java:111` et al), else `0` -- add4-T1f: the
    // switch's own TOP (`InstructionSwitch.java:125`). `getTranslate`'s
    // `yForFtile` above is centred whatever the alignment. `dx` mirrors
    // `marge` on the opposite side: `0` when LEFT, else `dimTotal.w -
    // dimNote.w`.
    this.noteOffsetY = verticalAlignment === 'center' ? (this.height - note.height) / 2 : 0;
    this.noteOffsetX = note.side === 'left' ? 0 : this.width - note.width;
    // `pp2` resolved into this composite's local frame: the x-seam between
    // note and tile (= `tileOffsetX` when LEFT, `tileOffsetX + tile.width`
    // when RIGHT), at the note's own vertical centre
    // (`noteOffsetY + dimNote.height/2`).
    this.spikeOffsetX = note.side === 'left' ? this.tileOffsetX : this.tileOffsetX + tile.width;
    this.spikeOffsetY = this.noteOffsetY + note.height / 2;
    // `getSwimlaneIn`/`getSwimlaneOut` (`:101-107`) delegate to the wrapped
    // tile verbatim.
    if (tile.swimlane !== undefined) this.swimlane = tile.swimlane;
    if (tile.swimlaneOut !== undefined) this.swimlaneOut = tile.swimlaneOut;
  }

  getCoord(hook: HookName): GPoint {
    const tile = this.children[0]!;
    // `calculateDimensionFtile` (`:223-233`): `left = orig.getLeft() +
    // translate.getDx()`; `inY`/`outY` = `orig.getInY/OutY() +
    // translate.getDy()`.
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
   *  (`:228-232`): passes through the wrapped tile's out state unchanged. */
  hasPointOut(): boolean {
    return this.children[0]!.hasPointOut();
  }
}
