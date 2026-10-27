/**
 * `UBrexZeroOrMore` -- wraps a part in `ChallengeZeroOrMore`.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexZeroOrMore.java
 */
import { ChallengeZeroOrMore } from '../ChallengeZeroOrMore.js';
import { UBrexPart } from './UBrexPart.js';

export class UBrexZeroOrMore extends UBrexPart {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexZeroOrMore.java */
  public constructor(origin: UBrexPart) {
    super(new ChallengeZeroOrMore(origin.getChallenge()));
  }
}
