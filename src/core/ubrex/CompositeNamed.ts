/**
 * `CompositeNamed` -- a named capture group (`〶$name=...`).
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeNamed.java
 */
import { Capture } from './Capture.js';
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { TextNavigator } from './TextNavigator.js';

export class CompositeNamed implements Challenge {
  private readonly name: string;
  private readonly challenges: readonly Challenge[];

  /** `List#toString` format. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeNamed.java */
  public toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- Java Object#toString: every Challenge has one
    return '(' + this.name + ') [' + this.challenges.map((c) => String(c)).join(', ') + ']';
  }

  /** Both Java constructors: `(String, Challenge)` (singleton list) and `(String, List<Challenge>)`. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeNamed.java */
  public constructor(name: string, challenge: Challenge | readonly Challenge[]) {
    this.name = name;
    this.challenges = Array.isArray(challenge) ? (challenge as readonly Challenge[]) : [challenge as Challenge];
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CompositeNamed.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    let capture: Capture = Capture.EMPTY;
    let current = position;
    for (const challenge of this.challenges) {
      const shallWePass = challenge.runChallenge(string, current);
      if (shallWePass.getFullCaptureLength() < 0) return ChallengeResult.NO_MATCH;
      current += shallWePass.getFullCaptureLength();
      capture = capture.merge(shallWePass.getCapture());
    }
    const value = string.subSequence(position, current).toString();
    capture = capture.withPrefixedKeys(this.name);
    capture = capture.withEntry(this.name, value);
    return new ChallengeResult(current - position, capture);
  }
}
