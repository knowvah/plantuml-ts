/**
 * chrome-mainframe.ts — `DiagramChromeFactory.decorateWithFrame` (cdd-T34),
 * split out of `chrome.ts` (cdd6 T2f, 500-line file cap) — a pure move, not
 * a refactor: every function below is verbatim from that file, along with
 * the shared {@link ChromeTextContext}/{@link nonNullDisplay} helpers both
 * modules need (moved here rather than duplicated, to keep `chrome.ts` the
 * one-directional importer and avoid a circular import between the two).
 *
 * @see ~/git/plantuml/.../core/DiagramChromeFactory.java:275-336
 */

import type { AnnotationBoxStyle } from './style.js';
import type { AnnotationBlock } from './blocks.js';
import type { DisplayPositioned } from './model.js';
import type { StringMeasurer } from '../measurer.js';
import type { SpriteRegistry } from '../sprite-commands.js';
import { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import { buildChromeTextBlock } from './blocks-creole.js';
import { mergeFragmentDefs } from '../klimt/document-shell.js';
import { shiftFragmentBody } from './coord-shift.js';
import { buildBigFrame, type BigFrameStyle } from '../klimt/shape/big-frame.js';
import type { InkBox } from './body-ink.js';

interface Dim {
  readonly width: number;
  readonly height: number;
}

/** cdd-T28: what every chrome text block needs beyond its own style — the
 *  injected `StringMeasurer` (unchanged) and the diagram's own
 *  `SpriteRegistry`, so a `<$name>`/`<img:…>`/`<:emoji:>` in a title or
 *  legend resolves through the SAME `makeAtomImageResolverFor` every other
 *  creole surface uses instead of measuring and drawing as nothing.
 *  Bundled rather than passed as two positional parameters so the per-slot
 *  builders stay inside this project's parameter budget. */
export interface ChromeTextContext {
  readonly measurer: StringMeasurer;
  readonly sprites?: SpriteRegistry | undefined;
}

/**
 * lgm-T1a: the block `decorateWithFrame` wraps, with the ink its `drawU`
 * leaves in a `LimitFinder` when the producer's body can be scanned for it
 * (`body-ink.ts`). `BigFrame#computeWidth`/`#computeHeight` and
 * `decorateWithFrame#computeDelta` read ONLY that ink (`BigFrame.java:77-91`,
 * `DiagramChromeFactory.java:332-337`), never `calculateDimension`; a block
 * without `ink` is framed from its dimension as before (class, whose
 * producer already hands over BigFrame's `ww`/`hh` -- see `big-frame.ts`).
 */
export interface FramedOriginal extends AnnotationBlock {
  readonly ink?: InkBox;
}

/** `BigFrame#computeWidth`/`#computeHeight` (java:77-91): `ww` is `maxX` for
 *  an ink starting at or after the origin and the ink width otherwise; `hh`
 *  likewise over Y. */
function frameExtent(original: FramedOriginal): Dim {
  const ink = original.ink;
  if (ink === undefined) return original;
  return {
    width: ink.minX >= 0 ? ink.maxX : ink.maxX - ink.minX,
    height: ink.minY >= 0 ? ink.maxY : ink.maxY - ink.minY,
  };
}

/** `decorateWithFrame#computeDelta` (java:332-337): the translate that moves
 *  an ink reaching into negative coordinates back to the origin. */
function inkDelta(original: FramedOriginal): { dx: number; dy: number } {
  const ink = original.ink ?? { minX: 0, minY: 0 };
  return { dx: Math.max(0, -ink.minX), dy: Math.max(0, -ink.minY) };
}

/** Every `matchLegend`/`matchLegendMultiline`/etc. command guards a
 *  non-empty display before storing a non-null `DisplayPositioned` (see
 *  model.ts/commands.ts); callers here only reach this after their own
 *  `isDisplayPositionedNull` check, so `display` is non-null by
 *  construction — a non-null assertion documents that invariant rather
 *  than re-validating an internal invariant already enforced upstream. */
export function nonNullDisplay(dp: DisplayPositioned): readonly string[] {
  return dp.display!;
}

/**
 * `DiagramChromeFactory.decorateWithFrame` (java:275-336): wraps `original`
 * in a {@link buildBigFrame} box with the mainframe text as a folder-tab
 * title in its top-left corner, then applies the mainframe style's own
 * OUTER `margin` around the whole thing. Unlike `addLegend`/`addTitle`/etc.
 * (which stack ABOVE/BELOW `original` via `chrome.ts#decorateEntityImage`),
 * mainframe WRAPS `original` on all four sides — a structurally different
 * composition, so it does not go through that shared helper. Applied FIRST
 * in `chrome.ts#applyChrome` (before legend/title/caption/header/footer),
 * matching `create`'s own step order (java:126-133): mainframe decorates
 * the raw body, and legend/title/etc. stack outside the mainframe-wrapped
 * result.
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
  // D3 (cdd6 T2f): see `blocks.ts#buildAnnotationBlock`'s identical forward
  // -- the mainframe title's own `ChromeTextPaint` seam.
  return buildChromeTextBlock(
    {
      uid: 'mainframe',
      color: mainframeTitleColor(style),
      sprites: ctx.sprites,
      ...(style.hyperlinkColor === undefined ? {} : { hyperlinkColor: style.hyperlinkColor }),
    },
    nonNullDisplay(mainFrame),
    centeredStyle,
    ctx.measurer,
  );
}

/** `UStroke#dashVisible,dashSpace` as the SVG `stroke-dasharray`; a zero
 *  `dashVisible` is a solid stroke (`style-line-style.ts#lineStyleDash`). */
function dashArrayOf(style: AnnotationBoxStyle): { dashArray?: string } {
  const dash = style.lineStyle;
  if (dash === undefined || dash.dashVisible === 0) return {};
  return { dashArray: `${String(dash.dashVisible)},${String(dash.dashSpace)}` };
}

function bigFrameStyleOf(style: AnnotationBoxStyle): BigFrameStyle {
  return {
    fillColor: style.backgroundColor ?? style.documentBackground,
    lineColor: style.lineColor ?? '#181818',
    lineThickness: style.lineThickness,
    roundCorner: style.roundCorner,
    padding: style.padding,
    ...dashArrayOf(style),
  };
}

function buildFramedBlock(
  original: FramedOriginal,
  mainFrame: DisplayPositioned,
  style: AnnotationBoxStyle,
  ctx: ChromeTextContext,
): AnnotationBlock {
  const titleBlock = buildMainframeTitleBlock(mainFrame, style, ctx);
  const layout = buildBigFrame(
    { width: titleBlock.width, height: titleBlock.height },
    frameExtent(original),
    bigFrameStyleOf(style),
  );
  const delta = inkDelta(original);

  const parts = [
    layout.body,
    // `BigFrame#drawU` (java:127-131): the title is always drawn at the
    // fixed `(3,1)` offset -- see `big-frame.ts`'s own doc comment for why
    // the `SpecialText`/direct-draw branch split there collapses to one
    // draw call in this port (no compression-mode `UGraphic`).
    shiftFragmentBody(titleBlock.body, 3, 1),
    shiftFragmentBody(original.body, layout.originalX + delta.dx, layout.originalY + delta.dy),
  ];
  const extraDefs = mergeFragmentDefs([original, titleBlock]);
  return {
    body: parts.join(''),
    width: layout.width,
    height: layout.height,
    ...(extraDefs === undefined ? {} : { extraDefs }),
  };
}

export function addMainframe(
  original: FramedOriginal,
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
