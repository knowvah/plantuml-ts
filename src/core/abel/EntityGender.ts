import type { Entity } from './Entity.js';

/**
 * EntityGender — a predicate over entities used by the `hide`/`show`/
 * `remove`/`restore` commands to select which entities a directive
 * applies to. Factories live in `EntityGenderUtils`.
 *
 * SI1/T5 — full port (2/2 members).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGender.java:40-45
 */
export interface EntityGender {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGender.java:42 */
  contains(test: Entity): boolean;

  /** Java returns `null` for the anonymous genders (byPackage/and/all/
   * emptyMethods/emptyFields) → `undefined` per the translation table.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityGender.java:44 */
  getGender(): string | undefined;
}
