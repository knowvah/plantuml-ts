/**
 * FRAME geometry — `alt`/`opt`/`loop`/`group`/`ref` boxes, their header tab
 * and their `else` branch bands.
 *
 * One of the four per-renderer geometry modules `geo.ts` was split into (D8);
 * this one pairs with `renderer-frame-header.ts` and `renderer-frame-blotter.ts`.
 *
 * Re-exported by `geo.ts`, which is re-exported by `ast.ts`.
 */

import type { SequencePaint } from './sequence-skin-param.js';
import type { TextRun } from './text-block-geo.js';

export interface FrameGeo {
  /**
   * The element's resolved style paint (sdd1 D1/D5). Optional until its family
   * migrates. NOT scaled by `scale-geo`: the jar scales at emission
   * (`SvgGraphics#format`), see `scale-geo.ts` header.
   */
  readonly paint?: SequencePaint;
  /** The group/ref HEADER's paint (`Grouping`/`Reference` merge the nested
   *  `header` style over the element style). Optional, not scaled. */
  readonly headerPaint?: SequencePaint;
  kind: 'frame';
  frameType: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** `COLORS` 0/1, raw, resolved late — see `FrameEvent` above. */
  backColorElement?: string;
  backColorGeneral?: string;
  /** `else` branch boundaries, as the `Blotter` reads them off the group's
   *  `ElseTile`s (`GroupingTile.java:318-347`): each tile's top and its own
   *  general colour, which MAY carry its own BODY-band fill. Empty for
   *  single-branch frames. The rule and condition each else draws are its
   *  own {@link ElseGeo}, in the event stream. */
  branchSeparators: {
    y: number;
    label: string;
    backColorGeneral?: string;
  }[];
  /** `ref over` body lines as placed, measured runs — pre-centred `x` and an
   *  absolute baseline, both resolved in layout because both need the measurer
   *  (D1). Empty for every other frame type. */
  refBody: readonly TextRun[];
  /**
   * The header tab did not survive the page clip, so it is not drawn.
   *
   * Set ONLY by `sequence-page.ts`, and only when a frame straddles a
   * `newpage` boundary such that its body rectangle is still (partly) on
   * this page but its top is not. The tab is a `UPath` (all-or-nothing on
   * its bbox corners, `DriverPathSvg:58-60`) while the body it hangs off is
   * a `URectangle` (clamped, `DriverRectangleSvg:66-74`) -- the one place
   * upstream's per-shape rules genuinely disagree within one kind. Absent
   * on every un-paginated geometry.
   */
  headerClipped?: boolean;
  /** Header Display, resolved in LAYOUT (no measurer at render time).
   *  @see GroupingTile.java:126-127, `frame-style.ts#groupingHeaderDisplay` */
  tabText: string;
  tabComment?: string;
  tabTextWidth: number;
  tabWidth: number;
  tabHeight: number;
  /**
   * The header tab's title and its optional `[comment]`, as placed and
   * measured runs (A4).
   *
   * Two runs at two DIFFERENT fonts — the title at `HEADER_FONT_SIZE` 13 bold,
   * the comment at the group style's own `smallFont2` 11 bold
   * (`ComponentRoseGroupingHeader.java:89,151-158`) — so each carries its own
   * width, ascent and line height. `tabTextWidth` above is NOT this: it is the
   * title's contribution to the tab BOX's width, a box dimension that
   * `tabWidth` and the corner path are derived from, and it survives alongside
   * the runs for that reason.
   */
  tabRuns: readonly TextRun[];
}

/**
 * An `else` branch's own tile (`ElseTile`): the dashed rule across the group's
 * frame and its bracketed condition (`ComponentRoseGroupingElse#drawInternalU`,
 * `:103-113`).
 *
 * It is one of its group's CHILD tiles (`GroupingTile.java:162-170`), so it
 * sits in the event stream after the branch it closes and is drawn there,
 * among the other tiles, in their order (`GroupingTile#drawU:280-281`) -- not
 * with the frame's header. It draws nothing in the background pass: under
 * teoz its background colour is transparent (`ComponentRoseGroupingElse
 * .java:71,75-76`).
 */
export interface ElseGeo {
  /** The leaf style's paint (`ElseTile.java:92-101`, merged from the
   *  builder current at the `else` line), which strokes the rule and fonts
   *  the condition (sdd1 D1/D2). NOT scaled by `scale-geo`: the jar scales at
   *  emission (`SvgGraphics#format`). */
  readonly paint: SequencePaint;
  kind: 'else';
  /** The group's FRAME extents, never its `getMinX`/`getMaxX`
   *  (`ElseTile.java:117-131`). */
  x: number;
  width: number;
  /** The tile's top, `getYGauge().getMin()` (`ElseTile.java:112`). */
  y: number;
  /** The bracketed condition as placed, measured runs (A5; an ARRAY since
   *  C5, because creole makes one condition several styled runs). EMPTY when
   *  the branch carries no condition, which draws the rule alone. Measured at
   *  the leaf style's own font -- `ComponentRoseGroupingElse` is a different
   *  component from the tab beside it. */
  runs: readonly TextRun[];
}
