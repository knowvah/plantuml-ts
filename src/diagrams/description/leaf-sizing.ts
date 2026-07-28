/**
 * Leaf-node box sizing for the description diagram engine.
 *
 * Faithful port of PlantUML's `EntityImageDescription.calculateDimensionSlow`
 * (= `symbol.asSmall(...).calculateDimension`): a leaf box is
 * `margin.addDimension(textBlock)`, i.e. the USymbol's margin added to the
 * text block's dimension. Under the deterministic StringBounder the text block
 * measures `lineCount × fontSize` tall (no inter-line leading) and
 * `maxLineWidth` wide. See `planning/s1l-leaf-sizing.md` and the per-symbol
 * `decoration/symbol/USymbol*.java` `getMargin()` values.
 *
 * D9 (plans/si5b-stdlib/decisions.md): a display line carrying a Creole
 * `<img>`/`<$sprite>` atom contributes the atom's SCALED pixel dims instead
 * of its raw markup text -- see `maxLineWidth`/`atomHeightBonus`, both
 * routed through `../../core/creole-atoms.js`.
 */

import type { DescriptiveNode } from './ast.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import { measureNodeLabel } from '../../core/latex.js';
import type { USymbol } from '../../core/descriptive-keywords.js';
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';
import {
  lineCount,
  textBlockHeight,
  maxLineWidth,
  atomHeightBonus,
} from './leaf-sizing-text.js';

/** `skinparam componentStyle` — only `uml2` (the default) draws the corner
 *  component icon; `uml1` and `rectangle` render a plain box. */
export type ComponentStyle = 'uml2' | 'uml1' | 'rectangle';

/** Per-diagram box-sizing context threaded from `ClassifyCtx` into
 *  `measureLeafNode`. Bundled (rather than separate params) to keep the
 *  sizing signatures within the argument-count budget. */
export interface BoxSizingOpts {
  componentStyle?: ComponentStyle | undefined;
  /** `skinparam minClassWidth` / style `MinimumWidth` (`PName.MinimumWidth`) —
   *  floors the text-block CONTENT width, before margin + icon. Default 0. */
  minimumWidth?: number | undefined;
}

/** Legacy actor box constants (kept for the re-export; the DOT size now comes
 *  from the stickman + label stack below). */
export const ACTOR_WIDTH = 50;
export const ACTOR_HEIGHT = 70;
/** ActorStickMan.getPreferredWidth = max(arms 13, legs 13) × 2 + 2×thickness
 *  = 26 + 1 (default thickness 0.5). */
const ACTOR_STICKMAN_WIDTH = 27;
/** ActorStickMan.getPreferredHeight = headDiam 16 + body 27 + legsY 15 +
 *  2×thickness + 1 = 59 + 1 (default thickness 0.5, no shadow). */
const ACTOR_STICKMAN_HEIGHT = 60;
/** Legacy fixed use-case ellipse height (renderer fallback / re-export). The
 *  actual DOT size now comes from the containing-ellipse formula below. */
export const USECASE_HEIGHT = 40;
/** `UEllipse.bigger(6)` — TextBlockInEllipse enlarges the containing ellipse by
 *  6px on each dimension after fitting it to the text footprint. */
const USECASE_ELLIPSE_BIGGER = 6;
/** Aspect clamp on the containing ellipse (TextBlockInEllipse: alpha in [0.2,0.8]). */
const USECASE_ALPHA_MIN = 0.2;
const USECASE_ALPHA_MAX = 0.8;
/**
 * Default box text-block minimum width (`MinimumWidth` style,
 * `EntityImageDescription:186` / `BodyEnhanced2:114`): 0 — a narrow box is
 * sized purely by its text + margin (verified: oracle `rectangle "i"` = 24px,
 * not floored). `skinparam minClassWidth` / style `MinimumWidth` raise it via
 * `BoxSizingOpts.minimumWidth` (S1L-g).
 */
const BOX_MIN_WIDTH_DEFAULT = 0;

/**
 * Per-USymbol box margin `[horizontal (x1+x2), vertical (y1+y2)]` in px,
 * transcribed verbatim from upstream `decoration/symbol/USymbol*.java`
 * `getMargin()`. Symbols not listed use DEFAULT_BOX_MARGIN.
 */
