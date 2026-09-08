import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { Theme } from '../../../core/theme.js';
import { NODE_MARGIN_Y } from '../activity-layout-constants.js';
import { activityFontSize } from '../activity-style-defaults.js';

const H_PAD = 12;

export class GtileGroup extends TileComposite {
  // Widened to `string` so subclasses (e.g. GtilePartition) can override
  // with a narrower literal while remaining assignable to this base type.
  readonly kind: string = 'gtile-group';
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];
  readonly titleHeight: number;
  readonly bodyOffsetX: number;
  readonly bodyOffsetY: number;

  constructor(title: string, body: Tile, bounder: StringBounder, theme: Theme) {
    super();
    this.children = [body];
    // A group/partition frame resolves `of(root, element, activityDiagram,
    // <symbol>, composite)` (`ftile/vcompact/FtileGroup.java:89-92`), and
    // `activityDiagram { composite { ... } }` (plantuml.skin:364-368)
    // declares LineColor, BackgroundColor and LineThickness but NO FontSize
    // -- so the title inherits the root `FontSize 14` (:10), which is what
    // `activityFontSize` returns for a kind declaring none. Routed through
    // the resolver rather than left as a bare `theme.fontSize` so a user's
    // `<style> activityDiagram { composite { FontSize N } }` reaches it.
    const titleMeasured = bounder.getDimension(title, activityFontSize(theme, 'composite'));
    const TITLE_H = titleMeasured.height + 8;
    this.titleHeight = TITLE_H;
    this.width = Math.max(body.width + 2 * H_PAD, titleMeasured.width + 2 * H_PAD);
    this.bodyOffsetX = H_PAD;
    this.bodyOffsetY = TITLE_H + NODE_MARGIN_Y;
    this.height = this.bodyOffsetY + body.height + H_PAD;
  }

  getCoord(hook: HookName): GPoint {
    const cx = this.width / 2;
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: cx, y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: cx, y: this.height };
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
}
