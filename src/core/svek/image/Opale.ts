/**
 * `Opale` — the note shape's own geometry constants (the folded-corner box
 * svek draws for `note`/`note on link`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java
 *
 * ```java
 * private static final int cornersize = 10;   // :53
 * public  static final int marginX1   = 6;    // :56
 * public  static final int marginX2   = 15;   // :57
 * private final       int marginY     = 5;    // :58
 * ```
 *
 * All four are ported. `marginX2` was initially left out on the grounds that
 * nothing declared it twice — an error: `class/note-layout-measure.ts` and
 * `state/state-note-layout.ts` each had one. Found by the inventory harness
 * on a later pass, which is the argument for running it after every batch
 * rather than only before.
 *
 * Readers: the class and state engines, which each drew notes from their
 * own copies of these numbers. Description sizes notes through
 * `leaf-sizing-consts.ts`'s own combined `NOTE_MARGIN_H = 21` — which is
 * `marginX1 + marginX2` — rather than the parts; that is a separate
 * derivation, left alone here.
 */

/**
 * `Opale#cornersize` — the folded-corner triangle's leg length.
 *
 * **Not to be confused with the activity engine's own `NOTE_FOLD = 8`**,
 * which is a different shape's fold in a different engine and merely shares
 * the name. That collision is why this constant carries upstream's own name
 * rather than the `NOTE_FOLD` the class and state engines used locally.
 */
export const OPALE_CORNERSIZE = 10;

/** `Opale#marginX1` — the note's left text inset. */
export const OPALE_MARGIN_X1 = 6;

/** `Opale#marginX2` — the note's RIGHT text inset, wider than the left to
 *  leave room for the folded corner. Not ported when this module was first
 *  written, on the stated grounds that nothing declared it twice; that was
 *  wrong — the class and state note sizers each had a copy. */
export const OPALE_MARGIN_X2 = 15;

/** `Opale#marginY` — the note's vertical text inset. */
export const OPALE_MARGIN_Y = 5;

// ---------------------------------------------------------------------------
// Opale outline/corner geometry
//
// Moved verbatim from `diagrams/class/note-opale.ts`, which is where this
// port of `Opale.java` had been living. Nothing about it was class-specific
// — the state engine already consumed it, by importing across an engine
// boundary (`from '../class/note-opale.js'`), which is the coupling that
// made the misplacement visible. Upstream keeps this geometry in
// `svek/image/Opale.java`, one class used by every cuca diagram type via
// `GeneralImageBuilder`, so this module is where it belongs.
//
// The fuzzy member-line matcher that shared the old file did NOT move: it
// is `cucadiagram/BodierAbstract#getBestMatch`, a different upstream class
// and a genuinely class-engine concern.
// ---------------------------------------------------------------------------

import { moveTo, lineTo, arcTo } from '../../svg-path-builder.js';
import type { Direction } from '../../abel/Direction.js';
import { Back } from '../../klimt/Back.js';
import { Fore } from '../../klimt/Fore.js';
import type { UGraphic } from '../../klimt/UGraphic.js';
import type { UStroke } from '../../klimt/UStroke.js';
import { UTranslate } from '../../klimt/UTranslate.js';
import type { HColorOrPaint } from '../../klimt/color/ColorMapper.js';
import type { StringBounder } from '../../klimt/font/StringBounder.js';
import { XDimension2D } from '../../klimt/geom/XDimension2D.js';
import type { XPoint2D } from '../../klimt/geom/XPoint2D.js';
import { TextBlockMemoized } from '../../klimt/shape/TextBlockMemoized.js';
import type { TextBlock } from '../../klimt/shape/TextBlock.js';
import type { UPath } from '../../klimt/shape/UPath.js';
import { corner, getPolygonLinked, polygonNormal, type OpaleBounds } from './OpalePolygons.js';

export interface OpalePoint {
  x: number;
  y: number;
}