const SYMBOL_BOX_MARGIN: Partial<Record<USymbol, readonly [number, number]>> = {
  component: [20, 20], // USymbolComponent1 (uml2/default) Margin(10,10,10,10)
  rectangle: [20, 20], // USymbolRectangle
  node: [40, 30], //      USymbolNode        Margin(15,25,20,10)
  frame: [40, 30], //     USymbolFrame       Margin(15,25,20,10)
  folder: [30, 23], //    USymbolFolder      Margin(10,20,13,10)
  package: [30, 23], //   USymbolFolder
  artifact: [30, 23], //  USymbolArtifact    Margin(10,20,13,10)
  card: [20, 6], //       USymbolCard        Margin(10,10,3,3)
  cloud: [20, 20], //     USymbolCloud (non-uml2) Margin(10,10,10,10)
  database: [20, 29], //  USymbolDatabase    Margin(10,10,24,5)
  storage: [20, 20], //   USymbolStorage
  file: [20, 20], //      USymbolFile
  person: [20, 20], //    USymbolPerson
  hexagon: [20, 20], //   USymbolHexagon
  label: [20, 20], //     USymbolLabel
  collections: [20, 20], // USymbolCollections
  queue: [20, 10], //     USymbolQueue       Margin(5,15,5,5)
  stack: [50, 20], //     USymbolStack       Margin(25,25,10,10)
  action: [30, 20], //    USymbolAction      Margin(10,20,10,10)
  process: [40, 20], //   USymbolProcess     Margin(20,20,10,10)
  agent: [20, 20], //     rectangle-like
};
/** Margin for any box symbol not in SYMBOL_BOX_MARGIN (upstream default). */
const DEFAULT_BOX_MARGIN: readonly [number, number] = [20, 20];

/** Stereotype line horizontal margin — `TextBlockUtils.withMargin(stereo, 1, 0)`
 *  in EntityImageDescription adds 1px each side (+2 total width, +0 height). */
const STEREO_MARGIN = 2;

/**
 * Per-line text height as a multiple of the font size. In the DETERMINISTIC
 * text mode that the oracle goldens use, `StringBounderFromWidthTable
 * .calculateDimension` returns height = size (no Creole leading), so a text
 * block is exactly `lineCount × size` tall — matching our own
 * `WidthTableMeasurer` (which likewise returns height = size). Hence 1.0.
 *
 * (An earlier value of 1.177736 was calibrated against the AWT build of the
 * oracle jar in `oracle/dist`, which is NOT the deterministic-patched jar that
 * produced the goldens — AWT adds ~2.5px/line of leading. Component golden
 * height 44px = 20 margin + 14 line + 10 icon confirms line = size = 14.)
 */
const LINE_HEIGHT_FACTOR = 1.0;

/**
 * Fixed pixel allowance `[width, height]` a USymbol's decoration adds on top of
 * its text box, independent of the font. UML2 `component` reserves space for
 * the corner component icon (measured `+20w, +10h` vs a plain rectangle in the
 * deterministic oracle). Symbols with no decoration add nothing.
 */
const SYMBOL_ICON_ALLOWANCE: Partial<Record<USymbol, readonly [number, number]>> = {
  component: [20, 10], // USymbolComponent1 UML2 corner icon
  cloud: [10, 10], //    cloud puffs (verified: cloud "L" 37.5×46.5 vs rect 27.5×36.5)
  // folder/package are NOT here: both are USymbolFolder and route to
  // `measureFolderLeaf`, never `measureBox`. It models the tab as the mergeTB
  // block upstream makes it, so the tab FLOORS the width as well as adding
  // height -- which a fixed icon allowance cannot express (S1L-a).
};

/** Fixed square a `port`/`portin`/`portout` leaf occupies
 *  (EntityPosition.RADIUS * 2, abel/EntityPosition.java:56). */
export const PORT_SIZE = 12;

/**
 * `USymbolFolder(sname, showTitle)` — the ONE symbol class behind both
 * `folder` (`showTitle=false`) and `package` (`showTitle=true`)
 * (USymbols.java:79/86). Absence from this table means "not the folder
 * family"; see `measureFolderLeaf` for why the two forms size differently.
 * `artifact` is deliberately NOT here: it shares the folder MARGIN but is
 * USymbolArtifact, and already measures exact.
 */
