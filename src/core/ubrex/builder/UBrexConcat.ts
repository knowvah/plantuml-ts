/**
 * `UBrexConcat` -- sequence of parts.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexConcat.java
 */
import { CompositeList } from '../CompositeList.js';
import { UBrexPart } from './UBrexPart.js';

export class UBrexConcat extends UBrexPart {
  /** Private upstream. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexConcat.java */
  private constructor(list: CompositeList) {
    super(list);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexConcat.java */
  public static build(...all: UBrexPart[]): UBrexConcat {
    const result = CompositeList.createEmpty();
    for (const element of all) result.addChallenge(element.getChallenge());

    return new UBrexConcat(result);
  }
}