/** The note's own absolute position + size -- this renderer draws absolute
 *  coordinates directly (no `<g transform>` wrapper, matches every other
 *  class-diagram shape), so every emitted path coordinate is `origin` plus
 *  a LOCAL (0,0-at-top-left) offset. */
export interface OpaleBox {
  origin: OpalePoint;
  width: number;
  height: number;
}

/** The notch's two anchor points, LOCAL to the note's own (0,0)-at-top-left
 *  frame -- `pp1` sits on the note's own edge (only its component along the
 *  notch-bearing edge matters); `pp2` is the notch tip, pointing at the
 *  target. */
export interface OpaleConnector {
  pp1: OpalePoint;
  pp2: OpalePoint;
}

// `OPALE_CORNERSIZE` used to be declared here, a second copy of
// `Opale#cornersize` that the constant at the top of this module already
// owns. The two were invisible to each other while the geometry lived in
// `diagrams/class/note-opale.ts`; moving it here put them side by side.
// Retired in favour of OPALE_CORNERSIZE.

/** `Opale#delta` — the zigzag notch's half-depth along the box edge the
 *  notch is cut into.
 *  @see ~/git/plantuml/.../svek/image/Opale.java:173 (`private final double delta = 4`) */
const OPALE_DELTA = 4;

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

/**
 * Zigzag-notch outline, notch cut into the LEFT edge (`direction ===
 * 'left'`, upstream `Direction.LEFT`) -- byte-exact port of
 * `Opale.java#getPolygonLeft` with `roundCorner` fixed at 0. `roundCorner
 * === 0` still emits degenerate `A0,0 0 0 0 x,y` arc commands (NOT
 * simplified to `L`) at every `arcTo` call site -- jar-verified byte-for-
 * byte against `cajicu-52-cego765`/`tenobo-24-liga464`: a zero-radius arc
 * renders identically to a straight line per the SVG spec, but the emitted
 * PATH TEXT differs (`A0,0...` vs `L...`), and this mission's conformance
 * bar is byte/structural, not merely visual.
 *
 * `k` (cdd3-T34, E1-8, default 1 -- every pre-existing caller, including
 * the state engine's, is unscaled): `box`/`connector` are already in
 * SCALED coordinates (the class engine scales the whole `NoteGeo`,
 * `class-scale-geo-note.ts#scaleNoteGeo`, including `opale.pp1`/`pp2`),
 * but `cornersize`/`delta` are RAW upstream constants drawn inside ONE
 * ambient scale-wrapped `UGraphic` (`TextBlockExporter.java:205-208`), so
 * they must scale too -- same rationale as `class-visibility-icon.ts
 * #drawSquare`'s identical fix.
 * @see ~/git/plantuml/.../svek/image/Opale.java#getPolygonLeft
 */
export function opalePolygonLeft(box: OpaleBox, connector: OpaleConnector, k = 1): string {
  const { origin, width, height } = box;
  const { pp1, pp2 } = connector;
  const delta = OPALE_DELTA * k;
  const c = OPALE_CORNERSIZE * k;
  const y1 = clamp(pp1.y - delta, 0, height - 2 * delta);
  const ox = origin.x;
  const oy = origin.y;
  // T7b: routed through svg-path-builder.ts's moveTo/lineTo/arcTo
  // (formatDecimal, ADR-1) instead of raw template-literal interpolation.
  return [
    moveTo(ox, oy),
    lineTo(ox, oy + y1),
    lineTo(ox + pp2.x, oy + pp2.y),
    lineTo(ox, oy + y1 + 2 * delta),
    lineTo(ox, oy + height),
    arcTo(ox, oy + height, 0, 0, 0),
    lineTo(ox + width, oy + height),
    arcTo(ox + width, oy + height, 0, 0, 0),
    lineTo(ox + width, oy + c),
    lineTo(ox + width - c, oy),
    lineTo(ox, oy),
    arcTo(ox, oy, 0, 0, 0),
  ].join(' ');
}

