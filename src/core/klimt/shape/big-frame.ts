/**
 * big-frame.ts — cdd-T34 (E14 `mainframe`): `klimt/shape/BigFrame.java`,
 * the box `core/DiagramChromeFactory.java#decorateWithFrame` wraps the
 * WHOLE diagram body in for `mainframe TEXT` — a rounded rect with a
 * folder-tab title cutout in its top-left corner.
 *
 * Implementation note (not a divergence from the ported algorithm, a
 * divergence from the Java's OOP shape only — same rationale
 * `core/annotations/chrome.ts`'s own module doc comment states for
 * {@link decorateWithFrame}'s Java call site, and `chrome.ts` is the SOLE
 * caller here): `BigFrame` upstream is a `TextBlockMemoized` whose
 * `calculateDimensionSlow`/`drawU` lazily recompute against a
 * `StringBounder`. `chrome.ts` already measures `original`/`title` eagerly
 * into plain `{width,height}` numbers before it ever reaches a chrome
 * step, so this module takes those numbers directly and returns plain
 * geometry + an already-serialized SVG fragment, instead of joining the
 * `TextBlock`/`UGraphic` object graph `klimt/shape/TextBlockMemoized.ts`'s
 * siblings in this directory use. `chrome.ts` composes the returned
 * `body` with the title text (drawn separately, at the fixed (3,1) offset
 * this module documents but does not draw — see {@link BigFrameLayout})
 * and the original diagram body (at {@link BigFrameLayout.originalX}/
 * `originalY`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/BigFrame.java (whole file)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/DiagramChromeFactory.java:275-336 (decorateWithFrame)
 */

import { rect, path } from '../../svg.js';

/** Plain width/height — mirrors `chrome.ts`'s own local `Dim`. */
export interface Dim {
  readonly width: number;
  readonly height: number;
}

/** `ClockwiseTopRightBottomLeft`'s four fields, reduced to what this module
 *  reads (`getTop`/`getRight`/`getBottom`/`getLeft`). */
