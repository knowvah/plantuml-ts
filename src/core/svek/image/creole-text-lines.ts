/**
 * creole-text-lines — the ONE core creole-text seam shared by the state
 * sizer (T6) and the state renderer (T7), per `plans/state-declared-size-fix/
 * decisions.md#D1`.
 *
 * SI28 found the state engine measures every text line RAW while the jar
 * routes it through `Display.create8(fc, align, skinParam, CreoleMode.FULL,
 * wrapWidth)` (`EntityImageStateCommon.java:80-81` for the name,
 * `EntityImageState.java:98-99` for the body). `create8` ultimately builds a
 * `Sheet` of `Stripe`s of `Atom`s (`Display.java:262-346` splits into
 * physical lines first) — the FULL `Sheet`/`SheetBlock1` pipeline is too
 * large to port for this fix mission (D1's own rejected-alternatives note),
 * so this seam builds on the pieces this port ALREADY has, unified for
 * description (`leaf-sizing-text.ts`) and class members
 * (`diagrams/class/class-member-creole.ts`, shape reference only — `core/`
 * must not depend on `diagrams/class`, D8):
 *
 * - Physical-line splitting: a literal `display.split('\n')`, matching every
 *   sibling call site in this port (`leaf-sizing-text.ts#lineCount`,
 *   `state-note-layout.ts:87`) — NOT `klimt/creole/DisplayNewlines.ts
 *   #splitDisplayLines` (`Display#getWithNewlines`, `Display.java:262-346`):
 *   that function splits on the two-character ESCAPE sequence `\n`
 *   (backslash then `n`) and the Jaws sentinel chars, not a literal 0x0A
 *   newline — verified empirically (this module's own test, "two physical
 *   lines" case) after the mission brief's read-set named it for this job.
 *   By the time a `Display` reaches `create8` upstream, physical-line
 *   splitting has ALREADY happened at PARSE time (`Display` is a
 *   `List<CharSequence>`, one entry per source line); this port's own
 *   convention instead joins those lines with a real `\n` before handing a
 *   single string to a layout-time sizer, so splitting on that same
 *   character here is what reproduces the SAME physical-line boundaries.
 * - Table-row priority: `CreoleParser.java:91-100` checks `isTableLine`
 *   BEFORE a line ever reaches the HR/heading/literal classifier — ported
 *   locally below (`CreoleParser.java:117,121-122`) since `core/creole-
 *   table.ts#isTableLine`'s regex is a different, looser engine's own rule
 *   (no trailing-`|` requirement), not this one.
 * - Classification + flat atom sequence: `klimt/creole/legacy/StripeSimple.ts
 *   #buildLineAtoms` (ADR-1 of creole-lexer-unification — the SAME lexer the
 *   description renderer draws with).
 * - Tab stops: `klimt/creole/legacy/AtomText.ts` (`AtomText.java:183-275`) —
 *   its `atomTextWidth` hardcodes the upstream-reachable `nb=8` tabString;
 *   this seam's `opts.tabSize` generalizes over `FontConfiguration
 *   .getTabSize()` (`AtomText.java:270-275`, `SkinParam.java:1073` default
 *   8), so `tokenizeOnTabs`/`tabString` are re-derived locally (small, pure,
 *   not exported by that out-of-write-set file — see each helper's own doc).
 * - Word-wrap: `klimt/creole/Fission.ts#getSplitted` (`Fission.java`).
 *
 * Not ported here (flagged in T1's report, not silently dropped): `<math>`/
 * `<sup>`/`<sub>` markup. `CommandCreoleBuilder.java:104-105,111` registers
 * `CommandCreoleExposantChange`/`CommandCreoleMath`; this port's
 * `CommandCreoleBuilder.ts` never added either (an undocumented gap, not a
 * journaled deferral) — out of this write-set to add. Such markup therefore
 * measures as LITERAL, tag-inclusive text (no command recognizes it, so
 * `StripeSimple.ts#modifyStripe`'s fallthrough accumulates it verbatim).
 */
