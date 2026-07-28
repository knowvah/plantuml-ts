/**
 * Shared per-line text measurement for the description engine's leaf sizing.
 *
 * Split out of `leaf-sizing.ts` to keep that file under the project's
 * 500-line cap (S1L-a). These are the primitives every per-symbol sizing
 * rule in `leaf-sizing.ts` composes — display-line width, text-block height,
 * creole horizontal-rule classification, and the `<img>`/`<$sprite>` inline
 * atom contributions — with no per-symbol geometry of their own.
 *
 * The load-bearing invariant here is sizer<->renderer lock-step: width and
 * HR classification both route through the SAME `buildLineAtoms` /
 * `classifyStripeLine` the leaf renderer draws with
 * (creole-lexer-unification ADR-1), so measured box and drawn ink cannot
 * drift apart.
 */

import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import {
  measureLineWithAtoms,
  measureInlineAtom,
  lineAtomHeightExcess,
  type SpriteDimsLookup,
} from '../../core/creole-atoms.js';
import { classifyStripeLine } from '../../core/klimt/creole/legacy/CreoleStripeSimpleParser.js';
import { buildLineAtoms } from '../../core/klimt/creole/legacy/StripeSimple.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { JAR_DEFAULT_TEXT_COLOR } from './renderer-symbol.js';

/** Number of display lines (upstream text block splits on hard newlines). */
export function lineCount(display: string): number {
  return display.split('\n').length;
}

/** A creole horizontal-rule line (`----`/`====`/`....`) renders as a thin
 *  separator, not a text line. Height verified 8px vs the deterministic oracle
 *  (`node [ foo1 ==== foo2 ]` = 14 + 8 + 14 + 30 margin = 66px); a fixed 8px
 *  across styles (S1L-b ADR-4 — no per-style split needed). */
export const CREOLE_HR_HEIGHT = 8;

/** True when the display line draws as a horizontal rule rather than glyphs.
 *  Delegated to the render-side `classifyStripeLine` (the same classifier the
 *  leaf renderer uses) so the sizer measures EXACTLY what the renderer draws —
 *  e.g. `----`/`====`/`....` are rules, but `____` (underscores) is NOT a rule
 *  in this creole dialect and renders as literal text (S1L-b ADR-4 refinement,
 *  decision-journal). Keeping the two in lock-step avoids a size/ink mismatch. */
export function isCreoleHrLine(line: string): boolean {
  return classifyStripeLine(line).type === 'HORIZONTAL_LINE';
}

/** Text-block height: each display line contributes one `lineH`, except creole
 *  horizontal rules which contribute the thinner `CREOLE_HR_HEIGHT` (S1L-b) —
 *  matching upstream's `UHorizontalLine`-carrying stripe, which draws a rule
 *  instead of a glyph line. */
export function textBlockHeight(display: string, lineH: number): number {
  let h = 0;
  for (const ln of display.split('\n')) {
    h += isCreoleHrLine(ln) ? CREOLE_HR_HEIGHT : lineH;
  }
  return h;
}

/** Base `FontConfiguration` built from a `FontSpec` solely to drive
 *  `buildLineAtoms`' tag-stripping (creole-lexer-unification ADR-3): family
 *  + size carry over, styles start empty, color is the jar's default text
 *  fill. No font FIDELITY is needed here — width is font-agnostic in the
 *  deterministic width table (S1L-b ADR-2), so this shim only needs to be
 *  well-formed, not visually accurate. */
export function baseFontConfiguration(fontSpec: FontSpec): FontConfiguration {
  return { family: fontSpec.family, size: fontSpec.size, color: JAR_DEFAULT_TEXT_COLOR, styles: new Set() };
}

