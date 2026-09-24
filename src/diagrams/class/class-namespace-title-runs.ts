/**
 * class-namespace-title-runs.ts — cdd-T26: resolves a namespace/package
 * folder-tab or rect title's `<img:>`/`<$sprite>` markup, split out of
 * `class-namespace-shape.ts` purely to keep that file under the repo's
 * 500-line cap (same precedent as that file's own `class-namespace-folder-
 * outline.ts` split — a pure move, no behavior change to the moved code
 * beyond the new functions this task adds).
 *
 * See {@link namespaceTitleRuns}'s own doc comment for the full mechanism
 * and its jar citation.
 */
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import { buildLineAtoms } from '../../core/klimt/creole/legacy/StripeSimple.js';
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { atomFontSpec } from './class-member-creole-sea.js';
import { resolveInlineAtom } from './class-member-atom-resolve.js';
import { text, image } from '../../core/svg.js';

/** `USymbolFolder#asBig`'s title local vertical offset before ANY text
 *  starts (`title.drawU(ug.apply(new UTranslate(4, 2)))`) — the "+2" every
 *  one of `renderNamespaceFolder`/`renderNamespaceRect`/
 *  `renderEmptyPackageIcon`'s `geo.baselineOffset` formula already bakes in
 *  for a SINGLE line (`class-namespace-shape.ts#getTitleBaselineOffset`).
 *  Named here (cdd-T26 residual round, `daxeno-00-kasu166`) because a
 *  MULTI-line title needs it as a standalone "block top" reference, not
 *  fused with one line's own ascent. */
export const TITLE_LOCAL_TOP_OFFSET = 2;

/** `class-namespace-shape.ts#titleFont`'s `FontConfiguration` counterpart
 *  and `#titleFontColor` — needed to route a folder/rect title through the
 *  shared creole atom lexer (`buildLineAtoms`), which speaks
 *  `FontConfiguration` (`core/klimt/shape/UText.ts`), not that module's
 *  plain `FontSpec`. Duplicated (not imported) per this module's own
 *  small-enough-to-duplicate precedent (`class-namespace-title-table.ts
 *  #namespaceTitleFont`'s identical doc-commented rationale) rather than
 *  widening `class-namespace-shape.ts`'s public surface for one caller. */
function titleFontConfiguration(theme: Theme): FontConfiguration {
  const size = theme.colors.elements?.package?.fontSize ?? theme.fontSize;
  const override = theme.colors.elements?.package?.font;
  const color = typeof override === 'string' ? override : '#000000';
  return { family: theme.fontFamily, size, color, styles: new Set([FontStyle.BOLD]) };
}

/** One resolved title run: either a text span (font may differ from the
 *  title's own base font -- see {@link namespaceTitleRuns}) or a resolved
 *  `<$sprite>`/successfully-decoded `<img:data:...>` image (cdd-T26
 *  residual round: the previously-skipped `'inline'` `CreoleAtom` gap,
 *  now resolved via the SAME `resolveInlineAtom` member rows use). */
export type NamespaceTitleRun =
  | { readonly kind: 'text'; readonly text: string; readonly font: FontConfiguration }
  | { readonly kind: 'image'; readonly href: string; readonly width: number; readonly height: number };

