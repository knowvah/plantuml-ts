/**
 * `ChallengeCharClass` -- one char matching a `CharClass`.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeCharClass.java
 */
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { CharClass } from './CharClass.js';
import type { TextNavigator } from './TextNavigator.js';

export class ChallengeCharClass implements Challenge {
  private readonly charClass: CharClass;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeCharClass.java */
  public constructor(charClass: CharClass) {
    this.charClass = charClass;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeCharClass.java */
  public toString(): string {
    return this.charClass.name();
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeCharClass.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    if (string.length() === position) return ChallengeResult.NO_MATCH;
    const ch = string.charAt(position);
    if (this.charClass.matches(ch)) return ChallengeResult.ONE;
    return ChallengeResult.NO_MATCH;
  }
}
