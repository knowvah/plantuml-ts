/**
 * Local, minimal stand-in for the private-use Unicode sentinels
 * `net.sourceforge.plantuml.jaws.Jaws` defines for its Creole/Display-layer
 * newline and escape handling. That package is out of this batch's write-set
 * (`src/core/tim/builtin/` only) and out of scope entirely -- no file here
 * calls anything on `Jaws` beyond these six `char` constants, following this
 * codebase's established narrow-local-duplicate precedent (see
 * `VariableManager.ts`'s `isLetterOrEmojiOrUnderscoreOrDigit`).
 *
 * `JawsFlags.USE_BLOCK_E1_IN_NEWLINE_FUNCTION` is a compile-time constant
 * upstream (`JawsFlags.java:40`, hardcoded `true`), and `Newline`/
 * `NewlineShort`/`Breakline` each carry BOTH branches (`BLOCK_E1_*` when
 * true, a real `"\n"` when false). Batch SI5a-4 originally set it FALSE
 * here (upstream's own legacy branch) because no display layer decoded the
 * sentinel yet -- it would have survived into the SVG as an invisible
 * private-use character. Mission A2s R2b flips it to upstream's real
 * `true`: the decode point now exists (`DisplayNewlines.ts#
 * parseWithNewlines`, the port of `Display#getWithNewlines`'s
 * `Jaws.BLOCK_E1_*` branches, `Display.java:315-339`), and the legacy
 * `"\n"` branch was destroying single-line commands whose TEXT used
 * `%n()` -- `note top of foo : some%n()%n()notes` split into three source
 * lines, truncating the note to "some", where the jar keeps ONE note with
 * three display lines (`rozudo-79-zavu288`'s pinned golden). Display paths
 * that do not yet route through `parseWithNewlines` render the sentinel as
 * an invisible character -- the remaining follow-up is wiring THOSE paths
 * to the decoder, not un-flipping the producer.
 *
 * `Jaws.BLOCK_E1_NEWLINE` is also used by `TContext#extractFromResultList`
 * (`%retrieve_procedure`'s multi-line capture), where upstream uses it as an
 * in-line separator that must NOT split the source line.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jaws/Jaws.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jaws/JawsFlags.java
 */
/** @see ~/git/plantuml/.../jaws/JawsFlags.java#USE_BLOCK_E1_IN_NEWLINE_FUNCTION */
export const USE_BLOCK_E1_IN_NEWLINE_FUNCTION = true;

export const BLOCK_E1_NEWLINE = '';
export const BLOCK_E1_NEWLINE_LEFT_ALIGN = '';
export const BLOCK_E1_NEWLINE_RIGHT_ALIGN = '';
export const BLOCK_E1_BREAKLINE = '';
export const BLOCK_E1_REAL_BACKSLASH = '';
export const BLOCK_E1_REAL_TABULATION = '';
