/**
 * AtomTextUtils — upstream's factory helpers around the legacy `AtomText`.
 * Only `createListNumber` is ported (cdd-T28): it is the ONE helper
 * `StripeStyle#getHeader` needs, and the only one whose output this port
 * cannot already express with a plain `CreoleAtom` text atom.
 *
 * `createListNumber` (`legacy/AtomTextUtils.java:145-159`) builds an
 * `AtomText` carrying the 1-based list number plus a period, with TWO
 * `DelayedDouble` margins resolved against the live `StringBounder`:
 *   - left  = width of `"9. "` × `order`  (java:146-151) — the per-depth
 *     indent, measured in the font's own digit-and-period width so a
 *     nested list lines up under its parent's text.
 *   - right = width of `"."`              (java:152-157) — the gap after
 *     the number.
 * `AtomText`'s own `drawU` applies the LEFT margin as a translate before
 * drawing (`legacy/AtomText.java:207-208`) and its
 * `calculateDimensionSlow` adds both margins to the text width, which is
 * exactly what this port's class below does — the data-only `CreoleAtom`
 * union has no margin fields, so a numbered-list header is an OOP `Atom`
 * (`SheetBlock1.ts`), like its sibling `Bullet`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/AtomTextUtils.java:145-159
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java:196-238 (drawU)
 */
import type { UGraphic } from '../../UGraphic.js';
import type { StringBounder } from '../../font/StringBounder.js';
import { XDimension2D } from '../../geom/XDimension2D.js';
import { UTranslate } from '../../UTranslate.js';
import { UText, getFont } from '../../shape/UText.js';
import type { FontConfiguration } from '../../shape/UText.js';
import type { Atom } from '../SheetBlock1.js';

/** java:148 — the reference string whose width is one indent level. */
const INDENT_REFERENCE = '9. ';
/** java:154 — the reference string whose width is the trailing gap. */
const TRAILING_REFERENCE = '.';

/** `AtomText` reduced to exactly what a list number needs: one text run
 *  with a left and a right margin, drawn at the line's own baseline. */
class ListNumberAtom implements Atom {
  constructor(
    private readonly text: string,
    private readonly font: FontConfiguration,
    private readonly order: number,
  ) {}

  private marginLeft(stringBounder: StringBounder): number {
    return stringBounder.calculateDimension(getFont(this.font), INDENT_REFERENCE).getWidth() * this.order;
  }

  private marginRight(stringBounder: StringBounder): number {
    return stringBounder.calculateDimension(getFont(this.font), TRAILING_REFERENCE).getWidth();
  }

  calculateDimension(stringBounder: StringBounder): XDimension2D {
    const dim = stringBounder.calculateDimension(getFont(this.font), this.text);
    return new XDimension2D(
      this.marginLeft(stringBounder) + dim.getWidth() + this.marginRight(stringBounder),
      dim.getHeight(),
    );
  }

  /** `AtomText#drawU` (java:207-230) minus the tab tokenizer (a list
   *  number never contains a tab): shift by the left margin, then draw at
   *  `height - descent`, the same baseline every text atom uses. */
  drawU(ug: UGraphic): void {
    const stringBounder = ug.getStringBounder();
    const font = getFont(this.font);
    const dim = stringBounder.calculateDimension(font, this.text);
    const descent = stringBounder.getDescent?.(font, this.text) ?? font.size / DESCENT_DIVISOR;
    ug.apply(new UTranslate(this.marginLeft(stringBounder), dim.getHeight() - descent)).draw(
      UText.build(this.text, this.font),
    );
  }

  /** `AtomText#getStartingAltitude` is `fontConfiguration.getSpace()`,
   *  which is 0 for the NORMAL font position a list number always carries
   *  (`AtomText.java:321-323`, `FontPosition.NORMAL`). */
  getStartingAltitude(_stringBounder: StringBounder): number {
    return 0;
  }

  getNeutrons(): never {
    throw new Error('UnsupportedOperationException');
  }
}

/** `WidthTableMeasurer`/`FixedMeasurer#getDescent`'s own `size/4.5`
 *  (`measurer.ts`), for a `StringBounder` that declares no `getDescent`. */
const DESCENT_DIVISOR = 4.5;

/** java:145-159. `localNumber` is `CreoleContext#getLocalNumber(order)`'s
 *  0-based counter, so the drawn label is `localNumber + 1` + `"."`. */
export function createListNumber(font: FontConfiguration, order: number, localNumber: number): Atom {
  return new ListNumberAtom(`${String(localNumber + 1)}.`, font, order);
}
