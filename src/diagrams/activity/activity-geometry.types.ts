/**
 * Shared geometry types for the activity diagram layout engine.
 *
 * Relocated verbatim (names + shapes + docs) from `activity-layout-types.ts`
 * per code-review-tasks.md batch D (2026-09-21): these are the geometry
 * types the LIVE tile layout engine (`layout/tile-layout.ts` and its
 * siblings) actually reads. The context/result types that stayed behind
 * (`BranchResult`, `LayoutCtx`, etc.) were internal to the superseded
 * `layout.old.ts` engine and were deleted with it.
 */

// ---------------------------------------------------------------------------
// Public geometry types
// ---------------------------------------------------------------------------

export interface ActivityNodeGeo {
  id: string;
  kind: string;
  label?: string;
  color?: string;
  stereotype?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** For note nodes: which side the note sits on relative to its action. */
  notePosition?: 'left' | 'right';
  /** For note nodes: absolute coordinates of the balloon spike tip. */
  spikeTip?: { x: number; y: number };
  /**
   * The swimlane this node's source `ActivityNode` was parsed in, if any.
   * Mirrors `Tile.swimlane` (`tiles/tile.ts`); T5 populates this in
   * `walkTile` so `swimlane-context.ts`'s `measureLaneExtents` can bucket
   * placed nodes by lane.
   */
  swimlane?: string;
}

export interface ActivityEdgeGeo {
  points: Array<{ x: number; y: number }>;
  label?: string;
  color?: string;
  /**
   * `false` = draw no end decoration. `Worm#drawInternalOneColor`'s
   * `if (endDecoration != null)` guard (`ftile/Worm.java:161-168`) never
   * fires when the builder passes a `null` end decoration -- e.g. an empty
   * branch (`cond/FtileIfWithLinks.java:96-101`), `…Direct`
   * (`FtileIfWithLinks.java:288-367`) or `ConnectionHline`.
   */
  arrowhead?: false;
  /**
   * `Worm#drawInternalOneColor`'s `emphasizeDirection` parameter (set via
   * `Snake#emphasizeDirection`): an arrow is drawn at the midpoint of the
   * FIRST segment whose `Direction.fromVector(p1, p2)` equals this value,
   * in addition to (never instead of) the terminal arrowhead.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:138-139,178-183
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Snake.java:112-113
   */
  emphasize?: 'up' | 'down' | 'left' | 'right';
  /**
   * D4 (`plans/activity-loop-lane-translate/decisions.md`): an explicit
   * extra arrowhead a translate shape draws at its own midpoint, separate
   * from `emphasize`'s segment-direction search --
   * `FtileWhile.ConnectionBackSimple#drawTranslate` draws `asToUp` at
   * `(xx, (y1 + y2) / 2)` with NO `emphasizeDirection` set, so the
   * renderer's `findEmphasisSegment` cannot place it. `renderEdge` draws
   * one `arrowTip` here, after the `emphasize` element.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:306-307
   */
  midArrowAt?: { x: number; y: number; dir: 'up' | 'down' | 'left' | 'right' };
}

export interface SwimlaneGeo {
  name: string;
  x: number;
  width: number;
  /**
   * `maxX - minX` of the lane's own content, in lane-local coordinates.
   * `0` for a lane with no assigned content. Optional because it is
   * populated by T5 (`tile-coordinates.ts`, via `swimlane-context.ts`'s
   * `computeLaneWidths`) -- pre-existing call sites that still build a
   * bare `{ name, x, width }` must keep compiling.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:451-453
   */
  contentWidth?: number;
  /**
   * The lane title's bounder width at the resolved swimlane title font
   * size (`swimlaneTitleFontSize`, `activity-style-defaults.ts`).
   * Optional for the same reason as {@link contentWidth}.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:285-293
   */
  titleWidth?: number;
  /**
   * Lane-local `minX` of the lane's content. T5 needs this for the
   * centring translate upstream applies when a lane's resolved width
   * exceeds its raw content width. Optional for the same reason as
   * {@link contentWidth}.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:427-429
   */
  contentMinX?: number;
  /**
   * The absolute left of the lane's CONTENT (`translate.dx + minX`,
   * `contentLeft` in `swimlane-placement.ts`'s origin loop) -- what
   * `CenteredText` centres the title over. Optional for the same reason
   * as {@link contentWidth}.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:373-375
   */
  contentX?: number;
}

/**
 * The transparent (or user-coloured) title-band rect drawn behind every
 * lane title (D3). Present only when there is chrome to draw --
 * `swimlanes.length > 1` (`Swimlanes.java:275`'s own `size() > 1` guard; a
 * single lane draws no band at all).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:358-367
 */
export interface SwimlaneBandGeo {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The Y-range every lane divider spans: from the block's own top (the
 * band's own `y`) to the content bottom. Same presence guard as
 * {@link SwimlaneBandGeo}.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:423-424
 */
export interface SwimlaneDividerY {
  y1: number;
  y2: number;
}

export interface ActivityGeometry {
  totalWidth: number;
  totalHeight: number;
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  swimlanes: SwimlaneGeo[];
  swimlaneBand?: SwimlaneBandGeo;
  swimlaneDividerY?: SwimlaneDividerY;
}
