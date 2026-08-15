/**
 * The two constants `SvekResult#calculateDimension` applies to every svek
 * diagram's ink extent — the single owner for all engines.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java
 *
 * ```java
 * public XDimension2D calculateDimension(StringBounder stringBounder) {
 *     if (minMax == null) {
 *         minMax = TextBlockUtils.getMinMax(this, stringBounder, false);
 *         clusterManager.moveDelta(6 - minMax.getMinX(), 6 - minMax.getMinY());
 *     }
 *     return minMax.getDimension().delta(15, 15);
 * }
 * ```
 *
 * Upstream applies this to the shared `SvekResult`, so the class,
 * description and state engines are all reading the SAME two numbers off
 * the SAME method. They previously each declared their own copy — four
 * declarations of two constants — and the drift that predicts had already
 * started: `state/layout-ink-extent.ts` cross-referenced "class's own
 * `layout-ink-extent.ts#JAR_INK_MARGIN`", a file that does not exist (the
 * class copy lived in `class-ink-box.ts`).
 *
 * **Why these are shared and `HACK_X_FOR_POLYGON` is not.** The ink modules
 * carry a stated klimt-free-module convention that duplicates
 * `HACK_X_FOR_POLYGON` rather than importing it, and that reason is real
 * and specific: `core/klimt/drawing/LimitFinder.ts` keeps that constant
 * PRIVATE, so there is nothing to import. It does not extend to these two —
 * they are `SvekResult`'s, not `LimitFinder`'s privates, and nothing ever
 * blocked sharing them. The convention had been applied by association.
 */

/** `SvekResult#calculateDimension`'s `.delta(15, 15)` padding. */
export const INK_DELTA = 15;

/** `SvekResult#calculateDimension`'s `moveDelta(6 - minMax.getMinX(),
 *  6 - minMax.getMinY())` — the origin the ink extent is shifted to. */
export const JAR_INK_MARGIN = 6;