/**
 * Zigzag-notch outline, notch cut into the RIGHT edge (`direction ===
 * 'right'`, upstream `Direction.RIGHT`) -- byte-exact port of
 * `Opale.java#getPolygonRight`, same `roundCorner === 0` semantics as
 * {@link opalePolygonLeft}. `k` -- see {@link opalePolygonLeft}'s own doc
 * comment.
 * @see ~/git/plantuml/.../svek/image/Opale.java#getPolygonRight
 */
export function opalePolygonRight(box: OpaleBox, connector: OpaleConnector, k = 1): string {
  const { origin, width, height } = box;
  const { pp1, pp2 } = connector;
  const delta = OPALE_DELTA * k;
  const c = OPALE_CORNERSIZE * k;
  const y1 = clamp(pp1.y - delta, c, height - 2 * delta);
  const ox = origin.x;
  const oy = origin.y;
  return [
    moveTo(ox, oy),
    lineTo(ox, oy + height),
    arcTo(ox, oy + height, 0, 0, 0),
    lineTo(ox + width, oy + height),
    arcTo(ox + width, oy + height, 0, 0, 0),
    lineTo(ox + width, oy + y1 + 2 * delta),
    lineTo(ox + pp2.x, oy + pp2.y),
    lineTo(ox + width, oy + y1),
    lineTo(ox + width, oy + c),
    lineTo(ox + width - c, oy),
    lineTo(ox, oy),
    arcTo(ox, oy, 0, 0, 0),
  ].join(' ');
}

/**
 * The folded-corner triangle drawn OVER the outline, always, regardless of
 * notch direction -- `Opale.java#getCorner`, `roundCorner` fixed at 0.
 * `k` -- see {@link opalePolygonLeft}'s own doc comment.
 * @see ~/git/plantuml/.../svek/image/Opale.java#getCorner
 */
export function opaleCorner(origin: OpalePoint, width: number, k = 1): string {
  const c = OPALE_CORNERSIZE * k;
  const ox = origin.x;
  const oy = origin.y;
  return [
    moveTo(ox + width - c, oy),
    lineTo(ox + width - c, oy + c),
    lineTo(ox + width, oy + c),
    lineTo(ox + width - c, oy),
  ].join(' ');
}

/**
 * Zigzag-notch outline, notch cut into the TOP edge (`direction === 'up'`,
 * upstream `Direction.UP`) -- byte-exact port of `Opale.java#getPolygonUp`
 * with `roundCorner` fixed at 0. Used ONLY by the general opalisable-note
 * mechanism (G2/N14) -- a member-tip note's grammar never reaches this
 * direction, see this module's own doc comment. `k` -- see
 * {@link opalePolygonLeft}'s own doc comment.
 * @see ~/git/plantuml/.../svek/image/Opale.java#getPolygonUp
 */
export function opalePolygonUp(box: OpaleBox, connector: OpaleConnector, k = 1): string {
  const { origin, width, height } = box;
  const { pp1, pp2 } = connector;
  const delta = OPALE_DELTA * k;
  const c = OPALE_CORNERSIZE * k;
  const x1 = clamp(pp1.x - delta, 0, width - c);
  const ox = origin.x;
  const oy = origin.y;
  return [
    moveTo(ox, oy),
    lineTo(ox, oy + height),
    arcTo(ox, oy + height, 0, 0, 0),
    lineTo(ox + width, oy + height),
    arcTo(ox + width, oy + height, 0, 0, 0),
    lineTo(ox + width, oy + c),
    lineTo(ox + width - c, oy),
    lineTo(ox + x1 + 2 * delta, oy),
    lineTo(ox + pp2.x, oy + pp2.y),
    lineTo(ox + x1, oy),
    lineTo(ox, oy),
    arcTo(ox, oy, 0, 0, 0),
  ].join(' ');
}

