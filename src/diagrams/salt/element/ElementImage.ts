import { Fore } from '../../../core/klimt/Fore.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import { UPixel } from '../../../core/klimt/shape/UPixel.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import { AbstractElement } from './AbstractElement.js';

/** The pixel-on character of a `<<…>>` image. @see ElementImage.java:69 */
const PIXEL = 'X';

/** `List#get(index)` with Java's bound check. */
function row(img: readonly string[], index: number): string {
  const r = img[index];
  if (r === undefined)
    throw new Error(`IndexOutOfBoundsException: Index ${index} out of bounds for length ${img.length}`);
  return r;
}

/** `String#charAt(index)` with Java's bound check. */
function charAt(s: string, index: number): string {
  if (index >= s.length) throw new Error(`StringIndexOutOfBoundsException: index ${index}, length ${s.length}`);
  return s.charAt(index);
}

/**
 * ElementImage — a `<<…>>` bitmap: one pixel per source character, an
 * `X` drawn in black ink as a `UPixel`; one row per line.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementImage.java:46-74
 */
export class ElementImage extends AbstractElement {
  /** @see ElementImage.java:48 */
  private readonly img: readonly string[];

  /** @see ElementImage.java:50-52 */
  constructor(img: readonly string[]) {
    super();
    this.img = img;
  }

  /** @see ElementImage.java:54-56 */
  getPreferredDimension(_stringBounder: StringBounder, _x: number, _y: number): XDimension2D {
    return new XDimension2D(row(this.img, 0).length, this.img.length);
  }

  /** @see ElementImage.java:58-73 */
  drawU(ug: UGraphic, zIndex: number, _dimToUse: XDimension2D | null): void {
    if (zIndex !== 0) return;

    ug = ug.apply(new Fore(this.getBlack().asPaint()));

    const w = row(this.img, 0).length;
    const h = this.img.length;
    for (let i = 0; i < w; i++)
      for (let j = 0; j < h; j++) {
        const c = charAt(row(this.img, j), i);
        if (c === PIXEL) ug.apply(new UTranslate(i, j)).draw(new UPixel());
      }
  }
}
