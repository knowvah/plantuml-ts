import { Display } from '../../../core/klimt/creole/Display.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import { UFontFactory } from '../../../core/klimt/font/UFontFactory.js';
import { HorizontalAlignment } from '../../../core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../../../core/klimt/shape/TextBlockUtils.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import type { Cell } from '../Cell.js';
import type { Positionner2 } from '../Positionner2.js';
import { atomOpsFor } from '../SaltDictionary.js';
import { AbstractElement } from './AbstractElement.js';
import type { Element } from './Element.js';
import { Grid } from './Grid.js';
import { LeftFirst } from './LeftFirst.js';
import type { TableStrategy } from './TableStrategy.js';
import { TopFirst } from './TopFirst.js';

/** The title font size upstream asks for; `UFontFactory.byDefault` ignores
 *  it and builds `sansSerif(12)` (UFontFactory.java:66-68).
 *  @see ElementPyramid.java:78 */
const TITLE_FONT_SIZE = 10;

/** Java array read: an out-of-range index throws `ArrayIndexOutOfBoundsException`
 *  (jar-probed: `{` / `a` / `b` / `*` / `}` dies at ElementPyramid.java:151). */
function at(array: readonly number[], index: number): number {
  const v = array[index];
  if (v === undefined) throw new RangeError(`Index ${index} out of bounds for length ${array.length}`);
  return v;
}

/** Java `new double[length]`: zero-filled. */
function doubleArray(length: number): number[] {
  return new Array<number>(length).fill(0);
}

/**
 * ElementPyramid — a salt grid container (`{`, `{+`, `{^"title"`, `{#`,
 * `{!`, `{-`): each `Positionner2` cell is sized to its element's preferred
 * dimension + 2, spanning cells claim only the width/height their
 * single-span neighbours left missing (`LeftFirst`/`TopFirst` order), the
 * optional 12 pt title pushes every row down by half its height, and the
 * `Grid` lines and title are drawn at z-index 0 after the cells.
 *
 * `rowsStart`/`colsStart` are computed once, lazily, by the first
 * `getPreferredDimension`/`drawU` (as upstream).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementPyramid.java:58-176
 */
export class ElementPyramid extends AbstractElement {
  /** @see ElementPyramid.java:60 */
  private rows: number;
  /** @see ElementPyramid.java:61 */
  private cols: number;
  /** @see ElementPyramid.java:62 */
  private readonly title: TextBlock;
  /** @see ElementPyramid.java:63 */
  private readonly tableStrategy: TableStrategy;
  /** @see ElementPyramid.java:64 */
  private readonly positions1: ReadonlyMap<Element, Cell>;
  /** A `HashMap<Cell, Element>`; `Cell` keeps `Object` identity, which a JS
   *  `Map` also keys on. Only read with `get`. @see ElementPyramid.java:65 */
  private readonly positions2 = new Map<Cell, Element>();

  /** Java `null` until `init`. @see ElementPyramid.java:67 */
  private rowsStart: number[] | undefined;
  /** Java `null` until `init`. @see ElementPyramid.java:68 */
  private colsStart: number[] | undefined;

  /**
   * `title === null` (no `{^"…"` title) is the empty 0 x 0 block. The title
   * is `Display.getWithNewlines` creole in `FontConfiguration.blackBlueTrue`
   * of `byDefault(10)` — 12 pt; `atomOps` is ADR-9's, as in `ElementText`.
   * @see ElementPyramid.java:70-93
   */
  constructor(
    positionner: Positionner2,
    tableStrategy: TableStrategy,
    title: string | null,
    spriteContainer: ISkinSimple,
  ) {
    super();
    this.positions1 = positionner.getAll();
    for (const [key, value] of this.positions1) {
      this.positions2.set(value, key);
    }

    if (title !== null) {
      const fontConfiguration = this.blackBlueTrue(UFontFactory.byDefault(TITLE_FONT_SIZE));
      const ctx = { fontConfiguration, spriteContainer, atomOps: atomOpsFor(spriteContainer, fontConfiguration) };
      this.title = Display.getWithNewlines(this.getPragma(), title).create(ctx, HorizontalAlignment.LEFT);
    } else {
      this.title = TextBlockUtils.empty(0, 0);
    }
    this.rows = positionner.getNbRows();
    this.cols = positionner.getNbCols();
    this.tableStrategy = tableStrategy;

    for (const c of this.positions1.values()) {
      this.rows = Math.max(this.rows, c.getMaxRow());
      this.cols = Math.max(this.cols, c.getMaxCol());
    }
  }

  /** @see ElementPyramid.java:95-99 */
  getPreferredDimension(stringBounder: StringBounder, _x: number, _y: number): XDimension2D {
    const { rowsStart, colsStart } = this.init(stringBounder);
    return new XDimension2D(
      at(colsStart, colsStart.length - 1),
      at(rowsStart, rowsStart.length - 1) + this.title.calculateDimension(stringBounder).getHeight(),
    );
  }

