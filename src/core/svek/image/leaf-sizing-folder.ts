/**
 * `folder` / `package` leaf sizing — `USymbolFolder(sname, showTitle)`.
 *
 * Split out of `leaf-sizing.ts` to keep that file under the project's
 * 500-line cap (S1L-f part 2b). Self-contained: one exported entry point
 * (`measureFolderLeaf`) plus the three `mergeTB` block helpers it composes.
 *
 * T2b (ink-walk-reuses-draw, D5) added two things, both still scoped to
 * this ONE symbol family:
 * - {@link measureFolderLeafInk}: a folder/package-specific `LimitFinder`
 *   ink walk over the REAL `decoration/symbol/USymbolFolder.ts#asSmall`
 *   (the SAME class the draw path resolves this symbol to), fed
 *   declared-size stand-ins for title/label/stereo so its internally
 *   recomputed `mergeTB`/`getMargin` total matches THIS file's own
 *   `measureFolderLeaf` exactly -- `class-layout-description-leaf-ink.ts`'s
 *   own doc comment records why walking the GENERIC `EntityImageDescription`
 *   construction instead regressed `cepedu-19-namu934` (Δ32: a different
 *   box than `measureFolderLeaf` sized).
 * - {@link folderTextBlock}'s embed branch: a `{{ ... }}` label routes
 *   through the real `EmbeddedDiagram` machinery instead of being measured
 *   as literal text lines (`rojida-14-fuli428` mechanism 2).
 */

import type { LeafSizingSubject } from './LeafSizingSubject.js';
import type { StringMeasurer, FontSpec } from '../../measurer.js';
import type { SpriteDimsLookup } from '../../creole-atoms.js';
import { textBlockHeight, maxLineWidth, atomHeightBonus } from './leaf-sizing-text.js';
import { measureShownFolderTitle } from './leaf-sizing-folder-title.js';
import {
  type BoxSizingOpts,
  BOX_MIN_WIDTH_DEFAULT,
  DEFAULT_BOX_MARGIN,
  FOLDER_FAMILY_SHOW_TITLE,
  FOLDER_TAB_HEIGHT,
  FOLDER_TAB_WIDTH,
  LINE_HEIGHT_FACTOR,
  STEREO_MARGIN,
  SYMBOL_BOX_MARGIN,
  type Dim,
} from './leaf-sizing-consts.js';
import { EmbeddedDiagram, getEmbeddedType } from '../../EmbeddedDiagram.js';
import { descEmbeddedRenderer } from './EntityImageDescriptionEmbed.js';
import { MeasurerStringBounder } from '../../measurer-bounder.js';
import { LimitFinder } from '../../klimt/drawing/LimitFinder.js';
import { USymbolFolder } from '../../decoration/symbol/USymbolFolder.js';
import { SymbolContext } from '../../decoration/symbol/SymbolContext.js';
import { UStroke } from '../../klimt/UStroke.js';
import { HorizontalAlignment } from '../../klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../klimt/shape/TextBlock.js';
import type { UGraphic } from '../../klimt/UGraphic.js';
import type { LeafSymbolInk } from './leaf-sizing-entity.js';

/**
 * `USymbolFolder`'s tab (`package`'s title) reads `SymbolContext
 * .getRoundCorner()` unconditionally, same as every OTHER descriptive
 * symbol (`renderer-usymbol-entity.ts#ELEMENT_ROUND_CORNER`, jar-verified
 * against `gujigi-63-roki030`'s `A2.5,2.5` tab arcs) -- duplicated rather
 * than imported (`renderer-usymbol-entity.ts` is a class-render file
 * outside this task's write-set; same "algorithm, not binding" precedent
 * `EmbeddedDiagram.ts`'s own `getEmbeddedType` duplication note documents).
 * Only the polygon-vs-path BRANCH (`roundCorner === 0`) matters for ink --
 * `USymbolFolder.ts#folderPath`'s arced bbox is `(0,0)-(width,height)`
 * regardless of the exact radius, so a `<style> package { RoundCorner 0 }`
 * override (no corpus row exercises one here) is the only value this
 * constant could ever get wrong.
 */
const ELEMENT_ROUND_CORNER = 5.0;

