/**
 * EntityPortion — which slice of an entity a `hide`/`show` directive
 * targets. Upstream: a 5-value enum with one member (`asSet`). As-const
 * object + string union + free function, not a TS `enum` (project
 * convention — see `src/core/abel/GroupType.ts`; the member becomes a
 * free function per the `LeafType.ts` `isLikeClass` precedent).
 *
 * SI1/T10 closure pull (consumed by `CucaDiagram`'s hide/show
 * machinery and the `PortionShower` contract).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPortion.java:41
 */
export const EntityPortion = {
  FIELD: 'FIELD',
  METHOD: 'METHOD',
  MEMBER: 'MEMBER',
  CIRCLED_CHARACTER: 'CIRCLED_CHARACTER',
  STEREOTYPE: 'STEREOTYPE',
} as const;
export type EntityPortion = (typeof EntityPortion)[keyof typeof EntityPortion];

/** `MEMBER` expands to `{FIELD, METHOD}`; every other value is a
 * singleton set.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPortion.java:44-49 */
export function asSet(portion: EntityPortion): ReadonlySet<EntityPortion> {
  if (portion === EntityPortion.MEMBER) return new Set([EntityPortion.FIELD, EntityPortion.METHOD]);

  return new Set([portion]);
}
