/**
 * Leaf-node box sizing for the description diagram engine.
 *
 * T6 (description-leaf-sizing-audit, ADR-6): `measureLeafNode` routes most
 * USymbols through the SAME faithful path the renderer already uses --
 * `EntityImageDescription.calculateDimensionSlow` = `symbol.asSmall(name,
 * desc, stereo, ctx, align).calculateDimension`, upstream's own sizing entry
 * point (`svek/image/EntityImageDescription.java`) -- superseding the flat
 * per-symbol tables that used to re-derive this geometry independently. See
 * `measureLeafNode`'s own doc comment for the per-case dispatch, including
 * the widened-pin diagnoses (folder/package, usecase+atom markup, box+atom
 * markup) that keep three families off this routing.
 *
 * `measureActor`/`measureUsecase` (exported below) are UNCHANGED: `src/
 * diagrams/class/class-layout-leaf-shapes.ts` imports both directly for the
 * class-diagram engine's own actor/use-case classifier shapes (a SEPARATE
 * ratchet, `measure-class-size-deltas.ts`, required to stay ZERO-DIFF) --
 * routing them would risk a ratchet this task does not own.
 *
 * See `planning/s1l-leaf-sizing.md`, `planning/usymbol-composition.md`,
 * `planning/sizer-renderer-parity.md`, and `plans/description-leaf-sizing-audit
 * /decisions.md` (ADR-6) for the full investigation this rewrite is based on.
 */

