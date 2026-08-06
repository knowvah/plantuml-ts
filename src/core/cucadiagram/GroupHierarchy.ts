import type { Entity } from '../abel/Entity.js';

/**
 * GroupHierarchy — the group-tree view a diagram exposes to the svek
 * assembly (one of `DotData`'s constructor contracts). `CucaDiagram`
 * implements it.
 *
 * SI1/T10 — full port (3/3 members; ADR-2 names this one of the three
 * DotData bridge contracts ported in full).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/GroupHierarchy.java:44-52
 */
export interface GroupHierarchy {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/GroupHierarchy.java:46 */
  getRootGroup(): Entity;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/GroupHierarchy.java:48 */
  getChildrenGroups(parent: Entity): readonly Entity[];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/GroupHierarchy.java:50 */
  isEmpty(g: Entity): boolean;
}