export interface Sides {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/**
 * The resolved paint/geometry `BigFrame`'s constructor receives as
 * `padding`/`symbolContext` (`Style#getSymbolContext`/`getPadding`,
 * already resolved by `chrome.ts` from the diagram's `mainframe` style —
 * see that call site for the exact resolution, including the
 * mainframe-specific "unset background falls back to the document canvas
 * colour, not `none`" rule jakaja-15-faze022 requires).
 */
export interface BigFrameStyle {
  readonly fillColor: string;
  readonly lineColor: string;
  readonly lineThickness: number;
  readonly roundCorner: number;
  readonly padding: Sides;
}

/**
 * `BigFrame#calculateDimensionSlow` + the placement `DiagramChromeFactory
 * .decorateWithFrame`'s returned wrapper computes for `original` (java:
 * 296-303: `margin.getTranslate().compose(padding.getTranslate().compose
 * (delta))`, `delta` collapsed to (0,0) here — see this module's own note
 * below) — combined into one result because `chrome.ts` needs both to
 * finish the composition (title text at the constant (3,1) BigFrame
 * itself draws it at, `BigFrame.java:129,131`; `original` at
 * `originalX`/`originalY`).
 *
 * `delta` (`decorateWithFrame`'s local, java:331-335: `dx =
 * originalMinMax.getMinX() < 0 ? -minX : 0`, same for `dy`) is not
 * modelled: every `AnnotationBlock` this port's chrome pipeline composes
 * already starts at `(0,0)` by construction (`chrome.ts`'s own module doc
 * comment) — `original`'s ink can never have a negative minX/minY here,
 * so `delta` is always `(0,0)` and the term is omitted rather than
 * threaded as two always-zero parameters.
 */
export interface BigFrameLayout {
  /** The frame's own footprint (rect + title cutout), NOT including the
   *  outer `margin` `chrome.ts`'s caller applies afterward. */
  readonly width: number;
  readonly height: number;
  /** Where `original` must be drawn, relative to this frame's own origin. */
  readonly originalX: number;
  readonly originalY: number;
  /** The frame's own decoration — border rect + folder-tab cutout path,
   *  origin `(0,0)`. Does NOT include the title text (`chrome.ts` draws
   *  that itself, at the fixed `(3,1)` offset `BigFrame.java:129,131`
   *  always uses regardless of `SpecialText`'s compression-mode branch —
   *  see this module's header: this port has no compression-mode
   *  `UGraphic`, so both of that method's branches produce identical SVG
   *  output here). */
  readonly body: string;
}

/** `BigFrame#getYpos` (java:65-70). */
function titleCutoutHeight(dimTitle: Dim): number {
  return dimTitle.width === 0 ? 12 : dimTitle.height + 3;
}

/** `BigFrame#getEffectivePadding` (java:72-75): `padding.incTop(dimTitle
 *  .getHeight() + 10)` — the top-side padding widened to reserve room for
 *  the title band. */
function effectivePadding(padding: Sides, dimTitle: Dim): Sides {
  return { ...padding, top: padding.top + dimTitle.height + 10 };
}

/** Upstream halves `RoundCorner` into an SVG `rx`/`ry` (`Style
 *  .java`'s `URectangle.rounded(cornersize)` -> `rx="cornersize/2"`) —
 *  same divisor `core/annotations/blocks.ts`'s own `SVG_ROUND_CORNER_
 *  DIVISOR` uses for the identical formula; duplicated here (a single
 *  cited constant, not a repeated magic number) rather than imported,
 *  since `blocks.ts` does not export it and this module has no other
 *  reason to depend on `core/annotations/`. */
const SVG_ROUND_CORNER_DIVISOR = 2;

/**
 * `BigFrame#computeWidth`/`#computeHeight` (java:77-91) + the folder-tab
 * cutout path `#drawU` draws (java:105-124) — everything BUT the title
 * text itself and the outer `margin` wrap, both left to `chrome.ts`.
 *
 * `ww`/`hh` (java:81,89: `originalMinMax.getMinX() >= 0 ? maxX : width`)
 * reduce to `originalDim.width`/`.height` outright: `chrome.ts`'s ink
 * always starts at `(0,0)` (see {@link BigFrameLayout}'s doc comment), so
 * `minX`/`minY` are always `>= 0` and `maxX === width` (its whole footprint
 * IS its ink, `AnnotationBlock` carries no separate ink-vs-box distinction).
 *
 * The `computeHeight`/`computeWidth` "add `dimTitle.height` again on top of
 * `effectivePadding.top`, which already added it once" is not a bug to
 * simplify away (CLAUDE.md: never fix an apparent upstream quirk inline)
 * — it is real, jar-verified extra bottom clearance: jakaja-15-faze022's
 * frame height (102) only reproduces exactly WITH the duplicated term
 * (effectivePadding.top(25) + dimTitle.height(14) + hh(62) +
 * effectivePadding.bottom(1) = 102); `original`'s own placement
 * (`originalY` below) does NOT duplicate it, so the extra term inflates
 * only the frame's own bottom margin below the diagram content, not
 * `original`'s position.
 */
/** The border rect, at the frame's own `(0,0)`-origin size. */
function frameRect(width: number, height: number, style: BigFrameStyle): string {
  const roundedAttrs =
    style.roundCorner === 0
      ? {}
      : { rx: style.roundCorner / SVG_ROUND_CORNER_DIVISOR, ry: style.roundCorner / SVG_ROUND_CORNER_DIVISOR };
  return rect(0, 0, width, height, {
    fill: style.fillColor,
    stroke: style.lineColor,
    strokeWidth: style.lineThickness,
    ...roundedAttrs,
  });
}

/** `BigFrame#drawU` (java:105-124): the folder-tab title cutout line,
 *  drawn with the border colour and NO fill (`ug.apply(HColors.none()
 *  .bg())`). */
function titleCutoutPath(width: number, dimTitle: Dim, style: BigFrameStyle): string {
  const textWidth = dimTitle.width === 0 ? width / 3 : dimTitle.width + 10;
  const cornerSize = dimTitle.width === 0 ? 7 : 10;
  const cutoutHeight = titleCutoutHeight(dimTitle);
  const d = `M${textWidth},0 L${textWidth},${cutoutHeight - cornerSize} L${textWidth - cornerSize},${cutoutHeight} L0,${cutoutHeight}`;
  return path(d, { stroke: style.lineColor, strokeWidth: style.lineThickness });
}

export function buildBigFrame(dimTitle: Dim, originalDim: Dim, style: BigFrameStyle): BigFrameLayout {
  const padding = effectivePadding(style.padding, dimTitle);
  const width = padding.left + Math.max(originalDim.width + 12, dimTitle.width + 10) + padding.right;
  const height = padding.top + dimTitle.height + originalDim.height + padding.bottom;

  return {
    width,
    height,
    originalX: padding.left,
    originalY: padding.top,
    body: frameRect(width, height, style) + titleCutoutPath(width, dimTitle, style),
  };
}
