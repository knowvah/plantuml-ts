import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileLeaf } from './tile.js';
import type { StringBounder } from './tile.js';
import type { ActivityNote } from '../ast.js';
import type { Theme } from '../../../core/theme.js';
import { NOTE_FOLD, NOTE_H_PAD } from '../activity-layout-constants.js';
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
