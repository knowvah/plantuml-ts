/**
 * `ChallengeOneOrMoreUpToOldVersion` -- `〄+ p1 -> p2`: repeat p1 until p2 peeks true.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeOneOrMoreUpToOldVersion.java
 */
import { Capture } from './Capture.js';
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeOneOrMoreUpToOldVersion implements Challenge {
  private readonly origin: Challenge;
  private readonly end: Challenge;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeOneOrMoreUpToOldVersion.java */
  public constructor(origin: Challenge, end: Challenge) {
    this.origin = origin;
    this.end = end;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeOneOrMoreUpToOldVersion.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    let capture: Capture = Capture.EMPTY;
    let currentPos = position;
    for (;;) {
      const shallWePass = this.origin.runChallenge(string, currentPos);
      if (shallWePass.getFullCaptureLength() < 0) return ChallengeResult.NO_MATCH;
      if (shallWePass.getFullCaptureLength() === 0) throw new Error('infinite loop');
      capture = capture.merge(shallWePass.getCapture());
      currentPos += shallWePass.getFullCaptureLength();

      const tmp = this.end.runChallenge(string, currentPos);
      if (tmp.getFullCaptureLength() >= 0) return new ChallengeResult(currentPos - position, capture);
    }
  }
}
