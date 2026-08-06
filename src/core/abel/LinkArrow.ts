/**
 * LinkArrow — the sequence-style direction hint on a link label
 * (`-->` label arrows): none/several, along the link, or against it.
 * A `Link` field (abel/Link.java:95, default `NONE_OR_SEVERAL`).
 *
 * Upstream: abel/LinkArrow.java:43. As-const object + string union per
 * project convention (`src/core/skin/ActorStyle.ts`).
 *
 * SI1/T2 (batch 1); ADR-1.
 *
 * DEFERRED member (reported; ActorStyle.ts precedent): `mute(GuideLine)`
 * (:55-72) — `svek/GuideLine.java` (the 2-method arrow-direction
 * interface) is unported and `src/core/svek/` is outside this task's
 * write-set.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LinkArrow.java:43
 */
export const LinkArrow = {
  NONE_OR_SEVERAL: 'NONE_OR_SEVERAL',
  DIRECT_NORMAL: 'DIRECT_NORMAL',
  BACKWARD: 'BACKWARD',
} as const;
export type LinkArrow = (typeof LinkArrow)[keyof typeof LinkArrow];

/**
 * `LinkArrow#reverse()` — swaps `DIRECT_NORMAL`/`BACKWARD`;
 * `NONE_OR_SEVERAL` maps to itself.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LinkArrow.java:45-53
 */
export function reverse(arrow: LinkArrow): LinkArrow {
  if (arrow === LinkArrow.DIRECT_NORMAL) return LinkArrow.BACKWARD;

  if (arrow === LinkArrow.BACKWARD) return LinkArrow.DIRECT_NORMAL;

  return LinkArrow.NONE_OR_SEVERAL;
}
