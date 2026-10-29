/**
 * The measuring half of `TextBlockJson#getTextBlock`: the font and wrap width a cell is built with come from
 * the cell's own merged `Style` (`getStyleToUse`), not from one diagram-wide font.
 *
 * Split out of `TextBlockJson.ts` (which sat against the 500-line cap) because resolving "which font does this
 * cell measure with" is separable from the row arithmetic that consumes it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/TextBlockJson.java:340-349
 */
import type { FontSpec as MeasurerFontSpec } from '../../core/measurer.js';
import type { Style } from '../../core/style/Style.js';
import { styleToUse, type JsonStyleSet } from './json-style-resolve.js';

/** `UFontFace#isBold`: CSS weight 700 and above. @see UFontFace.java:158-160 */
const BOLD_CSS_WEIGHT = 700;

/**
 * The font a cell is measured (and its `textLength` sized) with. `tabSize` is `skinparam tabSize`, which
 * upstream hangs off the `FontConfiguration` (`FontConfiguration#getTabSize`); it is consumed only by
 * `tab-stops.ts`.
 */
export interface CellFont extends MeasurerFontSpec {
  tabSize?: number;
}

/** One cell's font and the `MaximumWidth` its text block wraps at (`0` = no wrap). */
export interface CellMeasure {
  font: CellFont;
  wrap: number;
}

/** The two cells of a row: its key (`header` style) and its value (plain node style). */
export interface RowMeasure {
  key: CellMeasure;
  value: CellMeasure;
}

/**
 * `style.getFontConfiguration(...)`'s font and `style.wrapWidth()` for one cell, in the shape the measurer takes.
 * The family is `FontStack#getSvgFamily` (what the SVG writer emits), the face's bold / italic are
 * `FontConfiguration#getStyles` (`FontConfiguration.java:67-80`).
 * `LineBreakStrategy#getMaxWidth` is 0 for no `MaximumWidth`, a non-numeric one and `auto`
 * (`LineBreakStrategy.java:55-70`), none of which wrap in `getTextBlock`'s `create0`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/TextBlockJson.java:340-347
 */
export function cellMeasureOf(style: Style, tabSize: number | undefined): CellMeasure {
  const ufont = style.getUFont();
  const face = ufont.getFontFace();
  const font: CellFont = {
    family: ufont.getFontStack().getSvgFamily(),
    size: ufont.getSize(),
    ...(face.cssWeight >= BOLD_CSS_WEIGHT ? { weight: 'bold' as const } : {}),
    ...(face.italic ? { style: 'italic' as const } : {}),
    ...(tabSize === undefined ? {} : { tabSize }),
  };
  return { font, wrap: style.wrapWidth().getMaxWidth() };
}

/**
 * Both cells of a row at `getStyleToUse(true, highlighted)` / `getStyleToUse(false, highlighted)`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/TextBlockJson.java:123-131
 */
export function rowMeasureOf(styles: JsonStyleSet, highlight: string | false, tabSize: number | undefined): RowMeasure {
  return {
    key: cellMeasureOf(styleToUse(styles, true, highlight), tabSize),
    value: cellMeasureOf(styleToUse(styles, false, highlight), tabSize),
  };
}
