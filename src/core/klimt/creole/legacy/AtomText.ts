/**
 * AtomText — the TAB-STOP-aware width of one creole text run.
 *
 * Upstream: `klimt/creole/legacy/AtomText.java` — `calculateDimensionSlow`'s
 * own `text.indexOf("\t") == -1` guard (java:183-184, which is what makes a
 * tab-free run measure through the plain `StringBounder` path unchanged),
 * `getWidth` (java:239-256, the tokenizer + tab-stop advance), `getTabSize`
 * (java:270-275) and `tabString` (java:258-264). `drawU` (java:210-233) runs
 * the SAME tokenizer to place each token's `UText` at the advanced `x` — that
 * is the renderer's half and is not this module's concern; this module is the
 * measurement half both the sizer and the renderer must agree on.
 *
 * The rule, exactly as upstream states it: `x` starts at 0 **inside the run**,
 * each non-tab token advances `x` by its measured width, and each tab token
 * advances `x` to the NEXT MULTIPLE of the tab stop —
 * `x += tabSize - (x % tabSize)`. A tab that lands exactly on a stop boundary
 * therefore advances a FULL stop (remainder 0 -> `x += tabSize`), never zero.
 *
 * ## Why the stop is `fontSize * 4`, not "8 spaces wide"
 *
 * `getTabSize` measures `tabString()` — 8 spaces on this port's paths, see
 * below — and falls back to `getFont().getSize2D() * 4` **when that
 * measurement is zero** (java:272-274). Under the deterministic width table
 * both this port and the oracle jar run on
 * (`-DPLANTUML_DETERMINISTIC_TEXT=true`, `StringBounderFromWidthTable`) the
 * SPACE glyph has width 0, so `measure("        ") === 0` and the fallback is
 * the branch that always fires. Measured here 2026-08-07:
 * `new WidthTableMeasurer().measure(" ", { size: 14 }).width === 0`. At the
 * default font size 14 that yields **56px**, which is exactly the tab advance
 * jar-probed for `fariba-82-xolu802` (`plans/s1l-tail-diagnosis/findings/
 * container-cluster.md`, ruledOut (e)). The 56 is therefore NOT a constant —
 * it is `14 * 4`, and it scales with the run's font size.
 *
 * ## Why `skinparam tabSize` cannot move it
 *
 * Two independent reasons, both verified in upstream source:
 * 1. `Style#getFontConfiguration` (`style/Style.java:229`) builds every
 *    style-driven run's `FontConfiguration` through the 4-argument
 *    `FontConfiguration.create` overload, which **hardcodes `tabSize = 8`**
 *    (`klimt/font/FontConfiguration.java:229-232`). `skinparam tabSize`
 *    (`SkinParam#getTabSize`, default 8) never reaches a description-engine
 *    run at all.
 * 2. Even if it did, `tabString()` only varies for `1 <= nb < 7`, and its
 *    width is 0 for EVERY length under the deterministic width table — so the
 *    `getSize2D() * 4` fallback is taken regardless of the string's length.
 *
 * This is why {@link atomTextWidth} takes no tab-size parameter: threading one
 * would be a lever upstream does not have on this path.
 *
 * ## Every font size on this module's surface is the MUTED size
 *
 * Upstream reads the run's font through `fontConfiguration.getFont()`
 * (java:176, java:191-192, java:251, java:271-273), which mutes the size for a
 * `<sup>`/`<sub>` run before either the measurement or the tab-stop fallback
 * sees it (`FontConfiguration.java:98-104` -> `FontPosition.java:51-60`).
 * SI30 (decisions.md#D1) therefore fixes the contract for this module:
 * `fontSize` parameters take `getFont(fc).size`, never `fc.size`, and the
 * `measure` callback must be bound to that same muted font. For a NORMAL run
 * the two are identical, which is why no signature changed.
 *
 * `Jaws.BLOCK_E1_REAL_TABULATION` (`jaws/Jaws.java:53`, `U+E111`) is a
 * second delimiter upstream's tokenizer treats identically to `\t`. This port
 * has no Jaws preprocessor, so nothing emits that sentinel today; it is ported
 * anyway because it is upstream's own delimiter set, and a run that ever does
 * carry it must advance the same way.
 */

import { getSpace, type FontConfiguration } from '../../shape/UText.js';

/** Upstream `AtomText#getStartingAltitude(StringBounder)` (java:321-323) —
 *  a straight `return fontConfiguration.getSpace()`, i.e. the run's
 *  `FontPosition` space (−6 EXPOSANT / +3 INDICE / 0 NORMAL). The
 *  `StringBounder` parameter is unused upstream and has no counterpart here.
 *
 *  This is the ONLY place the raise/lower is applied: `AtomText#drawU`'s own
 *  `final int ypos = fontConfiguration.getSpace();` line is COMMENTED OUT
 *  upstream (java:212, and the live line is java:213-215) and the draw baseline is `height - descent` alone,
 *  so the altitude reaches the page through `Sea` and must not be applied a
 *  second time at draw (decisions.md#D2). */
export function atomTextStartingAltitude(fc: FontConfiguration): number {
  return getSpace(fc);
}

/** Upstream `AtomText#getTabSize`'s zero-width fallback multiplier
 *  (java:273, `fontConfiguration.getFont().getSize2D() * 4`). */
export const TAB_STOP_FONT_SIZE_FACTOR = 4;

