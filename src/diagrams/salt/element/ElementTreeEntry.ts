import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { Element } from './Element.js';
import { ListWidth } from './ListWidth.js';

/** Indent per tree level, in px. @see ElementTreeEntry.java:86 */
const LEVEL_INDENT = 10;

/**
 * The `dimToUse` every tree cell is drawn with: upstream passes `null`
 * (ElementTreeEntry.java:90, 96). `Element.ts` types the parameter
 * non-null, so the `null` is re-typed here rather than replaced by an
 * invented dimension; a cell that reads it (`ElementLine.java:62`) fails as
 * Java's `NullPointerException` does.
 */
const NULL_DIM_TO_USE = null as unknown as XDimension2D;

/** Java `Iterator<Double>#next`: `NoSuchElementException` once drained. */
function next(it: Iterator<number>): number {
  const r = it.next();
  if (r.done === true) {
    throw new Error('NoSuchElementException');
  }
  return r.value;
}

/**
 * ElementTreeEntry — one `{T` row: the tree label (indented `level * 10`)
 * and the row's other cells.
 *
 * Mutable like upstream: `addCell` appends in place.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementTreeEntry.java:47-101
 */
export class ElementTreeEntry {
  /** @see ElementTreeEntry.java:49 */
  private readonly firstElement: Element;
  /** @see ElementTreeEntry.java:50 */
  private readonly level: number;
  /** @see ElementTreeEntry.java:51 */
  private readonly otherElements: Element[] = [];

  /** @see ElementTreeEntry.java:53-56 */
  constructor(level: number, elmt: Element) {
    this.firstElement = elmt;
    this.level = level;
  }

  /** @see ElementTreeEntry.java:58-60 */
  addCell(elmt: Element): void {
    this.otherElements.push(elmt);
  }

  /** @see ElementTreeEntry.java:62-64 */
  getPreferredDimensionFirstCell(stringBounder: StringBounder): XDimension2D {
    return this.firstElement.getPreferredDimension(stringBounder, 0, 0).delta(this.getXDelta(), 0);
  }

  /** @see ElementTreeEntry.java:66-72 */
  getPreferredDimensionOtherCell(stringBounder: StringBounder): ListWidth {
    const result = new ListWidth();
    for (const element of this.otherElements) {
      result.add(element.getPreferredDimension(stringBounder, 0, 0).getWidth());
    }
    return result;
  }

  /**
   * The tallest cell of the row, the other cells included (issue #2730,
   * point 3).
   * @see ElementTreeEntry.java:74-83
   */
  getRowHeight(stringBounder: StringBounder): number {
    let h = this.getPreferredDimensionFirstCell(stringBounder).getHeight();
    for (const element of this.otherElements) {
      h = Math.max(h, element.getPreferredDimension(stringBounder, 0, 0).getHeight());
    }
    return h;
  }

  /** @see ElementTreeEntry.java:85-87 */
  getXDelta(): number {
    return this.level * LEVEL_INDENT;
  }

  /** @see ElementTreeEntry.java:89-91 */
  drawFirstCell(ug: UGraphic, x: number, y: number): void {
    this.firstElement.drawU(ug.apply(new UTranslate(x + this.getXDelta(), y)), 0, NULL_DIM_TO_USE);
  }

  /**
   * Each other cell at `x`, then `x` steps by that column's width plus
   * `margin`; `otherWidth` shorter than the cells throws, as `it.next()`.
   * @see ElementTreeEntry.java:93-99
   */
  drawSecondCell(ug: UGraphic, x: number, y: number, otherWidth: ListWidth, margin: number): void {
    const it = otherWidth.iterator();
    for (const element of this.otherElements) {
      element.drawU(ug.apply(new UTranslate(x, y)), 0, NULL_DIM_TO_USE);
      x += next(it) + margin;
    }
  }
}
