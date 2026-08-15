/**
 * `CucaDiagram#getDefaultMargins()` — the document margins every diagram in
 * the cuca family inherits.
 *
 * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:736-738
 *
 * ```java
 * public ClockwiseTopRightBottomLeft getDefaultMargins() {
 *     // Strange numbers here for backwards compatibility
 *     return ClockwiseTopRightBottomLeft.topRightBottomLeft(0, 5, 5, 0);
 * }
 * ```
 *
 * Upstream's own comment ("strange numbers … for backwards compatibility")
 * is why these are not derived from anything: they are a historical
 * constant, preserved verbatim.
 *
 * **Scoped to the cuca family on purpose, and the name says so.**
 * `getDefaultMargins` is overridden all over upstream — `SequenceDiagram`,
 * `GanttDiagram`, `NwDiagram`, `PSystemSalt`, `FlowDiagram` and others each
 * return their own — and the two base classes disagree with this override
 * too (`core/AbstractDiagram.java:231` returns `same(0)`,
 * `TitledDiagram.java:275` returns `same(10)`). So this is emphatically NOT
 * "the document margin"; it is CucaDiagram's, and only a CucaDiagram engine
 * may read it.
 *
 * Readers: the class, description and state engines — each of which
 * previously declared its own copy of all four numbers. Object and
 * component/usecase route through the class and description engines
 * respectively, so they inherit it transitively, exactly as they inherit
 * `CucaDiagram` upstream.
 *
 * A non-cuca engine needing document margins must NOT import these. It
 * should port its own diagram type's `getDefaultMargins` override into its
 * own owner module — that difference is real upstream behaviour, not
 * duplication to be removed.
 */

/** Top margin, in px. */
export const CUCA_DOCUMENT_MARGIN_TOP = 0;
/** Right margin, in px. */
export const CUCA_DOCUMENT_MARGIN_RIGHT = 5;
/** Bottom margin, in px. */
export const CUCA_DOCUMENT_MARGIN_BOTTOM = 5;
/** Left margin, in px. */
export const CUCA_DOCUMENT_MARGIN_LEFT = 0;
