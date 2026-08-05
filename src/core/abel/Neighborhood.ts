/**
 * Neighborhood — ADR-2 consumed-interface stub for `dot/Neighborhood.java`
 * (the same-tail link bundle drawn around a leaf). `Entity` only stores
 * and returns one (`setNeighborhood`/`getNeighborhood`) — an opaque
 * marker is the exact consumed surface. The real class (drawU over
 * Bibliotekon/SvekEdge) lands with the svek dot-neighborhood port,
 * which implements this and moves it to `src/core/dot/Neighborhood.ts`.
 * Journaled (T5).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/dot/Neighborhood.java:60
 */
export interface Neighborhood {
  /** TS-only nominal brand; never assigned. `Entity` calls no member. */
  readonly __neighborhoodBrand?: never;
}
