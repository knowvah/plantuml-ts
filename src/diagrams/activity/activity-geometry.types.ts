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

import type { SnakeTextAlign } from './layout/snake-text-position.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import type { StringMeasurer } from '../../core/measurer.js';

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
  /**
   * For `'if-split'` nodes only (add3-T3c): which concrete condition-
   * diamond tile built this node, carried so `activity-renderer-
   * shapes.ts#renderNode` can pick the true polygon shape instead of
   * inferring it from `label === ''` (T3d's own heuristic, ambiguous once
   * `buildIfWithLinks` could ALSO build a `GtileDiamondEmpty` with a
   * non-empty north test label -- see that function's own doc comment).
   * `undefined` for every OTHER producer of `'if-split'`/`'repeat-cond'`/
   * `'while-header'` this task's write-set does not touch (`walk-while-
   * branch.ts`/`walk-repeat*.ts`), which keep the pre-existing heuristic.
   */
  diamondShape?: 'inside' | 'square' | 'empty';
  /**
   * For `'if-label'` nodes only (add4-T3h): `'test'` when the label is an
   * EMPTY_DIAMOND condition's own test text -- `FtileDiamond.withNorth(tbTest)`
   * (`ConditionalBuilder.java:262-267`), the diamond-font `CreoleMode.FULL`
   * condition Sheet (`:240-247`). Absent = a branch label, the arrow-font
   * `SIMPLE_LINE` block (`:280-283`). `'full'` (add4-T3j) = an arrow-font
   * `Display#create` FULL block: a while's / repeat's yes/out labels
   * (`FtileWhile.java:123,127-128`, `FtileRepeat.java:127-131`) and an
   * elseif hexagon's slots (`FtileIfLongHorizontal.java:172-173,186`).
   */
  ifLabelRole?: 'test' | 'full';
  /** isw-T2-act F5: an `'if-label'`/`'if-own-label'` whose block carries the
   *  style `wrapWidth()` -- `ConditionalBuilder`'s test and SIMPLE_LINE
   *  branch labels, the switch's and horizontal elseif's tests
   *  (`ConditionalBuilder.java:120-121`, `FtileFactoryDelegatorSwitch.java:134`,
   *  `FtileIfLongHorizontal.java:174`). Absent: `LineBreakStrategy.NONE`. */
  wrapped?: true;
  /**
   * unwind2-S11: an `'if-label'` in a north/south/west/east slot of a
   * `FtileDiamondInside`/`FtileDiamondInside2`/`FtileDiamondSquare`, whose
   * `drawU` applies `backColor.bg()` to the `ug` the slots are drawn with
   * (`FtileDiamondInside.java:85,88-89,98-102`) -- so a slot's `<$sprite>`
   * tints over the diamond fill (`SpriteMonochrome.java:216`). Absent for
   * an EMPTY `FtileDiamond`, which applies the back to the polygon draw
   * only (`FtileDiamond.java:85-91`).
   */
  onDiamondBack?: true;
  /** For note nodes: absolute coordinates of the balloon spike tip. */
  spikeTip?: { x: number; y: number };
  /** For `label`/`goto` nodes (add4-T3d): `false` when upstream draws the
   *  tile through a decorator's direct `drawU`, bypassing
   *  `UGraphicDispatchFtile` (see `tiles/gtile-goto.ts#markDecoratedSoleChild`).
   *  Absent = dispatched. */
  dispatched?: false;
  /**
   * The swimlane this node's source `ActivityNode` was parsed in, if any.
   * Mirrors `Tile.swimlane` (`tiles/tile.ts`); T5 populates this in
   * `walkTile` so `swimlane-context.ts`'s `measureLaneExtents` can bucket
   * placed nodes by lane.
   */
  swimlane?: string;
  /** add4-T2b: a `group`/`partition` frame drawn with a non-frame `USymbol`
   *  (`CommandPartition3#getUSymbol`, `CommandPartition3.java:89-106`);
   *  absent = `USymbolFrame` (`partition`/`group`). */
  usymbol?: CompositeUSymbol;
}

