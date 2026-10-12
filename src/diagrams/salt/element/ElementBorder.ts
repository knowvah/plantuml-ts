import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import { XPoint2D } from '../../../core/klimt/geom/XPoint2D.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import { AbstractElement } from './AbstractElement.js';
import type { Element } from './Element.js';
import { ElementEmpty } from './ElementEmpty.js';

/**
 * ElementBorder — a salt border layout (`N=`/`S=`/`W=`/`E=`/`C=` inside
 * `{ }`): north on top, south at the bottom, west/center/east in between.
 * An unset region is a 1 x 1 `ElementEmpty`. Every region draws with the
 * border's whole `dimToUse`.
 *
 * `MathUtils.max(a, b, c)` is `Math.max(Math.max(a, b), c)`
 * (MathUtils.java:50-52), i.e. `Math.max(a, b, c)`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementBorder.java:45-106
 */
export class ElementBorder extends AbstractElement {
  /** @see ElementBorder.java:47 */
  private north: Element = new ElementEmpty();
  /** @see ElementBorder.java:48 */
  private south: Element = new ElementEmpty();
  /** @see ElementBorder.java:49 */
  private east: Element = new ElementEmpty();
  /** @see ElementBorder.java:50 */
  private west: Element = new ElementEmpty();
  /** @see ElementBorder.java:51 */
  private center: Element = new ElementEmpty();

  /** @see ElementBorder.java:53-55 */
  setNorth(north: Element): void {
    this.north = north;
  }

  /** @see ElementBorder.java:57-59 */
  setSouth(south: Element): void {
    this.south = south;
  }

  /** @see ElementBorder.java:61-63 */
  setEast(east: Element): void {
    this.east = east;
  }

  /** @see ElementBorder.java:65-67 */
  setWest(west: Element): void {
    this.west = west;
  }

  /** @see ElementBorder.java:69-71 */
  setCenter(center: Element): void {
    this.center = center;
  }

  /** @see ElementBorder.java:73-91 */
  drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D | null): void {
    const stringBounder = ug.getStringBounder();
    const dimNorth = this.north.getPreferredDimension(stringBounder, 0, 0);
    const dimSouth = this.south.getPreferredDimension(stringBounder, 0, 0);
    const dimEast = this.east.getPreferredDimension(stringBounder, 0, 0);
    const dimWest = this.west.getPreferredDimension(stringBounder, 0, 0);
    const pA = new XPoint2D(dimWest.getWidth(), dimNorth.getHeight());
    // Unguarded like upstream: a null dimToUse is ElementBorder.java:80's NullPointerException.
    const pB = new XPoint2D(dimToUse!.getWidth() - dimEast.getWidth(), dimNorth.getHeight());
    const pC = new XPoint2D(dimWest.getWidth(), dimToUse!.getHeight() - dimSouth.getHeight());

    this.north.drawU(ug, zIndex, dimToUse);
    this.south.drawU(ug.apply(UTranslate.dy(pC.getY())), zIndex, dimToUse);
    this.west.drawU(ug.apply(UTranslate.dy(pA.getY())), zIndex, dimToUse);
    this.east.drawU(ug.apply(new UTranslate(pB.getX(), pB.getY())), zIndex, dimToUse);
    this.center.drawU(ug.apply(new UTranslate(pA.getX(), pA.getY())), zIndex, dimToUse);
  }

  /** @see ElementBorder.java:93-104 */
  getPreferredDimension(stringBounder: StringBounder, x: number, y: number): XDimension2D {
    const dimNorth = this.north.getPreferredDimension(stringBounder, x, y);
    const dimSouth = this.south.getPreferredDimension(stringBounder, x, y);
    const dimEast = this.east.getPreferredDimension(stringBounder, x, y);
    const dimWest = this.west.getPreferredDimension(stringBounder, x, y);
    const dimCenter = this.center.getPreferredDimension(stringBounder, x, y);
    const width = Math.max(
      dimNorth.getWidth(),
      dimSouth.getWidth(),
      dimWest.getWidth() + dimCenter.getWidth() + dimEast.getWidth(),
    );
    const height =
      dimNorth.getHeight() +
      Math.max(dimWest.getHeight(), dimCenter.getHeight(), dimEast.getHeight()) +
      dimSouth.getHeight();
    return new XDimension2D(width, height);
  }
}
