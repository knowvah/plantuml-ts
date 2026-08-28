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
 * `UTranslate` at draw time; this port has no such translate step for a raw
 * `d`-string `<path>` (`core/svg-shapes.ts#path` takes only the finished
 * `d`), so every path-building helper here bakes the frame's own (x, y)
 * offset directly into each coordinate instead.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/Blotter.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/GroupingTile.java:301-340
 */

import type { FrameGeo } from './ast.js';
import { rect, path } from '../../core/svg.js';
import { moveTo, lineTo, arcTo } from '../../core/svg-path-builder.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';

/**
 * `HColors.transparent()`'s raw-source-token equivalent. `resolveColorToSvgHex`
 * recognizes the literal keyword (case-insensitively) and resolves it to
 * `#00000000` -- the same fully-alpha-0 value a real transparent hex would
 * produce -- so this sentinel round-trips through {@link isTransparentColor}
 * exactly like any other raw token.
 * @see HColors.java:125 (transparent())
 * @see HColorSet.ts:145-149 (resolveColorToSvgHex)
 */
const TRANSPARENT = 'transparent';

/**
 * `HColorSimple#isTransparent`: `color.getAlpha() == 0`. Ported against the
 * RAW source token rather than a resolved `HColor` object, since that is the
 * shape colours arrive in at this layer (see the interface contract note in
 * this mission's T3 brief).
 * @see HColorSimple.java:131-134
 */
function isTransparentColor(raw: string): boolean {
  return resolveColorToSvgHex(raw) === '#00000000';
}

/** `Blotter`'s own `defaultBackcolor` field, after its constructor's
 *  null -> transparent coercion (`Blotter.java:60-67`). A `FrameGeo` with no
 *  `COLORS` override carries `backColorGeneral: undefined`, the same "no
 *  color given" case upstream's `null` represents. */
function defaultBandColor(frame: FrameGeo): string {
  return frame.backColorGeneral ?? TRANSPARENT;
}

/** One `changes` entry: the y at which a new colour takes over, and that
 *  colour. Mirrors one `Entry<Double, HColor>` from the sorted `TreeMap`. */
interface BlotterBand {
  readonly y: number;
  readonly color: string;
}

/**
 * `Blotter#addChange` + `#closeChanges`, folded into one pass over
 * `frame.branchSeparators` -- the only caller (`GroupingTile
 * #drawCompBackground:315-336`) does the same: one `addChange` per
 * `ElseTile`, in ascending document order (already the order
 * `branchSeparators` was built in, `sequence-layout-events.ts`'s own
 * `event.branches.forEach`), then one final `closeChanges`.
 *
 * `last` tracks INSERTION order, not sorted-by-y order (`:130-137`) -- a
 * `changes.set` is skipped, not the loop iteration, when a separator's
 * colour repeats the immediately-prior ADDED colour.
 */
function buildBands(frame: FrameGeo): BlotterBand[] {
  const changes = new Map<number, string>();
  const defaultColor = defaultBandColor(frame);
  let last = defaultColor;
  for (const sep of frame.branchSeparators) {
    // `ypos = elseTile.getYGauge().getMin().getCurrentValue() - getFrameY()`
    // (GroupingTile.java:325), then `+ 1` at the `addChange` call site
    // (:333). `sep.y` and `frame.y` share the same absolute coordinate
    // space (both are what `renderer.ts`'s own frame/separator drawing
    // already uses directly), so `sep.y - frame.y` is that local `ypos`.
    const ypos = sep.y - frame.y + 1;
    const color = sep.backColorGeneral ?? defaultColor;
    if (color === last) continue;
    changes.set(ypos, color);
    last = color;
  }
  // `Blotter.java:126-128` -- always set, unconditionally, never through the
  // `last`-dedup gate `addChange` applies.
  changes.set(frame.height, defaultColor);
  return [...changes.entries()]
    .sort(([a], [b]) => a - b)
    .map(([y, color]) => ({ y, color }));
}

/** `Blotter#getRectangleBackground`'s two arc paths (`:98-122`), with the
 *  frame's own absolute (ox, oy) offset baked into every coordinate -- see
 *  this module's header comment for why. */