  /** `ug.apply(getBlack())` sets the foreground (`Fore`). @see ElementPyramid.java:101-121 */
  drawU(ug: UGraphic, zIndex: number, _dimToUse: XDimension2D): void {
    ug = ug.apply(new Fore(this.getBlack().asPaint()));

    const { rowsStart, colsStart } = this.init(ug.getStringBounder());
    const titleHeight = this.title.calculateDimension(ug.getStringBounder()).getHeight();
    const grid = new Grid(rowsStart, colsStart, this.tableStrategy, this.title);
    for (const [elt, cell] of this.positions1) {
      const xcell = at(colsStart, cell.getMinCol());
      const supY = cell.getMinRow() === 0 ? titleHeight / 2 : 0;
      const ycell = at(rowsStart, cell.getMinRow()) + supY;
      const width = at(colsStart, cell.getMaxCol() + 1) - at(colsStart, cell.getMinCol()) - 1;
      const height = at(rowsStart, cell.getMaxRow() + 1) - at(rowsStart, cell.getMinRow()) - 1;
      grid.addCell(cell);
      elt.drawU(ug.apply(new UTranslate(xcell + 1, ycell + 1)), zIndex, new XDimension2D(width, height));
    }
    if (zIndex === 0) grid.drawU(ug, 0, 0, this.getWhite());
  }

  /**
   * Returns the (now non-null) starts the Java reads off the fields. Split
   * in three for the complexity cap; `all` is ONE list, sorted `LeftFirst`
   * then re-sorted `TopFirst` in place — both sorts are stable
   * (`Collections.sort`, `Array#sort`), so the row pass sees TopFirst ties
   * in LeftFirst order, as upstream.
   * @see ElementPyramid.java:123-148
   */
  private init(stringBounder: StringBounder): { rowsStart: number[]; colsStart: number[] } {
    if (this.rowsStart !== undefined && this.colsStart !== undefined)
      return { rowsStart: this.rowsStart, colsStart: this.colsStart };

    const titleHeight = this.title.calculateDimension(stringBounder).getHeight();
    const rowsStart = doubleArray(this.rows + 1);
    this.rowsStart = rowsStart;
    rowsStart[0] = titleHeight / 2;
    for (let i = 1; i < this.rows + 1; i++) rowsStart[i] = titleHeight / 2;

    const colsStart = doubleArray(this.cols + 1);
    this.colsStart = colsStart;
    const all = [...this.positions1.values()];
    this.initCols(stringBounder, all, colsStart);
    this.initRows(stringBounder, all, rowsStart, titleHeight);
    return { rowsStart, colsStart };
  }

  /** @see ElementPyramid.java:134-140 */
  private initCols(stringBounder: StringBounder, all: Cell[], colsStart: number[]): void {
    const leftFirst = new LeftFirst();
    all.sort((c0, c1) => leftFirst.compare(c0, c1));
    for (const cell of all) {
      const dim = this.elementAt(cell).getPreferredDimension(stringBounder, 0, 0);
      this.ensureColWidth(colsStart, cell.getMinCol(), cell.getMaxCol() + 1, dim.getWidth() + 2);
    }
  }

  /** @see ElementPyramid.java:141-147 */
  private initRows(stringBounder: StringBounder, all: Cell[], rowsStart: number[], titleHeight: number): void {
    const topFirst = new TopFirst();
    all.sort((c0, c1) => topFirst.compare(c0, c1));
    for (const cell of all) {
      const supY = cell.getMinRow() === 0 ? titleHeight / 2 : 0;
      const dim = this.elementAt(cell).getPreferredDimension(stringBounder, 0, 0);
      this.ensureRowHeight(rowsStart, cell.getMinRow(), cell.getMaxRow() + 1, dim.getHeight() + supY + 2);
    }
  }

  /** `positions2.get(cell)`: every cell came from `positions1`, so it is
   *  mapped (a JS `Map#get` is `T | undefined` by type only). */
  private elementAt(cell: Cell): Element {
    const elt = this.positions2.get(cell);
    if (elt === undefined) throw new TypeError(`NullPointerException: no element at ${cell.toString()}`);
    return elt;
  }

  /** `colsStart` is the field `init` just set. @see ElementPyramid.java:150-157 */
  private ensureColWidth(colsStart: number[], first: number, last: number, width: number): void {
    const actual = at(colsStart, last) - at(colsStart, first);
    const missing = width - actual;
    if (missing > 0) for (let i = last; i < colsStart.length; i++) colsStart[i] = at(colsStart, i) + missing;
  }

  /** `rowsStart` is the field `init` just set. @see ElementPyramid.java:159-166 */
  private ensureRowHeight(rowsStart: number[], first: number, last: number, height: number): void {
    const actual = at(rowsStart, last) - at(rowsStart, first);
    const missing = height - actual;
    if (missing > 0) for (let i = last; i < rowsStart.length; i++) rowsStart[i] = at(rowsStart, i) + missing;
  }

  /** @see ElementPyramid.java:168-170 */
  getNbRows(): number {
    return this.rows + 1;
  }

  /** @see ElementPyramid.java:172-174 */
  getNbCols(): number {
    return this.cols + 1;
  }
}
