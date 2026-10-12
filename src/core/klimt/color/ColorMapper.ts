import type { Gradient, Paint } from '../../paint.js';
import { getReverse, type ColorOrder } from './ColorOrder.js';
import { getGrayScaleColor, getGrayScaleColorReverse } from './ColorUtils.js';
import { getReversed } from './fragment-color-mapper.js';
import { HColorGradient } from './HColorGradient.js';
import { parseSimpleColor, toSvgHex, type ResolvedColor } from './HColorSet.js';
import { HColorSimple } from './HColorSimple.js';

/** `XColor(int r, int g, int b)`'s alpha. */
const OPAQUE = 255;

/**
 * ColorMapper — the last step every drawn colour passes through
 * (`HColorSimple#toColor(mapper)` → `mapper.fromColorSimple(this)`,
 * HColorSimple.java:172-176).
 *
 * Ported arms: `IDENTITY`, `DARK_MODE`, `LIGTHNESS_INVERSE`, `MONOCHROME`,
 * `MONOCHROME_REVERSE` and `reverse(ColorOrder)` — every mapper
 * `TitledDiagram#muteColorMapper` returns (TitledDiagram.java:291-313). Not
 * ported: `TEAVM_LIGHT`, `TEAVM_DARK` (TeaVM runtime only).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorMapper.java:42-101
 */
export interface ColorMapper {
  fromColorSimple(simple: HColorSimple): ResolvedColor;
}

/** The as-const table of upstream's `public static final` mappers. */
const MAPPERS = {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorMapper.java:47-52 */
  IDENTITY: {
    fromColorSimple: (simple: HColorSimple): ResolvedColor => simple.getAwtColor(),
  },
  /** The `@media dark` partner, else the colour itself (`darkSchemeTheme`).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorMapper.java:68-73 */
  DARK_MODE: {
    fromColorSimple: (simple: HColorSimple): ResolvedColor => (simple.darkSchemeTheme() as HColorSimple).getAwtColor(),
  },
  /** `ColorUtils.getReversed` (HSLuv lightness flip), opaque: `new XColor(r, g, b)`,
   *  ColorUtils.java:139-167.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorMapper.java:74-79 */
  LIGTHNESS_INVERSE: {
    fromColorSimple: (simple: HColorSimple): ResolvedColor => ({ ...getReversed(simple.getAwtColor()), a: OPAQUE }),
  },
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorMapper.java:80-85 */
  MONOCHROME: {
    fromColorSimple: (simple: HColorSimple): ResolvedColor => getGrayScaleColor(simple.getAwtColor()),
  },
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorMapper.java:86-91 */
  MONOCHROME_REVERSE: {
    fromColorSimple: (simple: HColorSimple): ResolvedColor => getGrayScaleColorReverse(simple.getAwtColor()),
  },
} as const satisfies Record<string, ColorMapper>;

/** `public static ColorMapper reverse(ColorOrder)`: `order.getReverse(awtColor)`,
 *  opaque (`new XColor(...)`, ColorOrder.java:66-69).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorMapper.java:93-100 */
function reverse(order: ColorOrder): ColorMapper {
  return {
    fromColorSimple: (simple: HColorSimple): ResolvedColor => ({
      ...getReverse(order, simple.getAwtColor()),
      a: OPAQUE,
    }),
  };
}

/** Upstream's `ColorMapper` statics: the constant mappers plus `reverse(order)`. */
export const ColorMapper = { ...MAPPERS, reverse } as const;

/** `HColor#toSvg(mapper)` for one solid colour string: transparent stays
 *  `#00000000` without consulting the mapper (HColor.java:74-79); a string
 *  that is not a colour literal is returned unchanged. */
function mapSolid(color: string, mapper: ColorMapper): string {
  const resolved = parseSimpleColor(color);
  if (resolved === undefined) return color;
  const simple = HColorSimple.create(resolved);
  if (simple.isTransparent()) return '#00000000';
  return toSvgHex(mapper.fromColorSimple(simple));
}

/**
 * PORT-ONLY adapter: `HColor#toSvg(mapper)` over the port's `Paint` seam
 * (the substrate carries `Paint`, not `HColor` — `klimt/UParam.ts`). A
 * gradient maps both stops, as `SvgGraphics` does for the background
 * (`gr.getColor1().toRGB(option.getColorMapper())`, SvgGraphics.java:181-182).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColor.java:74-79
 */
export function mapPaint(paint: Paint, mapper: ColorMapper): Paint {
  if (typeof paint === 'string') return mapSolid(paint, mapper);
  const gradient: Gradient = {
    color1: mapSolid(paint.color1, mapper),
    color2: mapSolid(paint.color2, mapper),
    policy: paint.policy,
  };
  return gradient;
}

/**
 * PORT-ONLY: what the klimt substrate carries where upstream carries an
 * `HColor` (`Fore`/`Back`, `UParam#getColor`/`getBackcolor`, `SvgOption`'s
 * background, `UText`'s font colour). A `Paint` stands for an `HColor` built
 * from its spelling (no dark partner); an `HColorSimple`/`HColorGradient` is
 * the upstream object itself, mapped at draw time by the `UGraphic`'s
 * {@link ColorMapper} (`AbstractUGraphic.java:145`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColor.java:55
 */
export type HColorOrPaint = Paint | HColorSimple | HColorGradient;

/**
 * `HColor#toSvg(mapper)` over {@link HColorOrPaint}: an `HColorSimple` maps
 * with its dark partner (HColor.java:74-79); an `HColorGradient` maps both
 * stops with `toRGB(mapper)` (DriverRectangleSvg.java:87-90). A `Paint` is
 * returned as-is under `IDENTITY` — `IDENTITY.fromColorSimple` is the colour
 * itself (ColorMapper.java:47-52), and leaving the spelling untouched keeps
 * every `Paint` caller's emission byte-identical — and through
 * {@link mapPaint} under any other mapper.
 */
export function toSvgPaint(color: HColorOrPaint, mapper: ColorMapper): Paint {
  if (color instanceof HColorSimple) return color.toSvg(mapper);
  if (color instanceof HColorGradient) return color.asPaint(mapper);
  return mapper === ColorMapper.IDENTITY ? color : mapPaint(color, mapper);
}

/** {@link toSvgPaint} for one solid colour string: as-is under `IDENTITY`,
 *  else `HColor#toSvg(mapper)` of the colour it spells (HColor.java:74-79). */
export function toSvgSolid(color: string, mapper: ColorMapper): string {
  return mapper === ColorMapper.IDENTITY ? color : mapSolid(color, mapper);
}
