/**
 * `PlainStringsDiagram` — a {@link UgDiagram} whose page is its `strings`
 * drawn black on white, optionally with an `image` at `imagePosition`
 * (`version`, the eggs). Subclasses fill the protected fields in their
 * constructor, as upstream's do.
 *
 * `PortableImage` is the port's `RasterImage` (`core/error/raster-image.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/PlainStringsDiagram.java
 */
import type { RasterImage } from './error/raster-image.js';
import type { StringBounder } from './klimt/font/StringBounder.js';
import type { GraphicPosition } from './klimt/geom/GraphicPosition.js';
import { GraphicStrings } from './klimt/shape/GraphicStrings.js';
import type { TextBlock } from './klimt/shape/TextBlock.js';
import { UgDiagram } from './UgDiagram.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/PlainStringsDiagram.java:48 */
export abstract class PlainStringsDiagram extends UgDiagram {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/PlainStringsDiagram.java:50 */
  protected image: RasterImage | undefined = undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/PlainStringsDiagram.java:51 */
  protected imagePosition: GraphicPosition | undefined = undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/PlainStringsDiagram.java:53 */
  protected readonly strings: string[] = [];

  /** Always the three-argument `createBlackOnWhite`, image or not.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/PlainStringsDiagram.java:59-62 */
  getTextBlock(_num: number, _stringBounder: StringBounder): TextBlock {
    return GraphicStrings.createBlackOnWhite(this.strings, this.image, this.imagePosition);
  }
}
