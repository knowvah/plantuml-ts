/**
 * `PSystemDonors` -- the `donors` page: a bold header, the donors list in
 * `COLS` columns (`getCols`) and the PlantUML logo in the bottom-right corner.
 *
 * Upstream decodes the `DONORS` constant at runtime (`getDonors`, java:156-170:
 * AsciiEncoder -> Brotli -> UTF-8 -> `replace('*', '.')` -> `StringTokenizer`);
 * the port reads the list decoded once (`donors-list.ts`, decisions.md D5).
 * `getCols` is also used by the openiconic and archimate listings.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { PLANTUML_LOGO } from '../../core/error/plantuml-logo.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { GraphicStrings } from '../../core/klimt/shape/GraphicStrings.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { UImage } from '../../core/klimt/shape/UImage.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { UgDiagram } from '../../core/UgDiagram.js';
import { DONORS } from './donors-list.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:70 */
const COLS = 6;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:71 */
const FREE_LINES = 6;

/** The gap added after each column (`dim.getWidth() + 10`).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:122,137 */
const COLUMN_GAP = 10;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:103 */
const HEADER = '<b>Special thanks to our sponsors and donors !';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:173 */
const DESCRIPTION = '(Donors)';

/** `UImage#getHeight()` is the raster height minus one -- the value the logo's y placement uses
 *  (the draw itself keeps the full 71 rows).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/UImage.java:91-93 */
const LOGO_PLACEMENT_HEIGHT = PLANTUML_LOGO.height - 1;

/** `PixelImage(PSystemVersion.getPlantumlImage(), TYPE_BILINEAR)` at its pixel size. */
function logoImage(): UImage {
  return UImage.build(PLANTUML_LOGO.width, PLANTUML_LOGO.height, PLANTUML_LOGO.href);
}

/**
 * The columns, header and logo block (java:106-144), a port of the anonymous
 * `TextBlock` `getTextBlock` returns.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:106-144
 */
class DonorsTextBlock implements TextBlock {
  private readonly cols: readonly TextBlock[] = getCols(DONORS, COLS, FREE_LINES).map((current) =>
    GraphicStrings.createBlackOnWhite(current),
  );

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:102-104 */
  private static header(): TextBlock {
    return GraphicStrings.createBlackOnWhite([HEADER]);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:110-129 */
  drawU(ug: UGraphic): void {
    const header = DonorsTextBlock.header();
    header.drawU(ug);
    const stringBounder = ug.getStringBounder();
    const below = ug.apply(UTranslate.dy(header.calculateDimension(stringBounder).getHeight()));
    let x = 0;
    let lastX = 0;
    let y = 0;
    for (const tb of this.cols) {
      const dim = tb.calculateDimension(stringBounder);
      tb.drawU(below.apply(UTranslate.dx(x)));
      lastX = x;
      x += dim.getWidth() + COLUMN_GAP;
      y = Math.max(y, dim.getHeight());
    }
    below.apply(new UTranslate(lastX, y - LOGO_PLACEMENT_HEIGHT)).draw(logoImage());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:131-142 */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    const header = DonorsTextBlock.header();
    let totalWidth = 0;
    let colsHeight = 0;
    for (const tb of this.cols) {
      const dim = tb.calculateDimension(stringBounder);
      totalWidth += dim.getWidth() + COLUMN_GAP;
      colsHeight = Math.max(colsHeight, dim.getHeight());
    }
    const headerHeight = header.calculateDimension(stringBounder).getHeight();
    return new XDimension2D(totalWidth, headerHeight + colsHeight);
  }
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:68 */
export class PSystemDonors extends UgDiagram {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:98-100 */
  constructor(source: UmlSource, preprocessing: PreprocessingArtifact) {
    super(source, preprocessing);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:102-104 */
  getHeader(): TextBlock {
    return GraphicStrings.createBlackOnWhite([HEADER]);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:106-144 */
  getTextBlock(_num: number, _stringBounder: StringBounder): TextBlock {
    return new DonorsTextBlock();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:172-174 */
  getDescription(): string {
    return DESCRIPTION;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:176-178 */
  static create(source: UmlSource, preprocessing: PreprocessingArtifact): PSystemDonors {
    return new PSystemDonors(source, preprocessing);
  }
}

/**
 * Splits `lines` into at most `nbCol` columns of `maxLine` lines each, where
 * `maxLine = (lines.size() + (nbCol - 1) + reserved) / nbCol` (Java `int`
 * division: every operand is a non-negative `int`, so `Math.trunc`).
 *
 * Upstream wraps each column in `GraphicStrings.createBlackOnWhite(current)`
 * and returns `List<TextBlock>`; this port returns the columns' lines (the
 * ufp `batch-0/overview.md` interface contract), and the caller wraps them.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/donors/PSystemDonors.java:146-154
 */
export function getCols(lines: readonly string[], nbCol: number, reserved: number): string[][] {
  const result: string[][] = [];
  const maxLine = Math.trunc((lines.length + (nbCol - 1) + reserved) / nbCol);
  for (let i = 0; i < lines.length; i += maxLine) {
    result.push(lines.slice(i, Math.min(lines.length, i + maxLine)));
  }
  return result;
}
