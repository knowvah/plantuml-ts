/**
 * `ChallengeLookAhead` -- zero-width positive/negative look-ahead.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeLookAhead.java
 */
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import { LookAround } from './LookAround.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeLookAhead implements Challenge {
  private readonly origin: Challenge;
  private readonly ahead: LookAround;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeLookAhead.java */
  public constructor(origin: Challenge, ahead: LookAround) {
    this.origin = origin;
    this.ahead = ahead;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeLookAhead.java */
  public toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- Java Object#toString: every Challenge has one
    return this.ahead.name() + ' ' + String(this.origin);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeLookAhead.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    const tmp = this.origin.runChallenge(string, position).getFullCaptureLength();
    switch (this.ahead) {
      case LookAround.LOOK_AHEAD_POSITIVE:
        if (tmp < 0) return ChallengeResult.NO_MATCH;
        return ChallengeResult.ZERO;
      case LookAround.LOOK_AHEAD_NEGATIVE:
        if (tmp < 0) return ChallengeResult.ZERO;
        return ChallengeResult.NO_MATCH;
    }
    throw new Error('IllegalStateException');
  }
}