/**
 * cdd-T26: resolves a folder/rect title's plain text PLUS any `<img:>`
 * cannot-decode fallback run via the shared creole atom lexer
 * (`buildLineAtoms`, `core/klimt/creole/legacy/StripeSimple.ts`) — the SAME
 * pipeline class member rows already go through
 * (`class-member-creole.ts#resolveOneAtom`). A markup-free label reduces to
 * exactly one `{kind:'text', text: label, font}` atom (`StripeSimple.ts`'s
 * own single-atom line shape), so every pre-existing conformant namespace
 * fixture is measurement- and render-IDENTICAL after this cutover — the
 * `runs.length <= 1` branches in `class-namespace-shape.ts#getWTitle`/
 * `renderNamespaceFolder` take the untouched pre-existing code path.
 *
 * `<img:HelloWorld.png{scale=1.5}>` (a plain file path, no data URI/http) is
 * exactly upstream's non-decodable case: `AtomImg.create`'s file-exists
 * check (`AtomImg.java:171-177`) fails under this browser-safe port's
 * no-filesystem-access architecture (project CLAUDE.md), and — matching
 * upstream's own non-`INSECURE` default (`SecurityUtils.getSecurityProfile
 * () == SecurityProfile.INSECURE`, java:173) — always resolves to the short
 * `(Cannot decode)` fallback text, at the jar's hardcoded monospace-14
 * `IMG_FALLBACK_FONT` (`StripeSimple.ts`), NOT this title's own bold font.
 * `jabama-09-kago823` jar-verified: `MyNamespaceName` (bold sans, 130.725px)
 * + `(Cannot decode)` (monospace, non-bold, 100.363px), same baseline y,
 * sequential x (10 -> 140.725, `geo.x+4` plus the first run's own width).
 *
 * A `<$sprite>` or successfully-decoded `<img:data:...>` atom (the
 * 'inline' `CreoleAtom` kind) resolves through the SAME `resolveInlineAtom`
 * member rows already use (`class-member-atom-resolve.ts`) when `sprites`/
 * `spriteDims` are supplied -- no namespace/cluster-title fixture in this
 * mission's CORPUS exercises it (cdd-T26 diagnosis), so no production
 * render call site threads a registry yet (both params default `undefined`,
 * under which an 'inline' atom still resolves fine for a bare `<img:data:
 * ...>` -- `resolveInlineAtom`'s own `sprites === undefined` guard only
 * gates the `'sprite'` atom kind) -- see `tests/unit/class/class-namespace-
 * title-runs.test.ts`'s sprite/img-data fixtures for the atom-level
 * coverage this narrow gap now has.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java:171-177
 */
export function namespaceTitleRuns(
  label: string,
  theme: Theme,
  sprites?: SpriteRegistry,
  spriteDims?: SpriteDimsLookup,
): readonly NamespaceTitleRun[] {
  const font = titleFontConfiguration(theme);
  const runs: NamespaceTitleRun[] = [];
  for (const atom of buildLineAtoms(label, font).atoms) {
    if (atom.kind === 'text') {
      runs.push({ kind: 'text', text: atom.text, font: atom.font });
      continue;
    }
    if (atom.kind === 'inline') {
      const resolved = resolveInlineAtom(atom.atom, font, sprites, spriteDims);
      if (resolved !== undefined) runs.push(resolved);
    }
  }
  return runs.length > 0 ? runs : [{ kind: 'text', text: label, font }];
}

/** One split PHYSICAL line of a title (`daxeno-00-kasu166`'s
 *  `"<size:18>styled2</size>\nshould be styled"` splits into two): its own
 *  runs, their summed width, and TWO height figures that only coincide
 *  under a real measurer:
 *  - `fontSize` — the line's tallest run's own MEASURED height
 *    (`measurer.measure(...).height`), the figure `getHTitle`'s
 *    pre-existing single-line formula always trusted (its own doc comment:
 *    "even though `StringMeasurer.measure().height` always returns the raw
 *    font size" — an assumption that HOLDS for `WidthTableMeasurer`/
 *    `FormulaMeasurer` but not for a test-only measurer with a font-size-
 *    independent height, e.g. `tests/helpers/render.ts`'s `FixedMeasurer(8,
 *    16)`; `class-empty-package-no-cluster-box.test.ts`'s byte-level proof
 *    caught the regression when this used `nominalFontSize` instead).
 *  - `nominalFontSize` — the line's tallest run's own DECLARED font size
 *    (`run.font.size`), the figure `ClusterHeader.java:78`'s
 *    `(stereoLines+titleLines)*fontSize` formula and this port's PRE-
 *    EXISTING `namespaceTitleTableDims` single-line call both used (`font.
 *    size`, never a measured pixel height) — `namespaceTitleTableDims`
 *    reads THIS field, never `fontSize`. */
