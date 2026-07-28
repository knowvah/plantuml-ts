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
  type SpriteDimsLookup,
} from '../../core/creole-atoms.js';
import {
  measureInlineAtom,
  lineAtomHeightExcess,
} from '../../core/creole-atoms-measure.js';
import { classifyStripeLine } from '../../core/klimt/creole/legacy/CreoleStripeSimpleParser.js';
import { buildLineAtoms } from '../../core/klimt/creole/legacy/StripeSimple.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { JAR_DEFAULT_TEXT_COLOR } from './renderer-symbol.js';
import { getSplitted } from '../../core/klimt/creole/Fission.js';
import { manageGuillemet, type GuillemetPair } from '../../core/text/Guillemet.js';
import { spriteScale } from '../../core/creole-atoms-measure.js';
import type { InlineAtomToken } from '../../core/creole-atoms.js';
import { textFootprintBox, type FootprintBox } from './usecase-footprint.js';

/** Number of display lines (upstream text block splits on hard newlines).
 *  An EMPTY display has NO lines, not one blank one: `node C [ ]` draws a box
 *  of pure margin, 30px tall against our 44px when the empty body was billed
 *  a 14px line (balomu-94-kegi822 / xocodo-09-nuxi647, S1L-e). A display of
 *  one SPACE is still a line — only zero length is empty. */
