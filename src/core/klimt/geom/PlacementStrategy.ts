import type { TextBlock } from '../shape/TextBlock.js';
import type { XPoint2D } from './XPoint2D.js';

/**
 * PlacementStrategy — the row-placement seam `ULayoutGroup` drives:
 * blocks are `add`ed one by one, then `getPositions` lays every block
 * out inside a (width, height) area. `MethodsOrFieldsArea` (SI1/T8)
 * picks the concrete strategy per visibility-icon mode and alignment.
 *
 * Upstream: klimt/geom/PlacementStrategy.java — `add(TextBlock)`,
 * `getPositions(double, double): Map<TextBlock, XPoint2D>`. The Java
 * `LinkedHashMap` result becomes a TS `Map` (same insertion-order
 * iteration contract).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategy.java
 */
export interface PlacementStrategy {
  /** @see klimt/geom/PlacementStrategy.java#add */
  add(block: TextBlock): void;

  /** @see klimt/geom/PlacementStrategy.java#getPositions */
  getPositions(width: number, height: number): Map<TextBlock, XPoint2D>;
}
