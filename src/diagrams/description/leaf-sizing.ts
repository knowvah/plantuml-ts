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
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';
import type { USymbol } from '../../core/descriptive-keywords.js';
import {
  lineCount,
  maxLineWidth,
  atomHeightBonus,
  measureTextBlock,
  footprintBoxes,
} from './leaf-sizing-text.js';
import { boxPoints, containingEllipse } from './usecase-footprint.js';
import { measureFolderLeaf } from './leaf-sizing-folder.js';
import {
  type BoxSizingOpts,
  type ComponentStyle,
  type Dim,
  ACTOR_STICKMAN_HEIGHT,
  ACTOR_STICKMAN_WIDTH,
  BOX_MIN_WIDTH_DEFAULT,
  DEFAULT_BOX_MARGIN,
  FOLDER_FAMILY_SHOW_TITLE,
  INTERFACE_CIRCLE_SIZE,
  LINE_HEIGHT_FACTOR,
  NOTE_FONT_SIZE,
  NOTE_MARGIN_H,
  NOTE_MARGIN_V,
  PORT_SIZE,
  STEREO_MARGIN,
  SYMBOL_BOX_MARGIN,
  SYMBOL_ICON_ALLOWANCE,
  USECASE_ALPHA_MAX,
  USECASE_ALPHA_MIN,
  USECASE_ELLIPSE_BIGGER,
} from './leaf-sizing-consts.js';

/** Re-exported so existing importers of these keep working unchanged. */
export {
  type BoxSizingOpts,
  type ComponentStyle,
  ACTOR_HEIGHT,
  ACTOR_WIDTH,
  INTERFACE_CIRCLE_SIZE,
  PORT_SIZE,
  USECASE_HEIGHT,
} from './leaf-sizing-consts.js';


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
  // `atomHeightBonus` closes the gap this function's doc comment used to
  // flag ("the ellipse's height side of the footprint stays text-only for
  // now -- no corpus fixture exercises a tall atom inside a use-case
  // label"): ruziru-69-xixo434/bootstrap-0 now do, once SVG sprites resolve
  // to real dims. Upstream feeds `TextBlockInEllipse` the WHOLE text block,
  // whose height already includes any `<$sprite>`/`<img>` atom, so the
  // footprint must grow on both axes, not just the width (S1L-f part 2b).
  let textH =
    lineCount(display) * fontSpec.size * LINE_HEIGHT_FACTOR + atomHeightBonus(display, fontSpec, sprites);
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
  // `alpha` comes from the text block's DECLARED dimension
  // (`TextBlockInEllipse`'s ctor: `text.calculateDimension(stringBounder)`),
  // but the ellipse itself is fit to `Footprint`'s collected POINTS, via the
  // smallest enclosing circle of `ContainingEllipse`. The old closed form
  // (`diag = sqrt(W² + (H/alpha)²)` over the bounding box) is exactly right
  // for two opposite corners or a rectangle's four, which covered every
  // text-only and sprite-only display — but not a MIXED one, where the fit
  // becomes order-dependent (S1L-k). See `usecase-footprint.ts`.
  let alpha = textH / textW;
  if (alpha < USECASE_ALPHA_MIN) alpha = USECASE_ALPHA_MIN;
  else if (alpha > USECASE_ALPHA_MAX) alpha = USECASE_ALPHA_MAX;
  // The stereotype block is merged ABOVE the label before the ellipse is fit
  // (EntityImageUseCase.java:96-109), so its lines are drawn too and must
  // contribute footprint points — mopimi-10-jaco443 is entirely stereotyped
  // use-cases.
  const stereoLines = (stereotype ?? []).map((tag) => `«${tag}»`);
  const footprintDisplay = [...stereoLines, ...display.split('\n')].join('\n');
  const boxes = footprintBoxes(footprintDisplay, fontSpec, measurer, sprites, textW);
  const points = boxes.flatMap(boxPoints);
  const fitted = containingEllipse(points, alpha);
  if (fitted !== undefined) {
    return {
      width: fitted.width + USECASE_ELLIPSE_BIGGER,
      height: fitted.height + USECASE_ELLIPSE_BIGGER,
    };
  }
  // No drawn ink at all (an empty display) — fall back to the closed form.
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
  const block = measureTextBlock(node.display, fontSpec, measurer, sprites, {
    lineH,
    maxWidth: opts?.wrapWidth ?? 0,
    ...(opts?.guillemet !== undefined ? { guillemet: opts.guillemet } : {}),
  });
  let contentW = block.width;
  let contentH = block.height;
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
