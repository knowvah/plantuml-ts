/**
 * `Opale` — the note shape's own geometry constants (the folded-corner box
 * svek draws for `note`/`note on link`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java
 *
 * ```java
 * private static final int cornersize = 10;   // :53
 * public  static final int marginX1   = 6;    // :56
 * public  static final int marginX2   = 15;   // :57
 * private final       int marginY     = 5;    // :58
 * ```
 *
 * Only the three this port actually duplicates are ported here. `marginX2`
 * is deliberately absent: nothing declares it twice, and adding a constant
 * no caller reads would be speculative.
 *
 * Readers: the class and state engines, which each drew notes from their
 * own copies of these numbers. Description sizes notes through
 * `leaf-sizing-consts.ts`'s own combined `NOTE_MARGIN_H = 21` — which is
 * `marginX1 + marginX2` — rather than the parts; that is a separate
 * derivation, left alone here.
 */

/**
 * `Opale#cornersize` — the folded-corner triangle's leg length.
 *
 * **Not to be confused with the activity engine's own `NOTE_FOLD = 8`**,
 * which is a different shape's fold in a different engine and merely shares
 * the name. That collision is why this constant carries upstream's own name
 * rather than the `NOTE_FOLD` the class and state engines used locally.
 */
export const OPALE_CORNERSIZE = 10;

/** `Opale#marginX1` — the note's left text inset. */
export const OPALE_MARGIN_X1 = 6;

/** `Opale#marginY` — the note's vertical text inset. */
export const OPALE_MARGIN_Y = 5;
