/**
 * AtomTable — the drawable/measurable creole table `StripeTable` builds:
 * a grid of `Atom` cells (each itself a `SheetBlock1` wrapping one cell's
 * own nested `Sheet`), laid out column-width/row-height-first (every cell
 * in a column shares that column's max measured width, every cell in a
 * row shares that row's max measured height), then drawn with per-line/
 * per-cell background fills and a full grid of horizontal/vertical rules.
 *
 * Upstream: klimt/creole/atom/AtomTable.java. Ported: the nested `Line`
 * class, the constructor, `calculateDimensionSlow`, `getStartingAltitude`
 * (always 0), `drawU` (per-line background fill, per-cell background
 * fill + `RIGHT`-alignment x-shift + draw, the grid rule pass),
 * `initMap` (memoized on `positions.size() > 0`, matching upstream's own
 * cache-invalidation shape — `newLine`/`addCell` clear it), the six
 * private geometry helpers (`getStartingX`/`getEndingX`/`getStartingY`/
 * `getEndingY`/`getColWidth`/`getLineHeight`), `getPosition`, `getNbCols`/
 * `getNbLines`, `lastLine`, `addCell`, `newLine`.
 *
 * ## ADR-9 adaptations (HColor -> Paint, no HColorScheme branch)
 *
 * Upstream's `HColor lineColor`/`HColor cellBackColor` fields become this
 * port's `Paint` (`src/core/paint.ts`) — the SAME `HColor -> Paint`
 * adaptation `UParam.ts`/`UBackground.ts`/`Back.ts`/`Fore.ts` already
 * established port-wide (`Back.ts`'s own doc comment: "`new Back(paint)`
 * ... since `HColor` is not ported"). `ug.apply(HColors.none()).apply
 * (color.bg())` becomes `ug.apply(new Fore('none')).apply(new
 * Back(color))`, mirroring `USymbolStack.ts`'s own established `HColors
 * .none()` -> `new Fore('none')` precedent.
 *
 * `getLineColor(UGraphic)`'s `lineColor instanceof HColorScheme` branch
 * (java:159-166, resolving a scheme-relative color against the current
 * background via `ug.getParam().getBackcolor()`/`ug.getDefaultBackground
 * ()`) is NOT ported: this port's `Paint` type
 * (`string | Gradient`) has no scheme-wrapper variant at all — a plain
 * string/gradient value has nothing to resolve "against a background",
 * unlike upstream's `HColorScheme` subclass — and `UGraphic.ts` itself
 * carries no `getDefaultBackground()` member (T2's own scope reduction,
 * `drawing/UGraphicNo.ts`'s doc comment: "needs HColor/HColors, not
 * ported"). `getLineColor` therefore collapses to a plain `lineColor`
 * getter with no `ug` parameter needed — a TS-idiom branch collapse of
 * exactly the shape `shape/TextBlockLineBefore.ts`'s own doc comment
 * already documents for the analogous `HColors.none()` null-substitute
 * case ("the two-way branch collapses to a single unconditional...").
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomTable.java
 */
import { AbstractAtom } from './AbstractAtom.js';
import { Position } from '../Position.js';
import { SheetBlock1 } from '../SheetBlock1.js';
import { Back } from '../../Back.js';
import { Fore } from '../../Fore.js';
import { UTranslate } from '../../UTranslate.js';
import { URectangle } from '../../shape/URectangle.js';
import { ULine } from '../../shape/ULine.js';
import { HorizontalAlignment } from '../../geom/HorizontalAlignment.js';
import { XDimension2D } from '../../geom/XDimension2D.js';
import type { UGraphic } from '../../UGraphic.js';
import type { StringBounder } from '../../font/StringBounder.js';
import type { Paint } from '../../../paint.js';
import type { Atom } from '../SheetBlock1.js';

/** Upstream: `AtomTable$Line` (java:58-80), a package-private nested
 *  class -- ported as a module-private top-level class, this project's
 *  established idiom for a Java private nested data holder with no
 *  standalone identity outside its owner. */
