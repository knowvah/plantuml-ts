/**
 * `UBrexNamed` -- names a part's captures. An {@link UBrexUpto} origin is
 * unwrapped to its inner challenge list (Java `(CompositeList)` cast).
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexNamed.java
 */
import type { Challenge } from '../Challenge.js';
import type { CompositeList } from '../CompositeList.js';
import { CompositeNamed } from '../CompositeNamed.js';
import { UBrexPart } from './UBrexPart.js';
import { UBrexUpto } from './UBrexUpto.js';

export class UBrexNamed extends UBrexPart {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexNamed.java */
  public constructor(name: string, origin: UBrexPart) {
    super(UBrexNamed.create(name, origin));
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexNamed.java */
  private static create(name: string, part: UBrexPart): Challenge {
    if (part instanceof UBrexUpto) {
      const list = part.getChallenge() as CompositeList;
      return new CompositeNamed(name, list.getInternalChallengesList());
    }

    const challenge = part.getChallenge();
    return new CompositeNamed(name, challenge);
  }
}
