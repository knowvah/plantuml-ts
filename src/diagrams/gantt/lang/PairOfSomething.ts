import type { CaptureLookup } from '../../../core/ubrex/CaptureLookup.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import { Failable } from '../../../core/gantt/Failable.js';
import type { Something } from './Something.js';

/**
 * PairOfSomething -- two complements separated by one-or-more spaces.
 * `D extends Diagram` is unconstrained (see {@link Something}).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/PairOfSomething.java:46-75
 */
export class PairOfSomething<D> implements Something<D> {
  readonly #complement1: Something<D>;
  readonly #complement2: Something<D>;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/PairOfSomething.java:51-54 */
  public constructor(complement1: Something<D>, complement2: Something<D>) {
    this.#complement1 = complement1;
    this.#complement2 = complement2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/PairOfSomething.java:56-66 (both are evaluated before the first failure is returned) */
  public getMe(diagram: D, arg: CaptureLookup): Failable<unknown> {
    const r1 = this.#complement1.getMe(diagram, arg);
    const r2 = this.#complement2.getMe(diagram, arg);
    if (r1.isFail()) return r1;
    if (r2.isFail()) return r2;
    const result: unknown[] = [r1.get(), r2.get()];
    return Failable.ok(result);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/PairOfSomething.java:68-74 */
  public toUnicodeBracketedExpressionComplement(): UBrexPart {
    return UBrexConcat.build(
      this.#complement1.toUnicodeBracketedExpressionComplement(),
      UBrexLeaf.spaceOneOrMore(),
      this.#complement2.toUnicodeBracketedExpressionComplement(),
    );
  }
}
