/**
 * chrome.ts — mission G0b / T4: `DiagramChromeFactory.create`'s
 * warnings-less half (mainframe → legend → title → caption →
 * header/footer, header/footer outermost — decisions.md D1/D9) plus
 * `DecorateEntityImage`'s vertical-stack composition math (`mergeTB`,
 * `getTextX`, the `xImage`/`yImage`/`yText2` layout).
 *
 * cdd-T34 (E14 `mainframe`): `decorateWithFrame` (`addMainframe` below) is
 * now ported too — it was the one step this module's own doc comment
 * previously called out as deferred whole (`BigFrame` unported, an earlier
 * mission's D9). Structurally different from the other four slots (it
 * WRAPS `original` on all sides via `../klimt/shape/big-frame.js` rather
 * than stacking above/below it through {@link decorateEntityImage}), so it
 * is applied separately, first, in {@link applyChrome}.
 *
 * Implementation note (not a divergence from the ported algorithm, a
 * divergence from the Java's OOP shape only): upstream builds a chain of
 * `TextBlock` objects that each recompute their dimension lazily against a
 * shared `StringBounder`. This port has no such object graph — every block
 * this module composes is already a fully-measured {@link AnnotationBlock}
 * / {@link RenderFragment} (string body + fixed width/height), so
 * {@link decorateEntityImage} below performs the SAME arithmetic
 * `DecorateEntityImage#calculateDimension`/`#drawU` do, once, eagerly,
 * instead of via `TextBlock#calculateDimension(StringBounder)` calls
 * threaded through nested wrapper objects. The nested-CENTER telescoping
 * upstream's recursion produces for granted (each wrap re-centers the
 * previous "original" in its own new total) is reproduced exactly by
 * calling this same function once per `DiagramChromeFactory.create` step,
 * in the same order, each time treating the PREVIOUS step's result as the
 * next step's "original" — i.e. the recursion itself, not just its output,
 * is ported; only the "lazy dimension recomputation via StringBounder"
 * mechanism is collapsed to eager arithmetic on plain numbers.
 *
 * SVG shape note (RESOLVED by mission G1d, maintainer decision
 * 2026-07-15 — this paragraph used to document a deliberate G0b/T4
 * divergence; kept as history). Upstream bakes each block's final
 * absolute x/y directly into its own `<text>` coordinates (via `UGraphic
 * .apply(UTranslate)`'s coordinate-context threading), so a jar `<g
 * class="title">` never itself carries a `transform`, and title/legend/
 * caption/header/footer nest INSIDE the SAME single content `<g>` the
 * diagram body uses (one top-level `<g>` per document, not two). G0b/T4
 * originally diverged on both counts: a `<g transform="translate(x,y)">`
 * wrapper around each slot (`RenderFragment` is a flat string, not a
 * coordinate-context object) and a SEPARATE sibling `<g>` around the
 * "original" body. G1d closes both: {@link decorateEntityImage} now calls
 * `shiftFragmentBody` (`./coord-shift.js`) — the eager-arithmetic
 * equivalent of `UGraphic.apply(UTranslate)`, baking (dx,dy) into every
 * coordinate-bearing attribute of an already-serialized fragment string —
 * instead of wrapping in `<g transform>`, and {@link applyChrome} wraps
 * the fully-composed result in exactly ONE bare `<g>` (no class, no
 * transform) rather than each `decorateEntityImage` step adding its own
 * wrapper around "original". `description/renderer.ts#unwrapKlimtSvg` was
 * widened to match: it now strips klimt's OWN content `<g>` (and its
 * leading `<?plantuml?>` PI) too, so `RenderFragment.body` is uniformly
 * flat (no wrapping element) for EVERY engine, klimt included — the ONE
 * outer `<g>` `applyChrome` adds is the only one that survives.
 *
 * @see ~/git/plantuml/.../core/DiagramChromeFactory.java:137-149 (create, stacking order)
 * @see ~/git/plantuml/.../core/DiagramChromeFactory.java:320-413 (addLegend/addTitle/addCaption/addHeaderAndFooter)
 * @see ~/git/plantuml/.../svek/DecorateEntityImage.java (composition math)
 * @see ~/git/plantuml/.../klimt/geom/XDimension2D.java#mergeTB
 */