/**
 * `folder` / `package` leaf — `USymbolFolder(sname, showTitle)`, the one
 * symbol class behind both (USymbols.java:79/86). Its `asSmall`
 * `calculateDimension` is
 *
 *   getMargin().addDimension(dimName.mergeTB(dimStereo, dimLabel))
 *
 * with `getMargin() = Margin(10, 10+10, 10+3, 10)` -> `[30 h, 23 v]` and
 * `dimName = showTitle ? title.calculateDimension() : XDimension2D(40, 15)`
 * (USymbolFolder.java:146/172/177-183). `mergeTB` stacks: width is the MAX of
 * the three blocks, height their SUM. That single formula explains both
 * forms, which is why they share this function:
 *
 * - `folder` (showTitle=false): the tab is the FIXED (40, 15) block, so 40
 *   FLOORS the content width and 15 adds to the height, while the element's
 *   text rides in the LABEL slot. The floor is the part this port was
 *   missing (`folder b` measured 37.79 vs the jar's 70.00 = max(40, 7.79) +
 *   30); it only ever bites on a short name, which is why no corpus fixture
 *   caught it until now.
 * - `package` (showTitle=true): `dimName` is the real title block, and the
 *   title is the element's CODE while the LABEL carries its display when the
 *   two differ. Verified against the jar across every form:
 *   `package "a b c d e f g"` (code == display, so label empty) 91.787 =
 *   49.7875 + 12 + 30 at height 37 = 14 + 23; `package pp as "Display Here"`
 *   106.387 at height 51 = 14 + 14 + 23, the label winning the width max;
 *   `package "Disp Two" as dd` 84.600 at height 51, likewise.
 *
 * SI1 T12 (ADR-4): the shown title block is now the FAITHFUL
 * `BodyFactory.create2` → `BodyEnhanced1` route
 * (`leaf-sizing-folder-title.ts`) — the `+ 12` in the verified numbers
 * above is `BodyEnhanced1`'s `getMarginX()=6` both sides
 * (BodyEnhancedAbstract.java:107-109), no longer the measured-but-untraced
 * `FOLDER_SHOWN_TITLE_EXTRA_WIDTH` flat constant (deleted).
 */
/** The three `mergeTB` block dims (`dimName`/`dimLabel`/`dimStereo`)
 *  {@link measureFolderLeaf} composes into a `Dim` and {@link
 *  measureFolderLeafInk} feeds to the REAL `USymbolFolder.ts#asSmall` as
 *  {@link declaredSizeBlock} stand-ins -- split out so both derive the
 *  SAME numbers from ONE formula (T2b, D5: sizing and ink must agree on
 *  what box `asSmall` was given). showTitle puts the CODE in the title
 *  slot and the display in the label only when it differs; !showTitle
 *  leaves the title fixed (40, 15) and the display is the whole label. The
 *  shown title is the faithful `BodyFactory.create2`→`BodyEnhanced1` block
 *  (SI1 T12/ADR-4 — see `leaf-sizing-folder-title.ts`; upstream
 *  `getDimTitle` never measures `title` when `showTitle` is false,
 *  USymbolFolder.java:172). */
function folderBlockDims(
  node: LeafSizingSubject,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  opts: BoxSizingOpts | undefined,
  sprites: SpriteDimsLookup | undefined,
): {
  showTitle: boolean;
  title: readonly [number, number];
  label: readonly [number, number];
  stereo: readonly [number, number];
} {
  const symbol = node.symbol;
  const lineH = fontSpec.size * LINE_HEIGHT_FACTOR;
  const showTitle = FOLDER_FAMILY_SHOW_TITLE[symbol] === true;
  const title = showTitle
    ? measureShownFolderTitle(node.id, fontSpec, measurer, opts, sprites)
    : ([FOLDER_TAB_WIDTH, FOLDER_TAB_HEIGHT] as const);
  const labelText = showTitle && node.display === node.id ? '' : node.display;
  const label = folderTextBlock(labelText, fontSpec, measurer, sprites);
  const stereo = folderStereoBlock(node, fontSpec, measurer, lineH);
  return { showTitle, title, label, stereo };
}