/**
 * Zigzag-notch outline, notch cut into the BOTTOM edge (`direction ===
 * 'down'`, upstream `Direction.DOWN`) -- byte-exact port of
 * `Opale.java#getPolygonDown`, same `roundCorner === 0` semantics as
 * {@link opalePolygonUp}. `k` -- see {@link opalePolygonLeft}'s own doc
 * comment.
 * @see ~/git/plantuml/.../svek/image/Opale.java#getPolygonDown
 */
export function opalePolygonDown(box: OpaleBox, connector: OpaleConnector, k = 1): string {
  const { origin, width, height } = box;
  const { pp1, pp2 } = connector;
  const delta = OPALE_DELTA * k;
  const c = OPALE_CORNERSIZE * k;
  const x1 = clamp(pp1.x - delta, 0, width);
  const ox = origin.x;
  const oy = origin.y;
  return [
    moveTo(ox, oy),
    lineTo(ox, oy + height),
    arcTo(ox, oy + height, 0, 0, 0),
    lineTo(ox + x1, oy + height),
    lineTo(ox + pp2.x, oy + pp2.y),
    lineTo(ox + x1 + 2 * delta, oy + height),
    lineTo(ox + width, oy + height),
    arcTo(ox + width, oy + height, 0, 0, 0),
    lineTo(ox + width, oy + c),
    lineTo(ox + width - c, oy),
    lineTo(ox, oy),
    arcTo(ox, oy, 0, 0, 0),
  ].join(' ');
}

/** The four notch directions the general opalisable-note mechanism can pick
 *  (member-tips are LEFT/RIGHT only, see this module's own doc comment). */
export type OpaleDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Orthogonal (single-axis) distance from `pt` to a box edge given as two
 * endpoints -- `EntityImageNote.java#getOrthoDistance`: a horizontal edge
 * (`p1.y === p2.y`) measures only the y-gap, a vertical edge only the x-gap.
 * @see ~/git/plantuml/.../svek/image/EntityImageNote.java#getOrthoDistance
 */
function orthoDistance(p1: OpalePoint, p2: OpalePoint, pt: OpalePoint): number {
  if (p1.y === p2.y) return Math.abs(p1.y - pt.y);
  return Math.abs(p1.x - pt.x);
}

/**
 * Pick which of the note box's four edges `pt` (the connector's near-side
 * anchor, LOCAL to the note's own frame) is closest to -- byte-exact port of
 * `EntityImageNote.java#getOpaleStrategy`. Tie-break order matters: LEFT
 * wins over RIGHT/UP/DOWN, then RIGHT over UP/DOWN, then UP over DOWN
 * (upstream's own if/else-if chain, reproduced verbatim rather than a
 * generic min-of-4 to preserve its exact tie-breaking).
 * @see ~/git/plantuml/.../svek/image/EntityImageNote.java#getOpaleStrategy
 */
export function getOpaleStrategy(width: number, height: number, pt: OpalePoint): OpaleDirection {
  const d1 = orthoDistance({ x: width, y: 0 }, { x: width, y: height }, pt); // right edge
  const d2 = orthoDistance({ x: 0, y: height }, { x: width, y: height }, pt); // bottom edge
  const d3 = orthoDistance({ x: 0, y: 0 }, { x: 0, y: height }, pt); // left edge
  const d4 = orthoDistance({ x: 0, y: 0 }, { x: width, y: 0 }, pt); // top edge
  if (d3 <= d1 && d3 <= d2 && d3 <= d4) return 'left';
  if (d1 <= d2 && d1 <= d3 && d1 <= d4) return 'right';
  if (d4 <= d1 && d4 <= d2 && d4 <= d3) return 'up';
  return 'down';
}

