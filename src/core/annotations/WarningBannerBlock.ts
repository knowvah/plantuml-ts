/**
 * `DiagramChromeFactory#addWarnings` and its `WarningBannerBlock` — the
 * yellow banner `DiagramChromeFactory.create` draws ABOVE the raw text block
 * (its first step, before the mainframe/legend/title/caption/header/footer
 * `chrome.ts` composes), one monospace-10 line per warning message line.
 *
 * Unlike the other chrome steps this one is a klimt `TextBlock`: upstream
 * draws it through the export's own `UGraphic` — scaled, and wrapped in
 * `UGraphicHandwritten` when the diagram is handwritten
 * (TextBlockExporter.java:165-176) — so the banner rectangle jiggles with
 * the diagram. Split out of `chrome.ts` (over the file-length cap) along
 * upstream's own nested-class boundary.
 *
 * The export's `ColorMapper` (`TitledDiagram#muteColorMapper`) is applied
 * here, at the draw site, because the port's SVG layer does not map colours
 * (`u-graphic-svg.ts`'s dropped `getColorMapper()`); the banner's colours
 * are `withDark` pairs so `mode dark` picks the dark partner.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramChromeFactory.java:103,128,176-266
 */
import { Back } from '../klimt/Back.js';
import { Fore } from '../klimt/Fore.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import { UStroke } from '../klimt/UStroke.js';
import { UTranslate } from '../klimt/UTranslate.js';
import type { ColorMapper } from '../klimt/color/ColorMapper.js';
import { HColorSet, toSvgHex } from '../klimt/color/HColorSet.js';
import type { HColorSimple } from '../klimt/color/HColorSimple.js';
import { FontStack } from '../klimt/font/FontStack.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import { XDimension2D } from '../klimt/geom/XDimension2D.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import { URectangle } from '../klimt/shape/URectangle.js';
import { getFont, UText, type FontConfiguration } from '../klimt/shape/UText.js';
import type { Warning } from '../warning/Warning.js';

/** @see DiagramChromeFactory.java:212 */
const LINE_SPACING = 10;
/** @see DiagramChromeFactory.java:213 */
const CORNER_RADIUS = 5;
/** `UFontFactory.monospace(10)`. @see DiagramChromeFactory.java:103 */
const WARNING_FONT_SIZE = 10;
/** `UStroke.withThickness(3)`. @see DiagramChromeFactory.java:235 */
const BANNER_STROKE = 3;
/** `new UTranslate(3, 3)` for the rectangle. @see DiagramChromeFactory.java:235 */
const RECT_OFFSET = 3;
/** `effectiveWidth - 10` / `dim.getHeight() - 5`. @see DiagramChromeFactory.java:234 */
const RECT_WIDTH_INSET = 10;
const RECT_HEIGHT_INSET = 5;
/** `new UTranslate(10, 2)` for the text. @see DiagramChromeFactory.java:237 */
const TEXT_DX = 10;
const TEXT_DY = 2;
/** `new XDimension2D(width + 20, height + 10)`. @see DiagramChromeFactory.java:265 */
const DIM_WIDTH_PAD = 20;
const DIM_HEIGHT_PAD = 10;

/** `set.getColorOrWhite(light).withDark(set.getColorOrWhite(dark))`, drawn
 *  through `mapper` (`HColorSimple#toColor(mapper)`, HColorSimple.java:172-176). */
function mappedColor(light: string, dark: string, mapper: ColorMapper): string {
  const set = HColorSet.instance();
  const color = (set.getColorOrWhite(light) as HColorSimple).withDark(set.getColorOrWhite(dark)) as HColorSimple;
  return toSvgHex(mapper.fromColorSimple(color));
}

/**
 * The yellow warning banner.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramChromeFactory.java:207-266
 */
export class WarningBannerBlock implements TextBlock {
  private readonly warnings: readonly Warning[];
  private readonly mapper: ColorMapper;
  /** `FontConfiguration.blackBlueTrue(UFontFactory.monospace(10))`:
   *  `HColors.BLACK.withDark(HColors.WHITE)` (FontConfiguration.java:63-65). */
  private readonly warningFc: FontConfiguration;