const FOLDER_FAMILY_SHOW_TITLE: Partial<Record<USymbol, boolean>> = {
  folder: false,
  package: true,
};

/** `USymbolFolder.getDimTitle` when `showTitle == false`: the tab is a FIXED
 *  `XDimension2D(40, 15)` block, independent of any text
 *  (USymbolFolder.java:172). It enters `mergeTB` as a normal block, so the 40
 *  FLOORS the leaf's content width and the 15 adds to its height. */
const FOLDER_TAB_WIDTH = 40;
const FOLDER_TAB_HEIGHT = 15;

/**
 * Extra width a SHOWN folder title contributes beyond its own text
 * (`package`). Measured exactly 12px against the deterministic oracle at
 * three different title widths — `package a` 49.787496 vs our 37.7875,
 * `package iiii` 54.599976 vs 42.6, `package WWWWWWWW` 147.700008 vs 135.7
 * (deltas 11.999996 / 11.999976 / 12.000008, i.e. 12 within DOT's
 * 6-decimal-inch rounding).
 *
 * NOT attributed to a single upstream expression: `USymbolFolder`'s own
 * `calculateDimension` adds only `getMargin()` (= [30, 23]) to
 * `dimName.mergeTB(...)`, so the 12 lives inside the title TextBlock itself.
 * Nearby candidates that do NOT sum to it: `marginTitleX1 + marginTitleX2`
 * = 6 (the drawn tab's own inset, USymbolFolder.java:60-61), `+ marginTitleX3`
 * = 13 (the tab slant's right edge), and the title's `UTranslate(4, 3)` draw
 * offset. Recorded as measured rather than guessed at; it applies ONLY to the
 * showTitle slot — a `folder`'s label text takes no such allowance (verified:
 * `folder WWWWWWWWW` is exact at labelW + 30).
 */
const FOLDER_SHOWN_TITLE_EXTRA_WIDTH = 12;

/** Fixed square a `hideText` leaf (interface/circle) occupies:
 *  `CircleInterface2.calculateDimension` = `radius * 2 + 2 * margin` with
 *  `radius = 8`, `margin = 1` -> 18px = 0.25in exactly.
 *  @see .../svek/CircleInterface2.java#calculateDimension */
export const INTERFACE_CIRCLE_SIZE = 18;

// EntityImageNote sizing. Notes use FontParam.NOTE — a fixed 13px font, not the
// theme's default. Total horizontal margin (text padding + folded corner) and
// vertical margin measured exactly against the deterministic oracle.
const NOTE_FONT_SIZE = 13;
const NOTE_MARGIN_H = 21;
const NOTE_MARGIN_V = 10;

type Dim = { width: number; height: number };

/**
 * Measure a leaf node's bounding box, dispatching by USymbol to the shape's
 * own sizing rule:
 *
 * - port → fixed PORT_SIZE square
 * - note → multi-line body + folded-corner padding (NOTE_* constants)
 * - actor / actor-business → fixed ACTOR_WIDTH × ACTOR_HEIGHT
 * - usecase / usecase-business → USECASE_HEIGHT; width from text or LaTeX
 * - everything else → USymbol box (per-symbol margin + multi-line text block)
 *
 * `sprites` (D9): an optional per-diagram sprite-dims lookup, consulted by
 * `maxLineWidth`/`atomHeightBonus` when a display line embeds a
 * `<$sprite>` atom. Undefined when no registry is available (unknown
 * sprites then contribute nothing, per `creole-atoms.ts#measureInlineAtom`).
 */