function topArcPathD(ox: number, oy: number, width: number, height: number, round: number): string {
  const r = round / 2;
  return (
    [
      moveTo(ox + r, oy),
      lineTo(ox + width - r, oy),
      arcTo(ox + width, oy + r, r, 0, 1),
      lineTo(ox + width, oy + height),
      lineTo(ox, oy + height),
      lineTo(ox, oy + r),
      arcTo(ox + r, oy, r, 0, 1),
    ].join(' ') + ' Z'
  );
}

/** The mirror of {@link topArcPathD}: square top edge, rounded BOTTOM
 *  corners (`Blotter.java:110-120`). */
function bottomArcPathD(ox: number, oy: number, width: number, height: number, round: number): string {
  const r = round / 2;
  return (
    [
      moveTo(ox, oy),
      lineTo(ox + width, oy),
      lineTo(ox + width, oy + height - r),
      arcTo(ox + width - r, oy + height, r, 0, 1),
      lineTo(ox + r, oy + height),
      arcTo(ox, oy + height - r, r, 0, 1),
      lineTo(ox, oy),
    ].join(' ') + ' Z'
  );
}

/** Everything {@link renderBand} needs besides the per-band values already
 *  carried on a {@link BlotterBand} -- kept as one object so the function
 *  stays within this repo's 5-parameter cap. */
interface BandRenderCtx {
  readonly frameX: number;
  readonly frameY: number;
  readonly width: number;
  readonly round: number;
  readonly bandCount: number;
}

/**
 * One drawn span: from `localTop` to `endY` (both LOCAL to the frame, i.e.
 * `Blotter`'s own `y = ent.getKey()` before the caller re-adds `frame.y`),
 * painted in `color` -- which is `current`, the colour that was in force
 * BEFORE this change point, never the change point's OWN colour
 * (`Blotter.java:82` draws with `current`, then only AFTER the draw call
 * does `:85` advance `current = ent.getValue()`). A {@link BlotterBand}
 * entry supplies `endY` and the color for the NEXT span, not this one --
 * conflating the two was the bug this comment now guards against.
 */
interface BandSpan {
  readonly localTop: number;
  readonly endY: number;
  readonly color: string;
}

/**
 * `Blotter#getRectangleBackground` (`:90-124`) plus the `ug.apply(current)
 * .apply(current.bg()).apply(UTranslate.dy(y)).draw(rect)` call that uses
 * it (`:82`) -- both colour roles (stroke AND fill) painted with the same
 * `color`, matching that one HColor applied to both `ug` params.
 */
function renderBand(i: number, span: BandSpan, ctx: BandRenderCtx): string {
  const { frameX, frameY, width, round, bandCount } = ctx;
  const height = span.endY - span.localTop;
  const x = frameX;
  const y = frameY + span.localTop;
  const style = { fill: span.color, stroke: span.color };
  if (round === 0) return rect(x, y, width, height, style);
  if (bandCount === 1) return rect(x, y, width, height, { ...style, rx: round / 2, ry: round / 2 });
  if (i === 0) return path(topArcPathD(x, y, width, height, round), style);
  if (i === bandCount - 1) return path(bottomArcPathD(x, y, width, height, round), style);
  return rect(x, y, width, height, style);
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
 * `BackGroundColor` is `transparent` (`plantuml.skin:103`,
 * `frame-style.ts#GROUP_BACKGROUND`).
 *
 * @see Blotter.java#drawU
 */
export function renderFrameBlotter(frame: FrameGeo, roundCorner: number): string {
  const bands = buildBands(frame);
  const ctx: BandRenderCtx = {
    frameX: frame.x,
    frameY: frame.y,
    width: frame.width,
    round: roundCorner,
    bandCount: bands.length,
  };
  let current = defaultBandColor(frame);
  let localTop = 0;
  const parts: string[] = [];
  bands.forEach((band, i) => {
    if (!isTransparentColor(current)) {
      parts.push(renderBand(i, { localTop, endY: band.y, color: current }, ctx));
    }
    localTop = band.y;
    current = band.color;
  });
  return parts.join('');
}