  constructor(warnings: readonly Warning[], mapper: ColorMapper) {
    this.warnings = warnings;
    this.mapper = mapper;
    this.warningFc = {
      family: FontStack.MONOSPACE,
      size: WARNING_FONT_SIZE,
      color: mappedColor('000000', 'FFFFFF', mapper),
      styles: new Set(),
    };
  }

  /** `drawU(UGraphic)` is `drawU(ug, 0)` (java:220-223); the two Java
   *  overloads are one method with a defaulted `forceWidth`.
   *  @see DiagramChromeFactory.java:220-247 */
  drawU(ug: UGraphic, forceWidth = 0): void {
    const stringBounder = ug.getStringBounder();
    const dim = this.calculateDimension(stringBounder);
    const effectiveWidth = Math.max(dim.getWidth(), forceWidth);

    const back = mappedColor('ffffcc', '774400', this.mapper);
    const border = mappedColor('ffdd88', 'aa5500', this.mapper);

    const rect = URectangle.build(effectiveWidth - RECT_WIDTH_INSET, dim.getHeight() - RECT_HEIGHT_INSET).rounded(
      CORNER_RADIUS,
    );
    ug.apply(new Back(back))
      .apply(new Fore(border))
      .apply(UStroke.withThickness(BANNER_STROKE))
      .apply(new UTranslate(RECT_OFFSET, RECT_OFFSET))
      .draw(rect);

    let ugText = ug.apply(new Fore(this.warningFc.color!)).apply(new UTranslate(TEXT_DX, TEXT_DY));
    for (const w of this.warnings) {
      for (const s of w.getMessage()) {
        const height = stringBounder.calculateDimension(getFont(this.warningFc), s).getHeight();
        ugText = ugText.apply(UTranslate.dy(height));
        ugText.draw(UText.build(s, this.warningFc));
      }
      ugText = ugText.apply(UTranslate.dy(LINE_SPACING));
    }
  }

  /** @see DiagramChromeFactory.java:249-266 */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    let width = 0;
    let height = 0;
    for (const w of this.warnings) {
      for (const s of w.getMessage()) {
        const lineDim = stringBounder.calculateDimension(getFont(this.warningFc), s);
        width = Math.max(width, lineDim.getWidth());
        height += lineDim.getHeight();
      }
      height += LINE_SPACING;
    }
    // Remove trailing spacing from last warning
    if (this.warnings.length > 0) height -= LINE_SPACING;

    return new XDimension2D(width + DIM_WIDTH_PAD, height + DIM_HEIGHT_PAD);
  }
}

/**
 * `original` unchanged when there is no warning, else the banner stacked
 * above it at the full width, `original` translated down by the banner
 * height. (`getBackcolor` is not on the port's `TextBlock`.)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramChromeFactory.java:176-200
 */
export function addWarnings(original: TextBlock, warnings: readonly Warning[], mapper: ColorMapper): TextBlock {
  if (warnings.length === 0) return original;

  const warningBanner = new WarningBannerBlock(warnings, mapper);

  const block: TextBlock = {
    drawU(ug: UGraphic): void {
      const stringBounder = ug.getStringBounder();
      const totalWidth = block.calculateDimension(stringBounder).getWidth();
      warningBanner.drawU(ug, totalWidth);
      const bannerHeight = warningBanner.calculateDimension(stringBounder).getHeight();
      original.drawU(ug.apply(UTranslate.dy(bannerHeight)));
    },
    calculateDimension(stringBounder: StringBounder): XDimension2D {
      const dimBanner = warningBanner.calculateDimension(stringBounder);
      const dimOriginal = original.calculateDimension(stringBounder);
      return new XDimension2D(
        Math.max(dimBanner.getWidth(), dimOriginal.getWidth()),
        dimBanner.getHeight() + dimOriginal.getHeight(),
      );
    },
  };
  return block;
}
