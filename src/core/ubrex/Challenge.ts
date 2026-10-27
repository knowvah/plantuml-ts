/**
 * `Challenge` -- a ubrex matching step. Java interface with a constant
 * (`NO_MATCH`) and a default method (`runChallenge(String)`): the interface is
 * `Challenge`; the constant and the default are on the merged `Challenge`
 * value (`Challenge.NO_MATCH`, `Challenge.runChallengeString(c, s)`).
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Challenge.java
 */
import type { ChallengeResult } from './ChallengeResult.js';
import { TextNavigator } from './TextNavigator.js';

export interface Challenge {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Challenge.java */
  runChallenge(string: TextNavigator, position: number): ChallengeResult;
}

/** The constant and default-method half of upstream's `Challenge` interface. */
export const Challenge: {
  /** `Challenge.NO_MATCH = Integer.MIN_VALUE` (`Challenge.java:39`). */
  readonly NO_MATCH: number;
  /** The `default runChallenge(String)` (`Challenge.java:43-45`). */
  runChallengeString(challenge: Challenge, string: string): ChallengeResult;
} = {
  NO_MATCH: -2147483648,
  runChallengeString(challenge: Challenge, string: string): ChallengeResult {
    return challenge.runChallenge(TextNavigator.build(string), 0);
  },
};
