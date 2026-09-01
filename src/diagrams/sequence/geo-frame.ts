/**
 * FRAME geometry — `alt`/`opt`/`loop`/`group`/`ref` boxes, their header tab
 * and their `else` branch bands.
 *
 * One of the four per-renderer geometry modules `geo.ts` was split into (D8);
 * this one pairs with `renderer-frame-header.ts` and `renderer-frame-blotter.ts`.
 *
 * Re-exported by `geo.ts`, which is re-exported by `ast.ts`.
 */

export interface FrameGeo {
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
  /** `else` branch boundaries: y + bracketed condition. Each MAY carry its
   *  own resolved BODY-band fill. Empty for single-branch frames. */
  branchSeparators: { y: number; label: string; backColorGeneral?: string }[];
  /** `ref over` body lines, pre-centred `x` (needs the measurer, layout-only,
   *  same rationale as `x`/`y` above). Empty for every other frame type. */
  refBody: { text: string; x: number }[];
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
}
