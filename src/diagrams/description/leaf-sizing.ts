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
 * still open, a permanent divergence; `folder`/`package`'s title narrowing
 * (was SI1/ADR-10) is CLOSED -- SI1 T12 routed the shown title through the
 * real `create2`/`BodyEnhanced1` (see the folder/package `case` below).
 * T10/ADR-3 retired the sizer's `fitToInk`
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
import type { SpriteDimsLookup, AtomImageResolver } from '../../core/creole-atoms.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import type { FontConfiguration, FontStyle } from '../../core/klimt/shape/UText.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import type { GuillemetPair } from '../../core/text/Guillemet.js';
import { buildDesc } from '../../core/svek/image/EntityImageDescriptionDelegates.js';
import { USymbols } from '../../core/decoration/symbol/USymbols.js';
import { measureFolderLeaf } from './leaf-sizing-folder.js';
import { measureLegacyBoxFallback } from './leaf-sizing-legacy-fallback.js';
import { measureEntityLeaf, sizingAtomImageResolverFor } from './leaf-sizing-entity.js';
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
      // `opts` (NOT just `fontSpec`) -- `measureNote` resolves the note font
      // from the UN-collapsed `opts?.fontSize`; see its own doc comment and
      // ADR-4 (`plans/s1l-tail-fix/decisions.md`).
      return measureNote(node.display, fontSpec, measurer, opts, sprites);
    case 'folder':
    case 'package':
      // UN-NARROWED (SI1 T12, ADR-4 -- was T5/ADR-10's narrowing #1): the
      // shown title now measures through the REAL `BodyFactory.create2` ->
      // `BodyEnhanced1` route (`leaf-sizing-folder-title.ts`, upstream
      // `EntityImageDescription.java:198-199`'s construction); the flat
      // `FOLDER_SHOWN_TITLE_EXTRA_WIDTH` constant is deleted -- the 12 was
      // `getMarginX()=6` both sides. `measureFolderLeaf` stays the entry
      // point: its `mergeTB`+`getMargin()` composition is the jar-verified
      // transcription of `USymbolFolder.asSmall.calculateDimension`, and
      // the `measureEntityLeaf` route cannot serve this family until the
      // core `EntityImageDescription` `name` substitute itself adopts
      // `create2` (ADR-4 scopes that follow-on out of T12).
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

/** No style flags -- the sizing font carries family/size only
 *  (`leaf-sizing-entity.ts#SIZING_FONT_STYLES`'s convention). */
const NOTE_FONT_STYLES: ReadonlySet<FontStyle> = new Set();

/** `plantuml.skin:312-316`, `note { LineThickness 0.5 }` -- the note style's
 *  OWN override of `root { LineThickness 1.0 }`, forwarded to
 *  `BodyEnhanced2StyleValues.defaultThickness`
 *  (`BodyEnhancedAbstract#getDefaultThickness`).
 *
 *  Read on exactly one path and INERT on both halves of it, which is why the
 *  sizer may hand the same traced default to the renderer without threading a
 *  `Theme`: `TextBlockLineBefore.calculateDimension` never consults it (only
 *  `drawU` does), and `UHorizontalLine#drawMe` uses `defaultStroke` only when
 *  `style == '\0'` (`UHorizontalLine.java:85`) -- a block separator always
 *  carries `-`/`=`/`.`/`_`, so it takes `getStroke()` instead. Jar-confirmed:
 *  `xufexu-38-fola855`'s note border draws `stroke-width:0.5` while every one
 *  of its separator rules draws `stroke-width:1`. */
const NOTE_LINE_THICKNESS = 0.5;

/** `buildNoteBody`'s per-diagram inputs, bundled to stay inside this
 *  project's parameter-count budget. All three are optional and all three
 *  default to upstream's own unset value. */
