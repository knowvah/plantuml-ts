import type { TextBlock } from '../shape/TextBlock.js';
import type { Atom, SheetBlock1 } from './SheetBlock1.js';
import type { Stencil } from './Stencil.js';
import type { WithPorts } from '../../svek/WithPorts.js';
import { Ports } from '../../svek/Ports.js';
import { UGraphicStencil } from '../drawing/UGraphicStencil.js';
import type { UStroke } from '../UStroke.js';
import { UTranslate } from '../UTranslate.js';
import type { UGraphic } from '../UGraphic.js';
import type { StringBounder } from '../font/StringBounder.js';
import type { XDimension2D } from '../geom/XDimension2D.js';
import type { XRectangle2D } from '../geom/XRectangle2D.js';
import { HorizontalAlignment } from '../geom/HorizontalAlignment.js';

/**
 * SheetBlock2 — wraps a `SheetBlock1` with a `Stencil`-clipped draw (so its
 * horizontal rules stay inside the enclosing shape) and, when the sheet's
 * horizontal alignment is CENTER/RIGHT and a `minimumWidth` floor is set,
 * an extra x-shift so the whole block centers/right-aligns within that
 * floor width instead of the block's own natural (narrower) width.
 *
 * Upstream: klimt/creole/SheetBlock2.java. Ported in full: `enlargeMe`
 * (a `Stencil` decorator narrowing/widening the wrapped block's clearance
 * by `delta1`/`delta2`), the constructor, `getHorizontalAlignment`,
 * `toString`, `calculateDimension`, `drawU` (the CENTER/RIGHT
 * `minimumWidth` x-shift branches), `getStartingAltitude`,
 * `getInnerPosition` (delegates to `block`), `getPorts` (always a fresh,
 * empty `Ports` — upstream's own body, no delegation to `block`),
 * `getNeutrons` (always throws).
 *
 * TS-idiom note: upstream's `drawU` guards `UGraphicStencil.create` behind
 * `if (stencil != null)`; the constructor's own `Objects.requireNonNull
 * (stencil)` already makes that branch permanently true in the Java too
 * (dead defensive code at the source) — this port's constructor requires
 * `stencil` via the type system instead, so the wrap is unconditional.
 */
export class SheetBlock2 implements TextBlock, Atom, WithPorts {
  private readonly block: SheetBlock1;
  private readonly stencil: Stencil;
  private readonly defaultStroke: UStroke;

  constructor(block: SheetBlock1, stencil: Stencil, defaultStroke: UStroke) {
    this.block = block;
    this.stencil = stencil;
    this.defaultStroke = defaultStroke;
  }

  enlargeMe(delta1: number, delta2: number): SheetBlock2 {
    const stencil = this.stencil;
    const newStencil: Stencil = {
      getStartingX: (stringBounder: StringBounder, y: number): number => stencil.getStartingX(stringBounder, y) - delta1,
      getEndingX: (stringBounder: StringBounder, y: number): number => stencil.getEndingX(stringBounder, y) + delta2,
    };
    return new SheetBlock2(this.block, newStencil, this.defaultStroke);
  }

  private getHorizontalAlignment(): HorizontalAlignment {
    return this.block.getHorizontalAlignment();
  }

  toString(): string {
    return this.block.toString();
  }

  calculateDimension(stringBounder: StringBounder): XDimension2D {
    return this.block.calculateDimension(stringBounder);
  }

  drawU(ug: UGraphic): void {
    let target = UGraphicStencil.create(ug, this.stencil, this.defaultStroke);
    const alignment = this.getHorizontalAlignment();
    const minimumWidth = this.block.getMinimumWidth();
    if (alignment === HorizontalAlignment.CENTER && minimumWidth > 0) {
      const width = this.calculateDimension(target.getStringBounder()).getWidth();
      const dx = (minimumWidth - width) / 2;
      target = target.apply(UTranslate.dx(dx));
    } else if (alignment === HorizontalAlignment.RIGHT && minimumWidth > 0) {
      const width = this.calculateDimension(target.getStringBounder()).getWidth();
      const dx = minimumWidth - width;
      target = target.apply(UTranslate.dx(dx));
    }
    this.block.drawU(target);
  }

  getStartingAltitude(_stringBounder: StringBounder): number {
    return 0;
  }

  getInnerPosition(member: string, stringBounder: StringBounder): XRectangle2D | undefined {
    return this.block.getInnerPosition(member, stringBounder);
  }

  getPorts(_stringBounder: StringBounder): Ports {
    return new Ports();
  }

  getNeutrons(): never {
    throw new Error('UnsupportedOperationException');
  }
}
