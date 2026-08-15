/**
 * `FontParam` — the fixed per-element font sizes upstream declares as enum
 * entries, each independent of the diagram's own default font size.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontParam.java
 *
 * ```java
 * ARROW(13, UFontFace.normal()), //   :54
 * NOTE(13, UFontFace.normal()),  //   :66
 * ```
 *
 * **These two are the same number and are NOT the same constant.** They are
 * separate enum entries upstream, and either could change without the other
 * — an edge label's font and a note's font are unrelated decisions that
 * happen to agree at 13 today. They live in one module because upstream
 * declares them in one file, not because they are interchangeable. Never
 * collapse them into a shared `FONT_SIZE_13`; a caller must import the one
 * that names what it is drawing.
 *
 * Only the sizes are ported here. `FontParam` upstream also carries a
 * `UFontFace` and style flags per entry; this port resolves those through
 * its own theme layer, and adding them here would duplicate that.
 */

/**
 * `FontParam.ARROW` — the font size for an edge/transition label, fixed at
 * 13 regardless of the diagram's default. Read by the class, description
 * and state engines, several of which previously declared it more than once
 * internally: state carried six copies, one of them explicitly "duplicated
 * locally rather than imported … to avoid an import cycle"
 * (`state/layout.ts`). Importing from `core/` removes that constraint —
 * there is no cycle to avoid from here.
 */
export const ARROW_LABEL_FONT_SIZE = 13;

/**
 * `FontParam.NOTE` — the font size inside a note, fixed at 13 regardless of
 * the diagram's default. Distinct from {@link ARROW_LABEL_FONT_SIZE}; see
 * this module's doc comment.
 */
export const NOTE_FONT_SIZE = 13;
