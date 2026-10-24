/**
 * The grouping-frame BACKGROUND pass -- the coloured band(s) a `loop`/`alt`/
 * `opt`/`par`/`break`/`critical`/`group`/`ref` frame paints behind its body,
 * split at each `else` branch boundary so each branch can carry its own
 * fill. Drawn before the frame's own foreground tiles (border, header tab,
 * separator lines) -- `GroupingTile#drawBackground` runs ahead of
 * `GroupingTile#drawU`'s own body draw.
 *
 * This is a from-scratch port of `Blotter`, upstream's own small dedicated
 * class for this one job: a `TreeMap<Double, HColor>` of colour-change
 * points plus a `drawU` that paints one band per gap between consecutive
 * change points, in the colour that was in force BEFORE that change point
 * (an off-by-one that upstream itself calls out at `Blotter.java:74-88` --
 * `current` starts as the frame's own default and is only advanced to the
 * entry's own colour AFTER the band for the PRIOR span is drawn).
 *
 * Upstream draws through a `UGraphic`/`URectangle`/`UPath` that composes an
 * `UTranslate` at draw time, and so does this module (sdd3 T8e): the bands are
 * drawn on the page's `UGraphic`, translated to the frame's top-left, in the
 * frame's local frame.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/Blotter.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/GroupingTile.java:301-340
 */

import type { FrameGeo } from './ast.js';
import type { Paint } from '../../core/paint.js';
import { PAINT_NONE } from '../../core/svg.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UShape } from '../../core/klimt/UShape.js';
import { Back } from '../../core/klimt/Back.js';
import { Fore } from '../../core/klimt/Fore.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UPath } from '../../core/klimt/shape/UPath.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { ColorMapper, toSvgPaint } from '../../core/klimt/color/ColorMapper.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import { framePaintsOf } from './renderer-frame-header.js';
import { TRANSPARENT_SVG } from './text-block-geo.js';

/** `HColor#toSvg` of a fully transparent colour (`HColor.java:76`) -- what
 *  `HColorSimple#isTransparent` (`alpha == 0`) reads as transparent. */

/** `HColor#isTransparent` on a resolved paint: a gradient never is. A
 *  transparent simple colour resolves to `PAINT_NONE` through `svgPaint`
 *  (`SvgGraphics.java:521-541` `fixColor`, sdd1 T3e), and to the raw
 *  `#00000000` token where a command colour is painted directly. */
function isTransparentPaint(p: Paint): boolean {
  return p === TRANSPARENT_SVG || p === PAINT_NONE;
}

/** `HColor#equals`, on resolved paints: a colour by its value, a gradient
 *  by its stops and policy. */
function paintKey(p: Paint): string {
  return typeof p === 'string' ? p : JSON.stringify(p);
}

/** An `else #color`'s general colour as the command resolved it
 *  (`colorSet.getColor(color)`, `CommandGrouping.java:161-165`), painted. */
function branchPaint(raw: string): Paint {
  const color = HColorSet.instance().getColor(raw);
  if (color instanceof HColorSimple || color instanceof HColorGradient) return toSvgPaint(color, ColorMapper.IDENTITY);
  throw new Error(`else colour ${raw} is neither a simple nor a gradient colour`);
}

/** One `changes` entry: the y at which a new colour takes over, and that
 *  colour. Mirrors one `Entry<Double, HColor>` from the sorted `TreeMap`. */
interface BlotterBand {
  readonly y: number;
  readonly color: Paint;
}

/**
 * `Blotter#addChange` + `#closeChanges`, folded into one pass over
 * `frame.branchSeparators` -- the only caller (`GroupingTile
 * #drawCompBackground:318-347`) does the same: one `addChange` per
 * `ElseTile`, in ascending document order, then one final `closeChanges`.
 *
 * `back` is the body style's `BackGroundColor` (`GroupingTile.java:309-310`),
 * which `GroupingStart#getUsedStyles` already overrode with the general
 * colour. An else without its own colour inherits it (`:333-339`); one with
 * its own goes through `addChange`, which skips a colour equal to the last
 * ADDED one -- insertion order, not y order (`Blotter.java:130-137`).
 */
/** The `+ 1` of `addChange(ypos + 1, ...)` (`GroupingTile.java:340`). */
const BLOTTER_CHANGE_OFFSET = 1;

function buildBands(frame: FrameGeo, back: Paint): BlotterBand[] {
  const changes = new Map<number, Paint>();
  let last = back;
  for (const sep of frame.branchSeparators) {
    // `ypos = elseTile.getYGauge().getMin().getCurrentValue() - getFrameY()`
    // (GroupingTile.java:332), then `+ 1` at the `addChange` call (:340).
    const ypos = sep.y - frame.y + BLOTTER_CHANGE_OFFSET;
    const color = sep.backColorGeneral === undefined ? back : branchPaint(sep.backColorGeneral);
    if (paintKey(color) === paintKey(last)) continue;
    changes.set(ypos, color);
    last = color;
  }
  // `Blotter.java:126-128` -- always set, never through the `last` gate.
  changes.set(frame.height, back);
  return [...changes.entries()].sort(([a], [b]) => a - b).map(([y, color]) => ({ y, color }));
}

/** `Blotter#getRectangleBackground`'s two arc paths (`:98-122`), at the
 *  frame's origin. `closePath()` (`:106`, `:119`) is a `SEG_CLOSE`, which
 *  `SvgGraphics#svgPath` emits as nothing (`SvgGraphics.java:855-856`): the
 *  `d` is left unclosed, no `Z`. */
