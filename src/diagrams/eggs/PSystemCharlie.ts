/**
 * `PSystemCharlie` — the "Je suis Charlie" picture, alone on the page.
 *
 * `new UImage(new PixelImage(PSystemVersion.getCharlieImage(), TYPE_BILINEAR))`
 * is a port `UImage` over `CHARLIE_PNG` (T0e, `charlie-image.ts`) carrying its
 * raster size; the port's `UImage` has no `calculateDimension`, so upstream's
 * (`new XDimension2D(getWidth(), getHeight())`, each the raster size less one,
 * `UImage.java:87-93`, `:118-120`) is computed here from that raster size, as
 * `core/error/error-block.ts#imageBlock` and `svek/image/Footprint.ts` do.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlie.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { UImage } from '../../core/klimt/shape/UImage.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { UgSimpleDiagram } from '../../core/UgSimpleDiagram.js';
import { CHARLIE_PNG } from './charlie-image.js';

/** `image.getImage().getWidth() - 1` / `getHeight() - 1`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/UImage.java:87-93 */
const RASTER_INSET = 1;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlie.java:59 */
const DESCRIPTION = '(Je Suis Charlie)';

/** `CHARLIE_PNG` as a data URI. */
const CHARLIE_HREF = `data:image/png;base64,${CHARLIE_PNG.png}`;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlie.java:49 */
export class PSystemCharlie extends UgSimpleDiagram {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlie.java:51 */
  private readonly image: UImage;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlie.java:53-56 */
  constructor(source: UmlSource, preprocessing: PreprocessingArtifact) {
    super(source, preprocessing);
    const { width, height } = CHARLIE_PNG;
    this.image = UImage.build(width, height, CHARLIE_HREF, { rasterWidth: width, rasterHeight: height });
  }

  /** `DiagramDescription` reduced to its text.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlie.java:58-60 */
  getDescription(): string {
    return DESCRIPTION;
  }

  /** `image.calculateDimension(stringBounder)` (UImage.java:118-120).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlie.java:62-65 */
  calculateDimension(_stringBounder: StringBounder): XDimension2D {
    return new XDimension2D(this.image.getWidth() - RASTER_INSET, this.image.getHeight() - RASTER_INSET);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemCharlie.java:67-70 */
  drawU(ug: UGraphic): void {
    ug.draw(this.image);
  }
}