export interface NoteBodyOpts {
  /** `style.wrapWidth()` (`PName.MaximumWidth`) -- upstream passes it
   *  straight into `BodyFactory.create3`'s `lineBreakStrategy`
   *  (`EntityImageNote.java:117`), exactly as it does for entity `desc`. */
  readonly wrapWidth?: number | undefined;
  /** `skinparam guillemet` -- applied to display text by `manageGuillemet`
   *  inside `CreoleParser`, so sizer and renderer must supply the same pair. */
  readonly guillemet?: GuillemetPair | undefined;
  /** The `<img>`/`<$sprite>` atom resolver: the SIZING one
   *  (`sizingAtomImageResolverFor`) from `measureNote`, the DRAWING one
   *  (`render-atoms.ts#makeAtomImageResolverFor`) from `drawNoteFallback`. */
  readonly atomImageResolverFor?: ((font: FontConfiguration) => AtomImageResolver) | undefined;
}

/**
 * The note body's `TextBlock` -- upstream `EntityImageNote.java:114-118`'s
 * `BodyFactory.create3(strings, getSkinParam(), horizontalAlignment,
 * fontConfiguration, style.wrapWidth(), style)`, i.e. the SAME `create3` ->
 * `BodyEnhanced2` route `EntityImageDescription.java`'s `desc` takes.
 *
 * **One owner, two callers, on purpose.** Upstream's `EntityImageNote` owns
 * both the note's text block and its dimension; this port splits note SIZING
 * (`measureNote`, below) from note DRAWING (`renderer-entity.ts
 * #drawNoteFallback`), and the two disagreeing is the defect group G2 exists
 * to close -- they disagreed three ways before this function existed (flat
 * 13px lines / a creole heading plus literal separator text / upstream's real
 * block model). Exported and imported by the renderer so there is exactly ONE
 * `create3` construction, not a parallel assembly that can drift again. See
 * `planning/sizer-renderer-parity.md`.
 *
 * Reuses `buildDesc` (`EntityImageDescriptionDelegates.ts`) rather than
 * rebuilding its `ISkinSimple`/`AtomOps`/`Display`/`LineBreakStrategy`
 * wiring: that is the landed, jar-verified `create3` call site and every
 * value it needs is a parameter here. Two adaptations, both reported:
 *
 * - `symbol` is read for exactly one thing, `getSNames()[0] === 'package_'`
 *   (upstream's empty-`desc` package-leaf branch). A note has no `USymbol`
 *   upstream at all (`renderer-symbol.ts#resolveSymbol` returns `null` for
 *   it), so `USymbols.RECTANGLE` is passed as an INERT argument that answers
 *   that one question with upstream's own answer for a note: not a package.
 * - `codeName === displayText` selects `buildDesc`'s `fontTitle` slot, which
 *   is where this function puts the note font. `EntityImageNote` has no
 *   code/display distinction to begin with -- it builds from
 *   `entity.getDisplay()` alone.
 *
 * NARROWING (reported, not silent): `buildDesc`'s blank-display branch tests
 * `displayText.trim().length === 0` where `EntityImageNote.java:114` tests
 * `strings.size() == 1 && strings.get(0).length() == 0`. The two agree on the
 * reachable case (an empty note body -> a 0x0 block -> a 21x10 box); they
 * differ only for a note whose body is entirely WHITESPACE across one or more
 * lines, which upstream would measure as real (blank) text lines. No corpus
 * fixture exercises that shape.
 */
