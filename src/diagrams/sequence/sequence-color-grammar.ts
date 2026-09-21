/**
 * `ColorParser`'s two grammars (`COLOR_REGEXP`/`PART2`, combined as
 * `COLORS_REGEXP`), shared by every sequence command that carries a
 * `ColorParser.exp1()`/`simpleColor(...)` tail: the note-command family
 * (`command-note-factory.ts`) AND the participant-declaration family
 * (`sequence-participant-declaration.ts`, T11 ubrr) — `CommandParticipantA
 * .java:69` uses the exact same `ColorParser.exp1()` the note factories use
 * (`FactorySequenceNoteCommand.java`'s `color()`), so a participant's
 * trailing colour supports the identical gradient/compound shapes a note's
 * does. Split into its own module rather than left private to
 * `command-note-factory.ts` once a second, unrelated command family needed
 * the same grammar verbatim.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorParser.java:43-46,89-91
 */

/**
 * `ColorParser.COLOR_REGEXP` — a plain `#name` background color, OR a
 * two-stop gradient like `#yellow/blue` (one `-`/`\`/`|`/`/` separator
 * between two word runs).
 * @see klimt/color/ColorParser.java:43
 */
export const SEQUENCE_COLOR_ATOM = String.raw`#\w+[-\\|/]?\w+`;

/**
 * `ColorParser.PART2` — the compound `key:value(;key:value)*` form used by
 * `#green;line:lightblue` and `#back:green;line:lightblue`: an optional
 * leading plain color plus `;`, then one-or-more `keyword[:value]` pairs
 * drawn from the fixed `ColorParam`-backed keyword set.
 * @see klimt/color/ColorParser.java:45
 */
export const SEQUENCE_COLOR_COMPOUND = String.raw`#(?:\w+[-\\|/]?\w+;)?(?:(?:text|back|header|line|line\.dashed|line\.dotted|line\.bold|shadowing)(?::\w+[-\\|/]?\w+)?(?:;|(?![\w;:.])))+`;

/**
 * `ColorParser.COLORS_REGEXP = PART2 | COLOR_REGEXP` — compound tried
 * first, same alternation order upstream uses.
 * @see klimt/color/ColorParser.java:46
 */
export const SEQUENCE_COLOR = `(?:${SEQUENCE_COLOR_COMPOUND})|(?:${SEQUENCE_COLOR_ATOM})`;
