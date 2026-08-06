import type { Entity } from './Entity.js';
import type { ISkinParam } from './ISkinParam.js';
import type { DiagramType } from '../cucadiagram/CucaDiagram.js';

/**
 * EntityFactory — the entity-model view a diagram exposes to the svek
 * assembly (one of `DotData`'s constructor contracts). `CucaDiagram`
 * implements it.
 *
 * SI1/T10 — full port (5/5 members; ADR-2 names this one of the three
 * DotData bridge contracts ported in full).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityFactory.java:47-59
 */
export interface EntityFactory {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityFactory.java:49 */
  getRootGroup(): Entity;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityFactory.java:51 */
  groups(): readonly Entity[];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityFactory.java:53 */
  isHideEmptyDescriptionForState(): boolean;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityFactory.java:55 */
  getDiagramType(): DiagramType;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityFactory.java:57 */
  getSkinParam(): ISkinParam;
}
