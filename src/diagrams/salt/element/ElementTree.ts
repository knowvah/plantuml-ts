import { Fore } from '../../../core/klimt/Fore.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { trin } from '../../../core/style/parser/StyleParser.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { AbstractElement } from './AbstractElement.js';
import type { Element } from './Element.js';
import { ElementText } from './ElementText.js';
import { ElementTreeEntry } from './ElementTreeEntry.js';
import { Grid2 } from './Grid2.js';
import { ListWidth } from './ListWidth.js';
import { Skeleton } from './Skeleton.js';
import { TableStrategy } from './TableStrategy.js';

/** The tree-level prefix of a first cell, one per level. @see ElementTree.java:66 */
const LEVEL_PREFIX = '+';

/**
 * ElementTree — the `{T` tree table: one `ElementTreeEntry` per row (tree
 * label + other cells), the `Skeleton` guide lines, and the `Grid2` lines
 * its `TableStrategy` selects. Built by `ElementFactoryTree#create`
 * (ElementFactoryTree.java:66-104).
 *
 * Mutable like upstream: `addEntry`/`addCellToEntry` append in place.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementTree.java:50-157
 */
export class ElementTree extends AbstractElement {
  /** @see ElementTree.java:52 */
  private readonly entries: ElementTreeEntry[] = [];
  /** @see ElementTree.java:53 */
  private readonly font: UFont;
  /** @see ElementTree.java:54 */
  private readonly spriteContainer: ISkinSimple;
  /** Column margin, in px. @see ElementTree.java:55 */
  private readonly margin = 10;
  /** @see ElementTree.java:56 */
  private readonly strategy: TableStrategy;

  /** @see ElementTree.java:58-62 */
  constructor(font: UFont, spriteContainer: ISkinSimple, strategy: TableStrategy) {
    super();
    this.font = font;
    this.spriteContainer = spriteContainer;
    this.strategy = strategy;
  }

  /**
   * A new row: its leading `+` run is the level, the rest (trimmed) its
   * label.
   * @see ElementTree.java:64-72
   */
  addEntry(s: string): void {
    let level = 0;
    while (s.startsWith(LEVEL_PREFIX)) {
      level++;
      s = s.substring(1);
    }
    const elmt: Element = new ElementText([trin(s)], this.font, this.spriteContainer);
    this.entries.push(new ElementTreeEntry(level, elmt));
  }

  /** Appends a cell to the last row; dropped when there is none. @see ElementTree.java:74-79 */
  addCellToEntry(elmt: Element): void {
    const size = this.entries.length;
    if (size > 0) {
      // Invariant: size > 0, so the last entry is defined.
      (this.entries[size - 1] as ElementTreeEntry).addCell(elmt);
    }
  }

  /** @see ElementTree.java:81-98 */
  getPreferredDimension(stringBounder: StringBounder, _x: number, _y: number): XDimension2D {
    let w1 = 0;
    let h = 0;
    for (const entry of this.entries) {
      const dim1 = entry.getPreferredDimensionFirstCell(stringBounder);
      w1 = Math.max(w1, dim1.getWidth());
      // The row must be tall enough for its tallest cell (issue #2730, point 3).
      h += entry.getRowHeight(stringBounder);
    }
    let w2 = this.getWidthOther(stringBounder).getTotalWidthWithMargin(this.margin);
    if (w2 > 0) {
      w2 += this.margin;
    }
    return new XDimension2D(w1 + w2 + 2, h);
  }

  /** @see ElementTree.java:100-107 */
  private getWidthOther(stringBounder: StringBounder): ListWidth {
    let merge = new ListWidth();
    for (const entry of this.entries) {
      const dim2 = entry.getPreferredDimensionOtherCell(stringBounder);
      merge = merge.mergeMax(dim2);
    }
    return merge;
  }

  /** @see ElementTree.java:109-116 */
  private getWidth1(stringBounder: StringBounder): number {
    let w1 = 0;
    for (const entry of this.entries) {
      const dim1 = entry.getPreferredDimensionFirstCell(stringBounder);
      w1 = Math.max(w1, dim1.getWidth());
    }
    return w1;
  }

  /**
   * At z-index 0 only: every row's cells in black, then the skeleton and
   * (unless `DRAW_NONE`) the grid in `#888`. `dimToUse` is never read.
   * @see ElementTree.java:118-155
   */
  drawU(ug: UGraphic, zIndex: number, _dimToUse: XDimension2D): void {
    if (zIndex !== 0) return;

    ug = ug.apply(new Fore(this.getBlack().asPaint()));

    const stringBounder = ug.getStringBounder();
    const w1 = this.getWidth1(stringBounder);
    const otherWidth = this.getWidthOther(stringBounder);
    const skeleton = new Skeleton();
    let yvar = 0;
    const rows: number[] = [];
    rows.push(yvar);
    const cols = this.getColsStart(w1, otherWidth);

    for (const entry of this.entries) {
      entry.drawFirstCell(ug, 0, yvar);
      entry.drawSecondCell(ug, w1 + this.margin, yvar, otherWidth, this.margin);
      const h = entry.getRowHeight(stringBounder);
      skeleton.add(entry.getXDelta() - 7, yvar + h / 2 - 1);
      yvar += h;
      rows.push(yvar);
    }
    ug = ug.apply(new Fore(this.getColor88().asPaint()));
    skeleton.draw(ug, 0, 0);
    if (this.strategy !== TableStrategy.DRAW_NONE) {
      const grid = new Grid2(rows, cols, this.strategy);
      grid.drawU(ug);
    }
  }

  /**
   * `drawU`'s column starts: 0, the label column's end plus half a margin,
   * then each other column's width plus a margin. Split out of `drawU`
   * only to keep it inside the complexity limit; statement order unchanged
   * (the `rows` statements it interleaved with upstream are independent).
   * @see ElementTree.java:130,132-139
   */
  private getColsStart(w1: number, otherWidth: ListWidth): number[] {
    const cols: number[] = [];
    let xvar = 0;
    cols.push(xvar);
    xvar += w1 + this.margin / 2;
    cols.push(xvar);
    const it = otherWidth.iterator();
    for (let r = it.next(); r.done !== true; r = it.next()) {
      xvar += r.value + this.margin;
      cols.push(xvar);
    }
    return cols;
  }
}
