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
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import type { FrameEvent } from './ast.js';
import { displayLines } from './text-block-geo.js';
import { atomFontSpec } from './sequence-creole-text-atom.js';
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

/** The header text's dimension at `styleHeader`'s font (`fcHeader`,
 *  `ComponentRoseReference.java:75,78`). */
function refHeaderTextDim(headerPaint: SequencePaint, measurer: StringMeasurer): { width: number; height: number } {
  return measurer.measure(REF_HEADER_TEXT, atomFontSpec(headerPaint.font));
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
export function refBodyHeight(body: readonly string[], paints: ReferencePaints, measurer: StringMeasurer): number {
  // An empty body is an empty block: `getTextHeight` is its padding alone.
  const lineHeight = measurer.measure('M', atomFontSpec(paints.paint.font)).height;
  const textHeight = body.length * lineHeight + 2 * REF_PADDING;
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
export function refComponentWidth(body: readonly string[], paints: ReferencePaints, measurer: StringMeasurer): number {
  const spec = atomFontSpec(paints.paint.font);
  const widest = Math.max(0, ...body.map((l) => measurer.measure(l, spec).width));
  const headerWidth = refHeaderWidth(paints.headerPaint, measurer);
  return Math.max(widest + 2 * REF_PADDING, headerWidth) + 2 * REF_X_MARGIN + paints.paint.shadowing;
}

// ---------------------------------------------------------------------------
// Transitional: the participant-row constraint
// ---------------------------------------------------------------------------
//
// `sequence-layout-participants.ts#refConstraint` (sdd1 T3e's file) still
// sizes a `ref` through the theme, by `refBodyWidth(lines, theme, measurer)`,
// which `text-block-geo.ts` re-exports. The layout itself sizes it through
// the style (`refComponentWidth`). Until that caller passes the event's
// paints (`refComponentWidth(lines, referencePaints(ev), measurer)`), the
// theme path below stays; T3c deletes it with the fields it reads.

/**
 * `reference { FontSize 12 }` (`plantuml.skin:156`) -- the transitional
 * participant-row path's body size. The layout reads the style's.
 */
export const REFERENCE_FONT_SIZE = 12;

/** `referenceHeader { FontSize 13 }` (`plantuml.skin:167`), the transitional
 *  participant-row path's header size. */
const REFERENCE_HEADER_FONT_SIZE = 13;

/** The transitional path's body font. */
export function refBodyFontSpecOf(theme: Theme): FontSpec {
  return { family: theme.fontFamily, size: REFERENCE_FONT_SIZE };
}

/** The transitional path's header font: `referenceHeader { FontSize 13,
 *  FontStyle bold }` (`plantuml.skin:167-168`). */
export function refHeaderFontSpecOf(theme: Theme): FontSpec {
  return { family: theme.fontFamily, size: REFERENCE_HEADER_FONT_SIZE, weight: 'bold' };
}

/** {@link refComponentWidth} over the theme, for the participant-row
 *  constraint only (see the section comment above). */
export function refBodyWidth(body: readonly string[], theme: Theme, measurer: StringMeasurer): number {
  const widest = Math.max(0, ...body.map((l) => measurer.measure(l, refBodyFontSpecOf(theme)).width));
  const headerWidth = measurer.measure(REF_HEADER_TEXT, refHeaderFontSpecOf(theme)).width + REF_HEADER_EXTRA_WIDTH;
  const deltaShadow = theme.colors.graph.sequenceShadowing?.reference ?? 0;
  return Math.max(widest + 2 * REF_PADDING, headerWidth) + 2 * REF_X_MARGIN + deltaShadow;
}
