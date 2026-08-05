import type { StringBounder } from '../font/StringBounder.js';
import type { TextBlock } from '../shape/TextBlock.js';
import type { XDimension2D } from './XDimension2D.js';
import type { XPoint2D } from './XPoint2D.js';
import type { PlacementStrategy } from './PlacementStrategy.js';

/**
 * AbstractPlacementStrategy — the shared base of every concrete
 * placement strategy: measures each added block once (through the
 * constructor's `StringBounder`) into an insertion-ordered
 * block→dimension map, and provides the sum/max reducers the concrete
 * `getPositions` bodies share.
 *
 * Upstream: klimt/geom/AbstractPlacementStrategy.java. The Java
 * overload pairs (`getSumWidth()` / `getSumWidth(Iterator)`, etc.)
 * become one method each with an optional iterator parameter —
 * defaulting to `dimensions.values()`, exactly the Java no-arg body.
 * Java's `Iterator` maps to the ES `Iterator` protocol (`hasNext()/
 * next()` → `next().done/.value`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/AbstractPlacementStrategy.java
 */
export abstract class AbstractPlacementStrategy implements PlacementStrategy {
  private readonly stringBounder: StringBounder;
  /** @see klimt/geom/AbstractPlacementStrategy.java#dimensions (LinkedHashMap → Map) */
  private readonly dimensions = new Map<TextBlock, XDimension2D>();

  constructor(stringBounder: StringBounder) {
    this.stringBounder = stringBounder;
  }

  /** @see klimt/geom/AbstractPlacementStrategy.java#add */
  add(block: TextBlock): void {
    this.dimensions.set(block, block.calculateDimension(this.stringBounder));
  }

  abstract getPositions(width: number, height: number): Map<TextBlock, XPoint2D>;

  /** @see klimt/geom/AbstractPlacementStrategy.java#getDimensions */
  protected getDimensions(): Map<TextBlock, XDimension2D> {
    return this.dimensions;
  }

  /** @see klimt/geom/AbstractPlacementStrategy.java#getSumWidth (both overloads) */
  protected getSumWidth(it: Iterator<XDimension2D> = this.dimensions.values()): number {
    let result = 0;
    for (let e = it.next(); !(e.done ?? false); e = it.next()) result += e.value.getWidth();
    return result;
  }

  /** @see klimt/geom/AbstractPlacementStrategy.java#getSumHeight (both overloads) */
  protected getSumHeight(it: Iterator<XDimension2D> = this.dimensions.values()): number {
    let result = 0;
    for (let e = it.next(); !(e.done ?? false); e = it.next()) result += e.value.getHeight();
    return result;
  }

  /** @see klimt/geom/AbstractPlacementStrategy.java#getMaxWidth (both overloads) */
  protected getMaxWidth(it: Iterator<XDimension2D> = this.dimensions.values()): number {
    let result = 0;
    for (let e = it.next(); !(e.done ?? false); e = it.next()) result = Math.max(result, e.value.getWidth());
    return result;
  }

  /** @see klimt/geom/AbstractPlacementStrategy.java#getMaxHeight (both overloads) */
  protected getMaxHeight(it: Iterator<XDimension2D> = this.dimensions.values()): number {
    let result = 0;
    for (let e = it.next(); !(e.done ?? false); e = it.next()) result = Math.max(result, e.value.getHeight());
    return result;
  }

  /** @see klimt/geom/AbstractPlacementStrategy.java#getStringBounder */
  protected getStringBounder(): StringBounder {
    return this.stringBounder;
  }
}
