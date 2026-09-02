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
 *   8), so `tabStringFor` takes an explicit `nb`. Both it and `tokenizeOnTabs`
 *   are IMPORTED from `AtomText.ts`, which exports them — one port, never a
 *   copy (the SI27 shared-seam rule; they used to be re-derived here).
 * - Word-wrap: `klimt/creole/Fission.ts#getSplitted` (`Fission.java`).
 * - Vertical placement: `creole-sea-line.ts` — the real `Sea`
 *   (`SheetBlock1.java:130-152`), which is what gives each line its height
 *   and each run its `dy` (SI30 `decisions.md#D2`).
 *
 * `<sup>`/`<sub>` are ported since SI30 T1: `CommandCreoleBuilder.java:
 * 104-105` registers `CommandCreoleExposantChange`, so the lexer strips the
 * tags and the run carries a `FontPosition` (`FontConfiguration.java:98-104`
 * mutes its size by 3, `AtomText.java:321-323` reports its altitude to
 * `Sea`). `<math>` is ported too (`CommandCreoleBuilder.java:111` registers
 * `CommandCreoleMath` beside `CommandCreoleLatex`), so both tags become a
 * `'latex'` atom: {@link latexAtomMeasured} sizes it the way
 * `AtomMath#calculateDimensionSlow` does and its run carries the image
 * `AtomMath#drawU` paints (`AtomMath.java:64-97`), instead of the tag-
 * inclusive literal text the un-registered markup used to measure as.
 */
import type { FontSpec, StringMeasurer } from '../../measurer.js';
import type { SpriteDimsLookup } from '../../creole-atoms.js';
import { measureInlineAtom } from '../../creole-atoms-measure.js';
import { emojiSquareDim } from '../../klimt/creole/atom/AtomEmoji.js';
import type { CreoleAtom } from '../../klimt/creole/atom/Atom.js';
import { FontStyle, getFont } from '../../klimt/shape/UText.js';
import { ATOM_TEXT_MIN_HEIGHT, layoutLineThroughSea, measurerSeaLineOps } from './creole-sea-line.js';
import { buildLineAtoms } from '../../klimt/creole/legacy/StripeSimple.js';
import {
  hasTabulation,
  tabStopWidth,
  advanceToTabStop,
  tabStringFor,
  tokenizeOnTabs,
} from '../../klimt/creole/legacy/AtomText.js';
import { getSplitted } from '../../klimt/creole/Fission.js';
import { JAR_DEFAULT_TEXT_COLOR } from '../../decoration/symbol/usymbol-resolve.js';
import { renderLatexAsImage } from '../../latex.js';
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

/**
 * The drawable form of a creole `<latex>`/`<math>` atom: `AtomMath` measures
 * an image and draws that same image (`AtomMath.java:64-97`), so one call to
 * `core/latex.ts#renderLatexAsImage` answers both halves and they agree by
 * construction — which is the whole reason the href travels on the run rather
 * than being re-derived at draw time.
 *
 * `top` is the atom's own box top within its line (`SeaLineLayout.top`), i.e.
 * what `SheetBlock1#drawU` translates to before calling `AtomMath#drawU`
 * (`SheetBlock1.java:212-217`); a renderer draws the image at
 * `lineTop + top`, never off a text baseline, because an image has none.
 *
 * The IMAGE BYTES and the exact `width`/`height` are a PERMANENT divergence:
 * this port renders through KaTeX where the jar renders through JLaTeXMath
 * (`DIVERGENCES.md`, "LaTeX rendering engine — KaTeX, not JLaTeXMath", which
 * names `<math>` as well as `<latex>`). The STRUCTURE — an image atom in the
 * text flow, at its own box — is the conformance target; the numbers are not.
 */
export interface CreoleRunImage {
  readonly href: string;
  readonly width: number;
  readonly height: number;
  readonly top: number;
}

export interface CreoleTextRun {
  readonly text: string;
  readonly style: FontStyleFlags;
  readonly color?: string;
  readonly url?: string;
  /** The run's EFFECTIVE font size — `getFont(atom.font).size`
   *  (`FontConfiguration.java:98-104`), i.e. already muted by 3 for a
   *  `<sup>`/`<sub>` run (`FontPosition.java:51-60`) and equal to the
   *  cascaded size for every NORMAL run (SI30 `decisions.md#D1/#D3`). The
   *  size this seam MEASURED with, so a renderer must draw with it too. */
  readonly size: number;
  /** Baseline offset from the line's NORMAL baseline, from `Sea`
   *  (`decisions.md#D2`): a renderer draws this run at
   *  `lineTop + line.height - atom-unmuted-size/4.5 + dy`. 0 for every run
   *  of an all-NORMAL line — see `creole-sea-line.ts`'s doc comment for the
   *  two cases where a NORMAL run's `dy` is legitimately non-zero. */
  readonly dy: number;
  /** Set ONLY on a `'latex'` atom's run, which carries an image and no text
   *  at all (`AtomMath#drawU` draws one `UImage`/`UImageSvg` and nothing
   *  else, `AtomMath.java:78-97`). Absent on every text run. */
  readonly image?: CreoleRunImage;
}

