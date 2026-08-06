/**
 * ParserPass — which of the (up to) three parsing passes is running.
 * Upstream: a bare 3-value enum. As-const object + string union, not a
 * TS `enum` (project convention — see `src/core/abel/GroupType.ts`).
 *
 * SI1/T10 closure pull (consumed by `CucaDiagram#startingPass`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/ParserPass.java:38-41
 */
export const ParserPass = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const;
export type ParserPass = (typeof ParserPass)[keyof typeof ParserPass];
