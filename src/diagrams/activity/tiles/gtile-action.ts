import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileLeaf } from './tile.js';
import type { StringBounder } from './tile.js';
import type { ActivityAction } from '../ast.js';
import type { Theme } from '../../../core/theme.js';
import { activityBoxHeight, activityFontSize, activityPadding } from '../activity-style-defaults.js';
import { activityMinimumWidth } from '../activity-text-style.js';

export class GtileAction extends TileLeaf {
  readonly kind = 'gtile-action' as const;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly color: string | undefined;

  constructor(node: ActivityAction, bounder: StringBounder, theme: Theme) {
    super();
    this.label = node.label;
    this.color = node.color;
    // Strip <code>/<\/code> wrapper lines — they are not rendered as content.
    const allLines = node.label.split('\n');
    const isCodeBlock = /^<code>$/i.test(allLines[0]?.trim() ?? '');
    const lines = allLines.filter((l) => !/^<\/?code>$/i.test(l.trim()));
    const lineCount = lines.length;
    // `activityDiagram { activity { FontSize 12 } }` (plantuml.skin:361).
    // Every BoxStyle -- plain and SDL alike -- is an `FtileBox`, and every
    // `FtileBox` resolves `SName.activity`
    // (`ftile/vertical/FtileBox.java:97-99`, `:146`).
    const fontSize = activityFontSize(theme, 'activity');
    // The per-line baseline ADVANCE is EXACTLY 1x the font size, which is
    // what the RENDERER has advanced at since `activity-element-granularity`
    // T3 (`activity-renderer-shapes.ts`'s ASCENT_FRACTION block):
    // `calculateDimension`'s returned height is `size`, unconditionally --
    // `klimt/drawing/font/StringBounderFromWidthTable.java:71`. This sizer
    // used `* 1.4` until `activity-style-defaults` D6, an unsourced constant
    // that reserved 40% more height than the renderer then drew into.
    const lineHeight = bounder.getDimension('M', fontSize).height;
    // Monospace chars are ~0.6× fontSize wide; proportional bounder underestimates
    // indented code lines because space glyphs are narrower than code chars.
    const monoCharWidth = fontSize * 0.6;
    const maxWidth = isCodeBlock
      ? Math.max(0, ...lines.map((l) => l.length * monoCharWidth))
      : Math.max(...lines.map((l) => bounder.getDimension(l, fontSize).width));
    // `FtileBox#calculateDimensionFtile` (`ftile/vertical/FtileBox.java
    // :237-243`) adds the resolved `Padding` to BOTH axes and floors the
    // WIDTH only -- `atLeast(minimumWidth, 0)`, a literal 0 for the height.
    // So there is no upstream minimum height, and the port's own
    // `ACTION_HEIGHT = 36` floor is deleted rather than lowered to the 32
    // the jar emits (D8): 32 is what this derivation RETURNS for one line
    // at FontSize 12 and Padding 10, which is corroboration, not a source.
    const pad = activityPadding('activity');
    // `FtileBox#calculateDimensionFtile` (`ftile/vertical/FtileBox.java
    // :237-243`) adds Padding to both axes and floors the WIDTH only via
    // `dimRaw.atLeast(minimumWidth, 0)`; `minimumWidth` resolves through
    // the shared `<style>`/`skinparam minClassWidth` cascade
    // (`activityMinimumWidth`, D1), whose own unset default is 0
    // (`style/ValueNull.java:61-63`) -- so by default this box imposes no
    // width floor at all, matching the jar.
    this.width = Math.max(maxWidth + 2 * pad, activityMinimumWidth(theme));
    this.height = activityBoxHeight(lineHeight * lineCount, 'activity');
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
}