export interface CreoleTextLine {
  readonly runs: readonly CreoleTextRun[];
  readonly width: number;
  readonly height: number;
  readonly kind: 'text' | 'hr' | 'table-row';
}

const NO_STYLE: FontStyleFlags = { bold: false, italic: false, underline: false, strike: false };

/** `SkinParam#getTabSize` default (`SkinParam.java:1073`,
 *  `getAsInt("tabsize", 8)`). */
const DEFAULT_TAB_SIZE = 8;

/** Defensive only — every atom handed to `Sea` below was measured into the
 *  same map one statement earlier; `Map#get`'s `undefined` arm is
 *  unreachable, not a real dimension. */
const ZERO_DIM = { width: 0, height: 0 };

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
    // Not lexed, so no `FontPosition` can reach it: the whole raw line is
    // one NORMAL run at the caller's own font (`size`), sitting on the
    // line's own baseline (`dy: 0`).
    runs: [{ text: raw, style: NO_STYLE, color: JAR_DEFAULT_TEXT_COLOR, size: ctx.font.size, dy: 0 }],
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

/** `AtomText#calculateDimensionSlow`'s tab-free short-circuit
 *  (`AtomText.java:183-184`) + `#getWidth`'s tokenizer/advance loop
 *  (`AtomText.java:239-256`) + `#getTabSize` (`AtomText.java:270-275`, via
 *  the imported {@link tabStopWidth}). Reports only the run's TOTAL width —
 *  matching `getWidth`'s own return contract, not `drawU`'s SEPARATE
 *  per-token positioning walk (`AtomText.java:210-233`); a renderer drawing
 *  a tabbed run must re-tokenize ({@link tokenizeOnTabs}) for per-token x, the
 *  same two-method split upstream itself has. */
