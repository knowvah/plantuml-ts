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
 * `measureUsecase` (exported below) is NOT dead: it is `<latex>` usecase
 * content's own entry point (this file's `hasUnroutedUsecaseMarkup` guard,
 * the ONE case `measureLeafNode` still routes through it rather than the
 * faithful `measureEntityLeaf` call). SI10/ADR-2 additionally exports
 * `measureUsecaseOrActorLeaf` below, a purpose-built entry point routing
 * usecase/actor leaf sizing through the SAME faithful `measureEntityLeaf`
 * call this file already uses, so the class engine can call in instead of
 * reimplementing the routing decision.
 *
 * SI14/ADR-3 retired `usecase-footprint.ts`'s data-based ellipse-fit
 * (`FootprintBox`es handed to a standalone `smallestEnclosingCircle`) --
 * `measureUsecase`'s non-`<latex>` branch now delegates straight to
 * `measureEntityLeaf`, the SAME real, object-based `Footprint#getEllipse`
 * (`core/svek/image/Footprint.ts`) the faithful path already used, so there
 * is only ONE ellipse-fit implementation left for non-`<latex>` content.
 * PARTIAL (ADR-3's own fallback, taken here): the `<latex>` branch was NOT
 * also switched to wrap its box through `Footprint#getEllipse` -- measured
 * `widened 2` (`gevozu-46-sasu860`/`sunuju-01-pote718`, both `usecase
 * (<latex>...)`; delta 0.611632in -> 1.041146in against their pinned
 * ceiling), so it still returns the raw KaTeX box unchanged. See
 * `measureUsecase`'s own doc comment for the numbers; filed as tracked
 * follow-up, not completed. SI14/ADR-4 deleted `measureActor`:
 * `class-layout-leaf-shapes.ts` (SI10) imports only `measureUsecaseOrActor
 * Leaf` now, so nothing in `src/` calls it any longer.
 *
 * See `plans/description-leaf-sizing-audit/decisions.md` (ADR-6),
 * `plans/sizer-footprint-parity/decisions.md` (ADR-1/2/4),
 * `plans/svg-sprite-nanoparser/decisions.md` (ADR-3),
 * `plans/si10-usecase-actor-routing/decisions.md` (ADR-1/2), and
 * `plans/si14-usymbol-measurement-sharing/decisions.md` (ADR-3/4).
 */

import type { DescriptiveNode } from './ast.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import { measureNodeLabel } from '../../core/latex.js';
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';
import { lineCount, maxLineWidth, atomHeightBonus } from './leaf-sizing-text.js';
import { measureFolderLeaf } from './leaf-sizing-folder.js';
import { measureLegacyBoxFallback } from './leaf-sizing-legacy-fallback.js';
import { measureEntityLeaf } from './leaf-sizing-entity.js';
import {
  type BoxSizingOpts,
  type Dim,
  FOLDER_FAMILY_SHOW_TITLE,
  INTERFACE_CIRCLE_SIZE,
  NOTE_FONT_SIZE,
  NOTE_MARGIN_H,
  NOTE_MARGIN_V,
  PORT_SIZE,
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

/** ONLY `<latex>` markup still routes through `measureUsecase` instead of
 *  `measureEntityLeaf` directly. SI14/ADR-3: `measureUsecase`'s own
 *  non-`<latex>` branch now delegates to `measureEntityLeaf` too (the SAME
 *  real `Footprint#getEllipse`), but the `<latex>` branch itself was NOT
 *  switched onto that ellipse fit -- doing so widened two fixtures past
 *  their pinned allowance (`measureUsecase`'s own doc comment has the
 *  numbers), so it still returns its raw KaTeX box, unchanged. `<img>`/
 *  `<$sprite>` -- single-line OR multi-line -- do NOT
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
 * Use-case ellipse sizing entry point for `<latex>` content -- the ONLY
 * markup `measureLeafNode`'s `usecase`/`usecase-business` case still routes
 * here instead of `measureEntityLeaf` (`hasUnroutedUsecaseMarkup`'s own doc
 * comment). Every non-`<latex>` display -- text, `<$sprite>`/`<img>`,
 * stereotyped or not, single- or multi-line -- delegates straight to
 * `measureEntityLeaf` (SI14/ADR-3): that is the SAME real, object-based
 * `Footprint#getEllipse` (`core/svek/image/Footprint.ts`) `TextBlockInEllipse`
 * uses, so there is exactly one ellipse-fit implementation left for
 * non-`<latex>` content, not two. `usecase-footprint.ts`'s retired data-based
 * substitute (`FootprintBox`es -> a standalone `smallestEnclosingCircle`)
 * matched this delegation to within floating-point noise on every shape it
 * was jar-verified against (`tests/unit/description/footprint-parity
 * .test.ts`).
 *
 * PARTIAL, per ADR-3's own fallback (`plans/si14-usymbol-measurement-sharing
 * /decisions.md`): the `<latex>` branch below still returns the RAW
 * `measureNodeLabel` box, unchanged, rather than wrapping it through
 * `Footprint#getEllipse` too. Measured (`gevozu-46-sasu860`/`sunuju-01-
 * pote718`, both usecase `(<latex>\mathcal{A}</latex>)`): wrapping widens
 * `maxSizeDeltaIn` from 0.611632in (their pinned ceiling) to 1.041146in --
 * our KaTeX box is already far wider than JLaTeXMath's for this markup, and
 * `.bigger(6)`-padding a diagonal-circle fit around it only grows that gap.
 * Filed as tracked follow-up, not completed here -- see this task's own
 * write-up for the full numbers.
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
  const node: DescriptiveNode = {
    id: '',
    display,
    symbol: 'usecase',
    children: [],
    ...(stereotype === undefined ? {} : { stereotype }),
  };
  return measureEntityLeaf(node, fontSpec, { opts: undefined, sprites, measurer }, false);
}

// ---------------------------------------------------------------------------
// T6 (ADR-6): route through EntityImageDescription -- see leaf-sizing-entity.ts
// ---------------------------------------------------------------------------
