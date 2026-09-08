/**
 * The `note on link` merge half of `edge-label-box.ts` — the note operand,
 * the four `Position` merges and the shield.
 *
 * Split out 2026-09-08 to keep `edge-label-box.ts` under this project's
 * 500-line cap, which honouring a leading `<size:N>` had pushed it to
 * exactly. A pure move: every symbol below is unchanged, and
 * `edge-label-box.ts` re-exports `computeMergedLabelBox`/
 * `MergedLabelBoxInput` so no consumer's import changed (mirrors the
 * `svg.ts`->`svg-markers.ts` and `style-map-theme.ts`->`style-map-element.ts`
 * precedent).
 */
import type { FontSpec, StringMeasurer } from './measurer.js';
import { computeReservedLabelBox, type ReservedLabelBox } from './edge-label-box.js';

/** Two-dimensional size, independent of where it came from (a measured
 *  label or the note sizer's decorated-image output). */
interface Dim {
  readonly width: number;
  readonly height: number;
}

/** `Position.LEFT` / `RIGHT` / `TOP` / `BOTTOM` — the note's placement
 *  relative to the label, `SvekEdge.java:318-325`. */
export type NoteOnLinkPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * `labelShield` — 7 when the link type's middle decor is not `NONE`, 0
 * otherwise (`SvekEdge.java:353-356`). `2 * LABEL_SHIELD` is added to BOTH
 * width and height via `dimNote.delta(2 * labelShield)` (`:441`), because
 * `XDimension2D#delta(double)` (`XDimension2D.java:75-77`) forwards to the
 * two-arg form with the same value for width and height (`:87-92`).
 */
const LABEL_SHIELD = 7;

/**
 * `XDimension2D#mergeLR` (`XDimension2D.java:108-112`) — the arithmetic
 * `TextBlockHorizontal#calculateDimensionSlow` reduces over via
 * `TextBlockUtils.mergeLR` (`TextBlockHorizontal.java:69-75`,
 * `TextBlockUtils.java:112-120`). Read here, not inferred from the method
 * name (decisions.md D2): width sums, height takes the max — the alignment
 * parameter (`VerticalAlignment`) only affects `drawU`'s vertical offset
 * (`:77-93`), never the dimension. Width-sum and height-max are both
 * commutative, so operand order does not change the numbers this function
 * returns — it is preserved anyway to mirror upstream for a future drawing
 * consumer (T9/T10), which DOES care which side is on the left.
 */
function mergeLR(left: Dim, right: Dim): Dim {
  return { width: left.width + right.width, height: Math.max(left.height, right.height) };
}

/**
 * `XDimension2D#mergeTB` (`XDimension2D.java:94-98`) — same reduction, via
 * `TextBlockVertical#calculateDimensionSlow` (`TextBlockVertical.java:71-77`,
 * `TextBlockUtils.java:122-130`): width takes the max, height sums.
 */
function mergeTB(top: Dim, bottom: Dim): Dim {
  return { width: Math.max(top.width, bottom.width), height: top.height + bottom.height };
}

/**
 * Operand order per position (`SvekEdge.java:318-325`): note-first for
 * `LEFT`/`TOP`, label-first for `RIGHT`/`BOTTOM`.
 */
function mergeByPosition(position: NoteOnLinkPosition, noteDim: Dim, labelDim: Dim): Dim {
  switch (position) {
    case 'left':
      return mergeLR(noteDim, labelDim);
    case 'right':
      return mergeLR(labelDim, noteDim);
    case 'top':
      return mergeTB(noteDim, labelDim);
    case 'bottom':
      return mergeTB(labelDim, noteDim);
  }
}

export interface MergedLabelBoxInput {
  readonly label: string;
  /** From the note sizer (`EntityImageNoteLink` — padding, border, and any
   *  sprite already baked in), NOT a string measurement. */
  readonly noteDim: Dim;
  readonly position: NoteOnLinkPosition;
  /** `NoteLinkStrategy.HALF_NOT_PRINTED` / `HALF_PRINTED_FULL`
   *  (`SvekEdge.java:314-317`). */
  readonly halfWidth: boolean;
  /** `link.getType().getMiddleDecor() != LinkMiddleDecor.NONE`
   *  (`:353-356`). */
  readonly hasMiddleDecor: boolean;
  readonly font: FontSpec;
  readonly measurer: StringMeasurer;
  /** G20: forwarded verbatim to the label-side {@link computeReservedLabelBox}
   *  call below -- `SvekEdge.java:288-306` builds `labelOnly` (wrap-aware)
   *  BEFORE any note merge, so the note operand itself never sees this. */
  readonly maxWidth?: number | undefined;
}