function runTextWidth(text: string, fontSize: number, tabSizeNb: number, measure: (s: string) => number): number {
  if (!hasTabulation(text)) return measure(text);
  const tabStop = tabStopWidth(measure(tabStringFor(tabSizeNb)), fontSize);
  let x = 0;
  for (const token of tokenizeOnTabs(text)) {
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

/** A run before `Sea` has placed it: `dy` is not knowable atom-by-atom (it
 *  depends on every OTHER atom's altitude and height on the same line). */
type UnplacedRun = Omit<CreoleTextRun, 'dy'>;

interface AtomMeasured {
  readonly run: UnplacedRun | null;
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
  // SI30 D1: the EFFECTIVE size, i.e. `fontConfiguration.getFont()`
  // (`FontConfiguration.java:98-104`), which mutes a `<sup>`/`<sub>` run by
  // 3 points. Upstream reads it at every one of this function's mirrored
  // sites — `AtomText.java:176` (the dimension), `:251` (the per-token
  // width) and `:271-273` (the tab-stop fallback) — so the measurement
  // callback below is bound to the SAME muted font, per `AtomText.ts`'s
  // own contract note.
  const size = getFont(atom.font).size;
  const runFont: FontSpec = { ...ctx.font, size };
  const width = runTextWidth(atom.text, size, ctx.tabSizeNb, (s) => ctx.measurer.measure(s, runFont).width);
  const height = Math.max(ctx.measurer.measure(atom.text, runFont).height, ATOM_TEXT_MIN_HEIGHT);
  const run: UnplacedRun = {
    text: atom.text,
    style: styleFlagsFromSet(atom.font.styles),
    ...(atom.font.color !== null ? { color: atom.font.color } : {}),
    ...(atom.url !== undefined ? { url: atom.url.url } : {}),
    size,
  };
  return { run, width, height };
}

/**
 * A `'latex'` atom's run + width/height: `AtomMath#calculateDimensionSlow`
 * (`AtomMath.java:64-71`), whose dimension is the rendered image's own — here
 * `core/latex.ts#renderLatexAsImage`, the ONE latex renderer this port has,
 * bound exactly as `klimt/creole/atom/AtomMath.ts` and
 * `EntityImageDescriptionDelegates.ts#descAtomOps` already bind it. The run
 * carries no text: the atom draws an image and nothing else.
 *
 * The colour is the atom's own resolved `FontConfiguration.color`, falling
 * back to `XColor.BLACK` — `AtomMath#getColor`'s own default when `foreground`
 * is not an `HColorSimple` (`AtomMath.java:88,100-106`).
 *
 * `image.top` is filled in by {@link atomsToLine} once `Sea` has placed the
 * line; an atom cannot know its own top before its neighbours are laid out.
 */
function latexAtomMeasured(atom: Extract<CreoleAtom, { kind: 'latex' }>, ctx: MeasureCtx): AtomMeasured {
  void ctx;
  const drawn = renderLatexAsImage(atom.expr, atom.color ?? JAR_DEFAULT_TEXT_COLOR);
  const image: CreoleRunImage = { href: drawn.href, width: drawn.width, height: drawn.height, top: 0 };
  return {
    run: { text: '', style: NO_STYLE, size: ctx.font.size, image },
    width: drawn.width,
    height: drawn.height,
  };
}

/** One `CreoleAtom`'s run (`null` for a non-text, non-latex atom — the
 *  `CreoleTextRun` shape carries no sprite/emoji variant) plus its
 *  width/height contribution. `'inline'` (img/sprite): D9's
 *  `measureInlineAtom` (`creole-atoms-measure.ts`). `'emoji'`:
 *  `AtomEmoji#calculateDimensionSlow`/box height (`AtomEmoji.java:57-64`).
 *  `'latex'`: {@link latexAtomMeasured}. */
function atomMeasured(atom: CreoleAtom, ctx: MeasureCtx): AtomMeasured {
  if (atom.kind === 'text') return textAtomMeasured(atom, ctx);
  if (atom.kind === 'latex') return latexAtomMeasured(atom, ctx);
  if (atom.kind === 'inline') {
    const dims = measureInlineAtom(atom.atom, ctx.sprites, ctx.font.size);
    return { run: null, width: dims.width, height: dims.height };
  }
  if (atom.kind === 'emoji') {
    // `AtomEmoji#calculateDimensionSlow` VERBATIM — the `36*factor` SQUARE
    // (`AtomEmoji.java:57-59`), NOT `emojiBoxDim`'s pre-combined `39*factor`
    // line height. Since SI30 this seam drives the real `Sea`, which derives
    // that hang itself from the atom's own `-3*factor` altitude
    // (`AtomEmoji.java:62-64`): 39*factor when a text atom shares the line,
    // 36*factor when the emoji is alone on it. Folding the hang into the
    // DIMENSION double-counted it for an emoji-only line — the identical
    // correction `EntityImageDescriptionDelegates.ts#descAtomOps` already
    // carries, jar-probed in `AtomEmoji.ts`'s own doc comment.
    const dims = emojiSquareDim(atom.factor);
    return { run: null, width: dims.width, height: dims.height };
  }
  return { run: null, width: 0, height: 0 };
}

/**
 * One physical line's runs + box, laid out through the real `Sea`
 * (`SheetBlock1.java:130-152`, via `creole-sea-line.ts`): the width is the
 * x-cursor sum `Sea#add` accumulates, the height is `Sea#getHeight` (so a
 * raised `<sup>` or a hanging emoji grows its own line), and each run's
 * `dy` is that run's baseline relative to the line's NORMAL one.
 */
function atomsToLine(atoms: readonly CreoleAtom[], ctx: MeasureCtx): CreoleTextLine {
  const measured = atoms.map((atom) => atomMeasured(atom, ctx));
  // Keyed by atom identity, exactly as `Sea`'s own `positions` map is
  // (`Sea.java:53`) — so a line is measured once, not once per `Sea` call.
  const dims = new Map<CreoleAtom, { width: number; height: number }>();
  atoms.forEach((atom, i) => dims.set(atom, measured[i] as AtomMeasured));
  const layout = layoutLineThroughSea(
    atoms,
    measurerSeaLineOps(ctx.font, ctx.measurer, (atom) => dims.get(atom) ?? ZERO_DIM),
  );
  const runs: CreoleTextRun[] = [];
  measured.forEach((m, i) => {
    if (m.run === null) return;
    // `SheetBlock1#drawU` draws an image atom at its own `Position`
    // (`SheetBlock1.java:212-217`); only `Sea` knows it, and only now.
    const placed = m.run.image === undefined ? {} : { image: { ...m.run.image, top: layout.top[i] as number } };
    runs.push({ ...m.run, ...placed, dy: layout.dy[i] as number });
  });
  return { runs, width: layout.width, height: layout.height, kind: 'text' };
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
 * comment for how `<math>`/`<latex>`/`<sup>`/`<sub>` are handled.
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
