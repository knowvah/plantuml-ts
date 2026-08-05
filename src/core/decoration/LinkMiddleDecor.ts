/**
 * LinkMiddleDecor — the mid-link decoration (lollipop circles for
 * provided/required interfaces, subset/superset markers).
 *
 * Upstream: decoration/LinkMiddleDecor.java:47. As-const object +
 * string union per project convention; placed under
 * `src/core/abel/decoration/` — see `LinkDecor.ts`'s header note on
 * the write-set-constrained home. SI1/T2 (batch 1); ADR-1.
 *
 * DEFERRED member (reported; ActorStyle.ts precedent):
 * `getMiddleFactory(HColor, HColor)` (:49-69) — dispatches to
 * `svek/extremity` `MiddleFactory`/`MiddleFactoryCircle`/
 * `MiddleFactoryCircleCircled`/`MiddleFactorySubset`/
 * `MiddleCircleCircledMode`, none of which are ported, and their home
 * `src/core/svek/extremity/` is outside this task's write-set.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkMiddleDecor.java:47
 */
export const LinkMiddleDecor = {
  NONE: 'NONE',
  CIRCLE: 'CIRCLE',
  CIRCLE_CIRCLED: 'CIRCLE_CIRCLED',
  CIRCLE_CIRCLED1: 'CIRCLE_CIRCLED1',
  CIRCLE_CIRCLED2: 'CIRCLE_CIRCLED2',
  SUBSET: 'SUBSET',
  SUPERSET: 'SUPERSET',
} as const;
export type LinkMiddleDecor = (typeof LinkMiddleDecor)[keyof typeof LinkMiddleDecor];

/**
 * `LinkMiddleDecor#getInversed()` — swaps `CIRCLE_CIRCLED1`/
 * `CIRCLE_CIRCLED2`; every other value maps to itself.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkMiddleDecor.java:71-78
 */
export function getInversed(decor: LinkMiddleDecor): LinkMiddleDecor {
  if (decor === LinkMiddleDecor.CIRCLE_CIRCLED1) return LinkMiddleDecor.CIRCLE_CIRCLED2;
  else if (decor === LinkMiddleDecor.CIRCLE_CIRCLED2) return LinkMiddleDecor.CIRCLE_CIRCLED1;

  return decor;
}