import type { RenderFragment } from '../dispatcher.js';
import type { DiagramAnnotations, DisplayPositioned } from './model.js';
import { isDisplayPositionedNull, isEmpty } from './model.js';
import type { AnnotationBoxStyle, AnnotationElement } from './style.js';
import type { StringMeasurer } from '../measurer.js';
import { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import { VerticalAlignment } from '../klimt/geom/VerticalAlignment.js';
import { group } from '../svg.js';
import { buildAnnotationBlock, type AnnotationBlock } from './blocks.js';
import { buildChromeTextBlock } from './blocks-creole.js';
import { mergeFragmentDefs } from '../klimt/document-shell.js';
import type { SpriteRegistry } from '../sprite-commands.js';
import { shiftFragmentBody } from './coord-shift.js';
import { buildBigFrame, type BigFrameStyle } from '../klimt/shape/big-frame.js';

/** T2's `resolveAnnotationStyles` return shape, re-exported under the name
 *  T4's interface contract (`plans/g0b-annotations/batch-2/T4-chrome-core.md`)
 *  calls it. */
export type AnnotationStyles = Record<AnnotationElement, AnnotationBoxStyle>;

/** cdd-T28: what every chrome text block needs beyond its own style — the
 *  injected `StringMeasurer` (unchanged) and the diagram's own
 *  `SpriteRegistry`, so a `<$name>`/`<img:…>`/`<:emoji:>` in a title or
 *  legend resolves through the SAME `makeAtomImageResolverFor` every other
 *  creole surface uses instead of measuring and drawing as nothing.
 *  Bundled rather than passed as two positional parameters so the per-slot
 *  builders stay inside this project's parameter budget. */
interface ChromeTextContext {
  readonly measurer: StringMeasurer;
  readonly sprites?: SpriteRegistry | undefined;
}

interface Dim {
  readonly width: number;
  readonly height: number;
}

/** @see ~/git/plantuml/.../klimt/geom/XDimension2D.java#mergeTB —
 *  width = max, height = sum. */
export function mergeTB(a: Dim, b: Dim): Dim {
  return { width: Math.max(a.width, b.width), height: a.height + b.height };
}

/** @see ~/git/plantuml/.../svek/DecorateEntityImage.java:144-154 */
export function getTextX(dimText: Dim, dimTotal: Dim, h: HorizontalAlignment): number {
  if (h === HorizontalAlignment.CENTER) return (dimTotal.width - dimText.width) / 2;
  if (h === HorizontalAlignment.RIGHT) return dimTotal.width - dimText.width;
  // LEFT — DecorateEntityImage#getTextX throws IllegalStateException for any
  // other enum value; HorizontalAlignment (as-const object, 3 members) makes
  // a 4th value a compile-time impossibility, so LEFT is the exhaustive
  // fallthrough rather than a throw.
  return 0;
}

const EMPTY_DIM: Dim = { width: 0, height: 0 };

/** One text slot (title/caption/header/footer/legend) `decorateEntityImage`
 *  wraps around the running "original" — `className` mirrors upstream's
 *  `UGroup.put(UGroupType.CLASS, "title"/"legend"/...)` (DiagramChromeFactory
 *  addLegend/addTitle/addCaption/addHeaderAndFooter), applied to the `<g
 *  class="...">` `decorateEntityImage` wraps the slot's (now coordinate-
 *  shifted, transform-free) body in — matching jar's own bare `<g
 *  class="...">` shape (G1d). */
interface TextSlot {
  readonly block: AnnotationBlock;
  readonly halign: HorizontalAlignment;
  readonly className: string;
}

/**
 * `DecorateEntityImage#calculateDimension` + `#drawU`, collapsed to one
 * function (see this module's doc comment for why): `add`/`addTop`/
 * `addBottom`/`addTopAndBottom`'s four upstream static factories all reduce
 * to this one shape — callers pass `null` for whichever slot they don't use.
 *
 * @see ~/git/plantuml/.../svek/DecorateEntityImage.java:103-167
 */
function decorateEntityImage(
  original: AnnotationBlock,
  text1: TextSlot | null,
  text2: TextSlot | null,
): AnnotationBlock {
  const dim1: Dim = text1?.block ?? EMPTY_DIM;
  const dim2: Dim = text2?.block ?? EMPTY_DIM;
  const dimText = mergeTB(dim1, dim2);
  const dimTotal = mergeTB(original, dimText);

  const yImage = dim1.height;
  const yText2 = yImage + original.height;
  const xImage = (dimTotal.width - original.width) / 2;

  const parts: string[] = [];
  if (text1 !== null) {
    const xText1 = getTextX(dim1, dimTotal, text1.halign);
    parts.push(group(shiftFragmentBody(text1.block.body, xText1, 0), { class: text1.className }));
  }
  parts.push(shiftFragmentBody(original.body, xImage, yImage));
  if (text2 !== null) {
    const xText2 = getTextX(dim2, dimTotal, text2.halign);
    parts.push(group(shiftFragmentBody(text2.block.body, xText2, yText2), { class: text2.className }));
  }

  // cdd-T28: a chrome text block can now mint its own `<defs>` entries
  // (klimt lifts a `<back:color>` text-background `filter` out of the
  // fragment document, `klimt/document-shell.ts#renderDrawableToFragment`).
  // They must survive every composition step, so each wrap merges the
  // slots' defs into the running block's -- `mergeFragmentDefs` de-dups by
  // `id`, which matters because two slots built from the SAME uid-seeded
  // document (e.g. the same colour in header and footer) can emit the same
  // def twice.
  const extraDefs = mergeFragmentDefs([original, text1?.block ?? {}, text2?.block ?? {}]);
  const composed = { body: parts.join(''), width: dimTotal.width, height: dimTotal.height };
  return extraDefs === undefined ? composed : { ...composed, extraDefs };
}

// ---------------------------------------------------------------------------
// Mainframe — DiagramChromeFactory.decorateWithFrame (cdd-T34)
// ---------------------------------------------------------------------------

/**
 * `DiagramChromeFactory.decorateWithFrame` (java:275-336): wraps `original`
 * in a {@link buildBigFrame} box with the mainframe text as a folder-tab
 * title in its top-left corner, then applies the mainframe style's own
 * OUTER `margin` around the whole thing. Unlike {@link addLegend}/{@link
 * addTitle}/etc. (which stack ABOVE/BELOW `original` via {@link
 * decorateEntityImage}), mainframe WRAPS `original` on all four sides —
 * a structurally different composition, so it does not go through that
 * shared helper. Applied FIRST in {@link applyChrome} (before legend/
 * title/caption/header/footer), matching `create`'s own step order
 * (java:126-133): mainframe decorates the raw body, and legend/title/etc.
 * stack outside the mainframe-wrapped result.
 *
 * @see ~/git/plantuml/.../core/DiagramChromeFactory.java:275-336
 */
/** `TextBlockBordered#drawU`'s own `color` derivation (`buildAnnotationBlock`'s
 *  identical formula) -- mainframe's `lineThickness` is never 0 by default
 *  (1.5, plantuml.skin:87), so this is `style.lineColor` in every corpus
 *  fixture; the `?? 'none'` guards a future `<style>` override that zeroes
 *  it, mirroring `buildAnnotationBlock`'s own fallback. */
function mainframeTitleColor(style: AnnotationBoxStyle): string {
  return style.lineThickness === 0 ? (style.backgroundColor ?? 'none') : (style.lineColor ?? 'none');
}

/**
 * `BigFrame`'s box + folder-tab title, fully composed (frame decoration +
 * title text at its fixed `(3,1)` offset + `original` at the frame's own
 * placement) but NOT yet margin-wrapped — split out of {@link addMainframe}
 * to stay under this repo's per-function size cap.
 *
 * `Style#getSymbolContext`'s `backColor` (java:271-273): mainframe's own
 * `BackGroundColor` is unset in `plantuml.skin` (only `Padding`/
 * `LineThickness`/`Margin` are, `:85-89`) and does NOT inherit `root{}`'s
 * own `BackGroundColor` the way `LineColor`/`FontColor`/`RoundCorner` do
 * (`annotation-defaults.ts`'s mainframe entry: `backgroundColor: null`,
 * jar-verified via direct probe -- see `.agent-notes/cdd-T34.md`) --
 * instead it falls back to the DOCUMENT's own canvas colour: jar-verified
 * directly (`jakaja-15-faze022`'s frame fill is the default white canvas; a
 * probe with `skinparam BackgroundColor lightblue` made the frame fill the
 * SAME lightblue, `#ADD8E6`, exactly matching `documentBackground`).
 * `resolveColorToSvgHex`/`shortenColor` (already applied by `rect()`)
 * reproduce the jar's own `#FFF` 3-digit shorthand for the white case; a
 * future explicit `mainframe{BackgroundColor ...}` override (`style.
 * backgroundColor` non-null) takes priority.
 */
/** `BigFrame`'s title text: `mainFrame.create(fontConfiguration,
 *  HorizontalAlignment.CENTER, skinParam)` (java:288) -- CENTER is
 *  hard-coded regardless of the mainframe style's own resolved alignment,
 *  the same D8 quirk `addTitle`/`addCaption` document for their own slots. */
function buildMainframeTitleBlock(
  mainFrame: DisplayPositioned,
  style: AnnotationBoxStyle,
  ctx: ChromeTextContext,
): ReturnType<typeof buildChromeTextBlock> {
  const centeredStyle: AnnotationBoxStyle = { ...style, horizontalAlignment: HorizontalAlignment.CENTER };
  return buildChromeTextBlock(
    { uid: 'mainframe', color: mainframeTitleColor(style), sprites: ctx.sprites },
    nonNullDisplay(mainFrame),
    centeredStyle,
    ctx.measurer,
  );
}

function bigFrameStyleOf(style: AnnotationBoxStyle): BigFrameStyle {
  return {
    fillColor: style.backgroundColor ?? style.documentBackground,
    lineColor: style.lineColor ?? '#181818',
    lineThickness: style.lineThickness,
    roundCorner: style.roundCorner,
    padding: style.padding,
  };
}

function buildFramedBlock(
  original: AnnotationBlock,
  mainFrame: DisplayPositioned,
  style: AnnotationBoxStyle,
  ctx: ChromeTextContext,
): AnnotationBlock {
  const titleBlock = buildMainframeTitleBlock(mainFrame, style, ctx);
  const layout = buildBigFrame(
    { width: titleBlock.width, height: titleBlock.height },
    original,
    bigFrameStyleOf(style),
  );

  const parts = [
    layout.body,
    // `BigFrame#drawU` (java:127-131): the title is always drawn at the
    // fixed `(3,1)` offset -- see `big-frame.ts`'s own doc comment for why
    // the `SpecialText`/direct-draw branch split there collapses to one
    // draw call in this port (no compression-mode `UGraphic`).
    shiftFragmentBody(titleBlock.body, 3, 1),
    shiftFragmentBody(original.body, layout.originalX, layout.originalY),
  ];
  const extraDefs = mergeFragmentDefs([original, titleBlock]);
  return {
    body: parts.join(''),
    width: layout.width,
    height: layout.height,
    ...(extraDefs === undefined ? {} : { extraDefs }),
  };
}

function addMainframe(
  original: AnnotationBlock,
  mainFrame: DisplayPositioned,
  style: AnnotationBoxStyle,
  ctx: ChromeTextContext,
): AnnotationBlock {
  const framed = buildFramedBlock(original, mainFrame, style, ctx);

  // The outer `margin` wrap (`decorateWithFrame`'s returned anonymous
  // `TextBlock#drawU`/`calculateDimension`, java:298-320): `frame.drawU(ug
  // .apply(margin.getTranslate()))` and the SAME translate composed into
  // `original`'s own offset above already account for margin.left/top via
  // `layout.originalX/Y` being frame-LOCAL -- so the margin shift is
  // applied ONCE, here, to the whole already-composed `framed` block,
  // matching `calculateDimension`'s `margin.left + frameDim.width +
  // margin.right` (java:317-319).
  return {
    body: shiftFragmentBody(framed.body, style.margin.left, style.margin.top),
    width: style.margin.left + framed.width + style.margin.right,
    height: style.margin.top + framed.height + style.margin.bottom,
    ...(framed.extraDefs === undefined ? {} : { extraDefs: framed.extraDefs }),
  };
}

// ---------------------------------------------------------------------------
// Per-element wrap steps — DiagramChromeFactory.addLegend/addTitle/
// addCaption/addHeaderAndFooter
// ---------------------------------------------------------------------------

/** Every `matchLegend`/`matchLegendMultiline`/etc. command guards a
 *  non-empty display before storing a non-null `DisplayPositioned` (see
 *  model.ts/commands.ts); callers here only reach this after their own
 *  `isDisplayPositionedNull` check, so `display` is non-null by
 *  construction — a non-null assertion documents that invariant rather
 *  than re-validating an internal invariant already enforced upstream. */
function nonNullDisplay(dp: DisplayPositioned): readonly string[] {
  return dp.display!;
}

/** @see DiagramChromeFactory.java:324-336 */
function addLegend(
  original: AnnotationBlock,
  legend: DisplayPositioned,
  style: AnnotationBoxStyle,
  ctx: ChromeTextContext,
): AnnotationBlock {
  const block = buildAnnotationBlock('legend', nonNullDisplay(legend), style, ctx.measurer, ctx.sprites);
  const halign = legend.horizontalAlignment ?? HorizontalAlignment.CENTER;
  const slot: TextSlot = { block, halign, className: 'legend' };
  return legend.verticalAlignment === VerticalAlignment.TOP
    ? decorateEntityImage(original, slot, null)
    : decorateEntityImage(original, null, slot);
}

/** D8: title is forced CENTER at draw time regardless of the stored
 *  alignment. @see DiagramChromeFactory.java:342-356 */
function addTitle(
  original: AnnotationBlock,
  title: DisplayPositioned,
  style: AnnotationBoxStyle,
  ctx: ChromeTextContext,
): AnnotationBlock {
  const block = buildAnnotationBlock('title', nonNullDisplay(title), style, ctx.measurer, ctx.sprites);
  return decorateEntityImage(original, { block, halign: HorizontalAlignment.CENTER, className: 'title' }, null);
}

/** D8: caption is forced CENTER at draw time regardless of the stored
 *  alignment. @see DiagramChromeFactory.java:362-376 */
function addCaption(
  original: AnnotationBlock,
  caption: DisplayPositioned,
  style: AnnotationBoxStyle,
  ctx: ChromeTextContext,
): AnnotationBlock {
  const block = buildAnnotationBlock('caption', nonNullDisplay(caption), style, ctx.measurer, ctx.sprites);
  return decorateEntityImage(original, null, { block, halign: HorizontalAlignment.CENTER, className: 'caption' });
}

function headerFooterSlot(
  dp: DisplayPositioned,
  style: AnnotationBoxStyle,
  className: 'header' | 'footer',
  ctx: ChromeTextContext,
): TextSlot | null {
  if (isDisplayPositionedNull(dp)) return null;
  const block = buildAnnotationBlock(className, nonNullDisplay(dp), style, ctx.measurer, ctx.sprites);
  // D8: header defaults RIGHT, footer defaults CENTER, both FROM STYLE, only
  // when no explicit left|right|center prefix was parsed (dp.horizontalAlignment
  // null — see commands.ts matchHeader/matchFooter). style.horizontalAlignment
  // already carries the D8 default (BASE_DEFAULTS.header/footer in style.ts).
  const halign = dp.horizontalAlignment ?? style.horizontalAlignment;
  return { block, halign, className };
}

/** @see DiagramChromeFactory.java:382-413. Takes the full `annotations`/
 *  `styles` bags (rather than four separate header/footer args) to stay
 *  under this port's per-function param-count budget. */
function addHeaderAndFooter(
  original: AnnotationBlock,
  annotations: DiagramAnnotations,
  styles: AnnotationStyles,
  ctx: ChromeTextContext,
): AnnotationBlock {
  const text1 = headerFooterSlot(annotations.header, styles.header, 'header', ctx);
  const text2 = headerFooterSlot(annotations.footer, styles.footer, 'footer', ctx);
  return decorateEntityImage(original, text1, text2);
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * `DiagramChromeFactory.create`, minus warnings (no caller in this port —
 * `Collection<Warning>` has no producer yet). Skips entirely — returning
 * the SAME `fragment` object, `===` — when `isEmpty(annotations)`
 * (decisions.md D5, byte-stability for annotation-free diagrams).
 *
 * G1d: the fully-composed result (every active slot + the original body,
 * already transform-free per {@link decorateEntityImage}) is wrapped in
 * exactly ONE bare `<g>` — matching jar's single top-level content `<g>`
 * per annotated document (`test-results/dot-cache/<type>/<slug>/in.svg`, the 19 G1 I1
 * chrome fixtures: `<g><g class="title">...</g><!--entity foo-->...</g>`).
 *
 * @see ~/git/plantuml/.../core/DiagramChromeFactory.java:137-149
 */
/**
 * Legend -> title -> caption -> header/footer, in `DiagramChromeFactory`'s
 * own stacking order (D1/D9) -- split out of {@link applyChrome} so its own
 * CCN stays under this repo's cap (port-own split: `DiagramChromeFactory
 * .create` is one method upstream too; this is purely a decomposition of
 * OUR four `if` checks, not a divergence from the ported algorithm).
 * `decorated` mirrors upstream's own "did anything actually attach" state
 * (`fragment` stays byte-identical, `===`, when nothing did — D5).
 */
function applyChromeSlots(
  block: AnnotationBlock,
  annotations: DiagramAnnotations,
  styles: AnnotationStyles,
  ctx: ChromeTextContext,
): { readonly block: AnnotationBlock; readonly decorated: boolean } {
  let decorated = false;

  if (!isDisplayPositionedNull(annotations.legend)) {
    block = addLegend(block, annotations.legend, styles.legend, ctx);
    decorated = true;
  }
  if (!isDisplayPositionedNull(annotations.title)) {
    block = addTitle(block, annotations.title, styles.title, ctx);
    decorated = true;
  }
  if (!isDisplayPositionedNull(annotations.caption)) {
    block = addCaption(block, annotations.caption, styles.caption, ctx);
    decorated = true;
  }
  if (!isDisplayPositionedNull(annotations.header) || !isDisplayPositionedNull(annotations.footer)) {
    block = addHeaderAndFooter(block, annotations, styles, ctx);
    decorated = true;
  }

  return { block, decorated };
}

export function applyChrome(
  fragment: RenderFragment,
  annotations: DiagramAnnotations,
  styles: AnnotationStyles,
  measurer: StringMeasurer,
  sprites?: SpriteRegistry,
): RenderFragment {
  if (isEmpty(annotations)) return fragment;

  // G2 N46: class fragments carry `preChromeWidth`/`preChromeHeight` --
  // the PRE-document-margin/quirk ink dims jar's own `DecorateEntityImage`
  // centers chrome text against (see `RenderFragment.preChromeWidth`'s own
  // doc comment for the jar-verified mechanism and citation). Every other
  // engine leaves these `undefined`, so `?? fragment.width/height` is a
  // no-op for them -- zero behavior change outside class.
  const initial: AnnotationBlock = {
    body: fragment.body,
    width: fragment.preChromeWidth ?? fragment.width,
    height: fragment.preChromeHeight ?? fragment.height,
  };
  // cdd-T34: mainframe applies FIRST (`DiagramChromeFactory.create`'s own
  // step order, java:126-133) -- it WRAPS `initial` rather than stacking
  // above/below it, so it is not one of `applyChromeSlots`'s four `if`
  // checks. `framed` stays `initial` (`===`) when there is no mainframe,
  // so `mainframeDecorated` below is the ONLY thing that changes relative
  // to pre-T34 behavior for a mainframe-free diagram (none — `isEmpty()`
  // already required at least one non-null annotation to reach this line).
  const ctx: ChromeTextContext = { measurer, sprites };
  const mainframeDecorated = !isDisplayPositionedNull(annotations.mainFrame);
  const framed = mainframeDecorated ? addMainframe(initial, annotations.mainFrame, styles.mainframe, ctx) : initial;
  const { block, decorated } = applyChromeSlots(framed, annotations, styles, ctx);

  if (!decorated && !mainframeDecorated) return fragment;

  // Spread `fragment` first so `background`/`extraDefs` are inherited
  // exactly as present-or-absent (exactOptionalPropertyTypes forbids
  // explicitly assigning `background: undefined`), then override the
  // fields chrome composition actually changed. `bodyWrapped: true` (G2
  // N1) records that THIS call performed the single bare `<g>` wrap --
  // `core/assemble-svg.ts`'s per-`diagramType` finalize functions (T8)
  // read it to avoid wrapping a second time; every other engine ignores it.
  // cdd-T28: chrome's own `<defs>` (a `<back:color>` filter in a title/
  // legend/footer) merge with the diagram body's, de-duped by `id`.
  const extraDefs = mergeFragmentDefs([fragment, block]);
  return {
    ...fragment,
    body: group(block.body),
    width: block.width,
    height: block.height,
    bodyWrapped: true,
    ...(extraDefs === undefined ? {} : { extraDefs }),
  };
}
