import type { Bag } from './Bag.js';

/**
 * Together — a `together { ... }` grouping handle. Entities holding the
 * same `Together` instance are laid out together; nesting is expressed
 * through the parent chain.
 *
 * SI1/T5 — full port (2/2 members: constructor + `getParent`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Together.java:39-51
 */
export class Together implements Bag {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Together.java:41 */
  private readonly parent: Together | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Together.java:43-45 */
  constructor(parent: Together | undefined) {
    this.parent = parent;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Together.java:47-49 */
  getParent(): Together | undefined {
    return this.parent;
  }
}
