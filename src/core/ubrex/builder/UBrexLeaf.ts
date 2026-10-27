/**
 * `UBrexLeaf` -- a part parsed from one ubrex definition string.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexLeaf.java
 */
import { CompositeList } from '../CompositeList.js';
import { UBrexPart } from './UBrexPart.js';

export class UBrexLeaf extends UBrexPart {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexLeaf.java */
  public constructor(definition: string) {
    super(CompositeList.parseAndBuild(definition));
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexLeaf.java */
  public static end(): UBrexLeaf {
    return new UBrexLeaf('〒$');
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexLeaf.java */
  public static spaceOneOrMore(): UBrexLeaf {
    return new UBrexLeaf('〇+〴s');
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexLeaf.java */
  public static spaceZeroOrMore(): UBrexLeaf {
    return new UBrexLeaf('〇*〴s');
  }
}
