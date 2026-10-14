/**
 * `PSystemEgg` — a decoded easter-egg sentence, one line per `|`-separated
 * token, drawn by `PlainStringsDiagram`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemEgg.java
 */
import type { UmlSource } from '../../core/block-extractor.js';
import { PlainStringsDiagram } from '../../core/PlainStringsDiagram.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';

/** `new StringTokenizer(sentence, "|")`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemEgg.java:50 */
const DELIMITER = '|';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemEgg.java:57 */
const DESCRIPTION = '(Easter Eggs)';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemEgg.java:45 */
export class PSystemEgg extends PlainStringsDiagram {
  /** `StringTokenizer` never yields an empty token.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemEgg.java:48-54 */
  constructor(source: UmlSource, sentence: string, preprocessing: PreprocessingArtifact) {
    super(source, preprocessing);
    for (const token of sentence.split(DELIMITER)) if (token.length > 0) this.strings.push(token);
  }

  /** `DiagramDescription` reduced to its text.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemEgg.java:56-58 */
  getDescription(): string {
    return DESCRIPTION;
  }
}