/** The three container keywords that do NOT draw a `USymbolFrame`:
 *  `USymbols.PACKAGE` (folder), `CARD`, `RECTANGLE` (`USymbols.java:69,86,91`). */
export type CompositeUSymbol = 'package' | 'card' | 'rectangle';

export interface ActivityEdgeGeo {
  points: Array<{ x: number; y: number }>;
  label?: string;
  /** isw-T2-act F5: {@link label} is a `Branch#getTextBlock` block, wrapped
   *  at the arrow style's `wrapWidth()` (`Branch.java:248-258`) -- a switch
   *  case's in/out label. Absent: `create7`'s `LineBreakStrategy.NONE`. */
  labelWrapped?: true;
  /**
   * How {@link label} is positioned, mirroring `Snake#withLabel`'s two
   * overloads (`ftile/Snake.java:124-136`) -- a pushed label carries
   * EITHER `vertical` (the `VerticalAlignment` overload) OR `horizontal`
   * (the `HorizontalAlignment` overload), never both. `undefined` when
   * {@link label} is set but no push site has been updated to carry its
   * real alignment yet (falls back to upstream's own default, `LEFT`,
   * `skin/AlignmentParam.java:42`).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Snake.java:244-270
   *   (`getTextBlockPosition`, ported at `layout/snake-text-position.ts`)
   */
  labelAlign?: SnakeTextAlign;
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
   * add4-T1f (R1): the end decoration's direction, fixed by the push site
   * that built the `Snake` (`Snake.create(skinParam, color, arrows()
   * .asToDown())`, `ftile/Snake.java:144-148`) -- never read off the
   * points. Set by `ConnectionVerticalThenHorizontal`
   * (`cond/FtileSwitchWithManyLinks.java:159-170`), whose DOWN branch may
   * end on a short horizontal (or empty) segment. Absent: the renderer and
   * compressor fall back to the last segment with length
   * (`compress/shapes-of-terminal.ts#terminalDecorationVector`).
   */
  endDirection?: 'up' | 'down' | 'left' | 'right';
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
  /**
   * The Java `MergeStrategy` this edge's own `Snake` was built with
   * (`activitydiagram3/ftile/MergeStrategy.java:38-46`: `FULL < LIMITED <
   * NONE`), read ONLY by `layout/snake-merge.ts` (D1/D2) before any
   * compression runs; absent means the builder's own default `FULL`
   * (`Snake.create`'s static overloads, `Snake.java:138-153`, never call
   * `.withMerge(...)`). Walkers set this only at the few sites a `.withMerge`
   * call actually appears upstream -- every other push is correctly left
   * `undefined` rather than redundantly writing `'FULL'`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Snake.java:303-306
   */
  mergeable?: 'FULL' | 'LIMITED' | 'NONE';
  /**
   * b3/T3a (family C/EMMID): the PRE-compression midpoint of the first
   * segment matching `emphasize`'s direction -- `Worm#drawLine`
   * (`ftile/Worm.java:178-182`) computes the mid-arrow's anchor as
   * `p1 + (p2-p1)/2` using the Worm's own (uncompressed) points, THEN
   * draws through the compressing `UGraphic`, which maps that one anchor
   * point through `ct()` on each axis exactly like any other point
   * (`klimt/compress/UGraphicCompressOnXorY.java:117-126`'s `getTranslate`
   * on the `draw(UShape)` non-`ULine`/non-`URectangle` branch) -- never by
   * re-deriving a midpoint from the (already compressed) segment
   * endpoints, which is a DIFFERENT point once X or Y compression removes
   * unequal slack from each side. Populated once, pre-compression, by
   * `compress-geometry.ts#withEmphasizeAnchor`; carried through both
   * compress axes by `transformEdge`, same as {@link midArrowAt}.
   */
  emphasizeAt?: { x: number; y: number };
  /**
   * add4-T3a (R2): how far compression moved this edge's label off the
   * position `Snake#getTextBlockPosition` gives on `points`. Upstream places
   * the label on the RAW worm (`ftile/Snake.java:244-270`, `Worm#getPoint`
   * resolves only the Worm's own translate, `ftile/Worm.java:322-330`) and
   * maps its `UText` draw point through `ct()` at draw time
   * (`klimt/compress/UGraphicCompressOnXorY.java:87-128`). Set by
   * `compress/edge-label-anchor.ts#withLabelDeltas`; a delta rather than a
   * point so rigid translates of `points` carry it. Absent = zero.
   */
  labelDelta?: { x: number; y: number };
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
  /**
   * `swimlane.getActualWidth()` -- `max(min, contentWidth)`, set by
   * `computeSizeInternal` (`Swimlanes.java:407-411`) before compression and
   * never revisited; an `auto` title wrap reads it (`:290-291`). Optional
   * for the same reason as {@link contentWidth}.
   */
  actualWidth?: number;
  /**
   * `|name|LABEL`'s display label, which the title draws and measures
   * instead of the name (`Swimlane#getDisplay`). Absent: the name.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:163-164,285-293
   */
  display?: string;
  /**
   * The LAST lane only: `getHalfMissingSpace(n + 1)` (`Swimlanes.java:
   * 436-449`), the appended special lane's half-space -- `5`, or more when
   * its `""` title (one space at the title font) overflows `min`. The
   * title band's right edge is that lane's translate (`:363`).
   */
  trailingHalfMissingSpace?: number;
  /**
   * O (add2 T3i): `|#color|name|`'s own background -- `x`/`width` above
   * already span exactly the jar's background-rect bounds (verified
   * against `cejupe-34-muti621`'s oracle SVG: both divider lines land
   * on this lane's own `x` and `x + width`, byte-for-byte). `undefined`
   * for a lane with no color segment (no rect drawn).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:332-340
   */
  background?: string;
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
  /**
   * b3/T3a (family E): the `Recentred`-only span, BEFORE the document
   * margin -- `ink + RECENTRED_ENLARGE` (`activity-layout-constants.ts
   * #RECENTRED_ENLARGE`'s own doc: `(M - m) + RECENTRED_ENLARGE`, the jar's
   * `Recentred#getMinMax` size, which is exactly `RenderFragment
   * .preChromeWidth`/`preChromeHeight`'s target value, T3j).
   * `canvas-origin.ts#computeCanvasOrigin` computes this UN-floored, before
   * `Math.floor(ink + CANVAS_PADDING_TOTAL) + SVG_CANVAS_CEIL` derives
   * {@link totalWidth}/{@link totalHeight} (the document-margin-included,
   * floored, ceiled total). `renderer.ts#preChromeDims` reads it directly
   * instead of reverse-subtracting a margin from the already-floored
   * total, which loses the ink span's fractional part
   * (`svek/DecorateEntityImage.java:144-150`'s `getTextX` centres chrome
   * text against this un-floored span). Optional only for hand-built test
   * fixtures that construct a bare `ActivityGeometry` literal without
   * routing through `finalizeGeometry`.
   */
  rawWidth?: number;
  rawHeight?: number;
  /** unwind2-S11: `ast.sprites`, carried to the draw so a label's creole
   *  `<$sprite>` resolves there too (`Theme#sprites`, `SkinParam.java:
   *  799-817`). */
  sprites?: SpriteRegistry;
  /** isw-T2-act F1: the measurer the layout sized every text block with,
   *  carried to the draw so `drawU` re-measures through the SAME bounder
   *  (`Swimlanes.java:239,246` -- `ug.getStringBounder()` sizes and draws).
   *  Optional only for hand-built `ActivityGeometry` test literals. */
  measurer?: StringMeasurer;
  /** isw-T2c-scale: the export will scale this document
   *  (`scale-command.ts#isExportScaled` of `ast.scale` and the theme's dpi),
   *  so the draw defers number formatting to the scale pass
   *  (`SvgGraphics.java:468-475` formats once, after the scale). */
  exportScaled?: true;
}