export function measureFolderLeaf(
  node: LeafSizingSubject,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  opts: BoxSizingOpts | undefined,
  sprites: SpriteDimsLookup | undefined,
): Dim {
  const [marginH, marginV] = SYMBOL_BOX_MARGIN[node.symbol] ?? DEFAULT_BOX_MARGIN;
  const { title, label, stereo } = folderBlockDims(node, fontSpec, measurer, opts, sprites);
  const [titleW, titleH] = title;
  const [labelW, labelH] = label;
  const [stereoW, stereoH] = stereo;

  // `MinimumWidth` floors the CONTENT width before margin, exactly as in
  // `measureBox` — S1L-g wired `skinparam minClassWidth` / scoped `<style>
  // <sname> { MinimumWidth }` through `ClassifyCtx#minimumWidthFor`, and
  // `package` is one of its consumers (zotiru-33-legi180).
  const minContentW = opts?.minimumWidth ?? BOX_MIN_WIDTH_DEFAULT;
  return {
    width: Math.max(minContentW, titleW, labelW, stereoW) + marginH,
    height: titleH + labelH + stereoH + marginV,
  };
}

/**
 * `dimLabel` — an EMPTY label contributes a zero block, not a blank line
 * (`''.split('\n')` would otherwise bill it one `lineH`).
 *
 * T2b (rojida-14-fuli428 mechanism 2): a label whose FIRST line opens a
 * `{{ ... }}` embedded diagram is the SAME `desc` content
 * `EntityImageDescriptionDelegates.ts#buildDesc` routes through the real
 * `EmbeddedDiagram` machinery -- measuring it as literal text lines here
 * (the pre-existing fallthrough below) gave the 3-line embed's `{{`/
 * content/`}}` lines a `3 * lineH = 42`-tall block that matches the jar's
 * `EmbeddedDiagram.java:148-152` `(42, 42)` catch fallback only by
 * COINCIDENCE (a 4-line embed measured 56, not 42 -- the jar-verified
 * regression `decisions.md` D5 names). Routing through the real
 * `EmbeddedDiagram.calculateDimension` (via {@link descEmbeddedRenderer},
 * this port's `NestedDiagramRenderer`) reaches the SAME try/catch that
 * always resolves to `(42, 42)` today (its own doc comment), independent
 * of the embed's line count, matching upstream regardless of what the
 * embed source eventually contains.
 */
function folderTextBlock(
  text: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites: SpriteDimsLookup | undefined,
): readonly [number, number] {
  if (text === '') return [0, 0];
  const embedded = embeddedLabelDimension(text, measurer);
  if (embedded !== undefined) return embedded;
  const lineH = fontSpec.size * LINE_HEIGHT_FACTOR;
  return [
    maxLineWidth(text, fontSpec, measurer, sprites),
    textBlockHeight(text, lineH) + atomHeightBonus(text, fontSpec, sprites),
  ];
}

/**
 * `undefined` when the label's first line does not open a `{{ ... }}`
 * block (`getEmbeddedType`, the SAME dispatch `klimt/creole/legacy/
 * CreoleParser.ts#processDisplayLine` uses to decide the identical
 * question for a `desc` line) -- every non-embed label is unaffected.
 * `null` `skinParam` matches `buildLocalSkinSimple`'s own construction:
 * upstream's `Previous.createFrom(skinParam.values())` continuity has no
 * caller reachable from this sizing-only seam either.
 */
function embeddedLabelDimension(text: string, measurer: StringMeasurer): readonly [number, number] | undefined {
  const lines = text.split('\n');
  const type = getEmbeddedType(lines[0] ?? '');
  if (type === null) return undefined;
  const embedded = EmbeddedDiagram.createAndSkip(type, lines.slice(1)[Symbol.iterator](), null, descEmbeddedRenderer());
  const dim = embedded.calculateDimension(new MeasurerStringBounder(measurer));
  return [dim.getWidth(), dim.getHeight()];
}

/** `dimStereo` — the third mergeTB block: widest guillemet label, one line of
 *  height per tag (the same rule `measureBox` applies). */
function folderStereoBlock(
  node: LeafSizingSubject,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  lineH: number,
): readonly [number, number] {
  const tags = node.stereotype;
  if (tags === undefined || tags.length === 0) return [0, 0];
  const widest = Math.max(...tags.map((s) => measurer.measure(`«${s}»`, fontSpec).width));
  return [widest + STEREO_MARGIN, lineH * tags.length];
}

