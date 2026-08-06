/**
 * LinkStrategy — how link extremity decoration is realised: `LEGACY`
 * draws arrow tail/head in the graphviz-generated dot and recovers the
 * decoration angle from the produced SVG (fragile — graphviz sometimes
 * omits them); `SIMPLEST` emits no tail/head and derives the angle from
 * the Bezier data. `Link.getLinkStrategy()` is hardwired to `SIMPLEST`
 * upstream (abel/Link.java:97-100).
 *
 * Upstream: abel/LinkStrategy.java:38-59 ("Temporary class, while we
 * are fixing https://github.com/plantuml/plantuml/issues/1491" — the
 * name `LEGACY_toberemoved` is upstream's, preserved verbatim).
 * As-const object + string union per project convention.
 *
 * SI1/T2 (batch 1); ADR-1.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LinkStrategy.java:38-59
 */
export const LinkStrategy = {
  LEGACY_toberemoved: 'LEGACY_toberemoved',
  SIMPLEST: 'SIMPLEST',
} as const;
export type LinkStrategy = (typeof LinkStrategy)[keyof typeof LinkStrategy];