/** Visible (glyph-bearing) text of a creole line: routes through the SAME
 *  shared "line -> visible atoms" lexer the renderer draws with
 *  (`StripeSimple.ts#buildLineAtoms`, creole-lexer-unification ADR-1) rather
 *  than the separate `parseCreole` lexer this sizer used to call — the two
 *  disagreed on unclosed/`:`-variant tags, sizing wider than the renderer's
 *  actual ink. Concatenating every `'text'`-kind atom's own text mirrors what
 *  the renderer actually draws as glyphs. `'inline'` (`<img>`/`<$sprite>`)
 *  and `'latex'` atoms are recognized (and consumed) by the same unified
 *  scan and so are NOT part of the returned text — their own width is
 *  restored separately by `inlineAtomWidth` below (D9 parity: the shared
 *  lexer's atom recognition must not silently drop an `<img>`/`<$sprite>`
 *  atom's width the way a plain text-only concatenation would). The
 *  deterministic `WidthTableMeasurer` is weight-agnostic (bold == normal
 *  advance widths), so summing plain text at the base font is exact against
 *  the oracle. */
export function creoleVisibleText(line: string, fontSpec: FontSpec): string {
  const built = buildLineAtoms(line, baseFontConfiguration(fontSpec));
  let text = '';
  for (const atom of built.atoms) {
    if (atom.kind === 'text') text += atom.text;
  }
  return text;
}

/** Sum of every `'inline'`-kind atom's own scaled width on one display line
 *  (D9) — the shared lexer (`buildLineAtoms`) recognizes `<img>`/`<$sprite>`
 *  markup and carves it OUT of `creoleVisibleText`'s returned text (unlike
 *  the pre-ADR-1 `parseCreole` output, whose untouched markup let
 *  `measureLineWithAtoms`'s own regex re-detect and add it), so this restores
 *  that width contribution directly from the already-parsed atom list, via
 *  the SAME `measureInlineAtom` (`creole-atoms.ts`) the renderer's own
 *  `measureAtomsWidthHeight` sums — drawn and measured width agree. Returns 0
 *  for any atom-free line (`built.atoms` then carries no `'inline'` entry). */
export function inlineAtomWidth(line: string, fontSpec: FontSpec, sprites: SpriteDimsLookup | undefined): number {
  const built = buildLineAtoms(line, baseFontConfiguration(fontSpec));
  let width = 0;
  for (const atom of built.atoms) {
    if (atom.kind === 'inline') width += measureInlineAtom(atom.atom, sprites, fontSpec.size).width;
  }
  return width;
}

/** Width of the widest display line, measured per line (not the whole
 *  string). Creole formatting tags are resolved away first (S1L-b ADR-2 —
 *  see `creoleVisibleText`); `<U+XXXX>`/`&#NNN;` escapes are ALSO already
 *  decoded by `creoleVisibleText` (it now shares the renderer's lexer,
 *  creole-lexer-unification ADR-1, which decodes internally per-line —
 *  no separate outer `resolveTextEscapes` pass needed here anymore, unlike
 *  pre-ADR-1). `measureLineWithAtoms` (`creole-atoms.ts`) still runs its own
 *  atom-aware scan over that (now atom-markup-free) text — a no-op scan, so
 *  it is a zero-diff drop-in for `measurer.measure(ln, fontSpec).width` —
 *  `inlineAtomWidth` (D9) adds back each line's own `<img>`/`<$sprite>`
 *  contribution the shared lexer already carved out of `ln`. */
export function maxLineWidth(
  display: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites?: SpriteDimsLookup,
): number {
  let max = 0;
  for (const raw of display.split('\n')) {
    // Classification/HR detection (inside `creoleVisibleText`) still runs on
    // the RAW, still-`<U+XXXX>`-encoded line, in lock-step with the sizer's
    // own `isCreoleHrLine` and the renderer's `buildLine` — the sizer↔
    // renderer sync invariant.
    const ln = creoleVisibleText(raw, fontSpec);
    const w = measureLineWithAtoms(ln, fontSpec, measurer, sprites).width + inlineAtomWidth(raw, fontSpec, sprites);
    if (w > max) max = w;
  }
  return max;
}

/** Sum of `lineAtomHeightExcess` over every line of `display` — 0 for any
 *  atom-free display, so every caller above ADDS this to (never replaces)
 *  its existing `lineCount(display) * lineHeight` uniform-height formula. */
export function atomHeightBonus(display: string, fontSpec: FontSpec, sprites: SpriteDimsLookup | undefined): number {
  let bonus = 0;
  for (const ln of display.split('\n')) bonus += lineAtomHeightExcess(ln, fontSpec, sprites);
  return bonus;
}