export interface NamespaceTitleLine {
  readonly runs: readonly NamespaceTitleRun[];
  readonly width: number;
  readonly fontSize: number;
  readonly nominalFontSize: number;
}

/**
 * cdd-T26 (residual round, `daxeno-00-kasu166`): splits a title label into
 * its PHYSICAL lines via the shared `Display#getWithNewlines` port
 * (`splitDisplayLines`, `core/klimt/creole/DisplayNewlines.ts`) — the SAME
 * escape scan `ClusterHeader.java:115-142#getTitleBlock` receives through
 * `g.getDisplay()`'s own `Display` (built once, at PARSE time, from
 * `Display.getWithNewlines`; this port has no equivalent parse-time
 * `Display` object for a namespace label, so the split runs here, at
 * layout/render time instead — same escape grammar, different call site).
 * Each split line is then resolved through {@link namespaceTitleRuns}
 * exactly as before. A label with no `\n`/`\l`/`\r`/`\\` escape reduces to
 * exactly ONE line (`splitDisplayLines`'s own single-entry-array shape for
 * an escape-free string), so this is a strict superset of the pre-existing
 * single-line behavior, not a replacement of it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:262-346
 */
export function namespaceTitleLines(
  measurer: StringMeasurer,
  theme: Theme,
  label: string,
  sprites?: SpriteRegistry,
  spriteDims?: SpriteDimsLookup,
): readonly NamespaceTitleLine[] {
  return splitDisplayLines(label).lines.map((line) => {
    const runs = namespaceTitleRuns(line, theme, sprites, spriteDims);
    let width = 0;
    let fontSize = 0;
    let nominalFontSize = 0;
    for (const run of runs) {
      // See `NamespaceTitleLine`'s own doc comment for why `fontSize`
      // (measured) and `nominalFontSize` (declared) are tracked
      // separately -- an 'image' run's own height stands in for both
      // (both are "how tall is this run", `note-layout-measure-rows.ts`'s
      // identical `altitude: 0, height: atom.height` convention for an
      // image atom) -- no fixture exercises a mixed text+image title line
      // yet, so that half is the untested, honest generalization.
      if (run.kind === 'text') {
        const dim = measurer.measure(run.text, atomFontSpec(run.font));
        width += dim.width;
        if (dim.height > fontSize) fontSize = dim.height;
        if (run.font.size > nominalFontSize) nominalFontSize = run.font.size;
      } else {
        width += run.width;
        if (run.height > fontSize) fontSize = run.height;
        if (run.height > nominalFontSize) nominalFontSize = run.height;
      }
    }
    return { runs, width, fontSize, nominalFontSize };
  });
}

/** The title BLOCK's own width — the widest physical line — jar-verified
 *  `daxeno-00-kasu166`: line 1 "styled2"@18px = 57.037, line 2 "should be
 *  styled"@14px = 93.45 -> block width 93.45 (DOT `WIDTH="93"`,
 *  `Math.floor(93.45)`). Reduces to {@link namespaceTitleRuns}'s own single-
 *  line sum for an escape-free label (one line). */
export function namespaceTitleWidth(measurer: StringMeasurer, theme: Theme, label: string): number {
  return Math.max(0, ...namespaceTitleLines(measurer, theme, label).map((l) => l.width));
}

