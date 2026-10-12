import { Fore } from '../../../core/klimt/Fore.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UStroke } from '../../../core/klimt/UStroke.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import { AbstractElement } from './AbstractElement.js';

/** `==`: a double line. @see ElementLine.java:63, 70 */
const DOUBLE = '=';
/** `..`: a dotted line. @see ElementLine.java:73 */
const DOTTED = '.';
/** `--`: a plain line. @see ElementLine.java:75 */
const PLAIN = '-';
/** Every other separator (`~~`): a thick line. @see ElementLine.java:78 */
const THICK = 1.5;
/** @see ElementLine.java:54 */
const PREFERRED_WIDTH = 10;
/** @see ElementLine.java:54 */
const PREFERRED_HEIGHT = 6;

/**
 * ElementLine — a `--`/`==`/`..`/`~~` separator row: a `#AAA` horizontal
 * line across the whole cell it was given, at its mid-height.
 *
 * `separator` is upstream's `char`, a one-character string here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementLine.java:45-82
 */
export class ElementLine extends AbstractElement {
  /** @see ElementLine.java:47 */
  private readonly separator: string;

  /** @see ElementLine.java:49-51 */
  constructor(separator: string) {
    super();
    this.separator = separator;
  }

  /** @see ElementLine.java:53-55 */
  getPreferredDimension(_stringBounder: StringBounder, _x: number, _y: number): XDimension2D {
    return new XDimension2D(PREFERRED_WIDTH, PREFERRED_HEIGHT);
  }

  /** @see ElementLine.java:57-67 */
  drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D | null): void {
    if (zIndex !== 0) {
      return;
    }
    ug = ug.apply(new Fore(this.getColorAA()));
    // Unguarded like upstream: a null dimToUse is ElementLine.java:62's NullPointerException.
    let y2 = dimToUse!.getHeight() / 2;
    if (this.separator === DOUBLE) {
      y2 = y2 - 1;
    }
    ElementLine.drawLine(ug, 0, y2, dimToUse!.getWidth(), this.separator);
  }

  /** @see ElementLine.java:69-80 */
  private static drawLine(ug: UGraphic, x: number, y: number, widthToUse: number, separator: string): void {
    if (separator === DOUBLE) {
      ug.apply(UStroke.simple()).apply(new UTranslate(x, y)).draw(ULine.hline(widthToUse));
      ug.apply(UStroke.simple())
        .apply(new UTranslate(x, y + 2))
        .draw(ULine.hline(widthToUse));
    } else if (separator === DOTTED) {
      ug.apply(new UStroke(1, 2, 1))
        .apply(new UTranslate(x, y))
        .draw(ULine.hline(widthToUse));
    } else if (separator === PLAIN) {
      ug.apply(UStroke.simple()).apply(new UTranslate(x, y)).draw(ULine.hline(widthToUse));
    } else {
      ug.apply(UStroke.withThickness(THICK)).apply(new UTranslate(x, y)).draw(ULine.hline(widthToUse));
    }
  }
}
