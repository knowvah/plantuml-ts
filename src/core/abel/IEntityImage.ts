/**
 * IEntityImage — ADR-2 consumed-interface stub for
 * `svek/IEntityImage.java` (the rendered-block contract every svek leaf
 * image implements). `Entity` only stores and returns one
 * (`setSvekImage`/`getSvekImage`/`overrideImage`) — an opaque marker is
 * the exact consumed surface. NOT unified with this port's existing
 * description-engine image types (`svek/image/EntityImageDescription*.ts`
 * serve that engine's own AST, per ADR-1 no-migration); the real
 * interface (drawU, getShapeType, margins, shield, ...) lands with the
 * svek base-image port, which widens this and moves it to
 * `src/core/svek/IEntityImage.ts`. Journaled (T5).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/IEntityImage.java
 */
export interface IEntityImage {
  /** TS-only nominal brand; never assigned. `Entity` calls no member. */
  readonly __iEntityImageBrand?: never;
}
