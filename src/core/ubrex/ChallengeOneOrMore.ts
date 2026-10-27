/**
 * `ChallengeOneOrMore` -- greedy `〇+`.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeOneOrMore.java
 */
import { Capture } from './Capture.js';
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeOneOrMore implements Challenge {
  private readonly origin: Challenge;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeOneOrMore.java */
  public constructor(origin: Challenge) {
    this.origin = origin;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeOneOrMore.java */
  public toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- Java Object#toString: every Challenge has one
    return 'ChallengeOneOrMore:' + String(this.origin);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeOneOrMore.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    let capture: Capture = Capture.EMPTY;
    let currentPos = position;
    for (;;) {
      const shallWePass = this.origin.runChallenge(string, currentPos);
      if (shallWePass.getFullCaptureLength() < 0) {
        if (currentPos > position) return new ChallengeResult(currentPos - position, capture);
        else return ChallengeResult.NO_MATCH;
      }
      if (shallWePass.getFullCaptureLength() === 0) throw new Error('infinite loop');
      capture = capture.merge(shallWePass.getCapture());
      currentPos += shallWePass.getFullCaptureLength();
    }
  }
}
