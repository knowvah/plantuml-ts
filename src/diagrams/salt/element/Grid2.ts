/**
 * Grid2 — the `{T` tree-table lines over the given row and column starts,
 * per `TableStrategy`: the outline for `DRAW_OUTSIDE`/
 * `DRAW_OUTSIDE_WITH_TITLE`, every row line for `DRAW_HORIZONTAL`/
 * `DRAW_ALL`, every column line for `DRAW_VERTICAL`/`DRAW_ALL`.
 * Built by `ElementTree#drawU` (`ElementTree.java:151-154`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Grid2.java:44-93
 */
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { TableStrategy } from './TableStrategy.js';

/** Java `List.get(index)`: throws on an out-of-range index (IndexOutOfBoundsException). */
function get(list: readonly number[], index: number): number {
  const v = list[index];
  if (v === undefined) {
    throw new RangeError(`Index ${index} out of bounds for length ${list.length}`);
  }
  return v;
}

export class Grid2 {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Grid2.java:50-54 */
  constructor(
    private readonly rowsStart: readonly number[],
    private readonly colsStart: readonly number[],
    private readonly strategy: TableStrategy,
  ) {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Grid2.java:56-77 */
  drawU(ug: UGraphic): void {
    const xmin = get(this.colsStart, 0);
    const xmax = get(this.colsStart, this.colsStart.length - 1);
    const ymin = get(this.rowsStart, 0);
    const ymax = get(this.rowsStart, this.rowsStart.length - 1);
    if (this.strategy === TableStrategy.DRAW_OUTSIDE || this.strategy === TableStrategy.DRAW_OUTSIDE_WITH_TITLE) {
      ug.apply(new UTranslate(xmin, ymin)).draw(ULine.hline(xmax - xmin));
      ug.apply(new UTranslate(xmin, ymax)).draw(ULine.hline(xmax - xmin));
      ug.apply(new UTranslate(xmin, ymin)).draw(ULine.vline(ymax - ymin));
      ug.apply(new UTranslate(xmax, ymin)).draw(ULine.vline(ymax - ymin));
    }
    if (this.drawHorizontal()) {
      for (const y of this.rowsStart) {
        ug.apply(new UTranslate(xmin, y)).draw(ULine.hline(xmax - xmin));
      }
    }
    if (this.drawVertical()) {
      for (const x of this.colsStart) {
        ug.apply(new UTranslate(x, ymin)).draw(ULine.vline(ymax - ymin));
      }
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Grid2.java:79-84 */
  private drawHorizontal(): boolean {
    return this.strategy === TableStrategy.DRAW_HORIZONTAL || this.strategy === TableStrategy.DRAW_ALL;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Grid2.java:86-91 */
  private drawVertical(): boolean {
    return this.strategy === TableStrategy.DRAW_VERTICAL || this.strategy === TableStrategy.DRAW_ALL;
  }
}
