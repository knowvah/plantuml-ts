/**
 * AtomSpace — the creole `<space:N>` atom: N pixels of horizontal advance,
 * nothing drawn.
 *
 * Upstream: `klimt/creole/atom/AtomSpace.java` —
 * ```java
 * calculateDimensionSlow -> new XDimension2D(width, 1);   // java:~52
 * getStartingAltitude    -> 0;
 * drawU                  -> { }                            // empty
 * ```
 * The height is the constant `1`, NOT the font height. Ported as a constant
 * plus a dimension function (the `CreoleAtom` `'space'` variant is
 * data-only, like `'emoji'` — see `atom/AtomEmoji.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomSpace.java
 */
import { XDimension2D } from '../../geom/XDimension2D.js';

/** `AtomSpace#calculateDimensionSlow`'s constant height (AtomSpace.java). */
export const SPACE_ATOM_HEIGHT = 1;

/** `AtomSpace#getStartingAltitude` (AtomSpace.java) — always 0. */
export const SPACE_ATOM_STARTING_ALTITUDE = 0;

/** `AtomSpace#calculateDimensionSlow`: `new XDimension2D(width, 1)`. */
export function spaceAtomDim(width: number): XDimension2D {
  return new XDimension2D(width, SPACE_ATOM_HEIGHT);
}
