/**
 * Bullet — the leading glyph a `*`-prefixed (LIST_WITHOUT_NUMBER) creole
 * line draws before its text: a filled 5×5 disc at depth 0, a filled
 * 3.5×3.5 square at every deeper level, each indented by its own depth.
 *
 * Upstream: `klimt/creole/atom/Bullet.java` (ported in full — the
 * constructor, `drawU`, `calculateDimensionSlow`, `getStartingAltitude`).
 * `StripeStyle#getHeader` (`klimt/creole/StripeStyle.java:59-69`) is its
 * only constructor call site, and `StripeSimple`'s constructor
 * (`legacy/StripeSimple.java:117-121`) prepends the result to the line's
 * atoms — so it participates in `Sea`/`SheetBlock1` layout as an ordinary
 * atom, which is why it implements this port's OOP `Atom`
 * (`SheetBlock1.ts`) rather than joining the data-only `CreoleAtom` union:
 * it has geometry and a draw of its own, no text.
 *
 * Colour: upstream reads `fontConfiguration.getColor()` and applies it as
 * BOTH stroke and fill (`ug.apply(color).apply(color.bg())`) with a
 * zero-thickness stroke. This port's `FontConfiguration.color` is already
 * a resolved colour string (`klimt/shape/UText.ts`'s documented scope
 * reduction), so no `HColor` is needed — the gap `StripeStyle.ts`'s old
 * seam cited was the OOP atom layer, which `SheetBlock1.ts#Atom` has
 * provided since T8.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/Bullet.java
 */
import type { UGraphic } from '../../UGraphic.js';
import type { StringBounder } from '../../font/StringBounder.js';
import { XDimension2D } from '../../geom/XDimension2D.js';
import { UTranslate } from '../../UTranslate.js';
import { UStroke } from '../../UStroke.js';
import { Fore } from '../../Fore.js';
import { Back } from '../../Back.js';
import { UEllipse } from '../../shape/UEllipse.js';
import { URectangle } from '../../shape/URectangle.js';
import type { FontConfiguration } from '../../shape/UText.js';
import type { Atom } from '../SheetBlock1.js';

/** java:73 — the depth-0 disc's diameter. */
const DISC_SIZE = 5;
/** java:77 — every deeper level's square. */
const SQUARE_SIZE = 3.5;
/** java:71,75 — the per-level x indents. */
const DISC_INDENT = 3;
const SQUARE_INDENT_BASE = 1;
const INDENT_PER_LEVEL = 8;
/** java:83-87 — the reported box, and the hang below the line's baseline. */
const DISC_BOX = { width: 12, height: 5 };
const SQUARE_BOX_HEIGHT = 3;
const DISC_ALTITUDE = -5;
const SQUARE_ALTITUDE = -7;

export class Bullet implements Atom {
  private readonly fontConfiguration: FontConfiguration;
  private readonly order: number;

  constructor(fontConfiguration: FontConfiguration, order: number) {
    this.fontConfiguration = fontConfiguration;
    this.order = order;
  }

  drawU(ug: UGraphic): void {
    // java:60-62 — the font colour is applied as stroke AND background,
    // with a zero-thickness stroke, so the glyph is a flat filled shape.
    const color = this.fontConfiguration.color ?? 'black';
    let target = ug.apply(new Fore(color)).apply(new Back(color)).apply(UStroke.withThickness(0));
    if (this.order === 0) {
      target = target.apply(UTranslate.dx(DISC_INDENT));
      target.draw(UEllipse.build(DISC_SIZE, DISC_SIZE));
      return;
    }
    target = target.apply(UTranslate.dx(SQUARE_INDENT_BASE + INDENT_PER_LEVEL * this.order));
    target.draw(URectangle.build(SQUARE_SIZE, SQUARE_SIZE));
  }

  calculateDimension(stringBounder: StringBounder): XDimension2D {
    return this.calculateDimensionSlow(stringBounder);
  }

  /** java:82-87. */
  private calculateDimensionSlow(_stringBounder: StringBounder): XDimension2D {
    if (this.order === 0) return new XDimension2D(DISC_BOX.width, DISC_BOX.height);
    return new XDimension2D(INDENT_PER_LEVEL + INDENT_PER_LEVEL * this.order, SQUARE_BOX_HEIGHT);
  }

  /** java:89-93. */
  getStartingAltitude(_stringBounder: StringBounder): number {
    return this.order === 0 ? DISC_ALTITUDE : SQUARE_ALTITUDE;
  }

  getNeutrons(): never {
    throw new Error('UnsupportedOperationException');
  }
}