import type { DescriptiveNode } from './ast.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import { measureNodeLabel } from '../../core/latex.js';
import { measureInlineAtom } from '../../core/creole-atoms-measure.js';
import type { SpriteDimsLookup, AtomImageResolver } from '../../core/creole-atoms.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import { EntityImageDescription, type EntityImageDescriptionParams } from '../../core/svek/image/EntityImageDescription.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { FontStyle } from '../../core/klimt/shape/UText.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { GUILLEMET_DEFAULT } from '../../core/text/Guillemet.js';
import { upstreamKeyword, mapComponentStyle, resolveActorStyle } from './renderer-symbol.js';
import {
  lineCount,
  maxLineWidth,
  atomHeightBonus,
  footprintBoxes,
} from './leaf-sizing-text.js';
import { boxPoints, containingEllipse } from './usecase-footprint.js';
import { measureFolderLeaf } from './leaf-sizing-folder.js';
import { hasUnroutedBoxMarkup, measureLegacyBoxFallback } from './leaf-sizing-legacy-fallback.js';
import {
  type BoxSizingOpts,
  type Dim,
  ACTOR_STICKMAN_HEIGHT,
  ACTOR_STICKMAN_WIDTH,
  DEFAULT_SIZING_STROKE_THICKNESS,
  FOLDER_FAMILY_SHOW_TITLE,
  INTERFACE_CIRCLE_SIZE,
  LINE_HEIGHT_FACTOR,
  NOTE_FONT_SIZE,
  NOTE_MARGIN_H,
  NOTE_MARGIN_V,
  PORT_SIZE,
  STEREO_MARGIN,
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
 * Measure a leaf node's bounding box, dispatching by USymbol: port/note stay
 * on their unported fixed/text draw classes; interface/circle stay a fixed,
 * ctx-independent square; folder/package and usecase(-business) with atom
 * markup stay on their pre-T6 math (see each `case`'s own comment for why);
 * everything else routes through `EntityImageDescription
 * .calculateDimensionSlow` (`measureEntityLeaf`), the SAME faithful path the
 * renderer uses.
 *
 * `sprites` (D9): an optional per-diagram sprite-dims lookup, consulted (via
 * `measureInlineAtom`) when a display line embeds a `<$sprite>` atom.
 */
export function measureLeafNode(
  node: DescriptiveNode,
  baseFont: FontSpec,
  measurer: StringMeasurer,
  opts?: BoxSizingOpts,
  sprites?: SpriteDimsLookup,
): Dim {
  // A per-element `FontSize` override applies to every symbol's measurement,
  // so it is resolved once here rather than in each per-symbol rule (S1L-h).
  const fontSpec = opts?.fontSize === undefined ? baseFont : { ...baseFont, size: opts.fontSize };
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
      // its label. `CircleInterface2.calculateDimension` never reads
      // ctx.getStroke()/getDeltaShadow() (verified), so this fixed constant
      // stays exact without routing through EntityImageDescription. `circle`
      // shares the mechanism -- Entity.getUSymbol maps LeafType.CIRCLE to
      // USymbols.INTERFACE unconditionally.
      return { width: INTERFACE_CIRCLE_SIZE, height: INTERFACE_CIRCLE_SIZE };
    case 'note':
      return measureNote(node.display, fontSpec, measurer, sprites);
    case 'folder':
    case 'package':
      // Widened-pin diagnosis (this task): routing drops
      // `FOLDER_SHOWN_TITLE_EXTRA_WIDTH` (12px), a jar-verified residual
      // this port's `USymbolFolder`/`buildTextBlock` title measurement
      // (svek/, out of write-set) does not reproduce -- 8 corpus fixtures
      // flip to size-widened (bozana-38-xufi750, bozoju-49-kufo528,
      // gucefa-91-pume734, kanute-77-lacu414, lotofa-28-rudo664,
      // sevage-80-seva382, texacu-57-daci050, cobuju-30-paxo591). Kept on
      // the pre-existing `measureFolderLeaf` path -- never one of ADR-6's
      // six expected findings, so a scope narrowing, not a lost win.
      return measureFolderLeaf(node, fontSpec, measurer, opts, sprites);
    case 'usecase':
    case 'usecase-business':
      // Widened-pin diagnosis (this task): `<latex>` measures as a real,
      // non-zero-width KaTeX render via the shared svek/ pipeline -- worse
      // against the 2 permanently-divergent LaTeX fixtures (DIVERGENCES.md).
      // `<$sprite>` loses `inlineFootprintBox`'s ink-extent fit (the shared
      // `AtomImageResolver` has no ink-offset field) -- bootstrap-0,
      // ruziru-69-xixo434. Both are svek/ gaps (out of write-set);
      // `measureUsecase` (kept, unchanged) already handles both correctly.
      return hasUnroutedUsecaseMarkup(node.display)
        ? measureUsecase(node.display, fontSpec, measurer, sprites, node.stereotype)
        : measureEntityLeaf(node, fontSpec, { opts, sprites, measurer }, false);
    case 'actor':
    case 'actor-business':
    case 'control':
    case 'entity':
    case 'boundary':
      // `USymbolSimpleAbstract` family (stickman/fixed-drawing + label
      // stack) -- never went through `measureBox`'s box-margin math even
      // pre-T6 (a DIFFERENT composition, `mergeLayoutT12B3`), so the
      // box-family `<latex>`/`<img>` fallback below does not apply here.
      return measureEntityLeaf(node, fontSpec, { opts, sprites, measurer }, false);
    default:
      // Every other (true) box symbol (component, rectangle, node, frame,
      // artifact, card, cloud, database, storage, file, person, hexagon,
      // label, collections, queue, stack, action, process, agent) routes
      // through the same faithful call -- except a `<latex>`/`<img>`-bearing
      // display, which falls back to the pre-T6 math for the SAME class of
      // reason as usecase's own guard above (see `leaf-sizing-legacy-
      // fallback.ts`'s module doc comment for the exact mechanism --
      // jecici-56-bimu826). Only the generic box family floors content
      // width against `opts.minimumWidth` (S1L-g).
      if (hasUnroutedBoxMarkup(node.display)) {
        return measureLegacyBoxFallback(node, fontSpec, { measurer, opts, sprites, defaultFont: baseFont });
      }
      return measureEntityLeaf(
        node, fontSpec, { opts, sprites, measurer },
        FOLDER_FAMILY_SHOW_TITLE[node.symbol] === undefined,
      );
  }
  // #lizard forgives -- a flat USymbol dispatch `switch` (this project's
  // established shape for this exact function, pre-T6); the per-case bodies
  // are 1-4 lines each, none independently over any threshold.
}

/** `<latex>`/`<$sprite>`/`<img>` markup a use-case display embeds that this
 *  task's routing does not yet reproduce byte-exact -- see the dispatch's
 *  own doc comment for the mechanism each guards against. */
function hasUnroutedUsecaseMarkup(display: string): boolean {
  return display.includes('<latex>') || display.includes('<$') || display.includes('<img');
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
 *
 * UNCHANGED by T6 -- kept for `class-layout-leaf-shapes.ts`'s import; see
 * module doc comment.
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
 * UNCHANGED by T6 -- kept for `class-layout-leaf-shapes.ts`'s import AND as
 * the sizer's own atom/latex-markup fallback (see module doc comment); the
 * default (no atom markup) dispatch instead routes through
 * `measureEntityLeaf` (`EntityImageDescription.calculateDimensionSlow`, the
 * SAME `TextBlockInEllipse`/`Footprint` classes, faithfully).
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
    // draws.
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
  // #lizard forgives -- pre-existing, kept VERBATIM (this file's module doc
  // comment: UNCHANGED by T6/ADR-6, retained only for `class-layout-leaf-
  // shapes.ts`'s own import). Not refactored here per this project's porting
  // discipline (do not restructure code while unrelated work is in flight).
}

// ---------------------------------------------------------------------------
// T6 (ADR-6): route through EntityImageDescription
// ---------------------------------------------------------------------------

/** No style flags — every sizing-only `FontConfiguration` below carries this
 *  (styles never reach `StringBounder.calculateDimension`, whose font
 *  parameter is narrowed to `family`/`size` only — see that interface's own
 *  doc comment). */
const SIZING_FONT_STYLES: ReadonlySet<FontStyle> = new Set();

/** `EntityImageDescription#calculateDimensionSlow` never reads
 *  forecolor/backcolor: `SymbolContext#getBackColor`/`getForeColor` are
 *  consumed only by `apply`/`applyColors`, both DRAW-time methods (verified
 *  across `USymbolRectangle`/`Database`/`Hexagon`/`Folder`/`Person`'s own
 *  `asSmall` `calculateDimension` closures — none touch the ambient
 *  `symbolContext`'s colors at all). Any string satisfies the `Paint` type
 *  the params object requires; this documents intent rather than being a
 *  real color. */
const SIZING_PLACEHOLDER_COLOR = '#000000';

/**
 * Sizing-only `AtomImageResolver` factory: resolves a creole `<img>`/
 * `<$sprite>`/openiconic atom to its SCALED pixel dims via the SAME
 * `measureInlineAtom` the pre-T6 sizer used (`leaf-sizing-text.ts`'s
 * `maxLineWidth`/`atomHeightBonus`), against the dims-only `SpriteDimsLookup`
 * this engine already threads (`BoxSizingOpts`/`measureLeafNode`'s own
 * `sprites` param) — no `SpriteRegistry` (real pixel/tint data, render-only)
 * is available or needed here, since `calculateDimension` never reads
 * `href`. An unresolved sprite name (`sprites?.get` returns `undefined`)
 * measures as a 0×0 atom via `measureInlineAtom`'s own fallback — numerically
 * equivalent to `render-atoms.ts`'s "contributes nothing" (`undefined`)
 * convention for `calculateDimension` purposes (both add 0 to the running
 * width/height sum), so no divergence from the render path's own resolver.
 */
function sizingAtomImageResolverFor(sprites: SpriteDimsLookup | undefined): (font: FontConfiguration) => AtomImageResolver {
  return (font) => (atom) => {
    const dims = measureInlineAtom(atom, sprites, font.size);
    return { href: '', width: dims.width, height: dims.height };
  };
}

/** Bundles the three per-diagram inputs `measureEntityLeaf`/
 *  `buildSizingEntityParams` need alongside a `node`/`fontSpec` pair, so
 *  neither function's own parameter count grows with this task's added
 *  routing plumbing (this project's 5-param complexity-hook ceiling). */
interface EntityLeafCtx {
  readonly opts: BoxSizingOpts | undefined;
  readonly sprites: SpriteDimsLookup | undefined;
  readonly measurer: StringMeasurer;
}

/** `paint.fontTitle`/`fontStereo` (T6, ADR-6): the SAME `fontSpec` for both
 *  slots, matching the pre-routing sizer's own convention (`measureBox`'s
 *  stereotype width read `fontSpec` directly, never a separate stereotype
 *  size) -- `resolveElementFontSize(theme, sname, 'stereotype')`'s distinct
 *  per-element override is a SEPARATE, unlisted gap this task does not
 *  introduce or fix (out of ADR-6's six expected findings). */
function sizingFontConfig(fontSpec: FontSpec): FontConfiguration {
  return { family: fontSpec.family, size: fontSpec.size, color: null, styles: SIZING_FONT_STYLES };
}

/** `EntityImageDescriptionPaint` assembly, split out of `buildSizingEntityParams`
 *  purely to keep that function under this project's complexity-hook NLOC/CCN
 *  ceiling -- see this module's "Deliberately NOT threaded" doc comment
 *  (below, on `buildSizingEntityParams`) for why each field takes the value
 *  it does. */
function sizingPaint(font: FontConfiguration, opts: BoxSizingOpts | undefined): EntityImageDescriptionParams['paint'] {
  return {
    forecolor: SIZING_PLACEHOLDER_COLOR,
    backcolor: SIZING_PLACEHOLDER_COLOR,
    roundCorner: 0,
    diagonalCorner: 0,
    deltaShadow: 0,
    stroke: UStroke.withThickness(DEFAULT_SIZING_STROKE_THICKNESS),
    fontTitle: font,
    fontStereo: font,
    titleAlignment: HorizontalAlignment.CENTER,
    stereotypeAlignment: HorizontalAlignment.CENTER,
    minimumWidth: opts?.minimumWidth ?? 0,
    wrapWidth: opts?.wrapWidth ?? 0,
    guillemet: opts?.guillemet ?? GUILLEMET_DEFAULT,
  };
}

/**
 * Assembles `EntityImageDescriptionParams` for ONE leaf, from exactly what
 * `BoxSizingOpts`/`DescriptiveNode` already carry — mirrors
 * `renderer-entity.ts#buildEntityParams`'s field-for-field shape (private to
 * the renderer, so this is a parallel assembly of the SAME params, not a
 * call to it).
 *
 * Deliberately NOT threaded (verified draw-only, or out of write-set):
 * `forecolor`/`backcolor` (`SIZING_PLACEHOLDER_COLOR`), `roundCorner`/
 * `diagonalCorner`, `deltaShadow`/`stroke` per-element overrides
 * (`resolveElementShadowing`/`LineThickness` need `Theme` in `layout.ts`'s
 * `ClassifyCtx` -- T9's write-set; the DEFAULT stroke IS supplied, see
 * `DEFAULT_SIZING_STROKE_THICKNESS`), `links`/`hexagonPolygon`, and
 * `fixCircleLabelOverlapping` (only feeds `resolveShapeType`, never
 * `calculateDimensionSlow`). `actorStyle` IS threaded (T7, see below) --
 * no longer a hardcode.
 *
 * `actorStyle` (T7, description-leaf-sizing-audit): `ctx.opts?.actorStyle`
 * (`BoxSizingOpts.actorStyle`, threaded from `Theme.actorStyle` by
 * `layout.ts`/`layout-dot-tree.ts`) — the SAME accessor the RENDERER reads
 * (`renderer-entity.ts#buildEntityParams`), so an actor sizes to whichever
 * of stickman/awesome/hollow it will actually be drawn as. Falls back to
 * `ActorStyle.STICKMAN`, upstream's own default (`SkinParam.java:1217`),
 * when no `skinparam actorStyle` was set.
 */
function buildSizingEntityParams(
  node: DescriptiveNode,
  fontSpec: FontSpec,
  ctx: EntityLeafCtx,
): EntityImageDescriptionParams {
  const font = sizingFontConfig(fontSpec);
  return {
    entity: { name: node.id, uid: '', qualifiedName: node.id, location: null, url: null },
    symbol: {
      keyword: upstreamKeyword(node.symbol),
      actorStyle: resolveActorStyle(ctx.opts?.actorStyle),
      componentStyle: mapComponentStyle(ctx.opts?.componentStyle),
    },
    labels: {
      codeName: node.display,
      displayText: node.display,
      stereotypeLabels: node.stereotype ?? [],
    },
    paint: sizingPaint(font, ctx.opts),
    links: [],
    fixCircleLabelOverlapping: false,
    atomImageResolverFor: sizingAtomImageResolverFor(ctx.sprites),
  };
}

/** The margin+icon-only baseline `measureEntityLeaf`'s `MinimumWidth` floor
 *  needs: the SAME symbol, constructed with zero content/stereotype/
 *  minimumWidth, so its `calculateDimensionSlow` width is exactly the fixed
 *  additive allowance the real (non-empty) measurement already carries on
 *  top of its content -- see `measureEntityLeaf`'s own doc comment. */
function minWidthFloorBaseline(node: DescriptiveNode, fontSpec: FontSpec, ctx: EntityLeafCtx, bounder: MeasurerStringBounder): number {
  // `stereotype` omitted, not set to `undefined` (`exactOptionalPropertyTypes`).
  const { stereotype: _dropped, ...rest } = node;
  const baselineNode: DescriptiveNode = { ...rest, display: '' };
  const baselineCtx: EntityLeafCtx = { ...ctx, opts: ctx.opts === undefined ? undefined : { ...ctx.opts, minimumWidth: 0 } };
  const params = buildSizingEntityParams(baselineNode, fontSpec, baselineCtx);
  return new EntityImageDescription(params).calculateDimensionSlow(bounder).getWidth();
}

/**
 * Routes one leaf through `EntityImageDescription.calculateDimensionSlow` --
 * upstream's own sizing entry point, ALREADY used by the renderer (ADR-6).
 *
 * `applyMinWidthFloor` (box family only): `buildDesc` (svek/, out of
 * write-set) reads `paint.minimumWidth` ONLY on its "empty desc" branch --
 * already correct for `package` (`displayText === codeName` always holds
 * here, so its desc always takes that branch), but silently skipped for
 * non-blank box text (jar-verified: `component/dexigu-24-deru622`,
 * `minClassWidth 200; component foo` -> 240 = max(24,200)+40, not 24+40).
 * Reproduced as a POST-STEP via `minWidthFloorBaseline` (a synthetic
 * zero-content construction of the same params, not a re-derived formula):
 * `Math.max(real, minimumWidth + baseline)` -- can only WIDEN, never shrink
 * below upstream's own margin+icon, and is skipped when no floor is set.
 */
function measureEntityLeaf(
  node: DescriptiveNode,
  fontSpec: FontSpec,
  ctx: EntityLeafCtx,
  applyMinWidthFloor: boolean,
): Dim {
  const bounder = new MeasurerStringBounder(ctx.measurer);
  const params = buildSizingEntityParams(node, fontSpec, ctx);
  const dim = new EntityImageDescription(params).calculateDimensionSlow(bounder);
  const width = dim.getWidth();
  const height = dim.getHeight();

  const minContentW = applyMinWidthFloor ? (ctx.opts?.minimumWidth ?? 0) : 0;
  if (minContentW <= 0) return { width, height };

  const baselineWidth = minWidthFloorBaseline(node, fontSpec, ctx, bounder);
  return { width: Math.max(width, minContentW + baselineWidth), height };
}
