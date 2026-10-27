/**
 * `UBrexOneOrMore` -- wraps a part in `ChallengeOneOrMore`.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexOneOrMore.java
 */
import { ChallengeOneOrMore } from '../ChallengeOneOrMore.js';
import { UBrexPart } from './UBrexPart.js';

export class UBrexOneOrMore extends UBrexPart {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexOneOrMore.java */
  public constructor(origin: UBrexPart) {
    super(new ChallengeOneOrMore(origin.getChallenge()));
  }
}
