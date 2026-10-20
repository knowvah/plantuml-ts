/**
 * {@link paintOf}: the reads the `skin/rose/ComponentRose*` classes make off a
 * resolved sequence `Style`. Split out of `sequence-skin-param.ts`, which is
 * past the 500-line cap (sdd1 T3e); that module re-exports both names, so its
 * importers are unchanged.
 */
import { ColorMapper, toSvgPaint } from '../../core/klimt/color/ColorMapper.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import { bridgeFontConfiguration } from '../../core/klimt/font/FontConfigurationBridge.js';
import type { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { Paint } from '../../core/paint.js';
import type { Style } from '../../core/style/Style.js';
import type { HColor, HColorSet } from '../../core/style/Value.js';
import { PAINT_NONE } from '../../core/svg.js';

/**
 * What a `ComponentRose*` reads off its `Style`, resolved. Colours are the
 * paint the klimt SVG driver emits (`HColor#toSvg`, IDENTITY mapper, then
 * `SvgGraphics#fixColor`); a gradient stays a gradient `Paint`.
 */
export interface SequencePaint {
  readonly stroke: Paint;
  readonly thickness: number;
  readonly dash: readonly number[] | undefined;
  readonly fill: Paint;
  readonly roundCorner: number;
  readonly diagonalCorner: number;
  readonly padding: ClockwiseTopRightBottomLeft;
  readonly margin: ClockwiseTopRightBottomLeft;
  readonly font: FontConfiguration;
  readonly shadowing: number;
  readonly align: HorizontalAlignment | undefined;
}

/**
 * `ug.apply(color)`'s SVG paint: the style layer's colours are simple or
 * gradient (Java's cast otherwise). A transparent one is `none`: `HColor#toSvg`
 * spells it as the alpha-0 hex (`HColor.java:74-76`) and `SvgGraphics#fixColor`
 * writes that as `none` for every stroke and every `WITH_FILL_NONE` fill
 * (`SvgGraphics.java:521-541`), the spelling the port's klimt layer compares
 * (`DriverPathSvg.java:64-68`, `ActorStickMan.ts`'s `Back('none')`).
 */
function svgPaint(color: HColor): Paint {
  if (color instanceof HColorSimple && color.isTransparent()) return PAINT_NONE;
  if (color instanceof HColorSimple || color instanceof HColorGradient) return toSvgPaint(color, ColorMapper.IDENTITY);
  throw new Error('ClassCastException: a style colour is a simple or gradient colour');
}

/**
 * The reads, each where upstream makes it:
 * - stroke: `getColorLine()` (AbstractComponent.java:101-103) /
 *   `getSymbolContext` fore (Style.java:274-276);
 * - fill: `getColorBackGround()` (AbstractComponent.java:105-107) /
 *   `getSymbolContext` back (Style.java:271-273);
 * - thickness, dash: `getStroke()` (AbstractComponent.java:117-119,
 *   Style.java:299-320);
 * - roundCorner, diagonalCorner: `value(...).asInt()`
 *   (AbstractComponent.java:109-115; ComponentRoseParticipant.java:73-74);
 * - padding: `style.getPadding()` (ComponentRoseParticipant.java:71,
 *   Rose.java:134); margin: `getMargin()` (Rose.java:135);
 * - font: `getFontConfiguration(set)` (AbstractComponent.java:129-131);
 * - shadowing: `getShadowing()` (AbstractComponent.java:121-123);
 * - align: `getHorizontalAlignment()` (AbstractComponent.java:133-135).
 *
 * Each is read on access, as a component reads only what it draws: an
 * eager read would throw where upstream never reads — e.g. a lifeline's
 * `BackGroundColor` is dark-only (`@media (prefers-color-scheme:dark)
 * { sequenceDiagram { lifeLine { BackGroundColor black } } }`,
 * plantuml.skin:607-609), so `asColor` is `ValueImpl.java`'s
 * IllegalArgumentException, and `ComponentRoseLine` reads only its line
 * colour (ComponentRoseLine.java:66-67).
 */
export function paintOf(style: Style, colorSet: HColorSet): SequencePaint {
  return {
    get stroke() {
      return svgPaint(style.value('LineColor').asColor(colorSet));
    },
    get thickness() {
      return style.getStroke().getThickness();
    },
    get dash() {
      return style.getStroke().getDasharraySvg();
    },
    get fill() {
      return svgPaint(style.value('BackGroundColor').asColor(colorSet));
    },
    get roundCorner() {
      return style.value('RoundCorner').asInt();
    },
    get diagonalCorner() {
      return style.value('DiagonalCorner').asInt();
    },
    get padding() {
      return style.getPadding();
    },
    get margin() {
      return style.getMargin();
    },
    get font() {
      return bridgeFontConfiguration(style.getFontConfiguration(colorSet));
    },
    get shadowing() {
      return style.getShadowing();
    },
    get align() {
      return style.getHorizontalAlignment();
    },
  };
}
