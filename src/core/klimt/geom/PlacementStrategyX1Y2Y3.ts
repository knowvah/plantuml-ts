import type { StringBounder } from '../font/StringBounder.js';
import type { TextBlock } from '../shape/TextBlock.js';
import type { XDimension2D } from './XDimension2D.js';
import { XPoint2D } from './XPoint2D.js';
import { AbstractPlacementStrategy } from './AbstractPlacementStrategy.js';

/**
 * PlacementStrategyX1Y2Y3 — two-column layout: the FIRST block is a
 * vertically-centered left column; every remaining block stacks in a
 * second column (each centered against the widest of them), the stack
 * itself vertically centered. Horizontal slack splits into three equal
 * gaps (`space = (width - firstWidth - maxWidthButFirst) / 3`), with
 * the second column starting at `2 * space + firstWidth`.
 *
 * Upstream: klimt/geom/PlacementStrategyX1Y2Y3.java.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategyX1Y2Y3.java
 */
export class PlacementStrategyX1Y2Y3 extends AbstractPlacementStrategy {
  constructor(stringBounder: StringBounder) {
    super(stringBounder);
  }

  /** @see klimt/geom/PlacementStrategyX1Y2Y3.java#getPositions */
  getPositions(width: number, height: number): Map<TextBlock, XPoint2D> {
    const firstEntry = this.getDimensions().values().next();
    if (firstEntry.done ?? false) throw new Error('PlacementStrategyX1Y2Y3: no blocks');
    const first: XDimension2D = firstEntry.value;

    const maxWidthButFirst = this.getMaxWidth(this.butFirst());
    const sumHeightButFirst = this.getSumHeight(this.butFirst());

    const space = (width - first.getWidth() - maxWidthButFirst) / 3;

    const result = new Map<TextBlock, XPoint2D>();

    const it = this.getDimensions().entries();
    const entResult = it.next();
    if (entResult.done ?? false) throw new Error('PlacementStrategyX1Y2Y3: no blocks');
    const ent: [TextBlock, XDimension2D] = entResult.value;
    let y = (height - ent[1].getHeight()) / 2;
    result.set(ent[0], new XPoint2D(space, y));

    y = (height - sumHeightButFirst) / 2;
    for (let e = it.next(); !(e.done ?? false); e = it.next()) {
      const ent2: [TextBlock, XDimension2D] = e.value;
      const textBlock = ent2[0];
      const dim = this.getDimensions().get(textBlock);
      if (dim === undefined) throw new Error('PlacementStrategyX1Y2Y3: unmeasured block');
      const x = 2 * space + first.getWidth() + (maxWidthButFirst - dim.getWidth()) / 2;
      result.set(textBlock, new XPoint2D(x, y));
      y += ent2[1].getHeight();
    }
    return result;
  }

  /** @see klimt/geom/PlacementStrategyX1Y2Y3.java#butFirst */
  private butFirst(): Iterator<XDimension2D> {
    const iterator = this.getDimensions().values();
    iterator.next();
    return iterator;
  }
}
