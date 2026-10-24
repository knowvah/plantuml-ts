import type { Paint } from '../../../paint.js';
import { Back } from '../../Back.js';
import { Fore } from '../../Fore.js';
import type { UGraphic } from '../../UGraphic.js';
import type { ColorResolver as PaintColorResolver } from '../../UGraphicWithScale.js';
import { UGraphicWithScale } from '../../UGraphicWithScale.js';
import type { ResolvedColor } from '../../color/HColorSet.js';
import type { StringBounder } from '../../font/StringBounder.js';
import { XDimension2D } from '../../geom/XDimension2D.js';
import { URectangle } from '../../shape/URectangle.js';
import type { TextBlock } from '../../shape/TextBlock.js';
import { UImageSvg } from '../../shape/UImageSvg.js';
import { ColorResolver, colorResolverToSvgHex } from '../ColorResolver.js';
import type { GrayLevelRange } from '../ColorResolver.js';
import { DefsCollector } from './sax-defs.js';
import { parseSaxEvents } from './sax-events.js';
import { RenderHandler } from './sax-render-handler.js';

/**
 * Zero-dependency SAX-based SVG parser (`!pragma svgparser sax`): two-pass
 * parsing, pass 1 collects definitions ({@link DefsCollector}), pass 2 renders
 * ({@link RenderHandler}). Feature-frozen at the SVG 1.1 core subset upstream.
 *
 * Not yet selected by any sprite path (T4f wires it).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSaxParser.java:101-185
 */

const MIN_GRAY_LEVEL = 0;
const MAX_GRAY_LEVEL = 255;
const PARSE_FAILURE = 'Failed to parse SVG';

/**
 * `UGraphicWithScale` declares its own `Paint`-typed resolver seam; the real
 * `ColorResolver` returns `ResolvedColor`. Same boundary adapter as
 * `SvgNanoParser.ts`'s private `PaintColorResolver` (hex string is a `Paint`).
 */
class PaintAdapter implements PaintColorResolver {
  constructor(private readonly inner: ColorResolver) {}

  getDefaultColor(): Paint {
    return colorResolverToSvgHex(this.inner.getDefaultColor());
  }

  getTrueColor(code: string): Paint {
    return colorResolverToSvgHex(this.inner.getTrueColor(code));
  }
}

/** @see SvgSaxParser.java:101 (class SvgSaxParser implements ISvgSpriteParser, GrayLevelRange) */
export class SvgSaxParser implements GrayLevelRange {
  constructor(private readonly svg: string) {}

  /**
   * A parse failure is rethrown wrapped, as upstream's
   * `RuntimeException("Failed to parse SVG", e)`; its preceding
   * `LOG.warning` (:117) has no carrier in `src/` (eslint no-console), the
   * original error travels as `cause`.
   *
   * @see SvgSaxParser.java:111-122
   */
  drawU(
    ug: UGraphic,
    scale: number,
    fontColor: ResolvedColor | undefined,
    forcedColor: ResolvedColor | undefined,
  ): void {
    const colorResolver = new ColorResolver(fontColor, forcedColor, this);
    const ugs = UGraphicWithScale.create(ug, new PaintAdapter(colorResolver), scale);
    try {
      this.parseSvg(this.svg, ugs, colorResolver);
    } catch (err) {
      throw new Error(PARSE_FAILURE, { cause: err });
    }
  }

  /**
   * The declared box times `scale`, drawn by replaying the sprite's primitives.
   *
   * @see SvgSaxParser.java:124-144
   */
  asTextBlock(
    fontColor: ResolvedColor | undefined,
    forcedColor: ResolvedColor | undefined,
    scale: number,
    backColor: Paint | undefined,
  ): TextBlock {
    const data = new UImageSvg(this.svg, scale);
    const width = data.getWidth();
    const height = data.getHeight();
    return {
      calculateDimension: (_stringBounder: StringBounder): XDimension2D => new XDimension2D(width, height),
      drawU: (ug: UGraphic): void => {
        if (backColor !== undefined) {
          ug.apply(new Back(backColor)).apply(new Fore(backColor)).draw(URectangle.build(width, height));
        }
        this.drawU(ug, scale, fontColor, forcedColor);
      },
    };
  }

  /** @see SvgSaxParser.java:146-149 */
  getMinGrayLevel(): number {
    return MIN_GRAY_LEVEL;
  }

  /** @see SvgSaxParser.java:151-154 */
  getMaxGrayLevel(): number {
    return MAX_GRAY_LEVEL;
  }

  /**
   * Parses SVG using two-pass SAX parsing. DOCTYPE and external entities are
   * refused by the event adapter (`SvgSaxParser.java:162-165`).
   *
   * @see SvgSaxParser.java:157-175
   */
  private parseSvg(svgContent: string, ugs: UGraphicWithScale, colorResolver: ColorResolver): void {
    const defsCollector = new DefsCollector();
    parseSaxEvents(svgContent, defsCollector);
    const renderer = new RenderHandler(ugs, colorResolver, defsCollector.getDefinitions());
    parseSaxEvents(svgContent, renderer);
  }
}
