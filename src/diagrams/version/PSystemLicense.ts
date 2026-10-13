/**
 * `PSystemLicense` — the `license` page: `License#getText1` + `#getText2` as
 * one black-on-white `GraphicStrings`, or, when the licence carries a
 * distributor logo, the two halves around that logo.
 *
 * Upstream's private no-argument `getTextBlock()` (java:83-118) would collide
 * with `UgDiagram#getTextBlock(num, stringBounder)` (TS has no overloading by
 * arity); it is the module function {@link getTextBlock}, taking the licence
 * and logo it reads (`LicenseInfo.retrieveQuick()`,
 * `LicenseInfo.retrieveDistributorImage`, java:84-85) as parameters.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import type { RasterImage } from '../../core/error/raster-image.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { GraphicStrings } from '../../core/klimt/shape/GraphicStrings.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { UImage } from '../../core/klimt/shape/UImage.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { UgSimpleDiagram } from '../../core/UgSimpleDiagram.js';
import { License } from './License.js';
import type { LicenseInfo } from './LicenseInfo.js';
import { retrieveDistributorImage, retrieveQuick } from './LicenseInfo.js';

/** `DiagramDescription("(License)")`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:71 */
const DESCRIPTION = '(License)';

/** `UTranslate.dy(4 + ...)` and `4 + im.getHeight()`: the gap above the logo.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:102 */
const LOGO_GAP = 4;

/** `UTranslate.dx(20)` and `20 + im.getWidth()`: the logo's indent.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:103 */
const LOGO_INDENT = 20;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:66-68 */
function getGraphicStrings(strings: readonly string[]): TextBlock {
  return GraphicStrings.createBlackOnWhite(strings);
}

/**
 * The anonymous `TextBlock` around a distributor logo: the first half, a
 * 4px gap, the logo indented 20px, the second half.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:98-116
 */
class LicenseWithLogo implements TextBlock {
  constructor(
    private readonly result1: TextBlock,
    private readonly result2: TextBlock,
    private readonly im: UImage,
  ) {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:100-106 */
  drawU(ug: UGraphic): void {
    this.result1.drawU(ug);
    let moved = ug.apply(UTranslate.dy(LOGO_GAP + this.result1.calculateDimension(ug.getStringBounder()).getHeight()));
    moved.apply(UTranslate.dx(LOGO_INDENT)).draw(this.im);
    moved = moved.apply(UTranslate.dy(this.im.getHeight()));
    this.result2.drawU(moved);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:108-115 */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    const dim1 = this.result1.calculateDimension(stringBounder);
    const dim2 = this.result2.calculateDimension(stringBounder);
    const width = Math.max(Math.max(dim1.getWidth(), dim2.getWidth()), LOGO_INDENT + this.im.getWidth());
    const height = dim1.getHeight() + LOGO_GAP + this.im.getHeight() + dim2.getHeight();
    return new XDimension2D(width, height);
  }
}

/**
 * The page block for `licenseInfo`, with `logo` (`retrieveDistributorImage`)
 * when there is one; `new UImage(new PixelImage(logo, TYPE_BILINEAR))` draws
 * the raster at its pixel size (the `GraphicStrings` precedent).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:83-118
 */
export function getTextBlock(licenseInfo: LicenseInfo, logo: RasterImage | undefined): TextBlock {
  const license = License.getCurrent();
  if (logo === undefined)
    return getGraphicStrings([...license.getText1(licenseInfo), ...license.getText2(licenseInfo)]);
  const result1 = getGraphicStrings(license.getText1(licenseInfo));
  const result2 = getGraphicStrings(license.getText2(licenseInfo));
  return new LicenseWithLogo(result1, result2, UImage.build(logo.width, logo.height, logo.href));
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:56 */
export class PSystemLicense extends UgSimpleDiagram {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:58-60 */
  static create(source: UmlSource, preprocessing: PreprocessingArtifact): PSystemLicense {
    return new PSystemLicense(source, preprocessing);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:70-72 */
  getDescription(): string {
    return DESCRIPTION;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:74-76 */
  drawU(ug: UGraphic): void {
    this.licenseTextBlock().drawU(ug);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemLicense.java:78-81 */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    return this.licenseTextBlock().calculateDimension(stringBounder);
  }

  /** java:84-85: `LicenseInfo.retrieveQuick()` and its distributor logo. */
  private licenseTextBlock(): TextBlock {
    const licenseInfo = retrieveQuick();
    return getTextBlock(licenseInfo, retrieveDistributorImage(licenseInfo));
  }
}
