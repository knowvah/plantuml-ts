import type { StringBounder } from '../font/StringBounder.js';
import type { TextBlock } from '../shape/TextBlock.js';
import { XPoint2D } from './XPoint2D.js';
import { AbstractPlacementStrategy } from './AbstractPlacementStrategy.js';

/**
 * PlacementStrategyX1X2 — horizontal row: each block vertically
 * centered, with the unused width split into equal gaps left of,
 * between and right of the blocks (`space = (width - usedWidth) /
 * (n + 1)`).
 *
 * Upstream: klimt/geom/PlacementStrategyX1X2.java.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategyX1X2.java
 */
export class PlacementStrategyX1X2 extends AbstractPlacementStrategy {
  constructor(stringBounder: StringBounder) {
    super(stringBounder);
  }

  /** @see klimt/geom/PlacementStrategyX1X2.java#getPositions */
  getPositions(width: number, height: number): Map<TextBlock, XPoint2D> {
    const usedWidth = this.getSumWidth();

    const space = (width - usedWidth) / (this.getDimensions().size + 1);
    const result = new Map<TextBlock, XPoint2D>();
    let x = space;
    for (const [block, dim] of this.getDimensions()) {
      const y = (height - dim.getHeight()) / 2;
      result.set(block, new XPoint2D(x, y));
      x += dim.getWidth() + space;
    }
    return result;
  }
}
