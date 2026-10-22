/**
 * ref-body-geo.ts — the `ref over` frame's own geometry and paint
 * (`ComponentRoseReference`), split out of `text-block-geo.ts` when that file
 * reached the project's 500-line cap; `text-block-geo.ts` re-exports the
 * names it carried.
 *
 * sdd1 T3a: the component reads two styles, merged in `Reference`'s
 * constructor from the builder current at the command (`Reference.java:
 * 104-113`): `style` (`reference`) for the body's font, alignment, symbol
 * context, `RoundCorner` and shadow (`ComponentRoseReference.java:69-76`),
 * and `styleHeader` (`referenceHeader` under the nested `reference
 * { header }`, `Reference.java:85-97`) for the header's font and symbol
 * context (`:72,75`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseReference.java
 */
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { FrameEvent } from './ast.js';
import { displayLines } from './text-block-geo.js';
import { alignedBlockRuns, type BlockContext, type PlacedBlock } from './sequence-block-align.js';
import { componentLabelBlock, symbolInk, type LabelInk } from './sequence-creole-sheet.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { paintOf, referenceStyle, type SequencePaint } from './sequence-skin-param.js';

/** The body padding `ComponentRoseReference` hands to `super` --
 *  `topRightBottomLeft(4, 4, 4, 4)`, so the same value on all four sides
 *  (`ComponentRoseReference.java:69-70`). */
export const REF_PADDING = 4;
/** `heightFooter` -- the band below the body block
 *  (`ComponentRoseReference.java:61`). */
export const REF_HEIGHT_FOOTER = 5;
/** `xMargin` -- the inset between the component's box and its bounds
 *  (`ComponentRoseReference.java:62`). */
export const REF_X_MARGIN = 2;
/** `getHeaderWidth` adds a flat `30 + 15` to the header text's own width
 *  (`ComponentRoseReference.java:145-148`). */
export const REF_HEADER_EXTRA_WIDTH = 45;
/** The header text itself: `stringsToDisplay.subList(0, 1)`, the frame's
 *  keyword (`ComponentRoseReference.java:78`). */
export const REF_HEADER_TEXT = 'ref';

/** A `ref`'s two paints: `style` (the body) and `styleHeader`. */
export interface ReferencePaints {
  readonly paint: SequencePaint;
  readonly headerPaint: SequencePaint;
}

/**
 * `Reference#getUsedStyles` (`Reference.java:99-102`): the body style as
 * merged, the header style with the `ref#color` as its `BackGroundColor` --
 * `colorSet.getColor(s1)` (`CommandReferenceOverSeveral.java:118-119`).
 */
export function referencePaints(event: Pick<FrameEvent, 'styleBuilder' | 'backColorElement'>): ReferencePaints {
  const set = HColorSet.instance();
  const back = event.backColorElement === undefined ? undefined : set.getColor(event.backColorElement);
  return {
    paint: paintOf(referenceStyle(event.styleBuilder, false), set),
    headerPaint: paintOf(referenceStyle(event.styleBuilder, true).eventuallyOverride('BackGroundColor', back), set),
  };
}

/**
 * A `ref over` frame's BODY, one entry per source line.
 *
 * `ref` is the one frame type whose label is content rather than a condition:
 * `CommandReferenceMultilinesOverSeveral` accumulates the block's plain-text
 * lines, and `ComponentRoseReference#drawInternalU` draws them as their own
 * text block INSIDE the box (`:126-136`), below the header — where every other
 * frame type draws a bracketed `[condition]` beside the tab. Empty for any
 * other frame type, which is what keeps this a `ref`-only path.
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseReference.java#drawInternalU
 */
export function refBodyLines(frameType: string, label: string): readonly string[] {
  if (frameType !== 'ref') return [];
  // `CommandReferenceOverSeveral.java:132` builds `reference.getStrings()`
  // with `Display.getWithNewlines`, so a single-line `ref over A : a\nb` is a
  // two-line body exactly as the `ref … end ref` block form is.
  // The single-line form `trin`s the WHOLE text once at parse
  // (`CommandReferenceOverSeveral.java:125`), the block form only drops the
  // common indent (`CommandReferenceMultilinesOverSeveral.java:142`); neither
  // trims each line, so an inner line keeps its spaces.
  return label.trim() === '' ? [] : displayLines(label);
}

/** The header text block's dimension: `stringsToDisplay.subList(0, 1)
 *  .create(fcHeader, LEFT, skinParam)` at `styleHeader`'s font
 *  (`ComponentRoseReference.java:75,78`). */