/**
 * A `TextBlock` stand-in that reports a FIXED, declared dimension and
 * draws nothing. `USymbolFolder.ts#asSmall`'s returned `drawU` only calls
 * `title.drawU`/`tb.drawU` (the merged stereo+label) for content strictly
 * INSIDE its own outer tab/border shape's `(0,0)-(width,height)` bbox
 * (`drawFolder`'s outline dominates by construction -- the title/label/
 * stereo positions `getMargin()` computes always sit within it) -- so
 * their OWN drawn ink never affects the symbol's overall extent, and a
 * declared-size stand-in is both sufficient and, cheaper: it recomputes
 * the SAME `calculateDimension()` `measureFolderLeaf` already derived,
 * instead of re-deriving through a second, independent creole/text
 * construction that risks disagreeing with it (the very drift {@link
 * measureFolderLeafInk}'s own doc comment traces `cepedu-19-namu934`'s
 * Δ32 regression to, one level up).
 */
function declaredSizeBlock(width: number, height: number): TextBlock {
  const dim = new XDimension2D(width, height);
  return {
    calculateDimension: () => dim,
    drawU: (_ug: UGraphic) => undefined,
  };
}

/**
 * The ink extent of a `folder`/`package` leaf: a `LimitFinder` walk over
 * the REAL `decoration/symbol/USymbolFolder.ts#asSmall` (the SAME class
 * `resolveUSymbol` resolves this symbol to for the actual draw), fed
 * {@link declaredSizeBlock} stand-ins sized by the SAME title/label/stereo
 * derivations {@link measureFolderLeaf} itself uses -- so `asSmall`'s own
 * internal `calculateDimension()` (`dimName.mergeTB(dimStereo, dimLabel)`
 * + `getMargin().addDimension(...)`) recomputes IDENTICALLY to
 * `measureFolderLeaf`'s hand-rolled formula, and the walked ink is bounded
 * by the SAME box the classifier was actually laid out at.
 *
 * `class-layout-description-leaf-ink.ts`'s own doc comment records WHY a
 * generic `EntityImageDescription`-based walk (`measureEntityLeafInk`,
 * every OTHER symbol's route) cannot be reused here instead: it measures
 * a DIFFERENT box than `measureFolderLeaf` sized (`cepedu-19-namu934`
 * widened 430 -> a Δ32 blowout when tried).
 *
 * `undefined` only when `USymbolFolder`'s own drawn shapes leave the
 * `LimitFinder`'s `MinMax` at its empty-infinity sentinel -- never true in
 * practice (`drawFolder` always draws an outline + a divider line).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/symbol/USymbolFolder.java:104-131
 */
/** `USymbolFolder.ts#asSmall`'s returned `TextBlock`, built from {@link
 *  folderBlockDims}'s three {@link declaredSizeBlock} stand-ins -- split
 *  out of {@link measureFolderLeafInk} purely to keep that function under
 *  the project's per-function NLOC cap. */
function folderAsSmallBlock(node: LeafSizingSubject, dims: ReturnType<typeof folderBlockDims>): TextBlock {
  const usymbol = new USymbolFolder(node.symbol, dims.showTitle);
  const ctx = new SymbolContext(null, null, UStroke.simple(), 0, ELEMENT_ROUND_CORNER, 0);
  return usymbol.asSmall(
    declaredSizeBlock(...dims.title),
    declaredSizeBlock(...dims.label),
    declaredSizeBlock(...dims.stereo),
    ctx,
    HorizontalAlignment.CENTER,
  );
}

export function measureFolderLeafInk(
  node: LeafSizingSubject,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  opts: BoxSizingOpts | undefined,
  sprites: SpriteDimsLookup | undefined,
): LeafSymbolInk | undefined {
  const dims = folderBlockDims(node, fontSpec, measurer, opts, sprites);
  const block = folderAsSmallBlock(node, dims);
  const finder = LimitFinder.create(new MeasurerStringBounder(measurer), false);
  block.drawU(finder);
  const minX = finder.getMinX();
  if (!Number.isFinite(minX)) return undefined;
  return { minX, minY: finder.getMinY(), maxX: finder.getMaxX(), maxY: finder.getMaxY() };
}
