import type { LinkType } from '../decoration/LinkType.js';
import type { Entity } from './Entity.js';

/**
 * Link — ADR-2 type-only FORWARD declaration for `abel/Link.java`
 * (T6's write-set). Declares exactly the member surface T5's closure
 * calls (`Entity#overrideImage`/`isAloneAndUnlinked`/`isAutarkic`/
 * `canBePacked`, `EntityUtils#isPureInnerLink12`/`isPureInnerLink3`);
 * T6 replaces this file with the full class, whose members must keep
 * these exact signatures. Journaled (T5).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Link.java
 */
export interface Link {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Link.java (getEntity1) */
  getEntity1(): Entity;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Link.java (getEntity2) */
  getEntity2(): Entity;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Link.java (contains) */
  contains(entity: Entity): boolean;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Link.java (getOther) */
  getOther(entity: Entity): Entity;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Link.java (getType) */
  getType(): LinkType;
}
