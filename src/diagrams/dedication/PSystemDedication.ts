/**
 * `PSystemDedication` — a dedication image, alone on the page.
 *
 * `new UImage(new PixelImage(portableImage, TYPE_BILINEAR))` is a port
 * `UImage` carrying its raster size; the port's `UImage` has no
 * `calculateDimension`, so upstream's (`new XDimension2D(getWidth(),
 * getHeight())`, each the raster size less one, `UImage.java:87-93`,
 * `:118-120`) is computed here from that raster size, as
 * `core/error/error-block.ts#imageBlock` does.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/PSystemDedication.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import type { RasterImage } from '../../core/error/raster-image.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { UImage } from '../../core/klimt/shape/UImage.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { UgSimpleDiagram } from '../../core/UgSimpleDiagram.js';

/** `image.getImage().getWidth() - 1` / `getHeight() - 1`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/UImage.java:87-93 */
const RASTER_INSET = 1;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/PSystemDedication.java:73 */
const DESCRIPTION = '(Dedication)';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/PSystemDedication.java:51 */
export class PSystemDedication extends UgSimpleDiagram {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/PSystemDedication.java:53 */
  private readonly image: UImage;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/PSystemDedication.java:55-58 */
  constructor(source: UmlSource, portableImage: RasterImage, preprocessing: PreprocessingArtifact) {
    super(source, preprocessing);
    const { width, height, href } = portableImage;
    this.image = UImage.build(width, height, href, { rasterWidth: width, rasterHeight: height });
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/PSystemDedication.java:60-64 */
  drawU(ug: UGraphic): void {
    ug.draw(this.image);
  }

  /** `image.calculateDimension(stringBounder)` (UImage.java:118-120).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/PSystemDedication.java:66-70 */
  calculateDimension(_stringBounder: StringBounder): XDimension2D {
    return new XDimension2D(this.image.getWidth() - RASTER_INSET, this.image.getHeight() - RASTER_INSET);
  }

  /** `DiagramDescription` reduced to its text.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dedication/PSystemDedication.java:72-74 */
  getDescription(): string {
    return DESCRIPTION;
  }
}
