/**
 * `ChallengeLazzyOneOrMore` -- lazy `〇l+`: repeat until the stop condition peeks true.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeLazzyOneOrMore.java
 */
import { Capture } from './Capture.js';
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeLazzyOneOrMore implements Challenge {
  private readonly origin: Challenge;
  private readonly stopCondition: Challenge;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeLazzyOneOrMore.java */
  public constructor(origin: Challenge, stopCondition: Challenge) {
    this.origin = origin;
    this.stopCondition = stopCondition;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeLazzyOneOrMore.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    let capture: Capture = Capture.EMPTY;
    let currentPos = position;
    for (;;) {
      const match1 = this.origin.runChallenge(string, currentPos);
      if (match1.getFullCaptureLength() < 0) return ChallengeResult.NO_MATCH;
      if (match1.getFullCaptureLength() === 0) throw new Error('infinite loop');
      capture = capture.merge(match1.getCapture());
      currentPos += match1.getFullCaptureLength();
      // Only peek at the stop condition, don't consume it.
      // The stop condition challenges will be matched as siblings
      // by the parent CompositeList/CompositeNamed.
      const match2 = this.stopCondition.runChallenge(string, currentPos);
      if (match2.getFullCaptureLength() >= 0) return new ChallengeResult(currentPos - position, capture);
    }
  }
}
