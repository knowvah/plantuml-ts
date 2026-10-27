/**
 * `ChallengeAlternative` -- first alternative that matches wins.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeAlternative.java
 */
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeAlternative implements Challenge {
  private readonly alternatives: Challenge[] = [];

  /** Java `"ALTERNATIVE" + alternatives` (`List#toString` format). @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeAlternative.java */
  public toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- Java Object#toString: every Challenge has one
    return 'ALTERNATIVE[' + this.alternatives.map((a) => String(a)).join(', ') + ']';
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeAlternative.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    for (const pattern of this.alternatives) {
      const tmp = pattern.runChallenge(string, position);
      if (tmp.getFullCaptureLength() >= 0) return tmp;
    }
    return ChallengeResult.NO_MATCH;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeAlternative.java */
  public addAlternative(pattern: Challenge): void {
    this.alternatives.push(pattern);
  }
}
