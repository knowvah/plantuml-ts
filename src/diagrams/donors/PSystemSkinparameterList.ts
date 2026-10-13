/**
 * `PSystemSkinparameterList` -- the `skinparameters` page: every
 * `SkinParam.getPossibleValues()` key in 5 columns. The keys are read off the
 * pinned jar (`skinparameter-names.ts`, decisions.md D5).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { GraphicStrings } from '../../core/klimt/shape/GraphicStrings.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { UgDiagram } from '../../core/UgDiagram.js';
import { SKINPARAMETER_NAMES } from './skinparameter-names.js';

/** `getCols(getDonors(), 5)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:61 */
const COLS = 5;

/** The gap added after each column (`dim.getWidth() + 10`).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:71,81 */
const COLUMN_GAP = 10;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:105 */
const DESCRIPTION = '(Parameters)';

/**
 * Splits `lines` into at most `nbCol` columns of `maxLine = (size + nbCol - 1) / nbCol`
 * lines (Java `int` division), each a black-on-white block.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:89-97
 */
export function getCols(lines: readonly string[], nbCol: number): TextBlock[] {
  const result: TextBlock[] = [];
  const maxLine = Math.trunc((lines.length + (nbCol - 1)) / nbCol);
  for (let i = 0; i < lines.length; i += maxLine) {
    result.push(GraphicStrings.createBlackOnWhite(lines.slice(i, Math.min(lines.length, i + maxLine))));
  }
  return result;
}

/** The anonymous `TextBlock` of `getTextBlock`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:64-86 */
class SkinparameterListTextBlock implements TextBlock {
  private readonly cols: readonly TextBlock[] = getCols(SKINPARAMETER_NAMES, COLS);

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:65-73 */
  drawU(ug: UGraphic): void {
    const stringBounder = ug.getStringBounder();
    let x = 0;
    for (const tb of this.cols) {
      const dim = tb.calculateDimension(stringBounder);
      tb.drawU(ug.apply(UTranslate.dx(x)));
      x += dim.getWidth() + COLUMN_GAP;
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:75-85 */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    let totalWidth = 0;
    let maxHeight = 0;
    for (const tb of this.cols) {
      const dim = tb.calculateDimension(stringBounder);
      totalWidth += dim.getWidth() + COLUMN_GAP;
      maxHeight = Math.max(maxHeight, dim.getHeight());
    }
    return new XDimension2D(totalWidth, maxHeight);
  }
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:55 */
export class PSystemSkinparameterList extends UgDiagram {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:57-59 */
  constructor(source: UmlSource, preprocessing: PreprocessingArtifact) {
    super(source, preprocessing);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:61-87 */
  getTextBlock(_num: number, _stringBounder: StringBounder): TextBlock {
    return new SkinparameterListTextBlock();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:104-106 */
  getDescription(): string {
    return DESCRIPTION;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemSkinparameterList.java:108-110 */
  static create(source: UmlSource, preprocessing: PreprocessingArtifact): PSystemSkinparameterList {
    return new PSystemSkinparameterList(source, preprocessing);
  }
}
