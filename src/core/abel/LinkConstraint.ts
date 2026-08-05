/**
 * LinkConstraint — ADR-2 consumed-interface stub for
 * `cucadiagram/LinkConstraint.java` (the paired-link `{constraint}`
 * label drawn between two links). `Link` only STORES and RETURNS one
 * (`setLinkConstraint`/`getLinkConstraint`, carried by `getInv`) — an
 * opaque marker is the exact consumed surface (`Neighborhood.ts`
 * precedent). The real class (`setPosition`/`drawMe` over `UGraphic`)
 * lands with the cucadiagram package port, which implements this and
 * moves it to `src/core/cucadiagram/LinkConstraint.ts`. Journaled (T6).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/LinkConstraint.java:53
 */
export interface LinkConstraint {
  /** TS-only nominal brand; never assigned. `Link` calls no member. */
  readonly __linkConstraintBrand?: never;
}
