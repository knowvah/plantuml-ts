/**
 * GroupType — the 8-value group-entity kind selector of the abel model:
 * which kind of container a group Entity is (package, state region,
 * activity partition, ...). `ROOT` is the synthetic top-level group
 * `EntityFactory` creates for the diagram itself.
 *
 * Upstream: abel/GroupType.java:38-42 (a bare 8-value enum, no
 * members). As-const object + string union, not a TS `enum` (project
 * convention — see `src/core/skin/ActorStyle.ts`).
 *
 * SI1/T2 (batch 1); ADR-1 — the base's own faithful abel version.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/GroupType.java:40
 */
export const GroupType = {
  ROOT: 'ROOT',
  PACKAGE: 'PACKAGE',
  STATE: 'STATE',
  CONCURRENT_STATE: 'CONCURRENT_STATE',
  INNER_ACTIVITY: 'INNER_ACTIVITY',
  CONCURRENT_ACTIVITY: 'CONCURRENT_ACTIVITY',
  DOMAIN: 'DOMAIN',
  REQUIREMENT: 'REQUIREMENT',
} as const;
export type GroupType = (typeof GroupType)[keyof typeof GroupType];
