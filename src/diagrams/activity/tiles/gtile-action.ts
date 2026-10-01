import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import { TileLeaf } from './tile.js';
import type { StringBounder } from './tile.js';
import type { ActivityAction } from '../ast.js';
import type { Theme } from '../../../core/theme.js';
import { activityBoxHeight, activityFontSize, activityPadding } from '../activity-style-defaults.js';
import { activityMinimumWidth } from '../activity-text-style.js';
import { creoleTextLines } from '../../../core/svek/image/creole-text-lines.js';
import type { StringMeasurer, FontSpec } from '../../../core/measurer.js';
import { isTableRowLine, tableRowCellsOf } from '../activity-text-placement.js';

/** `StripeTable.java:82`: `new AtomWithMargin(table, 2, 2)` -- the merged
 *  creole table's own +2-top/+2-bottom margin, added ONCE per `FtileBox`
 *  whose entire label is a single `StripeTable` stripe (this task's two
 *  assigned rows, `activity-creole-table`/`niletu-83-lego826`, are both
 *  all-table labels; a label MIXING table and plain-text physical lines
 *  needs per-stripe margin accounting this constructor does not attempt).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomWithMargin.java:49 */
const TABLE_BLOCK_MARGIN_Y = 4;

/** `WidthTableMeasurer`-shaped adapter over this tile's own injected
 *  `StringBounder` (`tile.js`'s `getDimension(text, fontSizePt)`) -- the
 *  seam `creoleTextLines` needs ({@link StringMeasurer}'s
 *  `measure(text, font)`) is a different, wider shape. `getDescent`'s
 *  `size/4.5` is `StringBounder.java:47`'s own documented default, already
 *  cited by `activity-renderer-shapes.ts#ASCENT_FRACTION`; the seam only
 *  reads it for a `<back:gradient>` patch no row this task owns reaches. */
function measurerAdapterOf(bounder: StringBounder): StringMeasurer {
  return {
    measure: (text, font) => bounder.getDimension(text, font.size),
    getDescent: (font) => font.size / 4.5,
  };
}

/**
 * One physical line's content width -- the RESOLVED creole width, not the
 * literal (bracket/pipe-including) source text: `FtileBox
 * #calculateDimensionFtile` (`ftile/vertical/FtileBox.java:237-243`) sizes
 * the box from the `Display#create8`-built `TextBlock`, which for a
 * `[[url]]` line is `CommandCreoleUrl`'s resolved label/url/trailing-text
 * run sequence (`CommandCreoleUrl.ts`, consumed by `creoleTextLines` via
 * `buildLineAtoms`) and for a `|cell|` line is `StripeTable`'s own stripped
 * cell content (`activity-text-placement.ts#tableRowCellsOf`,
 * `StripeTable.java:137-159`) -- every other line (the overwhelming
 * majority of this port's corpus) keeps the pre-existing literal-text
 * measurement unchanged.
 */
function creoleLineWidth(line: string, bounder: StringBounder, theme: Theme, fontSize: number): number {
  if (line.includes('[[')) {
    const font: FontSpec = { family: theme.fontFamily, size: fontSize };
    const built = creoleTextLines(line, font, measurerAdapterOf(bounder));
    return built[0]?.width ?? 0;
  }
  if (isTableRowLine(line)) {
    return tableRowCellsOf(line).reduce((sum, cell) => sum + bounder.getDimension(cell, fontSize).width, 0);
  }
  return bounder.getDimension(line, fontSize).width;
}

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
      : Math.max(...lines.map((l) => creoleLineWidth(l, bounder, theme, fontSize)));
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
    // `StripeTable.java:82`'s `AtomWithMargin(table, 2, 2)` -- see
    // `TABLE_BLOCK_MARGIN_Y`'s own doc comment for the all-table-lines scope.
    const isAllTableRows = !isCodeBlock && lineCount > 0 && lines.every((l) => isTableRowLine(l));
    const textHeight = lineHeight * lineCount + (isAllTableRows ? TABLE_BLOCK_MARGIN_Y : 0);
    this.height = activityBoxHeight(textHeight, 'activity');
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
   * Has an out point: an action box always continues the flow.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBox.java:237-241
   *   -- `calculateDimensionFtile` uses the five-argument `FtileGeometry`
   *   constructor with `outY = dimRaw.getHeight()`.
   */
  hasPointOut(): boolean {
    return true;
  }
}
