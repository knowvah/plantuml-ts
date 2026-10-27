import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { Failable } from '../../../core/gantt/Failable.js';

/**
 * Something — a grammar complement able to resolve itself against a diagram.
 * `D extends Diagram` is an unconstrained type parameter here: this port has
 * no `core.Diagram` interface and Gantt's own diagram arrives in a later batch.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Something.java:44-50
 */
export interface Something<D> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Something.java:46 */
  getMe(diagram: D, arg: CaptureLookup): Failable<unknown>;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/Something.java:48 */
  toUnicodeBracketedExpressionComplement(): UBrexPart;
}
