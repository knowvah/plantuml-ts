import type { StringBounder } from '../font/StringBounder.js';
import type { TextBlock } from '../shape/TextBlock.js';
import { XPoint2D } from './XPoint2D.js';
import { AbstractPlacementStrategy } from './AbstractPlacementStrategy.js';

/**
 * PlacementStrategyY1Y2Right — vertical stack pinned to the right edge
 * (`x = width - blockWidth`), unused height split into equal gaps.
 *
 * Upstream: klimt/geom/PlacementStrategyY1Y2Right.java.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategyY1Y2Right.java
 */
export class PlacementStrategyY1Y2Right extends AbstractPlacementStrategy {
  constructor(stringBounder: StringBounder) {
    super(stringBounder);
  }

  /** @see klimt/geom/PlacementStrategyY1Y2Right.java#getPositions */
  getPositions(width: number, height: number): Map<TextBlock, XPoint2D> {
    const usedHeight = this.getSumHeight();

    const space = (height - usedHeight) / (this.getDimensions().size + 1);
    const result = new Map<TextBlock, XPoint2D>();
    let y = space;
    for (const [block, dim] of this.getDimensions()) {
      const x = width - dim.getWidth();
      result.set(block, new XPoint2D(x, y));
      y += dim.getHeight() + space;
    }
    return result;
  }
}