export function measureLeafNode(
  node: DescriptiveNode,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  opts?: BoxSizingOpts,
  sprites?: SpriteDimsLookup,
): Dim {
  switch (node.symbol) {
    case 'port':
      // EntityImagePort.calculateDimensionSlow: fixed RADIUS*2 square,
      // independent of the display text (the text drives the shape choice
      // instead — see isPortLabelWide/portTablePad in layout-helpers).
      return { width: PORT_SIZE, height: PORT_SIZE };
    case 'interface':
    case 'circle':
      // EntityImageDescription.java:137 `hideText = symbol == USymbols
      // .INTERFACE`, then :209-211 builds asSmall from EMPTY name/desc/
      // stereo. calculateDimensionSlow returns that asSmall dimension, so a
      // hideText leaf measures the bare CircleInterface2 square regardless of
      // its label. The label is drawn OUTSIDE the node; when the shield is
      // not suppressed, `getShield` reserves room for it as HTML-table
      // margins around this square (see isInterfaceShielded) rather than by
      // growing it. `circle` shares the mechanism -- Entity.getUSymbol maps
      // LeafType.CIRCLE to USymbols.INTERFACE unconditionally (see
      // layout-helpers-shape-endpoint.ts#shapeForNode).
      return { width: INTERFACE_CIRCLE_SIZE, height: INTERFACE_CIRCLE_SIZE };
    case 'note':
      return measureNote(node.display, fontSpec, measurer, sprites);
    case 'actor':
    case 'actor-business':
      return measureActor(node.display, fontSpec, measurer, sprites);
    case 'usecase':
    case 'usecase-business':
      return measureUsecase(node.display, fontSpec, measurer, sprites, node.stereotype);
    default:
      return FOLDER_FAMILY_SHOW_TITLE[node.symbol] === undefined
        ? measureBox(node, fontSpec, measurer, opts, sprites)
        : measureFolderLeaf(node, fontSpec, measurer, opts, sprites);
  }
}

/** EntityImageNote: multi-line body, folded top-right corner. Notes measure at
 *  the fixed 13px note font (FontParam.NOTE), not the theme size. Width = widest
 *  line + horizontal margin; height = line count × 13 + vertical margin. Exact
 *  vs the deterministic oracle ("Hello" 50.74×23, 2-line 67.31×36). */
function measureNote(
  display: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites?: SpriteDimsLookup,
): Dim {
  const noteFont: FontSpec = { ...fontSpec, size: NOTE_FONT_SIZE };
  return {
    width: maxLineWidth(display, noteFont, measurer, sprites) + NOTE_MARGIN_H,
    height: lineCount(display) * NOTE_FONT_SIZE + NOTE_MARGIN_V + atomHeightBonus(display, noteFont, sprites),
  };
}

/**
 * Actor — the stick-figure stacked above its label (USymbolSimpleAbstract
 * .asSmall -> mergeLayoutT12B3(stereo, stickman, label)): width is the wider of
 * the stickman (27px) and the label; height is the stickman (60px) plus the
 * label. Exact against the deterministic oracle ("Bob" 27x74, "A Long Actor
 * Name" 110.51x74). actor-business shares the same bounding box.
 */
export function measureActor(
  display: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites?: SpriteDimsLookup,
): Dim {
  return {
    width: Math.max(ACTOR_STICKMAN_WIDTH, maxLineWidth(display, fontSpec, measurer, sprites)),
    height:
      ACTOR_STICKMAN_HEIGHT +
      lineCount(display) * fontSpec.size * LINE_HEIGHT_FACTOR +
      atomHeightBonus(display, fontSpec, sprites),
  };
}

/**
 * Use-case ellipse — faithful port of `TextBlockInEllipse` +
 * `ContainingEllipse` (EntityImageUseCase.calculateDimensionSlow). The ellipse
 * is the smallest circle enclosing the text footprint after the Y axis is
 * scaled by 1/alpha, so:
 *   alpha = clamp(textH / textW, 0.2, 0.8)
 *   diag  = √(textW² + (textH / alpha)²)     // 2×SEC radius of the scaled box
 *   width  = diag + 6,   height = alpha × diag + 6   // UEllipse.bigger(6)
 * Exact against the deterministic oracle (footprint = text bounding box):
 * "L" 25.15×21.32, "Hello World" 103.0×25.8.
 *
 * `sprites` widens the footprint (via `maxLineWidth`) when the display
 * embeds an img/sprite atom; the ellipse's height side of the footprint
 * stays text-only for now (no corpus fixture exercises a tall atom inside
 * a use-case label -- flagged as a follow-up alongside T9's registry wiring).
 *
 * `stereotype` (G1 I5b): a stereotyped use-case merges the guillemet block
 * ABOVE the label footprint before the ellipse is fit (mergeTB,
 * EntityImageUseCase.java:96-109) -- previously unwired entirely (every
 * use-case stereotype, single or multi-tag, contributed zero footprint
 * growth; pre-existing gap, first surfaced diagnosing mopimi-10-jaco443).
 */
