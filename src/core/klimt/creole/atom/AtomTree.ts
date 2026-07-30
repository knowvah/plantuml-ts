/**
 * AtomTree — a stack of `Atom` cells, each tagged with an integer nesting
 * `level`, measured/drawn top-to-bottom with a `Skeleton2` bullet/hline/
 * vline connector drawn beside each cell at its own vertical midpoint. The
 * `|_`-prefixed tree-list creole construct's real geometry engine.
 *
 * Upstream: klimt/creole/atom/AtomTree.java (`extends AbstractAtom
 * implements Atom`). Ported in full: the constructor, `calculateDimensionSlow`
 * (per-cell width/height accumulation against `Skeleton2#getXEndForLevel`),
 * `getStartingAltitude` (always 0), `drawU` (draw each cell translated by
 * its own level's indent, accumulate `Skeleton2` entries as it goes, THEN
 * draw the skeleton's connectors in one pass after every cell is drawn —
 * NOT interleaved), `addCell`.
 *
 * ## ADR-9 adaptation: bound to this port's OOP `Atom` (`SheetBlock1.ts`),
 * not upstream's `Atom`/`AtomText` hierarchy
 *
 * `AtomWithMargin.ts` (T10a) already extends `AbstractAtom implements Atom`
 * against `SheetBlock1.ts`'s `Atom` interface — that same interface (a
 * `TextBlock` plus `getStartingAltitude`/`getNeutrons`), not `atom/Atom.ts`'s
 * `CreoleAtom` data union — because `AtomTree`'s cells are themselves
 * measured/drawn sub-blocks (each cell is a `StripeTable.asAtom`-built
 * `SheetBlock1`, see `StripeTree.ts`), not flat text runs. This class
 * follows the SAME precedent: `cells: Atom[]`/`levels: Map<Atom, number>`
 * hold this port's OOP `Atom`, matching `AtomWithMargin`'s established
 * shape exactly rather than inventing a second encoding.
 *
 * ## `HColor` -> `Paint` (established T2 substitution, not new here)
 *
 * `lineColor: HColor` becomes `lineColor: Paint` (`../../../paint.js`) —
 * the SAME substitution `UParam.ts`/`Fore.ts`/`TextBlockLineBefore.ts`
 * already make everywhere an `HColor` is threaded as a plain foreground
 * color (`HColor` itself is not ported anywhere in this port — `Position
 * .ts`'s own doc comment). `ug.apply(this.lineColor)` (java:91, an `HColor`
 * IS a `UChange` upstream) becomes `ug.apply(new Fore(this.lineColor))`,
 * mirroring `TextBlockLineBefore.ts#drawU`'s identical `ug.apply(new
 * Fore(color))` call for the same upstream shape.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomTree.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton2.java
 */
import { AbstractAtom } from './AbstractAtom.js';
import { Skeleton2 } from './Skeleton2.js';
import { Fore } from '../../Fore.js';
import { UTranslate } from '../../UTranslate.js';
import type { UGraphic } from '../../UGraphic.js';
import type { StringBounder } from '../../font/StringBounder.js';
import { XDimension2D } from '../../geom/XDimension2D.js';
import type { Paint } from '../../../paint.js';
import type { Atom } from '../SheetBlock1.js';

export class AtomTree extends AbstractAtom implements Atom {
  private readonly lineColor: Paint;
  private readonly cells: Atom[] = [];
  private readonly levels = new Map<Atom, number>();
  private readonly margin = 2;

  constructor(lineColor: Paint) {
    super();
    this.lineColor = lineColor;
  }

  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    const skeleton = new Skeleton2();
    let width = 0;
    let height = 0;
    for (const cell of this.cells) {
      const dim = cell.calculateDimension(stringBounder);
      height += dim.getHeight();
      const level = this.getLevel(cell);
      width = Math.max(width, skeleton.getXEndForLevel(level) + this.margin + dim.getWidth());
    }
    return new XDimension2D(width, height);
  }

  getStartingAltitude(_stringBounder: StringBounder): number {
    return 0;
  }

  drawU(ugInit: UGraphic): void {
    const skeleton = new Skeleton2();
    let y = 0;
    let ug = ugInit;
    for (const cell of this.cells) {
      const level = this.getLevel(cell);
      cell.drawU(ug.apply(UTranslate.dx(this.margin + skeleton.getXEndForLevel(level))));
      const dim = cell.calculateDimension(ug.getStringBounder());
      skeleton.add(level, y + dim.getHeight() / 2);
      ug = ug.apply(UTranslate.dy(dim.getHeight()));
      y += dim.getHeight();
    }
    skeleton.draw(ugInit.apply(new Fore(this.lineColor)));
  }

  private getLevel(atom: Atom): number {
    // Invariant: every `Atom` in `this.cells` was added via `addCell`,
    // which sets `levels` for it in the same call — matches upstream
    // trusting the same invariant with an unboxing `Map#get` (java:96).
    return this.levels.get(atom) as number;
  }

  addCell(cell: Atom, level: number): void {
    this.cells.push(cell);
    this.levels.set(cell, level);
  }
}
