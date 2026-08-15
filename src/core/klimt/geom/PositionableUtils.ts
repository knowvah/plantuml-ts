import { PositionableImpl } from './PositionableImpl.js';
import type { Positionable } from './Positionable.js';
import type { XDimension2D } from './XDimension2D.js';
import { XPoint2D } from './XPoint2D.js';
import { XRectangle2D } from './XRectangle2D.js';

/**
 * PositionableUtils — rectangle overlap tests and the "push a label clear
 * of a box" solver.
 *
 * Upstream: klimt/geom/PositionableUtils.java. Ported in full:
 * `convert`, `intersect`, `addMargin`, `getCenter`, `move`,
 * `moveAwayFrom`, `doesIntersectWithThisCoef`.
 *
 * `moveAwayFrom` is the reason this class exists here:
 * `SvekEdge#manageCollision` (svek/SvekEdge.java:1205-1216) feeds every
 * port label through it, and that is what places multiplicity labels
 * clear of the nodes they sit beside. See
 * `class-edge-geo.ts#manageCollision` for the caller.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PositionableUtils.java
 */

function convert(positionable: Positionable): XRectangle2D {
  const position = positionable.getPosition();
  const size = positionable.getSize();
  return new XRectangle2D(position.getX(), position.getY(), size.getWidth(), size.getHeight());
}

/** `bigR.intersects(smallR)` — note `XRectangle2D#intersects` is Java's
 *  `Rectangle2D` rule, so an EMPTY rectangle (zero width or height) never
 *  intersects anything. A zero-width label is therefore never pushed. */
export function intersect(big: Positionable, small: Positionable): boolean {
  return convert(big).intersects(convert(small));
}

/** Grow `pos` by `widthMargin`/`heightMargin` on every side: the origin
 *  moves up-left by one margin, the size grows by two. */
export function addMargin(
  pos: Positionable,
  widthMargin: number,
  heightMargin: number,
): Positionable {
  return {
    getPosition(): XPoint2D {
      const p = pos.getPosition();
      return new XPoint2D(p.getX() - widthMargin, p.getY() - heightMargin);
    },
    getSize(): XDimension2D {
      return pos.getSize().delta(2 * widthMargin, 2 * heightMargin);
    },
    moveDelta(deltaX: number, deltaY: number): void {
      pos.moveDelta(deltaX, deltaY);
    },
  };
}

function getCenter(p: Positionable): XPoint2D {
  const pt = p.getPosition();
  const dim = p.getSize();
  return new XPoint2D(pt.getX() + dim.getWidth() / 2, pt.getY() + dim.getHeight() / 2);
}

function move(p: Positionable, deltaX: number, deltaY: number): Positionable {
  const pt = p.getPosition();
  const dim = p.getSize();
  return new PositionableImpl(pt.getX() + deltaX, pt.getY() + deltaY, dim);
}

function doesIntersectWithThisCoef(
  fixe: Positionable,
  toMove: Positionable,
  deltaX: number,
  deltaY: number,
  c: number,
): boolean {
  return intersect(fixe, move(toMove, deltaX * c, deltaY * c));
}

/**
 * Slide `toMove` along the `fixe`-centre -> `toMove`-centre ray until it
 * clears `fixe`, and return it at that position.
 *
 * The distance is NOT computed in closed form: upstream brackets the
 * coefficient (`max` doubling from `0.1` until it clears) and then runs a
 * fixed **five**-iteration bisection, returning the midpoint of the final
 * `[min, max]` bracket. That midpoint is not the exact minimal clearing
 * coefficient and can still overlap slightly — reproducing the iteration
 * count exactly is what reproduces jar's coordinates, so the loop is
 * ported verbatim rather than solved analytically.
 *
 * Throws when `toMove` does not already intersect `fixe` (upstream's own
 * `IllegalArgumentException`); every caller tests `intersect` first.
 */
export function moveAwayFrom(fixe: Positionable, toMove: Positionable): Positionable {
  const centerFixe = getCenter(fixe);
  const centerToMove = getCenter(toMove);

  const deltaX = centerToMove.getX() - centerFixe.getX();
  const deltaY = centerToMove.getY() - centerFixe.getY();

  let min = 0.0;
  if (doesIntersectWithThisCoef(fixe, toMove, deltaX, deltaY, min) === false)
    throw new Error('IllegalArgumentException');

  let max = 0.1;
  while (doesIntersectWithThisCoef(fixe, toMove, deltaX, deltaY, max)) max = max * 2;

  for (let i = 0; i < 5; i++) {
    const candidate = (min + max) / 2.0;
    if (doesIntersectWithThisCoef(fixe, toMove, deltaX, deltaY, candidate)) min = candidate;
    else max = candidate;
  }
  const candidate = (min + max) / 2.0;
  return move(toMove, deltaX * candidate, deltaY * candidate);
}