/**
 * G2/N14: resolve the general "opalisable" note connector -- byte-exact port
 * of `EntityImageNote.java#drawU`'s `opaleLine` branch (the non-Smetana/dot
 * path this project's oracle uses). `rawPoints` is the routed DOT connector
 * spline in the SAME absolute coordinate space as `origin` (both come from
 * the same `DotLayoutResult`) -- localized here (`p - origin`) the same way
 * `DotPath#moveDelta(-node.getMinX(), -node.getMinY())` localizes it in
 * Java. Whichever endpoint is CLOSER to the note's own center becomes `pp1`
 * (the box-boundary anchor); the farther one becomes `pp2` (the notch tip,
 * near the host) -- `path.getStartPoint().distance(center) >
 * path.getEndPoint().distance(center)` triggers `path.reverse()` in Java,
 * which is equivalent to just picking the closer point directly. `undefined`
 * when there's no real spline to resolve (freestanding note, or a
 * degenerate single-point connector) -- caller falls back to a plain
 * folded-corner box. cdd3-T15 (C-15 = E3-19): also `undefined` when the
 * connector routes as MORE than one bezier -- `SvekEdge.java:769-770` `if
 * (isOpalisable() == false) setOpale(false);` and `:804-806` `return
 * dotPath.getBeziers().size() <= 1;`. `DotPath#addCurve`
 * (`klimt/shape/DotPath.java:112-124`) appends 4 points for the first
 * bezier and 3 more per additional bezier (sharing the previous curve's
 * endpoint), so `points = 3*beziers + 1` -- `beziers <= 1` is exactly
 * `points <= 4`.
 * @see ~/git/plantuml/.../svek/image/EntityImageNote.java#drawU
 * @see ~/git/plantuml/.../svek/SvekEdge.java:769-770,804-806
 */
const OPALE_MAX_POINTS_FOR_SINGLE_BEZIER = 4;

export function resolveOpaleConnector(
  dim: { width: number; height: number },
  origin: { x: number; y: number },
  rawPoints: ReadonlyArray<{ x: number; y: number }>,
): { direction: OpaleDirection; pp1: OpalePoint; pp2: OpalePoint } | undefined {
  if (rawPoints.length < 2 || rawPoints.length > OPALE_MAX_POINTS_FOR_SINGLE_BEZIER) return undefined;
  const first = rawPoints[0]!;
  const last = rawPoints[rawPoints.length - 1]!;
  const local = (p: { x: number; y: number }): OpalePoint => ({ x: p.x - origin.x, y: p.y - origin.y });
  const a = local(first);
  const b = local(last);
  const center: OpalePoint = { x: dim.width / 2, y: dim.height / 2 };
  const distTo = (p: OpalePoint): number => Math.hypot(p.x - center.x, p.y - center.y);
  const [pp1, pp2] = distTo(a) <= distTo(b) ? [a, b] : [b, a];
  return { direction: getOpaleStrategy(dim.width, dim.height, pp1), pp1, pp2 };
}

/**
 * A resolved general-opalisable note's geo (G2/N14), or `undefined` when
 * the connector didn't resolve (caller falls back to a plain folded-corner
 * box). Scope note: intended ONLY for a SINGLE-member group with a real
 * 2+-point connector -- whether upstream ever merges multiple non-tip
 * `note <pos> of X` statements onto one opalisable svek node (the way it
 * merges member-tips, `note-layout.ts#NoteGroup`'s own doc comment) is
 * unverified against any fixture in this mission's corpus; the caller
 * narrows to singleton groups to avoid inventing untested multi-member
 * Opale-stacking behavior. `note`/`m`/`points` are kept as plain structural
 * types (not `ClassNote`/`NoteMeasurement` by name) and the return type is
 * `import type`-only `NoteGeo` -- both erased at compile time
 * (`verbatimModuleSyntax`), so this module can build a `note-layout.ts`
 * shape without a runtime import cycle (that module already imports FROM
 * this one).
 */

/**
 * `Opale` -- the note block: a text block drawn inside the folded-corner
 * outline, optionally cut by a notch pointing at a linked entity. The
 * constants and string helpers above are its geometry for the svg-path
 * engines; this class is the `TextBlock` form (`gantt` notes build it).
 * `HColor#bg()` is `new Back(color)` and `ug.apply(HColor)` is `new Fore(..)`.
 *
 * The private `getPolygonLeft/Right/Up/Down` (java:175-266) live in `OpalePolygons.ts` (500-line split).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:51-271
 */
