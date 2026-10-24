/**
 * display-lines.ts -- a sequence display's LINES (`Display#getWithNewlines`).
 * Moved verbatim out of `text-block-geo.ts` when that file reached the
 * 500-line cap; `text-block-geo.ts` re-exports every name, so no import moved.
 */
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';

// ---------------------------------------------------------------------------
// Display -> lines — Display#getWithNewlines
// ---------------------------------------------------------------------------

/**
 * A sequence display's LINES.
 *
 * `Display#getWithNewlines(Pragma, String)` (`Display.java:262-346`) is what
 * every sequence display passes through before it can become a text block,
 * and this is the one place this engine calls it. Upstream's own call sites,
 * all of them:
 *
 *   - `CommandArrow.java:348` — a message label; `:161-170` — a participant
 *     auto-created by an arrow line;
 *   - `CommandParticipant.java:153` — a declared participant's `FULL` display,
 *     and `SequenceDiagram.java:123,168` for one created from its code alone;
 *   - `CommandReferenceOverSeveral.java:132` — a `ref over` body;
 *   - `CommandDivider.java:84`, `CommandDelay.java:83`,
 *     `CommandExoArrowAny.java:86`, `CommandReturn.java:125`,
 *     `CommandBoxStart.java:128`, `CommandNewpage.java:92`;
 *   - `AbstractTextualComponent.java:64` — the base every sequence component
 *     built from a raw `CharSequence` label reaches, and
 *     `ComponentRoseGroupingHeader.java:89` for a group's `[comment]`.
 *
 * A participant's STEREOTYPE is deliberately not on that list:
 * `CommandParticipant.java:174-180` hands the raw `<<...>>` run to
 * `Stereotype.build`, which never constructs a `Display` at all, so its rows
 * do not split however many escapes they carry.
 *
 * The escape it splits on is the two-character sequence backslash-n in the
 * SOURCE, never a real newline: `parseWithNewlines` has no real-newline
 * branch, because upstream's `Display` is a `List<CharSequence>` long before
 * anything reads it.
 *
 * ## Why a real newline is split here as well
 *
 * This port has no `Display` type, so a display arrives at layout as one
 * string — and its parser already lowers the escape to a REAL newline for the
 * two surfaces that needed it first (`command-note-factory.ts:119`,
 * `command-misc.ts:89`), then joins the multi-line `ref`/`note` block forms
 * with one (`parser.ts:122`). A real newline in a display therefore means
 * exactly what a second `displayData` entry means upstream, and the outer
 * split is this port's stand-in for "the display is already several entries"
 * — NOT a second escape scanner. Removing it would drop the multi-line `ref`
 * body and the multi-line note back to a single line.
 *
 * `splitDisplayLines` returns an `align` alongside the lines, resolved from a
 * `\l`/`\r` escape (`Display.java:290-295`). {@link displayLines} drops it;
 * {@link displayLinesAligned} keeps it for the one consumer that builds a
 * `create0` block from a raw label, {@link messageLabelLayout}
 * (`Display.java:648-649`). The BREAK those two escapes also cause is
 * honoured either way, which is upstream's behaviour.
 *
 * ## The JAWS deprecation warning: sequence does NOT surface it
 *
 * `Display#addWarning` (`Display.java:348-353`) raises a `JawsWarning` for
 * every escape consumed, and upstream's sequence commands thread the real
 * `diagram.getPragma()` in, so upstream WOULD raise one here. This port does
 * not, for two reasons that hold together: the split happens at LAYOUT time
 * where no `Pragma` is reachable — precisely why `splitDisplayLines` passes
 * `Pragma.createEmpty()` (`DisplayNewlines.ts:336-359`) — and the emission is
 * gated on `PragmaKey.SHOW_DEPRECATION`, off unless the source opts in, with
 * nothing in this port reading `Pragma#getWarnings()` back out. So a live
 * `Pragma` would render identically today. Recorded rather than left
 * implicit: an engine that DOES hold a `Pragma` should call
 * `parseWithNewlines` with it rather than inherit this decision by accident.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java#getWithNewlines
 */
export function displayLines(text: string): readonly string[] {
  return displayLinesAligned(text).lines;
}

/** {@link displayLines} plus `Display#getNaturalHorizontalAlignment`: the
 *  LAST `\r` (RIGHT) / `\l` (LEFT), `undefined` for none (`Display.java:290-298`). */
export interface AlignedDisplayLines {
  readonly lines: readonly string[];
  readonly align: HorizontalAlignment | undefined;
}

/** `splitDisplayLines` says `'center'` for "no escape" (`Display.java:290-295`). */
const NATURAL_ALIGN = { left: HorizontalAlignment.LEFT, right: HorizontalAlignment.RIGHT } as const;

/**
 * {@link displayLines} plus the natural alignment `create0` lets override the
 * component's own (`Display.java:648-649`). Upstream scans once, so the last
 * escape in the whole text wins; this keeps the last entry that set one.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java#getWithNewlines
 */
export function displayLinesAligned(text: string): AlignedDisplayLines {
  let align: HorizontalAlignment | undefined;
  const lines = text.split('\n').flatMap((entry) => {
    const split = splitDisplayLines(entry);
    if (split.align !== 'center') align = NATURAL_ALIGN[split.align];
    return split.lines;
  });
  return { lines, align };
}
