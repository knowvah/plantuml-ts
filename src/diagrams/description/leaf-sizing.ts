/**
 * Leaf-node box sizing for the description diagram engine.
 *
 * T6 (description-leaf-sizing-audit, ADR-6): `measureLeafNode` routes most
 * USymbols through the SAME faithful path the renderer already uses --
 * `EntityImageDescription.calculateDimensionSlow` -- superseding the flat
 * per-symbol tables that used to re-derive this geometry independently.
 *
 * sizer-footprint-parity T3 (ADR-1/ADR-2) closed box+`<img>` fully and
 * usecase+`<$sprite>` PARTIALLY: single-line routes through
 * `measureEntityLeaf`; MULTI-LINE stayed on the analytic substitute for a
 * time, but SI10 (ADR-1/ADR-2) re-measured that branch INERT and removed
 * it -- see `hasUnroutedUsecaseMarkup`'s doc. `<latex>` is the one narrowing
 * still open, a permanent divergence; `folder`/`package` (SI1/ADR-10) is a
 * separate, unrelated narrowing. T10/ADR-3 retired the sizer's `fitToInk`
 * ink substitution -- see `sizingAtomImageResolverFor`'s own doc.
 *
 * `measureActor`/`measureUsecase` (exported below) are NOT dead: off-limits
 * `class-layout-leaf-shapes.ts` imports both unconditionally for the
 * class-diagram engine's own shapes -- why `usecase-footprint.ts`/
 * `footprintBoxes` survive too. SI10/ADR-2 additionally exports
 * `measureUsecaseOrActorLeaf` below, a purpose-built entry point routing
 * usecase/actor leaf sizing through the SAME faithful `measureEntityLeaf`
 * call this file already uses, so the class engine can call in instead of
 * reimplementing the routing decision.
 *
 * See `plans/description-leaf-sizing-audit/decisions.md` (ADR-6),
 * `plans/sizer-footprint-parity/decisions.md` (ADR-1/2/4),
 * `plans/svg-sprite-nanoparser/decisions.md` (ADR-3), and
 * `plans/si10-usecase-actor-routing/decisions.md` (ADR-1/2).
 */

import type { DescriptiveNode } from './ast.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import { measureNodeLabel } from '../../core/latex.js';
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';
import {
  lineCount,
  maxLineWidth,
  atomHeightBonus,
  footprintBoxes,
} from './leaf-sizing-text.js';
import { boxPoints, containingEllipse } from './usecase-footprint.js';
import { measureFolderLeaf } from './leaf-sizing-folder.js';
import { measureLegacyBoxFallback } from './leaf-sizing-legacy-fallback.js';
import { measureEntityLeaf } from './leaf-sizing-entity.js';
import {
  type BoxSizingOpts,
  type Dim,
  ACTOR_STICKMAN_HEIGHT,
  ACTOR_STICKMAN_WIDTH,
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

/** SI10/ADR-2: the class engine's usecase/actor entry point, defined in
 *  `leaf-sizing-entity.ts` (a same-mission split, see that file's doc) and
 *  re-exported here so `leaf-sizing.ts` remains the ONE module that exports
 *  usecase/actor leaf sizing, per ADR-2. */
export { measureUsecaseOrActorLeaf } from './leaf-sizing-entity.js';

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
      // STILL NARROWED (T5/ADR-10, was ADR-6): routing drops
      // `FOLDER_SHOWN_TITLE_EXTRA_WIDTH` (12px) -- `getMarginX()`=6 needs
      // `create2`/`BodyEnhanced1`, moved to mission SI1. Kept on the
      // pre-existing `measureFolderLeaf` path -- never touch
      // `FOLDER_SHOWN_TITLE_EXTRA_WIDTH` here.
      return measureFolderLeaf(node, fontSpec, measurer, opts, sprites);
    case 'usecase':
    case 'usecase-business':
      // sizer-footprint-parity T3/ADR-2 dropped the `<img` guard -- a
      // single-line `<img>`/`<$sprite>` display routes through
      // `measureEntityLeaf` unconditionally. SI10/ADR-1/ADR-2 additionally
      // dropped the multi-line-`<$sprite>` guard (re-measured INERT); only
      // `<latex>` STAYS guarded now -- see `hasUnroutedUsecaseMarkup`'s doc
      // comment for the measurement.
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
      // pre-T6 (a DIFFERENT composition, `mergeLayoutT12B3`).
      return measureEntityLeaf(node, fontSpec, { opts, sprites, measurer }, false);
    default:
      // Every other (true) box symbol routes through the same faithful call
      // -- except a `<latex>`-bearing display, the ONLY box guard left (T3/
      // ADR-1: `<img>`'s fallback font is hardcoded at its draw site now).
      // Only the generic box family floors width against `opts.minimumWidth`
      // (S1L-g).
      if (node.display.includes('<latex>')) {
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

/** ONLY `<latex>` markup still routes through `measureUsecase`'s analytic
 *  substitute. `<img>`/`<$sprite>` -- single-line OR multi-line -- do NOT
 *  (sizer-footprint-parity T3/ADR-2 dropped single-line; SI10/ADR-1/ADR-2
 *  dropped multi-line).
 *
 *  DIAGNOSIS (re-measured 2026-08-01, `plans/si10-usecase-actor-routing/
 *  README.md`'s probe table -- supersedes the multi-line finding
 *  sizer-footprint-parity T3 recorded below): disabling the multi-line
 *  branch ALONE now measures `widened 0` against `measure-description-
 *  size-deltas.ts`, with a cause histogram IDENTICAL to baseline; both
 *  named fixtures the old guard cited (`bootstrap-0`, `ruziru-69-xixo434`)
 *  report `delta 0, conformant true` with and without the branch. The
 *  0.029321in widening T3's diagnosis originally found no longer
 *  reproduces -- `svg-sprite-nanoparser`'s two-channel sprite architecture
 *  (a later, unrelated mission) closed the gap that guard existed to paper
 *  over. Disabling `<latex>` TOO (both branches at once) measures
 *  `widened 2`, so `<latex>` alone remains genuinely load-bearing and
 *  stays guarded -- ADR-1. */
function hasUnroutedUsecaseMarkup(display: string): boolean {
  return display.includes('<latex>');
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
 * NOT dead (module doc comment): two LIVE callers remain --
 * `class-layout-leaf-shapes.ts`'s unconditional import (out of write-set;
 * SI10's T2 is closing this one to route through `measureUsecaseOrActorLeaf`
 * instead) and this file's own `<latex>` fallback (SI10/ADR-1: the
 * multi-line-`<$sprite>` fallback this comment used to cite is gone --
 * re-measured INERT, see `hasUnroutedUsecaseMarkup`'s doc). Every other
 * usecase display routes through `measureEntityLeaf` instead (the SAME
 * `TextBlockInEllipse`/`Footprint` classes, faithfully).
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
  // #lizard forgives -- pre-existing, kept VERBATIM; still has two live
  // callers (module doc comment). Not refactored per porting discipline.
}

// ---------------------------------------------------------------------------
// T6 (ADR-6): route through EntityImageDescription -- see leaf-sizing-entity.ts
// ---------------------------------------------------------------------------
