/**
 * Grid — the `{#`/`{+`/`{^`/`{!`/`{-` pyramid table lines: one unit
 * segment per cell edge, collected per `TableStrategy` (the outline at
 * construction, each cell's edges on `addCell`), drawn as horizontals then
 * verticals, then the pyramid title over a white box at (6, 0).
 * Built by `ElementPyramid#drawU` (`ElementPyramid.java:106`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Grid.java:50-133
 */
import { Back } from '../../../core/klimt/Back.js';
import type { HColorSimple } from '../../../core/klimt/color/HColorSimple.js';
import { Fore } from '../../../core/klimt/Fore.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { Cell } from '../Cell.js';
import { Segment } from './Segment.js';
import { TableStrategy } from './TableStrategy.js';

/** `HashMap.DEFAULT_INITIAL_CAPACITY` (`new HashSet<>()` → `new HashMap<>()`,
 *  HashSet.java:106-108). @see java.base/java/util/HashMap.java:238 (JDK 21) */
const DEFAULT_INITIAL_CAPACITY = 16;
/** @see java.base/java/util/HashMap.java:250 (JDK 21) */
const DEFAULT_LOAD_FACTOR = 0.75;
/** @see java.base/java/util/HashMap.java:260 (JDK 21) */
const TREEIFY_THRESHOLD = 8;
/** @see java.base/java/util/HashMap.java:275 (JDK 21) */
const MIN_TREEIFY_CAPACITY = 64;

/** `HashMap.hash(key)`: the key's `hashCode()` (a Java `int`) xor its high
 *  half. @see java.base/java/util/HashMap.java:336-339 (JDK 21) */
function spread(hashCode: number): number {
  const h = hashCode | 0;
  return h ^ (h >>> 16);
}

/**
 * `java.util.HashSet<Segment>` — what `Grid.java:57-58` collects into, and
 * whose ITERATION ORDER is the jar's line draw order (`cifali-45-fexa238`'s
 * `{+` verticals draw (0,0), (1,2), (0,2), (1,0)). A TS `Set` keys on
 * identity and iterates in insertion order, so neither its de-duplication
 * nor its order is the jar's; this is the `HashMap` bin table instead:
 * `add` is `putVal` (bin `(n - 1) & hash`, appended at the bin's tail unless
 * an equal key is already in it, `++size > threshold` doubles the table),
 * `resize` is the order-preserving lo/hi split, iteration walks bins in
 * index order. `treeifyBin`'s small-table branch (resize instead) is
 * ported; a tree bin (9+ segments in one bin of a 64+ table) keeps list
 * order here — upstream reorders it (`TreeNode#moveRootToFront`). Not
 * ported: residual, reported with sep-T2c.
 *
 * @see java.base/java/util/HashMap.java:631-676 (putVal), 683-751 (resize), 761-764 (treeifyBin) (JDK 21)
 */
class HashSet implements Iterable<Segment> {
  /** `HashMap.table`, `null` until the first `put`. */
  private table: Segment[][] | undefined;
  private size = 0;
  private threshold = 0;

  /** @see java.base/java/util/HashSet.java:228-230, HashMap.java:631-676 (JDK 21) */
  add(e: Segment): boolean {
    const hash = spread(e.hashCode());
    const tab = this.table ?? this.resize();
    const bin = (tab[(tab.length - 1) & hash] ??= []);
    for (const k of bin) {
      if (spread(k.hashCode()) === hash && e.equals(k)) return false;
    }
    bin.push(e);
    // `binCount >= TREEIFY_THRESHOLD - 1` with binCount + 2 nodes now in the bin.
    if (bin.length > TREEIFY_THRESHOLD && tab.length < MIN_TREEIFY_CAPACITY) this.resize();
    if (++this.size > this.threshold) this.resize();
    return true;
  }

  /** @see java.base/java/util/HashMap.java:683-751 (JDK 21) */
  private resize(): Segment[][] {
    const oldTab = this.table;
    const newCap = oldTab === undefined ? DEFAULT_INITIAL_CAPACITY : oldTab.length * 2;
    this.threshold = oldTab === undefined ? DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY : this.threshold * 2;
    const newTab: Segment[][] = [];
    newTab.length = newCap;
    for (const bin of oldTab ?? []) {
      for (const e of bin ?? []) (newTab[spread(e.hashCode()) & (newCap - 1)] ??= []).push(e);
    }
    this.table = newTab;
    return newTab;
  }

  *[Symbol.iterator](): Iterator<Segment> {
    for (const bin of this.table ?? []) yield* bin ?? [];
  }
}

