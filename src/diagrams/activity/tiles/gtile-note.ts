import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileComposite, TileLeaf } from './tile.js';
import type { StringBounder, Tile } from './tile.js';
import type { ActivityNote } from '../ast.js';
import type { Theme } from '../../../core/theme.js';
import { NOTE_FOLD, NOTE_H_PAD, NOTE_OPALE_GAP } from '../activity-layout-constants.js';
import { activityFontSize } from '../activity-style-defaults.js';

export class GtileNote extends TileLeaf {
  readonly kind = 'gtile-note' as const;
  readonly width: number;
  readonly height: number;
  readonly text: string;
  readonly side: 'left' | 'right';

  constructor(node: ActivityNote, bounder: StringBounder, theme: Theme) {
    super();
    this.text = node.text;
    this.side = node.position;
    // The ROOT `note { FontSize 13 }` block (plantuml.skin:323): an activity
    // note resolves `SName.note` under `activityDiagram`
    // (`ftile/vcompact/FtileWithNoteOpale.java:89`,
    // `ftile/vcompact/FtileNoteAlone.java:77`), and `activityDiagram { }`
    // declares no `note` override, so the root value stands. Was
    // `theme.fontSize - 2` = 12, which moved the note the WRONG WAY: the
    // jar's note text is LARGER than its action text, not smaller.
    const measured = bounder.getDimension(node.text, activityFontSize(theme, 'note'));
    this.width = measured.width + 2 * NOTE_H_PAD + NOTE_FOLD;
    this.height = measured.height + NOTE_FOLD + 16;
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

  constructor(tile: Tile, note: GtileNote, withLink = true) {
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
    // `getTranslateForOpale` (`:177-193`): `yForNote` is CENTER-aligned
    // (`verticalAlignment.CENTER`, the default every simple-leaf predecessor
    // passes -- `InstructionSimple.java:111`/`InstructionStop.java:76`/
    // `InstructionStart.java:76`/`InstructionSpot.java:76`/
    // `InstructionEnd.java:71`; `InstructionSwitch.java:125`'s TOP is not
    // reached by any tile this composite wraps). `dx` mirrors `marge` on
    // the opposite side: `0` when LEFT, else `dimTotal.w - dimNote.w`.
    this.noteOffsetY = (this.height - note.height) / 2;
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
