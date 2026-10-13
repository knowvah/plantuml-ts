/**
 * `PSystemListArchimateSprites` -- the `listsprite` page: every vendored
 * `sprites/<folder>/` file drawn as `<$folder/name> name (fmt)`, split into 4
 * columns by `getCols`.
 *
 * Adaptations, each forced by the port (decisions.md D5, ADR-2):
 * - `ResourcesUtils.getJarFile("sprites", ...)` walks the classpath at runtime;
 *   the port reads the generated {@link ARCHIMATE_SPRITE_NAMES} (same order,
 *   same `.png`/`.svg` filter and name/format split, java:64-73).
 * - `GraphicStrings.createBlackOnWhite(current)` reads `/sprites/**` from the
 *   classpath (`SpriteContainerEmpty.java:58-61`); the port hands it the
 *   internal sprite store instead. `getCols` (PSystemDonors.ts) returns raw
 *   columns, wrapped here as java:146-154 wraps them.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSprites.java
 */
import type { UmlSource } from '../../block-extractor.js';
import { getCols } from '../../../diagrams/donors/PSystemDonors.js';
import type { InternalSpriteStore } from '../../internal-sprite-store.js';
import type { PreprocessingArtifact } from '../../tim/PreprocessingArtifact.js';
import { UgDiagram } from '../../UgDiagram.js';
import type { StringBounder } from '../font/StringBounder.js';
import { VerticalAlignment } from '../geom/VerticalAlignment.js';
import { GraphicStrings } from '../shape/GraphicStrings.js';
import type { TextBlock } from '../shape/TextBlock.js';
import { TextBlockHorizontal } from '../shape/TextBlockHorizontal.js';
import { ARCHIMATE_SPRITE_NAMES } from './archimate-sprite-names.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSprites.java:105 */
const COLUMN_COUNT = 4;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSprites.java:77 */
const RESERVED = 0;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSprites.java:119 */
const DESCRIPTION = '(Sprites)';

/** java:56-59 (the three header lines and the blank one). */
const HEADER_LINES: readonly string[] = [
  '<b>List Current Sprites',
  '<i>Credit to',
  'http://www.archimatetool.com',
  ' ',
];

/** The page's lines: header, then per folder its title, a blank and one row per sprite.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSprites.java:56-75 */
export function listArchimateSpritesLines(): string[] {
  const lines = [...HEADER_LINES];
  let current: string | undefined;
  for (const { folder, name, format } of ARCHIMATE_SPRITE_NAMES) {
    if (folder !== current) {
      current = folder;
      lines.push(`<u>${folder}</u> :`, ' ');
    }
    lines.push(`<$${folder}/${name}> ${name} (${format})`);
  }
  return lines;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSprites.java:50 */
export class PSystemListArchimateSprites extends UgDiagram {
  /** `sprites` is port-only: the classpath stand-in (see the file header). */
  constructor(
    source: UmlSource,
    preprocessing: PreprocessingArtifact,
    private readonly sprites?: InternalSpriteStore,
  ) {
    super(source, preprocessing);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSprites.java:55-80 */
  getTextBlock(_num: number, _stringBounder: StringBounder): TextBlock {
    const cols = getCols(listArchimateSpritesLines(), COLUMN_COUNT, RESERVED).map((col) =>
      GraphicStrings.createBlackOnWhite(col, { sprites: this.sprites }),
    );
    return new TextBlockHorizontal(cols, VerticalAlignment.TOP);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/PSystemListArchimateSprites.java:118-120 */
  getDescription(): string {
    return DESCRIPTION;
  }
}
