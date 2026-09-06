/**
 * `renderBulletAtom` -- the creole bullet marker (`klimt/creole/atom/
 * Bullet.java`), split out of `renderer-note.ts` purely to keep that file
 * under this project's 500-line cap. Self-contained (its own geometry
 * constants, only needs `ellipse`/`rect` from `svg.ts`), so it moves as
 * one cohesive unit; `renderer-note.ts` re-exports it, unchanged for
 * `renderer-classifier-rows.ts`'s own import. Pure move, zero behavior
 * change.
 */
import { ellipse, rect } from '../../core/svg.js';

/**
 * `klimt/creole/Sea.java:72-79` — `doAlign` lays every atom at
 * `y = -height + getStartingAltitude()`, then `translateMinYto` shifts the
 * whole line so the TALLEST atom (the text) defines the top. For a bullet
 * that first term is **-10 at both orders** — order 0 is `5 - 5` and order
 * n is `3 - 7` (`Bullet.java:72-83`) — which is why both shapes share one
 * top offset despite different heights. So the bullet's top is
 * `lineTop + lineHeight - 10`, derived, not fitted: at the note's 13pt line
 * that is `lineTop + 3`, matching `donoki-79-riku189`'s jar output exactly
 * (ellipse `cy=27` against a `y=31.611` baseline).
 */
const BULLET_SEA_DEPTH = 10;
/** `Bullet.java:63-68` — the two shapes' own translate/size constants. */
const BULLET_DX_ORDER0 = 3;
const BULLET_R = 2.5;
const BULLET_DX_NESTED_BASE = 1;
const BULLET_NESTED_STEP = 8;
const BULLET_RECT = 3.5;

/**
 * B22/M21: draw a creole bullet marker — `klimt/creole/atom/Bullet.java
 * :58-69`. `order 0`: translate `dx(3)`, `UEllipse.build(5, 5)`.
 * `order >= 1`: translate `dx(1 + 8*order)`, `URectangle.build(3.5, 3.5)`.
 * Both are filled with the font colour and stroked with
 * `UStroke.withThickness(0)` — no visible stroke, which is what
 * distinguishes this shape from the `VisibilityModifier` glyph an object
 * member row's `*` draws instead (`rx=3` WITH `stroke-width:1`).
 *
 * `lineTop` is the atom box's own top; the atom is 5 tall at order 0 and 3
 * otherwise (`Bullet#calculateDimensionSlow:72-76`).
 */
export function renderBulletAtom(
  atom: { readonly order: number; readonly fill: string },
  x: number,
  lineTop: number,
  lineHeight: number,
): string {
  const top = lineTop + lineHeight - BULLET_SEA_DEPTH;
  if (atom.order === 0) {
    return ellipse(x + BULLET_DX_ORDER0 + BULLET_R, top + BULLET_R, BULLET_R, BULLET_R, { fill: atom.fill });
  }
  return rect(x + BULLET_DX_NESTED_BASE + BULLET_NESTED_STEP * atom.order, top, BULLET_RECT, BULLET_RECT, {
    fill: atom.fill,
  });
}