export function measureUsecase(
  display: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites?: SpriteDimsLookup,
  stereotype?: readonly string[],
): Dim {
  if (display.includes('<latex>')) {
    return measureNodeLabel(display, measurer, fontSpec);
  }
  let textW = maxLineWidth(display, fontSpec, measurer, sprites);
  let textH = lineCount(display) * fontSpec.size * LINE_HEIGHT_FACTOR;
  if (stereotype !== undefined && stereotype.length > 0) {
    // EntityImageUseCase.java:96-109 -- mergeTB(stereo, desc) stacks the
    // stereotype block ABOVE the label BEFORE TextBlockInEllipse measures
    // the merged footprint (G1 I5b). This port draws stereotype text via
    // the SAME shared `buildStereo` (EntityImageDescriptionSupport.ts,
    // `withMargin(1,1,0,0)`) for every leaf shape -- unlike upstream's
    // per-class EntityImageUseCase (no margin), a deliberate architecture
    // consolidation (ast.ts D1/D2) -- so STEREO_MARGIN is applied here too,
    // to stay internally consistent with what the render path actually
    // draws (see `measureBox`'s identical convention below).
    const stereoWidth = Math.max(...stereotype.map((s) => measurer.measure(`«${s}»`, fontSpec).width));
    textW = Math.max(textW, stereoWidth + STEREO_MARGIN);
    textH += stereotype.length * fontSpec.size * LINE_HEIGHT_FACTOR;
  }
  let alpha = textH / textW;
  if (alpha < USECASE_ALPHA_MIN) alpha = USECASE_ALPHA_MIN;
  else if (alpha > USECASE_ALPHA_MAX) alpha = USECASE_ALPHA_MAX;
  const diag = Math.sqrt(textW * textW + (textH / alpha) * (textH / alpha));
  return {
    width: diag + USECASE_ELLIPSE_BIGGER,
    height: alpha * diag + USECASE_ELLIPSE_BIGGER,
  };
}

/** Decoration allowance `[w, h]` for a box symbol. Only the default `uml2`
 *  component draws the corner icon; `uml1`/`rectangle` render a plain box
 *  (verified against the oracle: both identical to a plain rectangle). */
function boxIcon(symbol: USymbol, componentStyle: ComponentStyle | undefined): readonly [number, number] {
  if (symbol === 'component' && componentStyle !== undefined && componentStyle !== 'uml2') {
    return [0, 0];
  }
  return SYMBOL_ICON_ALLOWANCE[symbol] ?? [0, 0];
}

/** USymbol box. Faithful to EntityImageDescription: asSmall.calculateDimension
 *  = margin.addDimension(stereo ⊕ textBlock). The content is the stereotype
 *  line (`«name»`, +2px `withMargin(1,0)`) stacked above the label
 *  (`mergeTB`): width = max(labelW, stereoW), height = labelH + stereoH.
 *  Then + per-symbol margin and icon; floored at BOX_MIN_WIDTH.
 *
 *  `sprites` (D9): an img/sprite atom on a display line adds its scaled
 *  width to `contentW` and (via `atomHeightBonus`) grows `contentH` beyond
 *  the plain `lineCount * lineH` when the atom is taller than one text line
 *  -- this is what moves the six awslib-icon fixtures' DOT output. */
