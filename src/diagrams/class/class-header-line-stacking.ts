/**
 * Vertical placement of a classifier NAME's physical lines -- split out of
 * `class-stereotype-layout.ts#buildHeaderRows` (500-line cap) when cdd4-T12
 * replaced the flat `i * fontSize` step with upstream's per-stripe running
 * sum. Pure; `buildHeaderRows` is the sole caller.
 */

import type { MemberRenderAtom } from './class-member-creole.js';

/**
 * CDD B7FU-R2 item (c) (rotisi-30-loge424, `class "<$bug16>" as foo1`):
 * same bottom-anchor mechanism `class-member-rows.ts#buildSectionRows`'s
 * own doc comment documents in full -- a sprite/img (`'image'`-kind) atom
 * draws TOP-anchored at an absolute pixel position with no per-atom `dy`
 * correction, so ITS line needs `y` bottom-anchored to its real height;
 * every other line (plain text, sup/sub, blank) keeps the plain
 * `lineTop + baselineOffset` placement (every other atom kind carries its
 * own `Sea` `dy`, `class-member-creole-sea.ts#textAtomDy`). Split out
 * purely to keep `buildHeaderRows`'s row-map callback under the
 * project's per-function CCN cap.
 */
export function headerLineY(params: {
  lineTop: number;
  fontSize: number;
  baselineOffset: number;
  atoms: readonly MemberRenderAtom[] | undefined;
  height: number | undefined;
}): number {
  const { lineTop, fontSize, baselineOffset, atoms, height } = params;
  const flat = lineTop + baselineOffset;
  if (atoms?.some((a) => a.kind === 'image') !== true) return flat;
  return flat + (height ?? fontSize) - fontSize;
}

/**
 * cdd4-T12: each name line's TOP is `nameTop` plus the running sum of every
 * PREVIOUS line's own height -- the name is one `Display#create8` block
 * (EntityImageClassHeader.java:107-108 -> Display.java:699 `new SheetBlock1`)
 * whose `initMap` stacks stripes as `sea.translateMinYto(y); ... final double
 * height = sea.getHeight(); ... y += height;` (SheetBlock1.java:142-148). An
 * emoji line is `39*factor` tall (lecelo-92-loma110: 22.75 at 14pt), a sub-10pt
 * text line 10 (AtomText.java:179-181) -- never a flat `fontSize`. Without
 * `lineHeights` (hand-built input) each line falls back to `fontSize`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/SheetBlock1.java
 */
export function headerLineTops(
  nameTop: number,
  count: number,
  fontSize: number,
  lineHeights?: readonly number[],
): number[] {
  const tops: number[] = [];
  let y = nameTop;
  for (let i = 0; i < count; i++) {
    tops.push(y);
    y += lineHeights?.[i] ?? fontSize;
  }
  return tops;
}