/** The title BLOCK's own height — SUM of each physical line's own height
 *  (its tallest run's font size), mirroring `ClusterHeader.java:78`'s
 *  `mergeTB(stereo, title)` vertical STACK (`XDimension2D.java:94-98`,
 *  sum-not-max) applied to `title` alone. Jar-verified `daxeno-00-kasu166`:
 *  18 (line 1) + 14 (line 2) = 32 -> `computeTitleTableHeight(32, 0, 0,
 *  N/A)` = 32-5=27, +15 (USymbolDatabase's own `suppHeightBecauseOfShape`,
 *  `class-namespace-title-table.ts#titleSupp`) = 42, matching the cached
 *  oracle `svek-1.dot`'s `HEIGHT="42"` exactly. Reduces to the pre-existing
 *  single-line `dim.height` (one line, `fontSize` unchanged) for an
 *  escape-free label. */
export function namespaceTitleHeight(measurer: StringMeasurer, theme: Theme, label: string): number {
  return namespaceTitleLines(measurer, theme, label).reduce((sum, l) => sum + l.fontSize, 0);
}

/** Each physical line's own baseline Y, LOCAL to the title BLOCK's top (the
 *  caller adds `geo.y + `{@link TITLE_LOCAL_TOP_OFFSET}` once, then this
 *  array's own cumulative stacking, never re-adding a per-line "+2"). Line
 *  `i`'s baseline = the sum of every PRECEDING line's own height (its
 *  `fontSize`, {@link namespaceTitleLines}) plus its OWN ascent
 *  (`fontSize - descent`) — the exact generalization of the pre-existing
 *  single-line `getTitleBaselineOffset` formula (`2 + fontSize - descent`)
 *  to N lines, verified against BOTH `daxeno-00-kasu166` data points
 *  independently: the inter-line gap (56.889 - 42 = 14.889 local Y) and the
 *  block's total height growth (+18 in the corpus-wide cascade, matching
 *  `namespaceTitleHeight`'s own citation) agree with this same formula. */
export function namespaceTitleLineBaselines(
  measurer: StringMeasurer,
  theme: Theme,
  lines: readonly NamespaceTitleLine[],
): readonly number[] {
  const baselines: number[] = [];
  let top = 0;
  for (const line of lines) {
    const spec = { family: theme.fontFamily, size: line.fontSize };
    baselines.push(top + (line.fontSize - measurer.getDescent(spec, '')));
    top += line.fontSize;
  }
  return baselines;
}

/** Draws a full multi-line title BLOCK: one call to
 *  {@link renderNamespaceTitleRuns} per physical line, stacked at
 *  {@link namespaceTitleLineBaselines}' own Y offsets from `blockTopY`
 *  (already `geo.y + `{@link TITLE_LOCAL_TOP_OFFSET}`). `xForLine` lets
 *  each caller keep its OWN horizontal placement rule (`renderNamespaceFolder`
 *  /`renderEmptyPackageIcon`: fixed `geo.x + 4` for every line;
 *  `renderNamespaceRect`: each line centred against `geo.width`,
 *  `renderNamespaceRect`'s own pre-existing per-line convention). */
export function renderNamespaceTitleBlock(
  lines: readonly NamespaceTitleLine[],
  baselines: readonly number[],
  blockTopY: number,
  xForLine: (line: NamespaceTitleLine) => number,
  measurer: StringMeasurer,
): string {
  let out = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    out += renderNamespaceTitleRuns(xForLine(line), blockTopY + baselines[i]!, line.runs, measurer);
  }
  return out;
}

/** Draws {@link namespaceTitleRuns}' MULTI-run branch: one `<text>`/
 *  `<image>` per run, each at its OWN font/box, sequentially placed from
 *  `x0` — jar-verified `jabama-09-kago823`: `MyNamespaceName` (bold sans)
 *  then `(Cannot decode)` (monospace, non-bold) at `x = x0 + run1.width`,
 *  same baseline `y` for both (`class-namespace-shape.ts
 *  #renderNamespaceTitleLabel`'s own doc comment for the single-run
 *  byte-identical fallback this complements). An `'image'` run's Y is its
 *  OWN altitude-0 bottom-alignment to `y` (`resolveInlineAtom`'s own
 *  altitude contract, `note-layout-measure-rows.ts`'s identical
 *  convention for a member-row image atom) — untested against a jar
 *  fixture (no corpus title exercises it), the honest generalization from
 *  the ONE other place this port aligns an image atom to a text baseline. */
