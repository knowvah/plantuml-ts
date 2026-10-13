/**
 * `UgSimpleDiagram` — a {@link UgDiagram} that is its own `TextBlock`: the
 * subclass implements `calculateDimension`/`drawU`, and `getTextBlock` hands
 * back `this` (`final` upstream).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgSimpleDiagram.java
 */
import type { StringBounder } from './klimt/font/StringBounder.js';
import type { XDimension2D } from './klimt/geom/XDimension2D.js';
import type { TextBlock } from './klimt/shape/TextBlock.js';
import type { UGraphic } from './klimt/UGraphic.js';
import { UgDiagram } from './UgDiagram.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgSimpleDiagram.java:41 */
export abstract class UgSimpleDiagram extends UgDiagram implements TextBlock {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlock.java */
  abstract calculateDimension(stringBounder: StringBounder): XDimension2D;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/UDrawable.java */
  abstract drawU(ug: UGraphic): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgSimpleDiagram.java:47-50 */
  getTextBlock(_num: number, _stringBounder: StringBounder): TextBlock {
    return this;
  }
}
