/**
 * `ChallengeUpTo` -- `〄>`: advance until the origin matches (without consuming it).
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeUpTo.java
 */
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeUpTo implements Challenge {
  private readonly origin: Challenge;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeUpTo.java */
  public constructor(origin: Challenge) {
    this.origin = origin;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeUpTo.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    let currentPos = position;
    for (;;) {
      const tmp = this.origin.runChallenge(string, currentPos);
      if (tmp.getFullCaptureLength() >= 0) return new ChallengeResult(currentPos - position);
      currentPos += 1;
      if (currentPos > string.length()) return ChallengeResult.NO_MATCH;
    }
  }
}
