/**
 * AtomWithMargin — wraps another `Atom`, adding a fixed top/bottom margin
 * to its measured height (`marginY1`/`marginY2`) and translating it down
 * by `marginY1` at draw time. No horizontal margin — upstream only ever
 * needed vertical spacing here.
 *
 * Upstream: klimt/creole/atom/AtomWithMargin.java. Ported in full: the
 * constructor, `calculateDimensionSlow`, `getStartingAltitude`
 * (delegates straight to the wrapped atom — margin does not shift
 * altitude), `drawU`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomWithMargin.java
 */
import { AbstractAtom } from './AbstractAtom.js';
import { UTranslate } from '../../UTranslate.js';
import type { UGraphic } from '../../UGraphic.js';
import type { StringBounder } from '../../font/StringBounder.js';
import type { XDimension2D } from '../../geom/XDimension2D.js';
import type { Atom } from '../SheetBlock1.js';

export class AtomWithMargin extends AbstractAtom implements Atom {
  private readonly marginY1: number;
  private readonly marginY2: number;
  private readonly atom: Atom;

  constructor(atom: Atom, marginY1: number, marginY2: number) {
    super();
    this.atom = atom;
    this.marginY1 = marginY1;
    this.marginY2 = marginY2;
  }

  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    return this.atom.calculateDimension(stringBounder).delta(0, this.marginY1 + this.marginY2);
  }

  getStartingAltitude(stringBounder: StringBounder): number {
    return this.atom.getStartingAltitude(stringBounder);
  }

  drawU(ug: UGraphic): void {
    this.atom.drawU(ug.apply(UTranslate.dy(this.marginY1)));
  }
}
