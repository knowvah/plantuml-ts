import type { Entity } from './Entity.js';
import type { EntityGender } from './EntityGender.js';
import type { LeafType } from './LeafType.js';
import { GUILLEMET_DOUBLE_COMPARATOR } from '../stereo/StereotypeDecoration.js';

/**
 * EntityGenderUtils — the nine `EntityGender` factories the hide/show/
 * remove command family composes. Java's anonymous inner classes become
 * object literals; the class's static methods become free functions
 * (project convention — see `abel/EntityPosition.ts`).
 *
 * SI1/T5 — full port (9/9 factories).
 *
 * ## Consolidation note (batch-2 sub-task)
 *
 * The class engine carries a SCOPED equivalent of `byStereotype`/
 * `byPackage`: `src/diagrams/class/class-directives.ts` (the
 * gender-portion matcher mirroring `byStereotype`'s exact per-label
 * equality) and `class-directives-removal.ts`/`class-hideshow-dispatch.ts`
 * (the `byPackage` direct-parent-equality AND). That version is NOT a
 * type-compatible drop-in for this one: it matches over the class
 * engine's OWN AST (classifiers holding a raw `string` stereotype field
 * and string-keyed package membership), not `abel/Entity` +
 * `stereo/Stereotype` — the same shape gap `stereo/Stereotype.ts`'s own
 * header documents for `class-stereotype.ts`. Making the class engine
 * import this base would mean rewiring its matchers onto the abel
 * model, i.e. the engine migration ADR-1 explicitly defers to a
 * follow-on mission. Both encode the same upstream semantics
 * (`EntityGenderUtils.java:68-104`, cited in the class engine's own doc
 * comments); this file is the base's faithful home, the class engine
 * keeps its scoped copy until its migration mission.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGenderUtils.java:40
 */

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGenderUtils.java:42-53 */
export function byEntityType(type: LeafType): EntityGender {
  return {
    contains(test: Entity): boolean {
      return test.getLeafType() === type;
    },
    getGender(): string | undefined {
      return type;
    },
  };
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGenderUtils.java:55-66 */
export function byEntityAlone(entity: Entity): EntityGender {
  return {
    contains(test: Entity): boolean {
      return test.getUid() === entity.getUid();
    },
    getGender(): string | undefined {
      return entity.getUid();
    },
  };
}

/** Exact per-label equality over `Stereotype#getLabels(DOUBLE_COMPARATOR)`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGenderUtils.java:68-89 */
export function byStereotype(stereotype: string): EntityGender {
  return {
    contains(test: Entity): boolean {
      const testStereotype = test.getStereotype();
      if (testStereotype === undefined) return false;

      for (const label of testStereotype.getLabels(GUILLEMET_DOUBLE_COMPARATOR))
        if (label === stereotype) return true;

      return false;
    },
    getGender(): string | undefined {
      return stereotype;
    },
  };
}

/** DIRECT parent-container equality only (no ancestor walk); throws on
 * the root group.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGenderUtils.java:91-110 */
export function byPackage(group: Entity): EntityGender {
  if (group.isRoot()) throw new Error('IllegalArgumentException');

  return {
    contains(test: Entity): boolean {
      const parentContainer = test.getParentContainer();
      if (parentContainer === undefined || parentContainer.isRoot()) return false;

      if (group === parentContainer) return true;

      return false;
    },
    getGender(): string | undefined {
      return undefined;
    },
  };
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGenderUtils.java:112-123 */
export function and(g1: EntityGender, g2: EntityGender): EntityGender {
  return {
    contains(test: Entity): boolean {
      return g1.contains(test) && g2.contains(test);
    },
    getGender(): string | undefined {
      return undefined;
    },
  };
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGenderUtils.java:125-136 */
export function all(): EntityGender {
  return {
    contains(test: Entity): boolean {
      void test;
      return true;
    },
    getGender(): string | undefined {
      return undefined;
    },
  };
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGenderUtils.java:138-149 */
export function emptyMethods(): EntityGender {
  return {
    contains(test: Entity): boolean {
      return test.getBodier().getMethodsToDisplay().size() === 0;
    },
    getGender(): string | undefined {
      return undefined;
    },
  };
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGenderUtils.java:151-162 */
export function emptyFields(): EntityGender {
  return {
    contains(test: Entity): boolean {
      return test.getBodier().getFieldsToDisplay().size() === 0;
    },
    getGender(): string | undefined {
      return undefined;
    },
  };
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGenderUtils.java:164-177 */
export function byClassName(className: string): EntityGender {
  return {
    contains(test: Entity): boolean {
      return className === test.getName();
    },
    getGender(): string | undefined {
      return className;
    },
  };
}
