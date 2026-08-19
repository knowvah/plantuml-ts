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

import type { StringMeasurer, FontSpec } from '../../measurer.js';
import {
  type SpriteDimsLookup,
} from '../../creole-atoms.js';
import {
  measureInlineAtom,
  lineAtomHeightExcess,
} from '../../creole-atoms-measure.js';
import { classifyStripeLine } from '../../klimt/creole/legacy/CreoleStripeSimpleParser.js';
import { buildLineAtoms } from '../../klimt/creole/legacy/StripeSimple.js';
import { getFont, type FontConfiguration } from '../../klimt/shape/UText.js';
import type { CreoleAtom } from '../../klimt/creole/atom/Atom.js';
import { emojiSquareDim } from '../../klimt/creole/atom/AtomEmoji.js';
import { ATOM_TEXT_MIN_HEIGHT, layoutLineThroughSea, measurerSeaLineOps } from './creole-sea-line.js';
import { JAR_DEFAULT_TEXT_COLOR } from '../../decoration/symbol/usymbol-resolve.js';
import { getSplitted } from '../../klimt/creole/Fission.js';
import { manageGuillemet, type GuillemetPair } from '../../text/Guillemet.js';

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
  // sizer-footprint-parity T2 (ADR-1): `buildLineAtoms` no longer accepts a
  // default-font 3rd argument (its `<img>` cannot-decode fallback font is
  // hardcoded, `IMG_FALLBACK_FONT`) -- T1 confirmed no caller's font ever
  // reached it. `_defaultFont` stays as a parameter here (not removed) only
  // because `textBlockHeight`/`maxLineWidth` (this file, still threading it
  // from a T3-owned mechanism, `leaf-sizing-legacy-fallback.ts`'s module doc
  // comment) keep passing it positionally; it is never forwarded further.
  _defaultFont?: FontSpec,
): { width: number; height: number } {
  const built = buildLineAtoms(manageGuillemet(line, guillemet), baseFontConfiguration(fontSpec));
  let width = 0;
  let height = 0;
  for (const atom of built.atoms) {
    if (atom.kind !== 'text') continue;
    // SI30 D1: the EFFECTIVE size — `fontConfiguration.getFont()`
    // (`FontConfiguration.java:98-104`) mutes a `<sup>`/`<sub>` run by 3
    // points before either `AtomText#calculateDimensionSlow` (java:176) or
    // `#drawU` (java:213) sees it. Identical to `atom.font.size` for every
    // NORMAL run, which is why no measured box moves for plain text.
    const size = getFont(atom.font).size;
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
  // #lizard forgives -- pre-existing 6-PARAM violation (T1 confirmed via
  // `git show HEAD` lizard run before this task's own edits: unchanged by
  // sizer-footprint-parity T2, which only removed a dead 3rd `buildLineAtoms`
  // argument elsewhere in this file).
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

// ---------------------------------------------------------------------------
// `Sea`-placed line layout (SI30 T3, `decisions.md#D2`) — the seam the CLASS
// engine's member/note text consumes.
// ---------------------------------------------------------------------------

/** One atom's resolved font/placement on its line. Parallel to
 *  {@link LeafTextLineLayout.atoms}, so a caller that already has the atom
 *  list (every class text path builds it with `buildLineAtoms`) can index
 *  straight into it. */
export interface LeafTextAtomPlacement {
  /** The atom's EFFECTIVE font size: `getFont(atom.font).size` for a text
   *  atom (`FontConfiguration.java:98-104` — muted by 3 for `<sup>`/`<sub>`,
   *  unchanged for NORMAL), and the ambient size for a non-text atom, which
   *  is what scales it (`creole-atoms-measure.ts#measureInlineAtom`). */
  readonly size: number;
  /** Baseline offset from the line's NORMAL baseline (`Sea`): draw at
   *  `lineTop + height - atom.font.size/4.5 + dy`, the formula
   *  `class/renderer-note.ts:263` already uses plus this correction. 0 for
   *  every atom of an all-NORMAL line, and for non-text atoms (which have
   *  no baseline — their box IS their placement). */
  readonly dy: number;
}

/** One creole line's `Sea` geometry (`SheetBlock1.java:130-152`). */
export interface LeafTextLineLayout {
  /** `buildLineAtoms`' own atom sequence, in source order. */
  readonly atoms: readonly CreoleAtom[];
  /** Parallel to {@link atoms}. */
  readonly placements: readonly LeafTextAtomPlacement[];
  /** `Sea#getWidth` — the x-cursor sum over EVERY atom, text and inline
   *  alike (i.e. `lineTextMetrics().width + inlineAtomWidth()` in one). */
  readonly width: number;
  /** `Sea#getHeight` — grows for a raised `<sup>` or a hanging emoji. */
  readonly height: number;
}

/** `Atom#calculateDimension` for this seam: the measurer's own box at the
 *  atom's EFFECTIVE font, floored at `AtomText#calculateDimensionSlow`'s own
 *  10px (`AtomText.java:178-179`). Tab stops (`AtomText.java:239-256`) are
 *  deliberately absent — no class/description text path has ever measured
 *  them (only the state seam, `creole-text-lines.ts#runTextWidth`, ports
 *  that loop), and adding one here would move boxes this task must leave
 *  byte-identical. */
function leafAtomDim(
  atom: CreoleAtom,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites: SpriteDimsLookup | undefined,
): { width: number; height: number } {
  if (atom.kind === 'text') {
    const dim = measurer.measure(atom.text, { ...fontSpec, size: getFont(atom.font).size });
    return { width: dim.width, height: Math.max(dim.height, ATOM_TEXT_MIN_HEIGHT) };
  }
  if (atom.kind === 'inline') return measureInlineAtom(atom.atom, sprites, fontSpec.size);
  // `AtomEmoji#calculateDimensionSlow` VERBATIM (`AtomEmoji.java:57-59`) —
  // the square, never `emojiBoxDim`'s pre-combined line height: `Sea`
  // derives the hang from the atom's own altitude (`AtomEmoji.ts`).
  if (atom.kind === 'emoji') return emojiSquareDim(atom.factor);
  // `latex` is measured through a separate LaTeX path, not this atom stream
  // — the same divergence `creoleVisibleText` below already documents.
  return { width: 0, height: 0 };
}

/**
 * One display line's atoms, laid out through the real `Sea`
 * (`SheetBlock1.java:130-152` with the stripe's stacking `y` at 0) — the
 * per-atom `{size, dy}` + line height the CLASS engine's member and note
 * text draw with (SI30 `decisions.md#D2/#D3`).
 *
 * Additive: no pre-existing export changes behavior, and for an all-NORMAL
 * line every `dy` is 0 and every `size` is the size that path already used,
 * so a consumer adopting this reproduces its current output exactly.
 */
export function leafTextLineLayout(
  line: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites?: SpriteDimsLookup,
  guillemet?: GuillemetPair,
): LeafTextLineLayout {
  const built = buildLineAtoms(manageGuillemet(line, guillemet), baseFontConfiguration(fontSpec));
  const layout = layoutLineThroughSea(
    built.atoms,
    measurerSeaLineOps(fontSpec, measurer, (atom) => leafAtomDim(atom, fontSpec, measurer, sprites)),
  );
  const placements = built.atoms.map((atom, i) => ({
    size: atom.kind === 'text' ? getFont(atom.font).size : fontSpec.size,
    dy: layout.dy[i] as number,
  }));
  return { atoms: built.atoms, placements, width: layout.width, height: layout.height };
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
  // #lizard forgives -- pre-existing 6-PARAM violation (T1 confirmed via
  // `git show HEAD` lizard run before this task's own edits; unchanged by
  // sizer-footprint-parity T2).
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
  // #lizard forgives -- pre-existing violation (T1 confirmed via `git show
  // HEAD` lizard run before this task's own edits; unchanged by
  // sizer-footprint-parity T2).
}

