/**
 * `ChallengeZeroOrMore` -- greedy `〇*`.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeZeroOrMore.java
 */
import { Capture } from './Capture.js';
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeZeroOrMore implements Challenge {
  private readonly origin: Challenge;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeZeroOrMore.java */
  public constructor(origin: Challenge) {
    this.origin = origin;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeZeroOrMore.java */
  public toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- Java Object#toString: every Challenge has one
    return 'ChallengeZeroOrMore:' + String(this.origin);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeZeroOrMore.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    let capture: Capture = Capture.EMPTY;
    let currentPos = position;
    for (;;) {
      const tmp = this.origin.runChallenge(string, currentPos);
      if (tmp.getFullCaptureLength() < 0) return new ChallengeResult(currentPos - position, capture);
      if (tmp.getFullCaptureLength() === 0) throw new Error('infinite loop');
      capture = capture.merge(tmp.getCapture());
      currentPos += tmp.getFullCaptureLength();
    }
  }
}
