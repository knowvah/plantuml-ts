import type { Entity } from './Entity.js';

/**
 * Bibliotekon — ADR-2 consumed-interface stub for
 * `svek/Bibliotekon.java` (the entity↔svek-node/edge registry). `Link`
 * reaches exactly one member (`getNodeUid`, via
 * `getEntityPort1/2` → `getEntityPort`); the real class (node/cluster
 * lookup over `SvekNode`/`SvekEdge`) lands with the svek assembly
 * port, which implements this and moves it to
 * `src/core/svek/Bibliotekon.ts`. Journaled (T6).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Bibliotekon.java
 */
export interface Bibliotekon {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Bibliotekon.java (getNodeUid) */
  getNodeUid(leaf: Entity): string;
}