import type { FontSpec, StringMeasurer } from '../../measurer.js';
import type { SpriteDimsLookup } from '../../creole-atoms.js';
import { measureInlineAtom } from '../../creole-atoms-measure.js';
import { emojiBoxDim } from '../../klimt/creole/atom/AtomEmoji.js';
import type { CreoleAtom } from '../../klimt/creole/atom/Atom.js';
import { FontStyle } from '../../klimt/shape/UText.js';
import { buildLineAtoms } from '../../klimt/creole/legacy/StripeSimple.js';
import {
  hasTabulation,
  tabStopWidth,
  advanceToTabStop,
  BLOCK_E1_REAL_TABULATION,
  TAB_STRING,
} from '../../klimt/creole/legacy/AtomText.js';
import { getSplitted } from '../../klimt/creole/Fission.js';
import { JAR_DEFAULT_TEXT_COLOR } from '../../decoration/symbol/usymbol-resolve.js';
import { baseFontConfiguration, CREOLE_HR_HEIGHT } from './leaf-sizing-text.js';

// ---------------------------------------------------------------------------
// Public shape (locked — `plans/state-declared-size-fix/batch-1/overview.md`)
// ---------------------------------------------------------------------------

/** Bold/italic/underline/strike — the four style flags a `CreoleTextRun`
 *  reports for the RENDERER to draw with (`FontConfiguration.styles` also
 *  carries WAVE/BACKCOLOR/PLAIN, klimt/font/FontStyle.java's full 7-value
 *  enum; this seam's contract narrows to the four the locked interface
 *  names). */
export interface FontStyleFlags {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strike: boolean;
}

export interface CreoleTextRun {
  readonly text: string;
  readonly style: FontStyleFlags;
  readonly color?: string;
  readonly url?: string;
}

export interface CreoleTextLine {
  readonly runs: readonly CreoleTextRun[];
  readonly width: number;
  readonly height: number;
  readonly kind: 'text' | 'hr' | 'table-row';
}

const NO_STYLE: FontStyleFlags = { bold: false, italic: false, underline: false, strike: false };

/** `AtomText#calculateDimensionSlow`'s own floor (`AtomText.java:178-179`:
 *  `if (h < 10) h = 10`) — applied to every TEXT run's own measured height. */
const ATOM_TEXT_MIN_HEIGHT = 10;

/** `SkinParam#getTabSize` default (`SkinParam.java:1073`,
 *  `getAsInt("tabsize", 8)`). */
const DEFAULT_TAB_SIZE = 8;

/** Bundles the per-call measurement context (font/measurer/tabSize/sprites)
 *  so no helper below needs more than a couple of positional params — this
 *  project's 5-param-per-function complexity ceiling otherwise trips once
 *  atom-kind dispatch, tab stops, AND sprite lookup all need to reach the
 *  same leaf function. */
interface MeasureCtx {
  readonly font: FontSpec;
  readonly measurer: StringMeasurer;
  readonly tabSizeNb: number;
  readonly sprites: SpriteDimsLookup | undefined;
}

// ---------------------------------------------------------------------------
// Table-row classification (`CreoleParser.java:91-100,117,121-122`) — tried
// BEFORE the HR/heading/literal classifier, matching upstream's own
// `createStripes` dispatch order.
// ---------------------------------------------------------------------------

/** Source-string built, never a `/regex/` literal — `<`/`>`/`{`/`}` inside a
 *  regex literal desyncs lizard's brace-depth tracker (`creole-atoms.ts`'s
 *  own precedent). `CreoleParser.java:117`:
 *  `"^(\\<#\\w+(,#?\\w+)?\\>)?\\|(\\=)?.*\\|$"`. */
const TABLE_LINE_PATTERN_SOURCE = '^(<#\\w+(,#?\\w+)?>)?\\|(=)?.*\\|$';

function isTableLine(line: string): boolean {
  return new RegExp(TABLE_LINE_PATTERN_SOURCE).test(line);
}

/** A table-row line is not run through the creole style engine here — T7
 *  owns per-cell parsing (mirroring `core/creole-table.ts#parseTableRow`'s
 *  `|`-split, or a future `StripeTable` port). This seam reports the RAW
 *  line as one unstyled run (so T7 can re-split it) plus its whole-line
 *  measured box, matching every other `kind` line's width/height contract. */
function tableRowLine(raw: string, ctx: MeasureCtx): CreoleTextLine {
  const dim = ctx.measurer.measure(raw, ctx.font);
  return {
    runs: [{ text: raw, style: NO_STYLE, color: JAR_DEFAULT_TEXT_COLOR }],
    width: dim.width,
    height: Math.max(dim.height, ATOM_TEXT_MIN_HEIGHT),
    kind: 'table-row',
  };
}

// ---------------------------------------------------------------------------
// Tab-stop width (`AtomText.java:183-275`) — generalized over an explicit
// `nb` (`FontConfiguration.getTabSize()`), since `AtomText.ts`'s own
// `atomTextWidth` only ever reaches the port-wide-constant `nb=8` path (its
// own doc comment) and is out of this task's write-set to extend.
// ---------------------------------------------------------------------------

