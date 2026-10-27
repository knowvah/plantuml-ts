/**
 * `UBrexOptional` -- wraps a part in `ChallengeOptional`.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexOptional.java
 */
import { ChallengeOptional } from '../ChallengeOptional.js';
import { UBrexPart } from './UBrexPart.js';

export class UBrexOptional extends UBrexPart {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexOptional.java */
  public constructor(origin: UBrexPart) {
    super(new ChallengeOptional(origin.getChallenge()));
  }
}
