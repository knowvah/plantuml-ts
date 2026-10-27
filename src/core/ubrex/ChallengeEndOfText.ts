/**
 * `ChallengeEndOfText` -- zero-width match at the end of the text.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeEndOfText.java
 */
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeEndOfText implements Challenge {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeEndOfText.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    if (position >= string.length()) return ChallengeResult.ZERO;
    return ChallengeResult.NO_MATCH;
  }
}
