/**
 * `ChallengeLookBehind` -- zero-width positive/negative look-behind, run on the reversed text.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeLookBehind.java
 */
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import { LookAround } from './LookAround.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeLookBehind implements Challenge {
  private readonly origin: Challenge;
  private readonly ahead: LookAround;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeLookBehind.java */
  public constructor(origin: Challenge, ahead: LookAround) {
    this.origin = origin;
    this.ahead = ahead;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeLookBehind.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    const stringReversed = string.reverse(position);
    const tmp = this.origin.runChallenge(stringReversed, 0).getFullCaptureLength();
    switch (this.ahead) {
      case LookAround.LOOK_BEHIND_POSITIVE:
        if (tmp < 0) return ChallengeResult.NO_MATCH;
        return ChallengeResult.ZERO;
      case LookAround.LOOK_BEHIND_NEGATIVE:
        if (tmp < 0) return ChallengeResult.ZERO;
        return ChallengeResult.NO_MATCH;
    }
    throw new Error('IllegalStateException');
  }
}