/**
 * The box formula for a link whose note is merged into the label
 * (`SvekEdge.java:302-325, 440-445, 485-489`), covering all three terms in
 * order of application:
 *
 * 1. **Merge** — `mergeLR`/`mergeTB` over the label's ALREADY-margined
 *    dimension (`labelOnly = addVisibilityModifier(block, link, skinParam)`,
 *    `:302`, which bakes in `2 * marginLabel` via `withMargin` — `:372-373`
 *    — BEFORE the merge, not after) and the note operand's raw dimension.
 *    Reuses {@link computeReservedLabelBox} for the label side so the same
 *    creole-strip/split/margin arithmetic is not re-derived; `isSelfLoop`
 *    is fixed `false` because this contract carries no such flag — no
 *    corpus fixture combines a self-loop link with `note on link`, so the
 *    self-loop margin (6, `:372`) is unrepresented here. If one surfaces,
 *    that is a `DIVERGENCES.md` entry, not a reason to guess a flag through.
 *    An empty label mirrors `TextBlockUtils.mergeLR`/`mergeTB`'s own
 *    `EMPTY_TEXT_BLOCK` short-circuit (`TextBlockUtils.java:112-120,
 *    122-130`): the note dimension passes through untouched, unmerged.
 * 2. **Shield** — `+ 2 * labelShield` on BOTH dimensions.
 * 3. **Halving** — width only, via `eventuallyDivideByTwo`
 *    (`SvekEdge.java:485-489`).
 *
 * `appendTable`'s `(int)` cast (`:504-507`) truncates the final width AND
 * height — unlike {@link computeReservedLabelBox}, where only width can be
 * fractional; here both can, since `noteDim` may carry sub-pixel values.
 *
 * **Exactly one truncation, at the end.** Upstream's whole pipeline —
 * `withMargin` (`TextBlockUtils.java:75-78`), `mergeLR`/`mergeTB`
 * (`XDimension2D.java:94-98,108-112`), `delta` (`:87-92`),
 * `eventuallyDivideByTwo` — stays in doubles; only `appendTable`'s `(int)`
 * cast (`:504-507`) truncates, once, on the fully-combined dimension. The
 * label operand therefore enters the merge as `measuredWidth + 2 *
 * marginLabel` (fractional), NOT {@link computeReservedLabelBox}'s
 * `reservedWidth` (already floored, `:107`) — using the floored value here
 * would truncate the label twice (once early, once at the end below),
 * losing up to 1px whenever `mergeLR` sums it into the note's width or
 * `mergeTB` maxes against it. `computeReservedLabelBox`'s OWN callers still
 * get the early floor; only this merge path skips it, on the label operand
 * only. Height is unaffected: `computeReservedLabelBox` never floors
 * `reservedHeight` (`:108`), so it is already the fractional value.
 */
export function computeMergedLabelBox(input: MergedLabelBoxInput): ReservedLabelBox {
  const { label, noteDim, position, halfWidth, hasMiddleDecor, font, measurer, maxWidth } = input;
  const labelBox = computeReservedLabelBox(label, font, measurer, false, { maxWidth });
  const labelDim: Dim = {
    width: labelBox.measuredWidth + 2 * labelBox.marginLabel,
    height: labelBox.reservedHeight,
  };
  const merged = label.length === 0 ? noteDim : mergeByPosition(position, noteDim, labelDim);
  const shield = hasMiddleDecor ? LABEL_SHIELD : 0;
  const shieldedWidth = merged.width + 2 * shield;
  const shieldedHeight = merged.height + 2 * shield;
  const finalWidth = halfWidth ? shieldedWidth / 2 : shieldedWidth;
  return {
    marginLabel: labelBox.marginLabel,
    lines: labelBox.lines,
    measuredWidth: merged.width,
    measuredHeight: merged.height,
    reservedWidth: Math.floor(finalWidth),
    reservedHeight: Math.floor(shieldedHeight),
  };
}