export function buildNoteBody(display: string, font: FontConfiguration, opts?: NoteBodyOpts): TextBlock {
  return buildDesc(
    USymbols.RECTANGLE,
    { codeName: display, displayText: display, stereotypeLabels: [] },
    {
      // `buildDesc` reads NONE of these six -- they are consumed by
      // `EntityImageDescription`'s own draw path, which the note never
      // reaches (`EntityImageNote` is a separate, unported draw class).
      // Mirrors `leaf-sizing-entity.ts#sizingPaint`'s identical placeholders.
      forecolor: NOTE_PLACEHOLDER_COLOR,
      backcolor: NOTE_PLACEHOLDER_COLOR,
      roundCorner: 0,
      diagonalCorner: 0,
      deltaShadow: 0,
      stroke: UStroke.withThickness(NOTE_LINE_THICKNESS),
      fontTitle: font,
      fontStereo: font,
      // `style.getHorizontalAlignment()` -- `note {}` sets none, so it
      // inherits `root { HorizontalAlignment left }` (`plantuml.skin:11`).
      titleAlignment: HorizontalAlignment.LEFT,
      stereotypeAlignment: HorizontalAlignment.LEFT,
      // `style.value(PName.MinimumWidth)` -- no `plantuml.skin` selector sets
      // it for `note` (the same trace `buildDesc`'s own doc records).
      minimumWidth: 0,
      defaultThickness: NOTE_LINE_THICKNESS,
      ...(opts?.wrapWidth !== undefined ? { wrapWidth: opts.wrapWidth } : {}),
      ...(opts?.guillemet !== undefined ? { guillemet: opts.guillemet } : {}),
    },
    opts?.atomImageResolverFor,
  );
}

/** `buildDesc` never reads a color (draw-time only) -- documents intent,
 *  not a real color (`leaf-sizing-entity.ts#SIZING_PLACEHOLDER_COLOR`). */
const NOTE_PLACEHOLDER_COLOR = '#000000';

/**
 * `EntityImageNote.calculateDimensionSlow` (`EntityImageNote.java:176-181`):
 * the `create3` body block plus `marginX1 = 6` + `marginX2 = 15` horizontally
 * (`NOTE_MARGIN_H`) and `2 * marginY = 2 * 5` vertically (`NOTE_MARGIN_V`),
 * `EntityImageNote.java:89-91`.
 *
 * Replaces (mission `s1l-tail-fix`, F1-a/G2) a flat `lineCount(display) *
 * NOTE_FONT_SIZE` model that served four distinct defects at once
 * (`plans/s1l-tail-diagnosis/findings/SYNTHESIS.md` §3): it billed a
 * `--`/`==toto==` block separator as a full text line instead of removing it
 * and applying `BodyEnhancedAbstract#decorate`'s margins (C1); it never let a
 * `{{ … }}` block collapse to one `EmbeddedDiagram` atom (C2); it discarded
 * any per-element `FontSize` override (C3); and `lineCount` structurally
 * cannot see that a run drawn in another font -- an `<img:…>` that fails to
 * decode falls back to a fixed monospace 14 -- is taller than the note's own
 * 13 (C4).
 *
 * **ADR-4 (the trap).** The note font is `opts?.fontSize ?? NOTE_FONT_SIZE`,
 * NEVER `fontSpec.size`. `measureLeafNode` has already collapsed "no
 * per-element override" into the diagram-wide font (14) by the time this runs
 * (`:109`), so `fontSpec.size` cannot distinguish "measure at the note
 * default 13" from "the user asked for 14" -- reading it would silently
 * regress every plain note in the corpus by 1px.
 *
 * Jar-pinned: `"Hello"` 50.74x23 (unchanged from the flat model),
 * `xufexu-38-fola855` 85.43x116 / 85.43x129, `pivudu-29-pele178` 30.43x44,
 * `tijexo-10-zipo222` 89.88x20 at `FontSize 10`, `kovaxi-11-reti348` 63x52,
 * `nobiza-91-fimo741` 695.63x37 -- see
 * `tests/unit/description/leaf-sizing-note.test.ts`.
 */
function measureNote(
  display: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  opts?: BoxSizingOpts,
  sprites?: SpriteDimsLookup,
): Dim {
  const font: FontConfiguration = {
    family: fontSpec.family,
    size: opts?.fontSize ?? NOTE_FONT_SIZE,
    color: null,
    styles: NOTE_FONT_STYLES,
  };
  const block = buildNoteBody(display, font, {
    wrapWidth: opts?.wrapWidth,
    guillemet: opts?.guillemet,
    atomImageResolverFor: sizingAtomImageResolverFor(sprites),
  });
  const dim = block.calculateDimension(new MeasurerStringBounder(measurer));
  return { width: dim.getWidth() + NOTE_MARGIN_H, height: dim.getHeight() + NOTE_MARGIN_V };
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
