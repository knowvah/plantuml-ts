import type { Quark } from './Quark.js';

/**
 * Keeps track of the {@link Quark} objects that have a given name. Short
 * for "Plasma entry".
 *
 * Tracks the first instance created with that name, as well as the number
 * of quarks with that name. Package-private upstream (used only by
 * `Plasma#register`/`firstWithName`/`countByName`); exported here because
 * TypeScript has no package visibility.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/PEntry.java
 */
export class PEntry<DATA> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/PEntry.java:51 */
  readonly first: Quark<DATA>;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/PEntry.java:52 */
  counter = 1;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/PEntry.java:54-56 */
  constructor(first: Quark<DATA>) {
    this.first = first;
  }
}