/** Upstream `AtomText#tabString` (java:258-264) for this port's paths: the
 *  method returns `"        ".substring(0, nb)` only for `1 <= nb < 7` and the
 *  full 8 spaces otherwise, and every description-engine run carries `nb == 8`
 *  (see this module's doc comment) — so 8 spaces is the only value reachable
 *  here, not a simplification of the branch. */
export const TAB_STRING = '        ';

/** Upstream `jaws/Jaws.java:53`'s `BLOCK_E1_REAL_TABULATION` sentinel — a
 *  second tabulation character upstream's tokenizer treats identically to
 *  `\t`. Nothing in this port emits it today (no Jaws preprocessor); it is
 *  ported anyway because it is upstream's own delimiter set, and a run that
 *  ever does carry it must advance the same way. Written as an escape, never
 *  as the literal glyph: it is a private-use codepoint, invisible in an
 *  editor. */
export const BLOCK_E1_REAL_TABULATION = '\u{E111}';

/** The delimiter set upstream's `StringTokenizer(text, "\t" + Jaws
 *  .BLOCK_E1_REAL_TABULATION, true)` splits on (java:242, java:210). */
const TAB_CHARS = `\t${BLOCK_E1_REAL_TABULATION}`;

/** True when `text` contains a character upstream treats as a tabulation —
 *  upstream `calculateDimensionSlow`'s own guard (java:183), the branch that
 *  keeps every tab-free run on the plain measurement path. */
export function hasTabulation(text: string): boolean {
  for (const ch of text) if (TAB_CHARS.includes(ch)) return true;
  return false;
}

/** Upstream `AtomText#getTabSize` (java:270-275). `tabStringWidth` is the
 *  caller's measurement of {@link TAB_STRING} in the run's own font; a zero
 *  measurement (always, under the deterministic width table — see this
 *  module's doc comment) falls back to `fontSize * 4`. `fontSize` is the
 *  MUTED size (`getFont(fc).size`) — see this module's doc comment. */
export function tabStopWidth(tabStringWidth: number, fontSize: number): number {
  return tabStringWidth === 0 ? fontSize * TAB_STOP_FONT_SIZE_FACTOR : tabStringWidth;
}

/** Upstream `AtomText#getWidth`'s tab branch (java:247-250):
 *  `x += tabSize - (x % tabSize)`. Advances to the NEXT stop, so a position
 *  already ON a stop boundary advances a full `tabStop`, not zero. */
export function advanceToTabStop(currentX: number, tabStop: number): number {
  return currentX + (tabStop - (currentX % tabStop));
}

/** One `StringTokenizer(text, TAB_CHARS, true)` token: upstream returns each
 *  delimiter as its own single-character token and never returns an empty
 *  token, so `isTab` is the token's identity, not a re-test of its text. */
export interface TabToken {
  readonly text: string;
  readonly isTab: boolean;
}

/** Upstream's `StringTokenizer(text, TAB_CHARS, true)` (java:242, java:210).
 *  Exported because `AtomText#drawU` (java:210-233) re-tokenizes the SAME way
 *  `#getWidth` (java:242) does, and this port's renderer-side seams
 *  (`creole-text-lines.ts`, `state-sizing-creole.ts`) are that draw half —
 *  one port, never a copy (the SI27 shared-seam rule). */
export function tokenizeOnTabs(text: string): TabToken[] {
  const tokens: TabToken[] = [];
  let pending = '';
  for (const ch of text) {
    if (!TAB_CHARS.includes(ch)) {
      pending += ch;
      continue;
    }
    if (pending.length > 0) tokens.push({ text: pending, isTab: false });
    pending = '';
    tokens.push({ text: ch, isTab: true });
  }
  if (pending.length > 0) tokens.push({ text: pending, isTab: false });
  return tokens;
}

/** Upstream `AtomText#tabString` (java:258-264): `substring(0, nb)` for
 *  `1 <= nb < 7`, else the full 8 spaces. `nb` is
 *  `FontConfiguration#getTabSize()` (java:270-275, `SkinParam.java:1073`
 *  default 8); {@link atomTextWidth} below only ever reaches that default,
 *  which is why it passes {@link TAB_STRING} directly. */
export function tabStringFor(nb: number): string {
  return nb >= 1 && nb < 7 ? TAB_STRING.slice(0, nb) : TAB_STRING;
}

/**
 * Width of one creole text run, expanding tabulations to tab stops —
 * upstream `AtomText#calculateDimensionSlow`'s width term (java:183-184)
 * delegating to `#getWidth` (java:239-256).
 *
 * `fontSize` and `measure` must BOTH be bound to the run's muted font
 * (`getFont(fc)`) — see this module's doc comment.
 *
 * `measure` is the caller's own font-bound string measurement (the sizer's
 * `StringMeasurer`, the renderer's `StringBounder`); it is called with
 * {@link TAB_STRING} once per tabbed run to derive the stop, matching
 * upstream's own `getTabSize(stringBounder)` call placement.
 *
 * A tab-free run short-circuits to a single `measure(text)` — byte-identical
 * to the pre-existing call it replaces, which is what makes wiring this in a
 * zero-diff change for every run without a tabulation.
 */
export function atomTextWidth(text: string, fontSize: number, measure: (s: string) => number): number {
  if (!hasTabulation(text)) return measure(text);
  const tabStop = tabStopWidth(measure(TAB_STRING), fontSize);
  let x = 0;
  for (const token of tokenizeOnTabs(text)) {
    x = token.isTab ? advanceToTabStop(x, tabStop) : x + measure(token.text);
  }
  return x;
}
