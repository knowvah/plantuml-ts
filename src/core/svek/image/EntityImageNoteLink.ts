/**
 * ONE port of `EntityImageNoteLink`'s dimension -- collapses the FOUR former
 * copies (`class/class-note-link-box.ts:70`, `state/state-dot-graph.ts:172`,
 * `state/state-composite-edge-label.ts:49` -- the last two byte-identical
 * private duplicates -- and `description/link-note-box.ts:58`, which already
 * routed its padding through `core/rose-note-dim.ts#roseNoteDim`) onto one
 * function. `shared-seam-extraction` (SI27) T6, D1.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageNoteLink.java
 *   -- constructor (`:61-66`) builds a `ComponentRoseNote` via
 *   `Rose#createComponentNote`; `calculateDimensionSlow` (`:69-73`) is
 *   `getPreferredWidth`/`getPreferredHeight`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseNote.java
 *   -- `getPreferredWidth`/`getPreferredHeight` (`:81-90`) = text dim + 2 *
 *   paddingX/Y (both 5, `Rose.java:65-66`); the text dim itself carries
 *   Opale's 6/15/5 STYLE padding (`ComponentRoseNote`'s own `super(...)`,
 *   `:66-70`). Full derivation, incl. why the two pad separately, lives on
 *   `core/rose-note-dim.ts#roseNoteDim` -- this module reuses it rather than
 *   re-deriving it.
 *
 * Upstream always measures the note's `Display` through a REAL creole
 * `TextBlock` (`AbstractTextualComponent#getTextWidth`/`getTextHeight`) --
 * there is no "raw split" in the Java. This port's three per-engine callers
 * built that PURE (un-padded) text dimension three different ways before
 * this task: class's `note-layout-measure.ts#measureNote` (creole/atom/
 * sprite-aware, the richest), description's `leaf-sizing.ts#buildNoteBody`
 * (its own creole block), and state's raw `text.split('\n')` + flat
 * `measurer.measure` per line (no creole scan at all -- an approximation,
 * not upstream's true behavior, but the one no state `note on link` corpus
 * fixture's text exercises, so it is preserved byte-identically rather than
 * "fixed" here -- CLAUDE.md "preserve information-carrying output").
 *
 * This function owns the SHARED half: padding (`roseNoteDim`) plus,
 * absent a richer strategy, state's naive per-line measurement. A caller
 * with its own creole engine (class, description) supplies a `pureText`
 * strategy closing over that engine's real note-body builder and (for
 * class) its sprite registry -- the "optional sprites/creole handling" the
 * class copy's signature needed. `font.family` is `theme.fontFamily` for
 * those two callers; state passes its own resolved `fontFamily` directly,
 * with no `Theme` in hand at all -- both are the SAME `{ family: string }`
 * shape, so omitting `pureText` reproduces the state copies' former
 * fontFamily-only call exactly.
 */
import type { StringMeasurer } from '../../measurer.js';
import { roseNoteDim, type RoseNoteDim } from '../../rose-note-dim.js';
import { NOTE_FONT_SIZE } from '../../klimt/font/FontParam.js';

/** The un-padded ("pure") note-body dimension a caller's own text engine
 *  produces -- `roseNoteDim`'s own operand shape, restated here as this
 *  module's public strategy contract. */
export interface PureNoteTextDim {
  readonly width: number;
  readonly height: number;
}

/**
 * A caller-supplied pure-text strategy, e.g. class's `measureNote` (atom/
 * sprite-aware) or description's `buildNoteBody`, closed over whatever
 * theme/sprite context the caller already resolved. Omitted by state, which
 * has no creole engine of its own to plug in -- see this module's doc
 * comment for why the naive default is the RIGHT reproduction, not a
 * placeholder.
 */
export type PureNoteTextMeasurer = (text: string, measurer: StringMeasurer) => PureNoteTextDim;

/**
 * State's own former measurement (`state-dot-graph.ts:172-181`,
 * `state-composite-edge-label.ts:49-58`, byte-identical duplicates before
 * this task): split on literal `\n` only (no creole scan, no block/bullet/
 * table handling), measure each line RAW at `{ family, size: NOTE_FONT_SIZE
 * }`, width = the widest line, height = `lines.length * NOTE_FONT_SIZE`.
 * Kept verbatim as the default strategy so the fontFamily-only call shape
 * reproduces byte-identically (acceptance criterion 3).
 */
function naivePureTextDim(
  text: string,
  font: { readonly family: string },
  measurer: StringMeasurer,
): PureNoteTextDim {
  const lines = text.split('\n');
  let maxW = 0;
  for (const ln of lines) {
    maxW = Math.max(maxW, measurer.measure(ln, { family: font.family, size: NOTE_FONT_SIZE }).width);
  }
  return { width: maxW, height: lines.length * NOTE_FONT_SIZE };
}

/**
 * `EntityImageNoteLink`'s real dimension -- one body for every caller (see
 * this module's doc comment for the full derivation and the naive-default
 * rationale). `font.family` is the note text's font family; `pureText`, when
 * supplied, replaces the naive default with the caller's own creole-aware
 * measurement (class, description) -- omit it for state's former shape.
 */
export function measureLinkNoteDim(
  text: string,
  font: { readonly family: string },
  measurer: StringMeasurer,
  pureText?: PureNoteTextMeasurer,
): RoseNoteDim {
  const pure = pureText === undefined ? naivePureTextDim(text, font, measurer) : pureText(text, measurer);
  return roseNoteDim(pure);
}