export function renderNamespaceTitleRuns(
  x0: number,
  y: number,
  runs: readonly NamespaceTitleRun[],
  measurer: StringMeasurer,
): string {
  let x = x0;
  let out = '';
  for (const run of runs) {
    if (run.kind === 'image') {
      out += image(x, y - run.height, run.width, run.height, run.href);
      x += run.width;
      continue;
    }
    const width = measurer.measure(run.text, atomFontSpec(run.font)).width;
    out += text(x, y, run.text, {
      fontFamily: run.font.family,
      fontSize: run.font.size,
      ...(run.font.styles.has(FontStyle.BOLD) ? { fontWeight: '700' } : {}),
      fill: run.font.color ?? '#000000',
      lengthAdjust: 'spacing' as const,
      textLength: width,
    });
    x += width;
  }
  return out;
}

/** {@link renderNamespaceTitleAuto}'s label/theme/measurer/block-top bundle
 *  -- kept as one object so the function itself stays inside this
 *  project's 5-param cap. */
export interface NamespaceTitleRenderInput {
  readonly label: string;
  readonly theme: Theme;
  readonly measurer: StringMeasurer | undefined;
  readonly blockTopY: number;
}

/** {@link renderNamespaceTitleAuto}'s single-line/single-run FALLBACK draw
 *  -- the pre-existing, byte-identical literal-`<text>` shape every one of
 *  `renderNamespaceFolder`/`renderNamespaceRect`/`renderEmptyPackageIcon`
 *  already drew before cdd-T26; each caller supplies its OWN pre-existing
 *  x/y/font/textLength formula (they differ: folder/empty-package fix `x`
 *  at `geo.x+4`, rect CENTERS it). */
export interface NamespaceTitleFallback {
  readonly x: number;
  readonly y: number;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontColor: string;
  readonly textLength: number | undefined;
}

/**
 * cdd-T26 residual round: the ONE shared "draw this namespace title" entry
 * point for all three plain-string render paths (`renderNamespaceFolder`,
 * `renderNamespaceRect`, `renderEmptyPackageIcon`) — a title with no
 * creole markup and no `\n`/`\l`/`\r` escape (exactly one physical line,
 * one run) draws through `fallback`'s pre-existing literal-`<text>` shape,
 * byte-identical to every one of these three functions' own pre-cdd-T26
 * behavior; anything else routes through {@link renderNamespaceTitleBlock},
 * `xForLine` letting each caller keep its own per-line horizontal rule
 * (fixed left margin vs per-line centering).
 */
export function renderNamespaceTitleAuto(
  input: NamespaceTitleRenderInput,
  fallback: NamespaceTitleFallback,
  xForLine: (line: NamespaceTitleLine) => number,
): string {
  const { label, theme, measurer, blockTopY } = input;
  const lines = measurer === undefined ? [] : namespaceTitleLines(measurer, theme, label);
  const soleRun = lines.length <= 1 ? lines[0]?.runs[0] : undefined;
  const isPlainSingleRun = (lines[0]?.runs.length ?? 0) <= 1 && (soleRun === undefined || soleRun.kind === 'text');
  if (lines.length <= 1 && isPlainSingleRun) {
    return text(fallback.x, fallback.y, label, {
      fontFamily: fallback.fontFamily,
      fontSize: fallback.fontSize,
      fontWeight: '700',
      fill: fallback.fontColor,
      ...(fallback.textLength !== undefined
        ? { lengthAdjust: 'spacing' as const, textLength: fallback.textLength }
        : {}),
    });
  }
  const baselines = namespaceTitleLineBaselines(measurer!, theme, lines);
  return renderNamespaceTitleBlock(lines, baselines, blockTopY, xForLine, measurer!);
}