function measureBox(
  node: DescriptiveNode,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  opts: BoxSizingOpts | undefined,
  sprites?: SpriteDimsLookup,
): Dim {
  const [marginH, marginV] = SYMBOL_BOX_MARGIN[node.symbol] ?? DEFAULT_BOX_MARGIN;
  const [iconW, iconH] = boxIcon(node.symbol, opts?.componentStyle);
  const lineH = fontSpec.size * LINE_HEIGHT_FACTOR;
  let contentW = maxLineWidth(node.display, fontSpec, measurer, sprites);
  let contentH = textBlockHeight(node.display, lineH) + atomHeightBonus(node.display, fontSpec, sprites);
  if (node.stereotype !== undefined && node.stereotype.length > 0) {
    // G1 I5b: one guillemet line per stereotype tag (Stereotype
    // #getMultipleLabels(), EntityImageDescription.java:200-201) -- width
    // is the WIDEST label (not the sum), height grows by one lineH per tag.
    const stereoWidth = Math.max(...node.stereotype.map((s) => measurer.measure(`«${s}»`, fontSpec).width));
    contentW = Math.max(contentW, stereoWidth + STEREO_MARGIN);
    contentH += lineH * node.stereotype.length; // one stereotype line per tag, above the label
  }
  // MinimumWidth floors the CONTENT width (before margin + icon), matching the
  // oracle: `skinparam minClassWidth 200` gives `component foo` 240px =
  // max(text,200) + 20 margin + 20 icon; package `not_nested` @MinimumWidth 300
  // = 300 + 30 margin. Default 0 (no floor).
  const minContentW = opts?.minimumWidth ?? BOX_MIN_WIDTH_DEFAULT;
  return {
    width: Math.max(minContentW, contentW) + marginH + iconW,
    height: contentH + marginV + iconH,
  };
}

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
 */
function measureFolderLeaf(
  node: DescriptiveNode,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  opts: BoxSizingOpts | undefined,
  sprites: SpriteDimsLookup | undefined,
): Dim {
  const symbol = node.symbol;
  const [marginH, marginV] = SYMBOL_BOX_MARGIN[symbol] ?? DEFAULT_BOX_MARGIN;
  const lineH = fontSpec.size * LINE_HEIGHT_FACTOR;
  const showTitle = FOLDER_FAMILY_SHOW_TITLE[symbol] === true;
  // showTitle puts the CODE in the title slot and the display in the label
  // only when it differs; !showTitle leaves the title fixed (40, 15) and the
  // display is the whole label.
  const [titleW, titleH] = folderTitleBlock(node, fontSpec, measurer, showTitle);
  const labelText = showTitle && node.display === node.id ? '' : node.display;
  const [labelW, labelH] = folderTextBlock(labelText, fontSpec, measurer, sprites);
  const [stereoW, stereoH] = folderStereoBlock(node, fontSpec, measurer, lineH);

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

/** `dimName` — the fixed (40, 15) tab when `showTitle` is false, else the
 *  element CODE's own text block plus {@link FOLDER_SHOWN_TITLE_EXTRA_WIDTH}. */
function folderTitleBlock(
  node: DescriptiveNode,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  showTitle: boolean,
): readonly [number, number] {
  if (!showTitle) return [FOLDER_TAB_WIDTH, FOLDER_TAB_HEIGHT];
  const lineH = fontSpec.size * LINE_HEIGHT_FACTOR;
  return [
    maxLineWidth(node.id, fontSpec, measurer) + FOLDER_SHOWN_TITLE_EXTRA_WIDTH,
    textBlockHeight(node.id, lineH),
  ];
}

/** `dimLabel` — an EMPTY label contributes a zero block, not a blank line
 *  (`''.split('\n')` would otherwise bill it one `lineH`). */
function folderTextBlock(
  text: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites: SpriteDimsLookup | undefined,
): readonly [number, number] {
  if (text === '') return [0, 0];
  const lineH = fontSpec.size * LINE_HEIGHT_FACTOR;
  return [
    maxLineWidth(text, fontSpec, measurer, sprites),
    textBlockHeight(text, lineH) + atomHeightBonus(text, fontSpec, sprites),
  ];
}

/** `dimStereo` — the third mergeTB block: widest guillemet label, one line of
 *  height per tag (the same rule `measureBox` applies). */
function folderStereoBlock(
  node: DescriptiveNode,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  lineH: number,
): readonly [number, number] {
  const tags = node.stereotype;
  if (tags === undefined || tags.length === 0) return [0, 0];
  const widest = Math.max(...tags.map((s) => measurer.measure(`«${s}»`, fontSpec).width));
  return [widest + STEREO_MARGIN, lineH * tags.length];
}
