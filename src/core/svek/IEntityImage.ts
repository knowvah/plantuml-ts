/**
 * `IEntityImage` — the margins every svek entity image insets its content by.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/IEntityImage.java:44-46
 *
 * ```java
 * public static final int CORNER = 25;
 * public static final int MARGIN = 5;
 * public static final int MARGIN_LINE = 5;
 * ```
 *
 * `CORNER` is not ported: nothing here declares it twice, and adding a
 * constant no caller reads would be speculative.
 *
 * **`MARGIN` is qualified as `ENTITY_IMAGE_MARGIN` on purpose.** Unqualified
 * `MARGIN` is the worst name collision in this codebase — seven declarations
 * holding four different values (5 here, 12 for the graph-layout canvas pad,
 * 10 in board, 20 in chart), none of which mean the same thing. Importing
 * this one under a name that says whose margin it is stops the next reader
 * merging it with one of the others.
 *
 * Readers: the state engine's box/composite renderers and its composite
 * sizing, all of which read `IEntityImage`'s pair because that is what
 * `InnerStateAutonom#calculateDimensionSlow` and `EntityImageState` inset by.
 */

/** `IEntityImage.MARGIN` — the content inset on all four sides. */
export const ENTITY_IMAGE_MARGIN = 5;

/** `IEntityImage.MARGIN_LINE` — the additional inset below a separator line
 *  (the title/body divider in a state or class box). */
export const ENTITY_IMAGE_MARGIN_LINE = 5;
