import type { Gradient, Paint } from '../../paint.js';
import { getGrayScaleColor, getGrayScaleColorReverse } from './ColorUtils.js';
import { parseSimpleColor, toSvgHex, type ResolvedColor } from './HColorSet.js';
import { HColorSimple } from './HColorSimple.js';

/**
 * ColorMapper — the last step every drawn colour passes through
 * (`HColorSimple#toColor(mapper)` → `mapper.fromColorSimple(this)`,
 * HColorSimple.java:172-176).
 *
 * Ported arms: `IDENTITY`, `DARK_MODE`, `MONOCHROME`, `MONOCHROME_REVERSE`
 * — the ones `TitledDiagram#muteColorMapper` returns for `skinparam mode
 * dark` / `monochrome true|reverse` (TitledDiagram.java:291-297). Not
 * ported: `TEAVM_LIGHT`, `TEAVM_DARK`, `LIGTHNESS_INVERSE`,
 * `reverse(ColorOrder)` (the `reversecolor` arms, java:300-311).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorMapper.java:42-101
 */
export interface ColorMapper {
  fromColorSimple(simple: HColorSimple): ResolvedColor;
}

/** The as-const table of upstream's `public static final` mappers. */
export const ColorMapper = {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorMapper.java:47-52 */
  IDENTITY: {
    fromColorSimple: (simple: HColorSimple): ResolvedColor => simple.getAwtColor(),
  },
  /** The `@media dark` partner, else the colour itself (`darkSchemeTheme`).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorMapper.java:68-73 */
  DARK_MODE: {
    fromColorSimple: (simple: HColorSimple): ResolvedColor => (simple.darkSchemeTheme() as HColorSimple).getAwtColor(),
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
