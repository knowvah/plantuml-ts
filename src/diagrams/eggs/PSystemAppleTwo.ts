/**
 * `PSystemAppleTwo` — "Apple //e for ever !" over the Apple //e picture.
 *
 * `PSystemVersion.getApple2Image()` (`version/apple2.png`, a header-stripped
 * WebP) is `APPLE2_PNG`, the jar's own re-encoding of it (`apple2-image.ts`);
 * the bytes are read through the asset store, and a store that does not serve them is the
 * `IOException` of java:50 (`EggImageUnavailableError`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwo.java
 */
import type { AssetStore } from '../../core/asset-store.js';
import type { UmlSource } from '../../core/block-extractor.js';
import { GraphicPosition } from '../../core/klimt/geom/GraphicPosition.js';
import { PlainStringsDiagram } from '../../core/PlainStringsDiagram.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { APPLE2_PNG, eggRasterImage } from './apple2-image.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwo.java:52-53 */
const STRINGS: readonly string[] = [
  '                             <b><size:18>Apple //e for ever !                             ',
  ' ',
];

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwo.java:60 */
const DESCRIPTION = '(Apple //e)';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwo.java:47 */
export class PSystemAppleTwo extends PlainStringsDiagram {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwo.java:50-57 */
  constructor(source: UmlSource, preprocessing: PreprocessingArtifact, assetStore: AssetStore | undefined) {
    super(source, preprocessing);
    this.strings.push(...STRINGS);
    this.image = eggRasterImage(APPLE2_PNG, assetStore);
    this.imagePosition = GraphicPosition.BOTTOM;
  }

  /** `DiagramDescription` reduced to its text.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwo.java:59-61 */
  getDescription(): string {
    return DESCRIPTION;
  }
}
