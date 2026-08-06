import type { Entity } from '../abel/Entity.js';
import type { EntityPortion } from '../abel/EntityPortion.js';

/**
 * PortionShower — answers "is this portion (fields/methods/stereotype/
 * circled character) shown for this entity?" after the `hide`/`show`
 * directives have been applied (one of `DotData`'s constructor
 * contracts). `CucaDiagram` implements it.
 *
 * SI1/T10 — full port (2/2 members + the `ALL` constant; ADR-2 names
 * this one of the three DotData bridge contracts ported in full). The
 * Java interface constant `PortionShower.ALL` becomes a merged const
 * object so upstream call sites translate verbatim.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/PortionShower.java:44-60
 */
export interface PortionShower {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/PortionShower.java:56 */
  showPortion(portion: EntityPortion, entity: Entity): boolean;

  /** Java `List<String>` is implicitly nullable and
   * `CucaDiagram#getVisibleStereotypeLabels` really returns `null` for
   * a stereotype-less entity — widened to `| undefined` (the `Bodier`
   * T7-correction precedent).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/PortionShower.java:58 */
  getVisibleStereotypeLabels(entity: Entity): readonly string[] | undefined;
}

/** The show-everything instance (`PortionShower.ALL` upstream — an
 * anonymous class on the interface constant, here a merged const so the
 * `PortionShower.ALL` spelling keeps working).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/PortionShower.java:46-54 */
export const PortionShower = {
  ALL: {
    showPortion(_portion: EntityPortion, _entity: Entity): boolean {
      return true;
    },
    getVisibleStereotypeLabels(_entity: Entity): readonly string[] {
      return [];
    },
  } satisfies PortionShower,
} as const;