class Line {
  readonly cells: Atom[] = [];
  readonly cellsBackColor: (Paint | null)[] = [];
  readonly lineBackColor: Paint | null;

  constructor(lineBackColor: Paint | null) {
    this.lineBackColor = lineBackColor;
  }

  add(cell: Atom, cellBackColor: Paint | null): void {
    this.cells.push(cell);
    this.cellsBackColor.push(cellBackColor);
  }

  size(): number {
    return this.cells.length;
  }
}

export class AtomTable extends AbstractAtom implements Atom {
  private readonly lines: Line[] = [];
  private readonly positions = new Map<Atom, Position>();
  private readonly lineColor: Paint;

  constructor(lineColor: Paint) {
    super();
    this.lineColor = lineColor;
  }

  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    this.initMap(stringBounder);
    const width = this.getEndingX(this.getNbCols() - 1);
    const height = this.getEndingY(this.getNbLines() - 1);
    return new XDimension2D(width, height);
  }

  getStartingAltitude(_stringBounder: StringBounder): number {
    return 0;
  }

  drawU(ug: UGraphic): void {
    this.initMap(ug.getStringBounder());
    for (let i = 0; i < this.getNbLines(); i++) {
      const line = this.lines[i] as Line;
      this.drawLineBackground(ug, i, line);
      for (let j = 0; j < this.getNbCols(); j++) {
        if (j >= line.cells.length) continue;
        this.drawCell(ug, i, j, line);
      }
    }
    this.drawGrid(ug);
  }

  /** Upstream: `AtomTable#drawU`'s per-line background fill (java:106-113). */
  private drawLineBackground(ug: UGraphic, i: number, line: Line): void {
    if (line.lineBackColor === null) return;
    const y1 = this.getStartingY(i);
    const y2 = this.getStartingY(i + 1);
    const x1 = this.getStartingX(0);
    const x2 = this.getStartingX(this.getNbCols());
    ug.apply(new Fore('none'))
      .apply(new Back(line.lineBackColor))
      .apply(new UTranslate(x1, y1))
      .draw(URectangle.build(x2 - x1, y2 - y1));
  }

  /** Upstream: `AtomTable#drawU`'s per-cell body (java:118-144): alignment
   *  probe, optional background fill, then the cell's own `drawU` at its
   *  memoized position (plus the `RIGHT`-alignment x-shift). */
  private drawCell(ug: UGraphic, i: number, j: number, line: Line): void {
    const cell = line.cells[j] as Atom;
    let align: HorizontalAlignment = HorizontalAlignment.LEFT;
    if (cell instanceof SheetBlock1) align = cell.getCellAlignment();

    const cellBackColor = line.cellsBackColor[j] as Paint | null;
    const x1 = this.getStartingX(j);
    const x2 = this.getStartingX(j + 1);
    const cellWidth = x2 - x1;
    if (cellBackColor !== null) {
      const y1 = this.getStartingY(i);
      const y2 = this.getStartingY(i + 1);
      ug.apply(new Fore('none'))
        .apply(new Back(cellBackColor))
        .apply(new UTranslate(x1, y1))
        .draw(URectangle.build(x2 - x1, y2 - y1));
    }
    // Invariant: `initMap` populates `positions` for every cell of every
    // line before `drawU`'s own loop runs -- same trust
    // `SheetBlock1.ts#drawU`'s own comment documents for its analogous
    // `positions.get(atom) as Position` lookup.
    const pos = this.positions.get(cell) as Position;
    const dimCell = cell.calculateDimension(ug.getStringBounder());
    const dx = align === HorizontalAlignment.RIGHT ? cellWidth - dimCell.getWidth() : 0;

    if (cellBackColor === null) {
      cell.drawU(ug.apply(pos.getTranslate().compose(UTranslate.dx(dx))));
    } else {
      cell.drawU(ug.apply(new Back(cellBackColor)).apply(pos.getTranslate().compose(UTranslate.dx(dx))));
    }
  }

  /** Upstream: `AtomTable#drawU`'s grid-rule pass (java:147-155). */
  private drawGrid(ug: UGraphic): void {
    const ugColored = ug.apply(new Fore(this.getLineColor()));

    const hline = ULine.hline(this.getEndingX(this.getNbCols() - 1));
    for (let i = 0; i <= this.getNbLines(); i++) {
      ugColored.apply(UTranslate.dy(this.getStartingY(i))).draw(hline);
    }

    const vline = ULine.vline(this.getEndingY(this.getNbLines() - 1));
    for (let i = 0; i <= this.getNbCols(); i++) {
      ugColored.apply(UTranslate.dx(this.getStartingX(i))).draw(vline);
    }
  }

  /** See the module doc comment's ADR-9 adaptation note: upstream's
   *  `HColorScheme` resolve-against-background branch has no `Paint`
   *  equivalent, so this always returns the plain stored color. */
  private getLineColor(): Paint {
    return this.lineColor;
  }

  private initMap(stringBounder: StringBounder): void {
    if (this.positions.size > 0) return;

    for (const line of this.lines) {
      for (const cell of line.cells) {
        const dim = cell.calculateDimension(stringBounder);
        this.positions.set(cell, new Position(0, 0, dim));
      }
    }
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i] as Line;
      for (let j = 0; j < line.size(); j++) {
        const cell = line.cells[j] as Atom;
        const dim = cell.calculateDimension(stringBounder);
        const x = this.getStartingX(j);
        const y = this.getStartingY(i);
        this.positions.set(cell, new Position(x, y, dim));
      }
    }
  }

  private getStartingX(col: number): number {
    let result = 0;
    for (let i = 0; i < col; i++) result += this.getColWidth(i);
    return result;
  }

  private getEndingX(col: number): number {
    let result = 0;
    for (let i = 0; i <= col; i++) result += this.getColWidth(i);
    return result;
  }

  private getStartingY(line: number): number {
    let result = 0;
    for (let i = 0; i < line; i++) result += this.getLineHeight(i);
    return result;
  }

  private getEndingY(line: number): number {
    let result = 0;
    for (let i = 0; i <= line; i++) result += this.getLineHeight(i);
    return result;
  }

  private getColWidth(col: number): number {
    let result = 0;
    for (let i = 0; i < this.getNbLines(); i++) {
      const position = this.getPosition(i, col);
      if (position === null) continue;
      result = Math.max(result, position.getWidth());
    }
    return result;
  }

  private getLineHeight(line: number): number {
    let result = 0;
    for (let i = 0; i < this.getNbCols(); i++) {
      const position = this.getPosition(line, i);
      if (position === null) continue;
      result = Math.max(result, position.getHeight());
    }
    return result;
  }

  private getPosition(line: number, col: number): Position | null {
    if (line >= this.lines.length) return null;
    const l = this.lines[line] as Line;
    if (col >= l.cells.length) return null;
    const atom = l.cells[col] as Atom;
    return this.positions.get(atom) ?? null;
  }

  private getNbCols(): number {
    // Invariant: `lines` always has >= 1 entry whenever this is reached --
    // this port's sole producer, `StripeTable.ts`, always calls `newLine`
    // before any measurement/draw entry point runs. Matches upstream
    // trusting the same invariant with no guard (`lines.get(0)` throws
    // `IndexOutOfBoundsException` on an empty list, exactly as `(this
    // .lines[0] as Line)` would produce `undefined`-shaped breakage here
    // if the invariant were ever actually violated).
    let result = (this.lines[0] as Line).size();
    for (let i = 1; i < this.lines.length; i++) {
      result = Math.max(result, (this.lines[i] as Line).size());
    }
    return result;
  }

  private getNbLines(): number {
    return this.lines.length;
  }

  private lastLine(): Line {
    return this.lines[this.lines.length - 1] as Line;
  }

  addCell(cell: Atom, cellBackColor: Paint | null): void {
    this.lastLine().add(cell, cellBackColor);
    this.positions.clear();
  }

  newLine(lineBackColor: Paint | null): void {
    this.lines.push(new Line(lineBackColor));
  }
}
