import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder } from './tile.js';
import { TileLeaf } from './tile.js';
import type { Theme } from '../../../core/theme.js';

// Local until ast.ts is extended
interface ActivityLabel {
  kind: 'label';
  name: string;
  swimlane?: string;
}

export class GtileLabel extends TileLeaf {
  readonly kind = 'gtile-label' as const;
  readonly name: string;
  readonly width: number;
  readonly height: number;

  constructor(node: ActivityLabel, bounder: StringBounder, theme: Theme) {
    super();
    this.name = node.name;
    // A `label`/`goto` target resolves `of(root, element, activityDiagram,
    // goto)` (`ftile/Swimlanes.java:248,270`), and `plantuml.skin` carries
    // NO `goto` block at any scope -- verified by grep, not assumed -- so
    // the name inherits the root `FontSize 14` (:10) verbatim. The previous
    // `- 2` was unsourced. Read straight from the theme rather than through
    // `activityFontSize`: there is no `goto` SName in that resolver's union
    // and no bucket for it, so routing it there would invent a scope
    // upstream does not have.
    const measured = bounder.getDimension(node.name, theme.fontSize);
    this.width = measured.width + 16;
    this.height = measured.height + 8;
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
      /* c8 ignore next 3 */
      default: {
        const _exhaustive: never = hook;
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * Has an out point: `FtileLabel` does not override
   * `calculateDimensionFtile`, so it inherits `FtileEmpty`'s.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileLabel.java:40
   *   -- `class FtileLabel extends FtileEmpty` with no override.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileEmpty.java:91-92
   *   -- `calculateDimensionEmpty()`, five-argument `FtileGeometry` with
   *   `outY = height`.
   */
  hasPointOut(): boolean {
    return true;
  }
}
