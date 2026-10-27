/**
 * `ChallengeOptional` -- `〇?`.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeOptional.java
 */
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeOptional implements Challenge {
  private readonly origin: Challenge;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeOptional.java */
  public constructor(origin: Challenge) {
    this.origin = origin;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeOptional.java */
  public toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- Java Object#toString: every Challenge has one
    return 'ChallengeOptional:' + String(this.origin);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeOptional.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    const tmp = this.origin.runChallenge(string, position);
    if (tmp.getFullCaptureLength() < 0) return ChallengeResult.ZERO;
    return tmp;
  }
}
