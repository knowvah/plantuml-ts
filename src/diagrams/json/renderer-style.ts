/**
 * The json family's styles, read once per diagram into plain values the
 * renderer only draws with.
 *
 * Every value comes from the `Style` the jar reads it from, resolved by
 * `json-style-resolve.ts` at the jar's six signatures and carried on
 * `JsonGeometry.styles`: the node (`TextBlockJson.java:269-288`), its
 * separator (`:286-288`), the per-cell font styles (`getStyleToUse`,
 * `:138-152`) and the arrow (`SmetanaForJson.java:119-122`). Resolution and
 * drawing are separate stages upstream too (`drawU` resolves `styleNode` and
 * `styleSeparator` before it walks the rows), which is why this lives apart
 * from `renderer.ts`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/TextBlockJson.java#drawU
 */

import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import { ColorMapper, toSvgPaint } from '../../core/klimt/color/ColorMapper.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { fmt } from '../../core/svg-format.js';
import { noGradient } from '../../core/paint.js';
import type { Paint } from '../../core/paint.js';
import type { PName } from '../../core/style/PName.js';
import type { Style } from '../../core/style/Style.js';
import { canonicalColor } from './color-form.js';
import { styleToUse } from './json-style-resolve.js';
import type { JsonStyleSet } from './json-style-resolve.js';

/** The resolved box values — everything drawn as a shape. */
export interface BoxStyleJson {
  /** `node`'s `BackGroundColor`; a gradient when written `a-b` (`TextBlockJson.java:283`). */
  bg: Paint;
  /** `node`'s `LineColor` (`applyStrokeAndLineColor`, `TextBlockJson.java:270`). */
  border: Paint;
  /** `node`'s `LineThickness`. */
  borderWidth: number;
  /** `node`'s `LineStyle`, as the comma-separated SVG dasharray. */
  borderDash: string | undefined;
  /** `RoundCorner / 2` — see {@link SVG_CORNER_DIVISOR}. */
  rx: number;
  /** The `node+separator` style's `LineColor`, `LineThickness` and `LineStyle`. */
  sepColor: Paint;
  sepThickness: number;
  sepDash: string | undefined;
}

/** The resolved text values the node itself decides. */
export interface TextStyleJson {
  /** `node`'s `HorizontalAlignment` — one alignment places both columns (`TextBlockJson.java:313,320`). */
  align: 'left' | 'center' | 'right';
  /**
   * `node`'s `FontSize`. Every cell draws with its OWN style's size
   * ({@link CellPaint}); `scale` is applied at emit.
   */
  fontSize: number;
}

/**
 * What one cell's `<text>` is painted with: the font of the style the cell was
 * MEASURED with (`getTextBlock(getStyleToUse(header, highlighted), …)`,
 * `TextBlockJson.java:123-131,340-349`). Unscaled; `scale` is applied at emit.
 */
export interface CellPaint {
  fontFamily: string;
  fontSize: number;
  fill: Paint;
  /** The raw CSS weight, absent at 400 (`DriverTextSvg.java:106-108`). */
  fontWeight: number | undefined;
  italic: boolean;
}

/** The arrow's stroke, from `root,element,<T>,arrow` (`SmetanaForJson.java:119-122`). */
export interface ArrowStyleJson {
  /** `LineColor`, first stop only for a gradient (`DriverLineSvg.java:76-82`). */
  color: string;
  thickness: number;
  /** `LineStyle`, as the comma-separated SVG dasharray. */
  dash: string | undefined;
}

export interface NodeStyleJson {
  box: BoxStyleJson;
  text: TextStyleJson;
  arrow: ArrowStyleJson;
  /**
   * The `<highlight>` row fill: `node+highlight` (stereotype applied), the
   * non-header style (`TextBlockJson.java:296-299`).
   */
  highlightFill(styleClass: string): Paint;
  /** The paint of one cell; memoised per diagram. */
  cell(header: boolean, highlight: string | false): CellPaint;
}

/**
 * `URectangle#rounded(round)` stores `round` on both axes, and
 * `DriverRectangleSvg.java:78` emits `rx/2`, `ry/2`. So the skin's
 * `node { RoundCorner 10 }` reaches the SVG as `rx="5" ry="5"` — which is what
 * every cached golden shows.
 */
export const SVG_CORNER_DIVISOR = 2;

