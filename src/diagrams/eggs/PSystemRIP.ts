/**
 * `PSystemRIP` — a dedication to the author's grandfather over his picture.
 *
 * `SImageIO.read(imm)` (the inline JPEG `imm`, java:71-435) is `RIP_PNG`, the
 * jar's own re-encoding of it (`rip-image.ts`); its `IOException` (java:50)
 * has no counterpart.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIP.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { GraphicPosition } from '../../core/klimt/geom/GraphicPosition.js';
import { PlainStringsDiagram } from '../../core/PlainStringsDiagram.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { RIP_PNG } from './rip-image.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIP.java:52-61 */
const STRINGS: readonly string[] = [
  ' To my Grandfather,',
  ' A mon grand-pere,',
  ' ',
  '          <b>Jean CANOUET',
  ' ',
  ' 31-OCT-1921 <i>(Neuilly-Sur-Seine, France)',
  ' 15-SEP-2009 <i>(Nanterre, France)',
  ' ',
  '         <b>Requiescat In Pace',
  ' ',
];

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIP.java:68 */
const DESCRIPTION = '(RIP)';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIP.java:47 */
export class PSystemRIP extends PlainStringsDiagram {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIP.java:50-65 */
  constructor(source: UmlSource, preprocessing: PreprocessingArtifact) {
    super(source, preprocessing);
    this.strings.push(...STRINGS);
    this.image = RIP_PNG;
    this.imagePosition = GraphicPosition.BOTTOM;
  }

  /** `DiagramDescription` reduced to its text.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemRIP.java:67-69 */
  getDescription(): string {
    return DESCRIPTION;
  }
}