function topArcPath(width: number, height: number, round: number): UPath {
  const r = round / 2;
  const result = UPath.none();
  result.moveTo(r, 0);
  result.lineTo(width - r, 0);
  result.arcTo(r, r, 0, 0, 1, width, r);
  result.lineTo(width, height);
  result.lineTo(0, height);
  result.lineTo(0, r);
  result.arcTo(r, r, 0, 0, 1, r, 0);
  return result;
}

/** The mirror of {@link topArcPath}: square top edge, rounded BOTTOM
 *  corners (`Blotter.java:110-120`). */
function bottomArcPath(width: number, height: number, round: number): UPath {
  const r = round / 2;
  const result = UPath.none();
  result.moveTo(0, 0);
  result.lineTo(width, 0);
  result.lineTo(width, height - r);
  result.arcTo(r, r, 0, 0, 1, width - r, height);
  result.lineTo(r, height);
  result.arcTo(r, r, 0, 0, 1, 0, height - r);
  result.lineTo(0, 0);
  return result;
}

/** Everything {@link bandShape} needs besides the per-band values already
 *  carried on a {@link BandSpan} -- kept as one object so the function
 *  stays within this repo's 5-parameter cap. */
interface BandRenderCtx {
  readonly width: number;
  readonly round: number;
  readonly bandCount: number;
}

/**
 * One drawn span: from `localTop` to `endY` (both LOCAL to the frame, i.e.
 * `Blotter`'s own `y = ent.getKey()`), painted in `color` -- which is
 * `current`, the colour that was in force BEFORE this change point, never the
 * change point's OWN colour (`Blotter.java:82` draws with `current`, then
 * only AFTER the draw call does `:85` advance `current = ent.getValue()`). A
 * {@link BlotterBand} entry supplies `endY` and the color for the NEXT span,
 * not this one -- conflating the two was the bug this comment now guards
 * against.
 */
interface BandSpan {
  readonly localTop: number;
  readonly endY: number;
  readonly color: Paint;
}

/**
 * `Blotter#getRectangleBackground` (`:90-124`): the shape of band `i`. A
 * `UPath` band has fore == back, so `DriverPathSvg` draws it with an empty
 * stroke and width 0 (`DriverPathSvg.java:65-69`); rects keep their stroke
 * (`UStroke.simple()`'s 1, `UStroke.java:75-77`, `AbstractCommonUGraphic
 * .java:58`; jar-verified `stroke-width:1` on a `skinparam
 * sequenceGroupBodyBackgroundColor` band).
 */
function bandShape(i: number, span: BandSpan, ctx: BandRenderCtx): UShape {
  const { width, round, bandCount } = ctx;
  const height = span.endY - span.localTop;
  if (round === 0) return URectangle.build(width, height);
  if (bandCount === 1) return URectangle.build(width, height).rounded(round);
  if (i === 0) return topArcPath(width, height, round);
  if (i === bandCount - 1) return bottomArcPath(width, height, round);
  return URectangle.build(width, height);
}

/**
 * `Blotter#drawU`'s one draw (`:82`): `ug.apply(current).apply(current.bg())
 * .apply(UTranslate.dy(y)).draw(rect)` -- both colour roles (stroke AND fill)
 * painted with the same `color`, matching that one HColor applied to both
 * `ug` params. `ug` is already at the frame's top-left.
 */
function drawBand(ug: UGraphic, i: number, span: BandSpan, ctx: BandRenderCtx): void {
  ug.apply(new Fore(span.color))
    .apply(new Back(span.color))
    .apply(UTranslate.dy(span.localTop))
    .draw(bandShape(i, span, ctx));
}

/**
 * `Blotter#drawU` (`:74-88`). Walks the sorted change points; for each one,
 * paints the span from the PREVIOUS change point to this one in `current`
 * -- the colour that was in force BEFORE this change point, not after --
 * then advances `current` to this entry's own colour. The very first span
 * (0 .. first change point) is painted in the frame's own default colour,
 * since `current` starts there and no change point precedes it.
 *
 * A band is skipped entirely when `current` is transparent (`:80`) -- this
 * is why an uncoloured frame emits nothing: `group`'s own default
 * `BackGroundColor` is `transparent` (`plantuml.skin:103`).
 *
 * The `Blotter` is built from the body style: its `BackGroundColor` and its
 * `RoundCorner` (`GroupingTile.java:308-316`). Upstream reads the corner
 * `asDouble` there; `SequencePaint.roundCorner` is the `asInt` read
 * (`AbstractComponent.java:109-111`), equal for every integral value.
 *
 * @see Blotter.java#drawU
 */
export function drawFrameBlotter(ug: UGraphic, frame: FrameGeo): void {
  const { paint } = framePaintsOf(frame);
  const back = paint.fill;
  const bands = buildBands(frame, back);
  const ctx: BandRenderCtx = { width: frame.width, round: paint.roundCorner, bandCount: bands.length };
  const origin = ug.apply(new UTranslate(frame.x, frame.y));
  let current = back;
  let localTop = 0;
  bands.forEach((band, i) => {
    if (!isTransparentPaint(current)) drawBand(origin, i, { localTop, endY: band.y, color: current }, ctx);
    localTop = band.y;
    current = band.color;
  });
}
