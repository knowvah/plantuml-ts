import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder } from './tile.js';
import { TileLeaf } from './tile.js';
import type { Theme } from '../../../core/theme.js';

// Local until ast.ts is extended
interface ActivitySpot {
  kind: 'spot';
  name: string;
  color?: string;
  swimlane?: string;
}

import { CONNECTOR_SPOT_RADIUS as RADIUS } from '../activity-layout-constants.js';
import { activityFontSize } from '../activity-style-defaults.js';

export class GtileSpot extends TileLeaf {
  readonly kind = 'gtile-spot' as const;
  readonly name: string;
  readonly color: string | undefined;
  readonly width: number;
  readonly height: number;

  constructor(node: ActivitySpot, bounder: StringBounder, theme: Theme) {
    super();
    this.name = node.name;
    this.color = node.color;
    let width = RADIUS * 2;
    const height = RADIUS * 2;
    if (node.name) {
      // The connector spot resolves `of(root, element, activityDiagram,
      // circle, spot)` (`ftile/vcompact/VCompactFactory.java:103-105`,
      // `gtile/GtileCircleSpot.java:66`). The bare root `circle { }` block
      // is EMPTY (plantuml.skin:331-332) and the `activityDiagram { circle
      // { ... } }` block declares only thickness and colour, so the label
      // inherits the root `FontSize 14`. The previous `- 2` was unsourced.
      const m = bounder.getDimension(node.name, activityFontSize(theme, 'circle'));
      width = Math.max(width, m.width + 8);
    }
    this.width = width;
    this.height = height;
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
}