/** Java array read: an out-of-range index throws `ArrayIndexOutOfBoundsException`. */
function at(array: readonly number[], index: number): number {
  const v = array[index];
  if (v === undefined) throw new RangeError(`Index ${index} out of bounds for length ${array.length}`);
  return v;
}

export class Grid {
  /** @see Grid.java:52 */
  private readonly rowsStart: readonly number[];
  /** @see Grid.java:53 */
  private readonly colsStart: readonly number[];
  /** @see Grid.java:54 */
  private readonly strategy: TableStrategy;
  /** @see Grid.java:55 */
  private readonly title: TextBlock;

  /** @see Grid.java:57 */
  private readonly horizontals = new HashSet();
  /** @see Grid.java:58 */
  private readonly verticals = new HashSet();

  /** @see Grid.java:60-69 */
  constructor(rowsStart: readonly number[], colsStart: readonly number[], strategy: TableStrategy, title: TextBlock) {
    this.title = title;
    this.rowsStart = rowsStart;
    this.colsStart = colsStart;
    this.strategy = strategy;
    if (
      strategy === TableStrategy.DRAW_OUTSIDE ||
      strategy === TableStrategy.DRAW_OUTSIDE_WITH_TITLE ||
      strategy === TableStrategy.DRAW_ALL
    ) {
      this.addOutside();
    }
  }

  /** @see Grid.java:71-83 */
  private addOutside(): void {
    const nbRow = this.rowsStart.length;
    const nbCol = this.colsStart.length;
    for (let c = 0; c < nbCol - 1; c++) {
      this.horizontals.add(new Segment(0, c));
      this.horizontals.add(new Segment(nbRow - 1, c));
    }
    for (let r = 0; r < nbRow - 1; r++) {
      this.verticals.add(new Segment(r, 0));
      this.verticals.add(new Segment(r, nbCol - 1));
    }
  }

  /**
   * `white` is upstream's `HColor`; typed as the `HColorSimple` every caller
   * passes (`AbstractElement#getWhite`), so it can be painted
   * (`white.bg()` → `Back`, `apply(white)` → `Fore`).
   * @see Grid.java:85-109
   */
  drawU(ug: UGraphic, x: number, y: number, white: HColorSimple): void {
    // Hlines
    for (const seg of this.horizontals) {
      const row1 = seg.getRow();
      const col1 = seg.getCol();
      const width = at(this.colsStart, col1 + 1) - at(this.colsStart, col1);
      ug.apply(new UTranslate(x + at(this.colsStart, col1), y + at(this.rowsStart, row1))).draw(ULine.hline(width));
    }
    // Vlines
    for (const seg of this.verticals) {
      const row1 = seg.getRow();
      const col1 = seg.getCol();
      const height = at(this.rowsStart, row1 + 1) - at(this.rowsStart, row1);
      ug.apply(new UTranslate(x + at(this.colsStart, col1), y + at(this.rowsStart, row1))).draw(ULine.vline(height));
    }

    const dim = this.title.calculateDimension(ug.getStringBounder());

    if (dim.getWidth() > 0 && dim.getHeight() > 0) {
      const ug2 = ug.apply(new UTranslate(x + 6, y - dim.getHeight() * 0));
      ug2.apply(new Back(white)).apply(new Fore(white)).draw(URectangle.build(dim.getWidth(), dim.getHeight()));
      this.title.drawU(ug2);
    }
  }

  /** @see Grid.java:111-132 */
  addCell(cell: Cell): void {
    if (
      this.strategy === TableStrategy.DRAW_NONE ||
      this.strategy === TableStrategy.DRAW_OUTSIDE ||
      this.strategy === TableStrategy.DRAW_OUTSIDE_WITH_TITLE
    ) {
      return;
    }

    if (this.strategy === TableStrategy.DRAW_HORIZONTAL || this.strategy === TableStrategy.DRAW_ALL) {
      // Hlines
      for (let c = cell.getMinCol(); c <= cell.getMaxCol(); c++) {
        this.horizontals.add(new Segment(cell.getMinRow(), c));
        this.horizontals.add(new Segment(cell.getMaxRow() + 1, c));
      }
    }
    if (this.strategy === TableStrategy.DRAW_VERTICAL || this.strategy === TableStrategy.DRAW_ALL) {
      // Vlines
      for (let r = cell.getMinRow(); r <= cell.getMaxRow(); r++) {
        this.verticals.add(new Segment(r, cell.getMinCol()));
        this.verticals.add(new Segment(r, cell.getMaxCol() + 1));
      }
    }
  }
}