/** `skin/plantuml.skin`'s `yamlDiagram,jsonDiagram { FontColor black }` (the block at :446), in emitted form. */
export const JSON_SKIN_BLACK = '#000000';

/** `node.getHorizontalAlignment()` as the lowercase form `renderer.ts#cellTextX` branches on. */
const ALIGNMENTS = {
  [HorizontalAlignment.LEFT]: 'left',
  [HorizontalAlignment.CENTER]: 'center',
  [HorizontalAlignment.RIGHT]: 'right',
} as const;

/** The CSS weight `FontStyle`/`FontWeight` leave a plain cell at (`DriverTextSvg.java:106`). */
const NORMAL_CSS_WEIGHT = 400;

/**
 * A style colour as the paint the shape emitters take: `HColor#toSvg` for a
 * solid (shortened to the jar's `#RGB` form, `color-form.ts`), the gradient's
 * two stops otherwise — which the core path lifts into `<defs>`
 * (`svg-defs.ts#extractGradientDefs`; decisions D5).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverRectangleSvg.java:83-99
 */
function paintOf(style: Style, name: PName): Paint {
  const color = style.value(name).asColor(HColorSet.instance());
  // `HColorSet` builds only these two (`HColorSet.java:109-117`); anything else is a broken invariant.
  if (!(color instanceof HColorSimple || color instanceof HColorGradient)) {
    throw new Error(`json style: ${name} is neither a simple nor a gradient colour`);
  }
  const paint = toSvgPaint(color, ColorMapper.IDENTITY);
  return typeof paint === 'string' ? canonicalColor(paint) : paint;
}

/**
 * `Style#getStroke`'s dash as the comma-separated SVG dasharray (`UStroke
 * #getDasharraySvg`), or `undefined` for a solid line.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java:299-320
 */
function dashOf(style: Style): string | undefined {
  const dash = style.getStroke().getDasharraySvg();
  return dash === undefined ? undefined : `${fmt(dash[0])},${fmt(dash[1])}`;
}

function resolveBox(node: Style, separator: Style): BoxStyleJson {
  return {
    bg: paintOf(node, 'BackGroundColor'),
    border: paintOf(node, 'LineColor'),
    borderWidth: node.getStroke().getThickness(),
    borderDash: dashOf(node),
    // TextBlockJson.java:281
    rx: node.value('RoundCorner').asDouble() / SVG_CORNER_DIVISOR,
    sepColor: paintOf(separator, 'LineColor'),
    sepThickness: separator.getStroke().getThickness(),
    sepDash: dashOf(separator),
  };
}

function resolveArrow(arrow: Style): ArrowStyleJson {
  return {
    // SmetanaForJson.java:172
    color: noGradient(paintOf(arrow, 'LineColor')),
    thickness: arrow.getStroke().getThickness(),
    dash: dashOf(arrow),
  };
}

/** One cell's paint from the style `getStyleToUse` picks. */
function resolveCell(style: Style): CellPaint {
  const font = style.getUFont();
  const face = font.getFontFace();
  return {
    fontFamily: font.getFontStack().getSvgFamily(),
    fontSize: font.getSize(),
    fill: paintOf(style, 'FontColor'),
    fontWeight: face.cssWeight === NORMAL_CSS_WEIGHT ? undefined : face.cssWeight,
    italic: face.italic,
  };
}

/** Resolve every style the renderer reads, once per diagram. */
export function resolveNodeStyle(styles: JsonStyleSet): NodeStyleJson {
  const cells = new Map<string, CellPaint>();
  return {
    box: resolveBox(styles.node, styles.separator),
    text: {
      // HorizontalAlignment.fromString answered null: upstream's `.draw` would NPE (TextBlockJson.java:313).
      align: ALIGNMENTS[styles.node.getHorizontalAlignment() ?? HorizontalAlignment.LEFT],
      fontSize: styles.node.getUFont().getSize(),
    },
    arrow: resolveArrow(styles.arrow),
    highlightFill: (styleClass) => paintOf(styles.highlight(styleClass, false), 'BackGroundColor'),
    cell(header, highlight) {
      const key = `${String(header)}|${highlight === false ? '' : `#${highlight}`}`;
      const cached = cells.get(key);
      if (cached !== undefined) return cached;
      const paint = resolveCell(styleToUse(styles, header, highlight));
      cells.set(key, paint);
      return paint;
    },
  };
}
