/**
 * `UBrexPart` -- a composable ubrex fragment wrapping one {@link Challenge}.
 * Upstream's package-private constructor is `protected` here (the nine
 * builder classes are the only subclasses); `match` is `final` upstream
 * (TS has no `final`: subclasses must not override it).
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexPart.java
 */
import type { Challenge } from '../Challenge.js';
import type { TextNavigator } from '../TextNavigator.js';
import type { UMatcher } from '../UMatcher.js';
import { UnicodeBracketedExpression } from '../UnicodeBracketedExpression.js';

export abstract class UBrexPart implements UnicodeBracketedExpression {
  private readonly challenge: Challenge;

  /** Package-private upstream. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexPart.java */
  protected constructor(challenge: Challenge) {
    this.challenge = challenge;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexPart.java */
  public getChallenge(): Challenge {
    return this.challenge;
  }

  /**
   * `final public UMatcher match(TextNavigator, int)`; the interface defaults
   * `match(String, int)` / `match(TextNavigator)` are the same method here
   * (see {@link UnicodeBracketedExpression}).
   *
   * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexPart.java
   */
  public match(string: string | TextNavigator, position?: number): UMatcher {
    return UnicodeBracketedExpression.from(this.challenge).match(string, position);
  }
}