export class Opale extends TextBlockMemoized {
  /** `Opale#marginX1` (java:56). */
  static readonly marginX1: number = OPALE_MARGIN_X1;
  /** `Opale#marginX2` (java:57). */
  static readonly marginX2: number = OPALE_MARGIN_X2;

  readonly #noteBackgroundColor: HColorOrPaint;
  readonly #borderColor: HColorOrPaint;
  readonly #shadowing2: number;
  #strategy: Direction | undefined;
  #pp1: XPoint2D | undefined;
  #pp2: XPoint2D | undefined;
  readonly #withLink: boolean;
  #roundCorner = 0;
  readonly #stroke: UStroke | undefined;
  readonly #textBlock: TextBlock;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:72-80 */
  constructor(
    shadowing: number,
    borderColor: HColorOrPaint,
    noteBackgroundColor: HColorOrPaint,
    textBlock: TextBlock,
    withLink: boolean,
    stroke: UStroke | undefined,
  ) {
    super();
    this.#noteBackgroundColor = noteBackgroundColor;
    this.#withLink = withLink;
    this.#shadowing2 = shadowing;
    this.#borderColor = borderColor;
    this.#textBlock = textBlock;
    this.#stroke = stroke;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:82-84 */
  setRoundCorner(roundCorner: number): void {
    this.#roundCorner = roundCorner;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:86-90 */
  setOpale(strategy: Direction, pp1: XPoint2D, pp2: XPoint2D): void {
    this.#strategy = strategy;
    this.#pp1 = pp1;
    this.#pp2 = pp2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:92-94 */
  #getWidth(stringBounder: StringBounder): number {
    return this.#textBlock.calculateDimension(stringBounder).getWidth() + OPALE_MARGIN_X1 + OPALE_MARGIN_X2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:96-99 */
  #getHeight(stringBounder: StringBounder): number {
    const size = this.#textBlock.calculateDimension(stringBounder);
    return size.getHeight() + 2 * OPALE_MARGIN_Y;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:101-106 */
  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    const height = this.#getHeight(stringBounder);
    const width = this.#getWidth(stringBounder);
    return new XDimension2D(width, height);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:108-136 */
  drawU(ug: UGraphic): void {
    const stringBounder = ug.getStringBounder();
    ug = ug.apply(new Back(this.#noteBackgroundColor)).apply(new Fore(this.#borderColor));
    const bounds: OpaleBounds = {
      width: this.#getWidth(stringBounder),
      height: this.#getHeight(stringBounder),
      roundCorner: this.#roundCorner,
      cornersize: OPALE_CORNERSIZE,
    };
    const polygon = this.#withLink
      ? getPolygonLinked(this.#strategy, bounds, this.#pp1 as XPoint2D, this.#pp2 as XPoint2D)
      : Opale.getPolygonNormal(bounds.width, bounds.height, this.#roundCorner);

    polygon.setDeltaShadow(this.#shadowing2);
    if (this.#stroke !== undefined) ug = ug.apply(this.#stroke);
    ug.draw(polygon);
    ug.draw(Opale.getCorner(bounds.width, this.#roundCorner));
    this.#textBlock.drawU(ug.apply(new UTranslate(OPALE_MARGIN_X1, OPALE_MARGIN_Y)));
  }

  /** Body in `OpalePolygons.ts`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:147-161 */
  static getCorner(width: number, roundCorner: number): UPath {
    return corner(width, roundCorner, OPALE_CORNERSIZE);
  }

  /** Body in `OpalePolygons.ts`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:163-188 */
  static getPolygonNormal(width: number, height: number, roundCorner: number): UPath {
    return polygonNormal(width, height, roundCorner, OPALE_CORNERSIZE);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:268-270 */
  getMarginX1(): number {
    return OPALE_MARGIN_X1;
  }
}