export function lineCount(display: string): number {
  return display === '' ? 0 : display.split('\n').length;
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

/**
 * Per-line text metrics, measured atom-by-atom at each atom's OWN font — the
 * same fonts the leaf renderer draws with, because both come from the one
 * shared `buildLineAtoms` lexer (creole-lexer-unification ADR-1). That lexer
 * already bakes in BOTH font cascades: a `==heading` line's
 * `fontConfigurationForHeading` (order 0 -> +4, 1 -> +2, 2 -> +1,
 * `StripeSimple.ts`:271) and any inline `<size:N>` command.
 *
 * The sizer previously concatenated every text atom and measured the result
 * at the BASE font. That is exact only while every atom shares the base size
 * — true for plain lines, wrong for a heading or a `<size:N>` run, which the
 * renderer drew bigger/smaller than the box reserved. Same sizer<->renderer
 * divergence family as the creole lexer and wrapWidth (S1L-f:
 * nenedo-78-fiva569 needs 16px for `==label` and 12px for
 * `//<size:12>[technology]</size>//`).
 */
function lineTextMetrics(
  line: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  guillemet?: GuillemetPair,
  defaultFont?: FontSpec,
): { width: number; height: number } {
  const built = buildLineAtoms(
    manageGuillemet(line, guillemet),
    baseFontConfiguration(fontSpec),
    defaultFont === undefined ? undefined : baseFontConfiguration(defaultFont),
  );
  let width = 0;
  let height = 0;
  for (const atom of built.atoms) {
    if (atom.kind !== 'text') continue;
    const size = atom.font.size;
    width += measurer.measure(atom.text, { ...fontSpec, size }).width;
    if (size > height) height = size;
  }
  return { width, height: height === 0 ? built.lineFont.size : height };
}

/** Text-block height: each display line contributes its own tallest text-atom
 *  font (headings and `<size:N>` runs differ from the base — see
 *  `lineTextMetrics`), except creole horizontal rules which contribute the
 *  thinner `CREOLE_HR_HEIGHT` (S1L-b), matching upstream's
 *  `UHorizontalLine`-carrying stripe. `fontSpec`/`measurer` are optional so
 *  the pre-existing uniform-`lineH` callers keep their exact behavior when
 *  they have no font in scope. */
export function textBlockHeight(
  display: string,
  lineH: number,
  fontSpec?: FontSpec,
  measurer?: StringMeasurer,
  guillemet?: GuillemetPair,
  defaultFont?: FontSpec,
): number {
  if (display === '') return 0; // see `lineCount` — an empty body has no lines
  let h = 0;
  for (const ln of display.split('\n')) {
    if (isCreoleHrLine(ln)) {
      h += CREOLE_HR_HEIGHT;
      continue;
    }
    h +=
      fontSpec === undefined || measurer === undefined
        ? lineH
        : lineTextMetrics(ln, fontSpec, measurer, guillemet, defaultFont).height;
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
  guillemet?: GuillemetPair,
  defaultFont?: FontSpec,
): number {
  let max = 0;
  for (const raw of display.split('\n')) {
    // Classification/HR detection (inside `creoleVisibleText`) still runs on
    // the RAW, still-`<U+XXXX>`-encoded line, in lock-step with the sizer's
    // own `isCreoleHrLine` and the renderer's `buildLine` — the sizer↔
    // renderer sync invariant.
    const w =
      lineTextMetrics(raw, fontSpec, measurer, guillemet, defaultFont).width +
      inlineAtomWidth(raw, fontSpec, sprites);
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
/** Per-atom width for `getSplitted`'s `measureAtomWidth` callback — the
 *  sizer's mirror of the renderer's `measureSingleAtomWidth`
 *  (`EntityImageDescriptionSupport.ts`), so the two agree on every break
 *  position. `latex` atoms return 0 here for the same reason
 *  `creoleVisibleText` drops them: this sizer measures LaTeX through
 *  `measureNodeLabel`, not the atom stream (it is a named inherent-tolerance
 *  DIVERGENCE either way). */
function atomWidth(
  atom: { kind: string; text?: string; atom?: never },
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites: SpriteDimsLookup | undefined,
): number {
  const a = atom as unknown as { kind: string; text: string; atom: Parameters<typeof measureInlineAtom>[0] };
  if (a.kind === 'text') return measurer.measure(a.text, fontSpec).width;
  if (a.kind === 'inline') return measureInlineAtom(a.atom, sprites, fontSpec.size).width;
  return 0;
}

/**
 * Width + height of a display text block, word-wrapped at `maxWidth` when
 * that is > 0 (`skinparam wrapWidth`).
 *
 * Wrapping routes through the SAME `Fission.ts#getSplitted` the leaf
 * RENDERER already used (`EntityImageDescriptionSupport.ts
 * #buildWrappedLines`) — this sizer simply never called it, so a wrapped
 * diagram measured its boxes at the unwrapped single-line width while the
 * renderer drew them wrapped. Reusing the one implementation (rather than
 * re-deriving the break positions here) is what keeps the two in lock-step,
 * the same invariant `creoleVisibleText` maintains for the lexer.
 *
 * A `HORIZONTAL_LINE` line is never wrapped, matching `buildWrappedLines`
 * (upstream's `CreoleHorizontalLine` stripe carries no text atoms for
 * `Fission` to split).
 *
 * `maxWidth === 0` (the default — upstream sets no `PName.MaximumWidth`
 * anywhere) delegates to the pre-existing unwrapped helpers unchanged, so
 * this is a zero-diff drop-in for every diagram that does not set the
 * skinparam.
 */
export function measureTextBlock(
  display: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites: SpriteDimsLookup | undefined,
  opts: { lineH: number; maxWidth: number; guillemet?: GuillemetPair; defaultFont?: FontSpec },
): { width: number; height: number } {
  const { lineH, maxWidth, guillemet, defaultFont } = opts;
  if (maxWidth <= 0) {
    return {
      width: maxLineWidth(display, fontSpec, measurer, sprites, guillemet, defaultFont),
      height:
        textBlockHeight(display, lineH, fontSpec, measurer, guillemet, defaultFont) +
        atomHeightBonus(display, fontSpec, sprites),
    };
  }
  let width = 0;
  let height = 0;
  for (const raw of display.split('\n')) {
    if (isCreoleHrLine(raw)) {
      height += CREOLE_HR_HEIGHT;
      continue;
    }
    const built = buildLineAtoms(manageGuillemet(raw, guillemet), baseFontConfiguration(fontSpec));
    const subs = getSplitted(built.atoms, maxWidth, (a) => atomWidth(a as never, fontSpec, measurer, sprites));
    for (const sub of subs) {
      let w = 0;
      for (const a of sub) w += atomWidth(a as never, fontSpec, measurer, sprites);
      if (w > width) width = w;
      height += lineH;
    }
    height += atomHeightBonus(raw, fontSpec, sprites);
  }
  return { width, height };
}

/**
 * The `Footprint` boxes a display contributes, in block coordinates — the
 * input to `usecase-footprint.ts#containingEllipse`.
 *
 * Lines stack by their DECLARED heights and are centred horizontally within
 * the block (`HorizontalAlignment.CENTER`), matching how the block draws.
 * Within a line, atoms advance left to right; a text run records the
 * baseline-shifted box `Footprint#drawText` computes, while a sprite records
 * its INK box at its own offset inside the declared advance (`drawPath`).
 */
export function footprintBoxes(
  display: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites: SpriteDimsLookup | undefined,
  blockWidth: number,
): FootprintBox[] {
  const out: FootprintBox[] = [];
  let y = 0;
  for (const raw of display.split('\n')) {
    if (isCreoleHrLine(raw)) {
      y += CREOLE_HR_HEIGHT;
      continue;
    }
    const built = buildLineAtoms(raw, baseFontConfiguration(fontSpec));
    const lineW = lineTextMetrics(raw, fontSpec, measurer).width + inlineAtomWidth(raw, fontSpec, sprites);
    const lineH = Math.max(
      lineTextMetrics(raw, fontSpec, measurer).height,
      ...built.atoms.map((a) =>
        a.kind === 'inline' ? measureInlineAtom(a.atom, sprites, fontSpec.size).height : 0,
      ),
    );
    let x = (blockWidth - lineW) / 2;
    for (const atom of built.atoms) {
      if (atom.kind === 'text') {
        const w = measurer.measure(atom.text, { ...fontSpec, size: atom.font.size }).width;
        out.push(textFootprintBox(x, y, w, atom.font.size));
        x += w;
        continue;
      }
      if (atom.kind !== 'inline') continue;
      const dims = measureInlineAtom(atom.atom, sprites, fontSpec.size);
      out.push(inlineFootprintBox(atom.atom, dims, sprites, fontSpec.size, x, y));
      x += dims.width;
    }
    y += lineH;
  }
  return out;
}

/** A sprite's ink box at its drawn position; a non-SVG atom inks its whole
 *  declared box (it draws as one image, `Footprint#drawImage`). */
function inlineFootprintBox(
  atom: InlineAtomToken,
  dims: { width: number; height: number },
  sprites: SpriteDimsLookup | undefined,
  ambientFontSize: number,
  x: number,
  y: number,
): FootprintBox {
  if (atom.kind !== 'sprite') return { x, y, width: dims.width, height: dims.height };
  const reg = sprites?.get(atom.name);
  if (reg?.inkWidth === undefined || reg.inkHeight === undefined) {
    return { x, y, width: dims.width, height: dims.height };
  }
  const s = spriteScale(atom.scale, ambientFontSize);
  return {
    x: x + (reg.inkX ?? 0) * s,
    y: y + (reg.inkY ?? 0) * s,
    width: reg.inkWidth * s,
    height: reg.inkHeight * s,
  };
}
