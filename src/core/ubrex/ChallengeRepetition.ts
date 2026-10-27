/**
 * `ChallengeRepetition` -- `〇{...}` counted repetition.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeRepetition.java
 */
import { Capture } from './Capture.js';
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { Repetition } from './Repetition.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeRepetition implements Challenge {
  private readonly origin: Challenge;
  private readonly repetition: Repetition;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeRepetition.java */
  public constructor(repetition: Repetition, origin: Challenge) {
    this.origin = origin;
    this.repetition = repetition;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeRepetition.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    let capture: Capture = Capture.EMPTY;
    let currentPos = position;
    let count = 0;
    for (;;) {
      const shallWePass = this.origin.runChallenge(string, currentPos);
      if (shallWePass.getFullCaptureLength() < 0) {
        if (currentPos > position && this.repetition.match(count)) {
          return new ChallengeResult(currentPos - position, capture);
        } else return ChallengeResult.NO_MATCH;
      }
      if (shallWePass.getFullCaptureLength() === 0) throw new Error('infinite loop');
      capture = capture.merge(shallWePass.getCapture());
      currentPos += shallWePass.getFullCaptureLength();
      count++;
    }
  }
}
