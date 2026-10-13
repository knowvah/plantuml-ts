/**
 * `PSystemAppleTwo` — "Apple //e for ever !" over the Apple //e picture.
 *
 * `PSystemVersion.getApple2Image()` (`version/apple2.png`, a header-stripped
 * WebP) is `APPLE2_PNG`, the jar's own re-encoding of it (`apple2-image.ts`);
 * its `IOException` (java:50) has no counterpart.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwo.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { GraphicPosition } from '../../core/klimt/geom/GraphicPosition.js';
import { PlainStringsDiagram } from '../../core/PlainStringsDiagram.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { APPLE2_PNG } from './apple2-image.js';

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
  constructor(source: UmlSource, preprocessing: PreprocessingArtifact) {
    super(source, preprocessing);
    this.strings.push(...STRINGS);
    this.image = APPLE2_PNG;
    this.imagePosition = GraphicPosition.BOTTOM;
  }

  /** `DiagramDescription` reduced to its text.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwo.java:59-61 */
  getDescription(): string {
    return DESCRIPTION;
  }
}
