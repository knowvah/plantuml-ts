/**
 * `UBrexUpto` -- `what` one or more times, up to (and including) `stop`.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexUpto.java
 */
import type { Challenge } from '../Challenge.js';
import { ChallengeOneOrMoreUpToOldVersion } from '../ChallengeOneOrMoreUpToOldVersion.js';
import { CompositeList } from '../CompositeList.js';
import { UBrexPart } from './UBrexPart.js';

export class UBrexUpto extends UBrexPart {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexUpto.java */
  public constructor(what: UBrexPart, stop: UBrexPart) {
    super(UBrexUpto.buildChallenge(what, stop));
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexUpto.java */
  private static buildChallenge(what: UBrexPart, stop: UBrexPart): Challenge {
    const p1 = what.getChallenge();
    const p2 = stop.getChallenge();
    const result = CompositeList.createEmpty();
    result.addChallenge(new ChallengeOneOrMoreUpToOldVersion(p1, p2));
    result.addChallenge(p2);
    return result;
  }
}
