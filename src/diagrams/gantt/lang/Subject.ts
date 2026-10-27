import type { Failable } from '../../../core/gantt/Failable.js';
import type { UMatcher } from '../../../core/ubrex/UMatcher.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';

/**
 * Subject -- the left-hand side of a natural gantt sentence and the verb phrases it accepts.
 * `D extends Diagram` is an unconstrained type parameter: this port has no `core.Diagram`
 * interface (precedent `UBrexSingleLineCommand2.ts` header). `Collection` is an array.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Subject.java:44-52
 */
export interface Subject<D> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Subject.java:46 */
  toUnicodeBracketedExpressionSubject(): UBrexPart;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Subject.java:48 */
  getMe(diagram: D, arg: UMatcher): Failable<unknown>;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Subject.java:50 */
  getVerbPhrases(): VerbPhraseAction[];
}
