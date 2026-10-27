/**
 * `UBrexOr` -- alternatives. Both Java constructors (varargs and
 * `Collection<UBrexPart>`) are one overloaded constructor.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexOr.java
 */
import { ChallengeAlternative } from '../ChallengeAlternative.js';
import { UBrexPart } from './UBrexPart.js';

export class UBrexOr extends UBrexPart {
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexOr.java */
  public constructor(...all: UBrexPart[]);
  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/builder/UBrexOr.java */
  public constructor(all: Iterable<UBrexPart>);
  public constructor(...args: [Iterable<UBrexPart>] | UBrexPart[]) {
    super(new ChallengeAlternative());
    const first = args[0];
    const all: Iterable<UBrexPart> = args.length === 1 && !(first instanceof UBrexPart) ? first : (args as UBrexPart[]);
    for (const element of all) (this.getChallenge() as ChallengeAlternative).addAlternative(element.getChallenge());
  }
}