function refHeaderTextDim(headerPaint: SequencePaint, measurer: StringMeasurer): { width: number; height: number } {
  const align = { align: HorizontalAlignment.LEFT };
  return componentLabelBlock([REF_HEADER_TEXT], headerPaint.font, align, measurer);
}

/** The ink both ref text blocks are drawn under: `symbolContextHeader.apply
 *  (ug)` then `UStroke.simple()` (`ComponentRoseReference.java:121-124`),
 *  which `textHeader` and the body block (`:126,137`) both inherit. */
export function refTextInk(headerPaint: SequencePaint): LabelInk {
  return { ...symbolInk(headerPaint), stroke: UStroke.simple() };
}

/**
 * The body's text block (`getTextBlock()`, `AbstractTextualComponent.java:84-92`)
 * at the body style's font and alignment, with the padding's sides as its
 * margins (`topRightBottomLeft(4, 4, 4, 4)`, `ComponentRoseReference.java:69-70`),
 * drawn under {@link refTextInk}, placed at `origin`.
 */
export function refBodyBlock(
  body: readonly string[],
  paints: ReferencePaints,
  origin: { readonly leftX: number; readonly top: number },
  env: Omit<BlockContext, 'ink' | 'marginX1' | 'marginX2'>,
): PlacedBlock {
  const ink = refTextInk(paints.headerPaint);
  const context = { ...env, ink, marginX1: REF_PADDING, marginX2: REF_PADDING };
  return alignedBlockRuns(body, paints.paint.font, origin, paints.paint.align, context);
}

/** `getHeaderHeight` -- the header text's height plus `2 * 1`
 *  (`ComponentRoseReference.java:140-143`). */
export function refHeaderHeight(headerPaint: SequencePaint, measurer: StringMeasurer): number {
  return refHeaderTextDim(headerPaint, measurer).height + 2;
}

/** `getHeaderWidth` -- the header text's width plus `30 + 15`
 *  (`ComponentRoseReference.java:145-148`). */
export function refHeaderWidth(headerPaint: SequencePaint, measurer: StringMeasurer): number {
  return refHeaderTextDim(headerPaint, measurer).width + REF_HEADER_EXTRA_WIDTH;
}

/**
 * `getPreferredHeight` = text height + header height + footer
 * (`ComponentRoseReference.java:150-153`), where `getTextHeight` is the text
 * block's own height at the body style's font plus the top and bottom
 * padding (`AbstractTextualComponent.java:110-114`).
 */
export function refBodyHeight(
  body: readonly string[],
  paints: ReferencePaints,
  measurer: StringMeasurer,
  sprites?: SpriteRegistry,
): number {
  // An empty body is an empty block: `getTextHeight` is its padding alone.
  const block = refBodyBlock(body, paints, { leftX: 0, top: 0 }, { measurer, sprites });
  const textHeight = block.height + 2 * REF_PADDING;
  return textHeight + refHeaderHeight(paints.headerPaint, measurer) + REF_HEIGHT_FOOTER;
}

/**
 * `getPreferredWidth` = max(text width, header width) + 2 * xMargin +
 * `symbolContextBody.getDeltaShadow()` (`ComponentRoseReference.java:155-159`),
 * where `getTextWidth` is the widest line plus the left and right padding
 * (`AbstractTextualComponent.java:100-108`) and the delta is the body style's
 * `Shadowing` (`Style.java:277`), which `renderer-frame-header.ts
 * #renderBodyRect` takes back off the drawn rect (`:89`). Jar-verified:
 * `tests/fixtures/unwind2-S9/style-reference.svg` against
 * `noshadow-reference.svg` -- the canvas widens by 3, the rect does not.
 */
export function refComponentWidth(
  body: readonly string[],
  paints: ReferencePaints,
  measurer: StringMeasurer,
  sprites?: SpriteRegistry,
): number {
  // `getTextWidth` is the text block's `calculateDimension` (`AbstractTextual
  // Component.java:100-108`): the RENDERED creole stripes, so `[[url{tip}]]`
  // counts its label, not its markup.
  const widest = refBodyBlock(body, paints, { leftX: 0, top: 0 }, { measurer, sprites }).width;
  const headerWidth = refHeaderWidth(paints.headerPaint, measurer);
  return Math.max(widest + 2 * REF_PADDING, headerWidth) + 2 * REF_X_MARGIN + paints.paint.shadowing;
}
