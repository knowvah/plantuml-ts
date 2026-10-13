/**
 * `PSystemListOpenIconic` — the `listopeniconic` page: a header, then one
 * `<&name> name` creole line per icon of `all.txt`, in 7 columns.
 *
 * `all.txt` is `OPENICONIC_ALL` (`openiconic-all.ts`, decisions.md D5): the
 * classpath read (java:66-73, :78-80) becomes the vendored list.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconic.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { VerticalAlignment } from '../../core/klimt/geom/VerticalAlignment.js';
import { GraphicStrings } from '../../core/klimt/shape/GraphicStrings.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { TextBlockHorizontal } from '../../core/klimt/shape/TextBlockHorizontal.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { UgDiagram } from '../../core/UgDiagram.js';
import { getCols } from '../donors/PSystemDonors.js';
import { OPENICONIC_ALL } from './openiconic-all.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconic.java:61-64 */
const HEADER: readonly string[] = ['<b>List Open Iconic', '<i>Credit to', 'https://useiconic.com/open', ' '];

/** `PSystemDonors.getCols(lines, 7, 0)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconic.java:74 */
const NB_COL = 7;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconic.java:74 */
const RESERVED = 0;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconic.java:83 */
const DESCRIPTION = '(Open iconic)';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconic.java:54 */
export class PSystemListOpenIconic extends UgDiagram {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconic.java:56-58 */
  constructor(source: UmlSource, preprocessing: PreprocessingArtifact) {
    super(source, preprocessing);
  }

  /**
   * The header lines, `"<&" + s + "> " + s` per `all.txt` line, the columns
   * (each a `GraphicStrings.createBlackOnWhite`, `PSystemDonors.java:150`),
   * laid side by side top-aligned.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconic.java:60-76
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:146-154
   */
  getTextBlock(_num: number, _stringBounder: StringBounder): TextBlock {
    const lines: string[] = [...HEADER];
    for (const s of OPENICONIC_ALL) lines.push(`<&${s}> ${s}`);
    const cols = getCols(lines, NB_COL, RESERVED).map((col) => GraphicStrings.createBlackOnWhite(col));
    return new TextBlockHorizontal(cols, VerticalAlignment.TOP);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/PSystemListOpenIconic.java:82-84 */
  getDescription(): string {
    return DESCRIPTION;
  }
}
