/**
 * svg-option.ts -- the `SvgOption` shape and the two small enums it carries.
 * Split out of `svg-graphics-core.ts` (line cap); re-exported from there so
 * existing import sites are unchanged. Pure move -- no logic differs.
 *
 * @see ~/git/plantuml/src/main/java/net/atmp/SvgOption.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/LengthAdjust.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java
 */

import type { ColorMapper, HColorOrPaint } from '../../color/ColorMapper.js';
import type { Dimension2D } from '../../shape/UEllipse.js';
import { DEFAULT_SVG_DECIMALS } from '../../../svg-format.js';
import type { RootLengthAdjust } from '../../../svg.js';

/** Upstream: `style/LengthAdjust.java` (a 3-value enum), ported as an
 * as-const object — too small for its own file. */
export const LengthAdjust = {
  NONE: 'NONE',
  SPACING: 'SPACING',
  SPACING_AND_GLYPHS: 'SPACING_AND_GLYPHS',
} as const;
export type LengthAdjust = (typeof LengthAdjust)[keyof typeof LengthAdjust];

/** The port's `SkinParam#getlengthAdjust` value as the klimt enum -- the same
 *  three names (`style/LengthAdjust.java:38-43`). */
const LENGTH_ADJUST_OF_ROOT: Readonly<Record<RootLengthAdjust, LengthAdjust>> = {
  spacing: LengthAdjust.SPACING,
  spacingAndGlyphs: LengthAdjust.SPACING_AND_GLYPHS,
  none: LengthAdjust.NONE,
};

/**
 * The `SvgOption` override for `skinParam.getlengthAdjust()`
 * (`TextBlockExporter.java:306-307` `option.withLengthAdjust(...)`); empty when
 * unset so `basicSvgOption`'s SPACING default stays implicit (lad D4).
 */
export function lengthAdjustOverride(adjust: RootLengthAdjust | undefined): Partial<SvgOption> {
  return adjust === undefined ? {} : { lengthAdjust: LENGTH_ADJUST_OF_ROOT[adjust] };
}

/** Upstream: the nested enum `HColor.TransparentFillBehavior`. */
export const TransparentFillBehavior = {
  WITH_FILL_NONE: 'WITH_FILL_NONE',
  WITH_FILL_OPACITY: 'WITH_FILL_OPACITY',
} as const;
export type TransparentFillBehavior = (typeof TransparentFillBehavior)[keyof typeof TransparentFillBehavior];

/** See the module doc comment above for the `net.atmp.SvgOption` adaptation. */
export interface SvgOption {
  readonly lengthAdjust: LengthAdjust;
  readonly preserveAspectRatio: string;
  readonly hover: string | null;
  readonly svgDimensionStyle: boolean;
  readonly minDim: Dimension2D;
  readonly backcolor: HColorOrPaint | undefined;
  /** `SvgOption.getColorMapper()` (net/atmp/SvgOption.java:62,219-221); unset = IDENTITY. */
  readonly colorMapper?: ColorMapper;
  readonly scale: number;
  readonly rootAttributes: ReadonlyMap<string, string>;
  readonly title: string | null;
  readonly desc: string | null;
  readonly interactiveBaseFilename: string | null;
  /** Upstream: `SvgOption.getDecimal()` (ADR-2: threaded, default `DEFAULT_SVG_DECIMALS`). */
  readonly decimal: number;
  /** Upstream: `SvgOption.getLinkTarget()` (`net/atmp/SvgOption.java:223`); unset = `_top`. */
  readonly linkTarget?: string;
}

/** Upstream: `SvgOption.basic()` — a `SvgOption` with upstream's
 * documented defaults, overridable per field. */
export function basicSvgOption(overrides: Partial<SvgOption> = {}): SvgOption {
  return {
    lengthAdjust: LengthAdjust.SPACING,
    preserveAspectRatio: 'none',
    hover: null,
    svgDimensionStyle: true,
    minDim: { width: 0, height: 0 },
    backcolor: undefined,
    scale: 1.0,
    rootAttributes: new Map(),
    title: null,
    desc: null,
    interactiveBaseFilename: null,
    decimal: DEFAULT_SVG_DECIMALS,
    ...overrides,
  };
}