/** `AtomText#tabString` (`AtomText.java:258-264`): `substring(0, nb)` for
 *  `1 <= nb < 7`, else the full 8 spaces. */
function tabStringFor(nb: number): string {
  return nb >= 1 && nb < 7 ? TAB_STRING.slice(0, nb) : TAB_STRING;
}

interface TabToken {
  readonly text: string;
  readonly isTab: boolean;
}

/** `StringTokenizer(text, "\t" + Jaws.BLOCK_E1_REAL_TABULATION, true)`
 *  (`AtomText.java:242,210`) — a local port of `AtomText.ts`'s own private
 *  `tokenizeOnTabs` (not exported; that file is out of T1's write-set). */
function splitOnTabChars(text: string): readonly TabToken[] {
  const tokens: TabToken[] = [];
  let pending = '';
  for (const ch of text) {
    if (ch !== '\t' && ch !== BLOCK_E1_REAL_TABULATION) {
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

/** `AtomText#calculateDimensionSlow`'s tab-free short-circuit
 *  (`AtomText.java:183-184`) + `#getWidth`'s tokenizer/advance loop
 *  (`AtomText.java:239-256`) + `#getTabSize` (`AtomText.java:270-275`, via
 *  the imported {@link tabStopWidth}). Reports only the run's TOTAL width —
 *  matching `getWidth`'s own return contract, not `drawU`'s SEPARATE
 *  per-token positioning walk (`AtomText.java:210-233`); a renderer drawing
 *  a tabbed run must re-tokenize (`splitOnTabChars`) for per-token x, the
 *  same two-method split upstream itself has. */
function runTextWidth(text: string, fontSize: number, tabSizeNb: number, measure: (s: string) => number): number {
  if (!hasTabulation(text)) return measure(text);
  const tabStop = tabStopWidth(measure(tabStringFor(tabSizeNb)), fontSize);
  let x = 0;
  for (const token of splitOnTabChars(text)) {
    x = token.isTab ? advanceToTabStop(x, tabStop) : x + measure(token.text);
  }
  return x;
}

// ---------------------------------------------------------------------------
// Atom -> run/width/height
// ---------------------------------------------------------------------------

function styleFlagsFromSet(styles: ReadonlySet<FontStyle>): FontStyleFlags {
  return {
    bold: styles.has(FontStyle.BOLD),
    italic: styles.has(FontStyle.ITALIC),
    underline: styles.has(FontStyle.UNDERLINE),
    strike: styles.has(FontStyle.STRIKE),
  };
}

interface AtomMeasured {
  readonly run: CreoleTextRun | null;
  readonly width: number;
  readonly height: number;
}

/** A `'text'` atom's run + width/height. Measurement uses the CALLER's own
 *  `font` with only `size` overridden to the atom's own (possibly heading-
 *  /`<size:N>`-cascaded) size — mirrors `leaf-sizing-text.ts#lineTextMetrics`'s
 *  `{ ...fontSpec, size }` precedent, NOT `class-member-creole.ts
 *  #atomFontSpec`'s weight/italic re-derivation: this port's deterministic
 *  width table is weight-agnostic (`leaf-sizing-text.ts#creoleVisibleText`'s
 *  own doc comment — bold measures identically to normal), so `run.style`
 *  (this seam's `FontStyleFlags`) is the renderer's ONLY source of bold/
 *  italic/underline/strike, kept separate from the measurement `FontSpec`. */
function textAtomMeasured(atom: Extract<CreoleAtom, { kind: 'text' }>, ctx: MeasureCtx): AtomMeasured {
  const runFont: FontSpec = { ...ctx.font, size: atom.font.size };
  const width = runTextWidth(atom.text, atom.font.size, ctx.tabSizeNb, (s) => ctx.measurer.measure(s, runFont).width);
  const height = Math.max(ctx.measurer.measure(atom.text, runFont).height, ATOM_TEXT_MIN_HEIGHT);
  const run: CreoleTextRun = {
    text: atom.text,
    style: styleFlagsFromSet(atom.font.styles),
    ...(atom.font.color !== null ? { color: atom.font.color } : {}),
    ...(atom.url !== undefined ? { url: atom.url.url } : {}),
  };
  return { run, width, height };
}

/** One `CreoleAtom`'s run (`null` for a non-text atom — see this module's
 *  doc comment: the locked `CreoleTextRun` shape carries no image/sprite/
 *  emoji variant) plus its width/height contribution. `'inline'`
 *  (img/sprite): D9's `measureInlineAtom` (`creole-atoms-measure.ts`).
 *  `'emoji'`: `AtomEmoji#calculateDimensionSlow`/box height
 *  (`AtomEmoji.java:57-64`, via {@link emojiBoxDim}). `'latex'`: measured
 *  through a separate LaTeX-rendering path elsewhere, not this atom stream —
 *  the SAME documented divergence `leaf-sizing-text.ts#creoleVisibleText`
 *  already carries for the description engine; 0/0 here. */
function atomMeasured(atom: CreoleAtom, ctx: MeasureCtx): AtomMeasured {
  if (atom.kind === 'text') return textAtomMeasured(atom, ctx);
  if (atom.kind === 'inline') {
    const dims = measureInlineAtom(atom.atom, ctx.sprites, ctx.font.size);
    return { run: null, width: dims.width, height: dims.height };
  }
  if (atom.kind === 'emoji') {
    const dims = emojiBoxDim(atom.factor);
    return { run: null, width: dims.width, height: dims.height };
  }
  return { run: null, width: 0, height: 0 };
}

function atomsToLine(atoms: readonly CreoleAtom[], ctx: MeasureCtx): CreoleTextLine {
  const runs: CreoleTextRun[] = [];
  let width = 0;
  let height = 0;
  for (const atom of atoms) {
    const measured = atomMeasured(atom, ctx);
    if (measured.run !== null) runs.push(measured.run);
    width += measured.width;
    if (measured.height > height) height = measured.height;
  }
  return { runs, width, height, kind: 'text' };
}

// ---------------------------------------------------------------------------
// Physical line -> one or more CreoleTextLine (word-wrap fans one line out)
// ---------------------------------------------------------------------------

function buildPhysicalLine(raw: string, ctx: MeasureCtx, wrapWidth: number): readonly CreoleTextLine[] {
  if (isTableLine(raw)) return [tableRowLine(raw, ctx)];

  // ADR-1 (creole-lexer-unification): the SAME lexer the description
  // renderer draws with — sizer<->renderer lock-step by construction (D1).
  const built = buildLineAtoms(raw, baseFontConfiguration(ctx.font));
  if (built.classification.type === 'HORIZONTAL_LINE') {
    return [{ runs: [], width: 0, height: CREOLE_HR_HEIGHT, kind: 'hr' }];
  }

  // `Fission#getSplitted` never wraps an HR (handled above); every other
  // classification wraps identically (`leaf-sizing-text.ts#measureTextBlock`
  // precedent — LITERAL/HEADING/NORMAL all reach this same call).
  const groups =
    wrapWidth > 0
      ? getSplitted(built.atoms, wrapWidth, (a) => atomMeasured(a, ctx).width)
      : [built.atoms];
  return groups.map((atoms) => atomsToLine(atoms, ctx));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Splits `display` into physical lines (a literal `'\n'` split — see this
 * module's doc comment for why that, not `DisplayNewlines.ts
 * #splitDisplayLines`, matches this port's established convention) and
 * builds each one's styled-run sequence through the SAME creole lexer the
 * description renderer already uses, matching `Display.create8(fc, align,
 * skinParam, CreoleMode.FULL, wrapWidth)`'s measurement semantics
 * (`EntityImageState.java:98-99`, `EntityImageStateCommon.java:80-81`) as
 * closely as this port's existing primitives allow — see this module's doc
 * comment for what is NOT ported (`<math>`/`<sup>`/`<sub>`).
 *
 * An empty `display` reports NO lines (`leaf-sizing-text.ts#lineCount`'s
 * S1L-e precedent: an empty body is zero lines, not one blank one) —
 * `''.split('\n')` itself would otherwise report one.
 */
export function creoleTextLines(
  display: string,
  font: FontSpec,
  measurer: StringMeasurer,
  opts?: { readonly wrapWidth?: number; readonly tabSize?: number; readonly sprites?: SpriteDimsLookup },
): readonly CreoleTextLine[] {
  if (display === '') return [];

  const ctx: MeasureCtx = {
    font,
    measurer,
    tabSizeNb: opts?.tabSize ?? DEFAULT_TAB_SIZE,
    sprites: opts?.sprites,
  };
  const wrapWidth = opts?.wrapWidth ?? 0;

  const result: CreoleTextLine[] = [];
  for (const raw of display.split('\n')) {
    result.push(...buildPhysicalLine(raw, ctx, wrapWidth));
  }
  return result;
}
