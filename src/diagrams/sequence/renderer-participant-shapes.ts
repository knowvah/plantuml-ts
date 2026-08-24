/**
 * renderer-participant-shapes.ts — the `actor`/`database` participant
 * ICONS, split out of `renderer.ts` (which was already at 493 of the
 * repo's 500-line cap — the same reason `renderer-arrowhead.ts` split off
 * its own file, see that module's header) so this iteration's scale
 * threading (T13, dispatch-by-parse-attempt) had room to land.
 *
 * Every pixel-literal constant here (`headR`, `armSpan`, `legSpan`, the
 * `1.5` stroke widths, the `+2`/`-8`/`+14`/`-4`/`-2` offsets, …) is scaled
 * by `theme.scaleK` at its point of use: none of it flows through
 * `SequenceGeometry` (these shapes are computed fresh from an
 * already-positioned point, not looked up), so `scale-geo.ts`'s geometry
 * scaling never reaches it — see that module's header, "Exhaustiveness".
 * Upstream's `SvgGraphics#format` would scale these same numbers
 * regardless of their origin, so this port must too.
 */

import type { ScaledTheme } from './scale-geo.js';
import { rect, line, ellipse, path, circle } from '../../core/svg.js';
import { fmt } from '../../core/svg-format.js';

/** Pure geometry for {@link renderActorShape}, computed once and shared by
 *  its two drawing helpers (kept separate to stay under the 30-NLOC
 *  function cap). */
interface ActorGeo {
  readonly cx: number;
  readonly headR: number;
  readonly headCy: number;
  readonly bodyTop: number;
  readonly bodyBot: number;
  readonly armY: number;
  readonly armSpan: number;
  readonly legSpan: number;
  readonly legY: number;
  readonly strokeWidth: number;
}

/** `theme.fontSize` is already scaled (`scaleSequenceTheme`); every OTHER
 *  literal below is scaled here via `theme.scaleK`. */
function computeActorGeo(cx: number, topY: number, height: number, theme: ScaledTheme): ActorGeo {
  const k = theme.scaleK;
  const headR = 10 * k;
  const bodyTop = topY + headR * 2 + 2 * k;
  const bodyLen = height * 0.35; // ratio of an already-scaled height: self-scaling
  const bodyBot = bodyTop + bodyLen;
  const armY = bodyTop + bodyLen * 0.3; // ratio: self-scaling
  return {
    cx,
    headR,
    headCy: topY + headR,
    bodyTop,
    bodyBot,
    armY,
    armSpan: 14 * k,
    legSpan: 12 * k,
    // Legs — end 8px (scaled) above the label zone so the label has clear
    // breathing room.
    legY: topY + height - theme.fontSize - 8 * k,
    strokeWidth: 1.5 * k,
  };
}

/** Head + torso + arms. */
function renderActorTorso(geo: ActorGeo, theme: ScaledTheme): string {
  const { cx, headR, headCy, bodyTop, bodyBot, armY, armSpan, strokeWidth } = geo;
  const head = circle(cx, headCy, headR, {
    fill: theme.colors.background,
    stroke: theme.colors.border,
    strokeWidth,
  });
  const body = line(cx, bodyTop, cx, bodyBot, { stroke: theme.colors.border, strokeWidth });
  const arms = line(cx - armSpan, armY, cx + armSpan, armY, { stroke: theme.colors.border, strokeWidth });
  return head + body + arms;
}

/** The two legs. */
function renderActorLegs(geo: ActorGeo, theme: ScaledTheme): string {
  const { cx, bodyBot, legSpan, legY, strokeWidth } = geo;
  const left = line(cx, bodyBot, cx - legSpan, legY, { stroke: theme.colors.border, strokeWidth });
  const right = line(cx, bodyBot, cx + legSpan, legY, { stroke: theme.colors.border, strokeWidth });
  return left + right;
}

export function renderActorShape(
  cx: number,
  topY: number,
  height: number,
  theme: ScaledTheme,
): string {
  const geo = computeActorGeo(cx, topY, height, theme);
  return renderActorTorso(geo, theme) + renderActorLegs(geo, theme);
}

/** Pure geometry for {@link renderDatabaseShape}, computed once and shared
 *  by its three drawing helpers (kept separate to stay under the 30-NLOC
 *  function cap). */
interface DatabaseGeo {
  readonly x: number;
  readonly bodyTop: number;
  readonly bodyBot: number;
  readonly cx: number;
  readonly rx: number;
  readonly capRy: number;
  readonly bodyH: number;
  readonly width: number;
  readonly inset: number;
  readonly strokeWidth: number;
}

/** `theme.fontSize` is already scaled (`scaleSequenceTheme`); every OTHER
 *  literal below is scaled here via `theme.scaleK`. */
function computeDatabaseGeo(
  x: number,
  topY: number,
  width: number,
  height: number,
  theme: ScaledTheme,
): DatabaseGeo {
  const k = theme.scaleK;
  // With sweep=1 the arc nadir sits capRy below bodyBot. labelH must satisfy
  // labelH > 1.15*(capRy_fraction*height) + fontSize + 4 to keep the label
  // top clear of the arc. fontSize+12 gives ~3 px of clearance at fontSize=14.
  const labelH = theme.fontSize + 14 * k;
  const bodyH = height - labelH;
  const capRy = Math.max(4 * k, bodyH * 0.15);
  return {
    x,
    bodyTop: topY + capRy,
    bodyBot: topY + bodyH,
    cx: x + width / 2,
    rx: width / 2 - 2 * k,
    capRy,
    bodyH,
    width,
    inset: 2 * k,
    strokeWidth: 1.5 * k,
  };
}

/** Body rect + side lines. */
function renderDatabaseBody(geo: DatabaseGeo, theme: ScaledTheme): string {
  const { x, width, inset, bodyTop, bodyBot, bodyH, capRy, strokeWidth } = geo;
  const bodyRect = rect(x + inset, bodyTop, width - 2 * inset, bodyH - capRy, {
    fill: theme.colors.background,
    stroke: 'none',
  });
  const leftLine = line(x + inset, bodyTop, x + inset, bodyBot, { stroke: theme.colors.border, strokeWidth });
  const rightLine = line(x + width - inset, bodyTop, x + width - inset, bodyBot, {
    stroke: theme.colors.border,
    strokeWidth,
  });
  return bodyRect + leftLine + rightLine;
}

/** Top ellipse (full, visible). */
function renderDatabaseCap(geo: DatabaseGeo, theme: ScaledTheme): string {
  return ellipse(geo.cx, geo.bodyTop, geo.rx, geo.capRy, {
    fill: theme.colors.background,
    stroke: theme.colors.border,
    'stroke-width': fmt(geo.strokeWidth),
  });
}

/** Bottom arc — sweep=0 (counter-clockwise from left to right) routes
 *  through (cx, bodyBot+capRy), bowing the arc downward for a convex
 *  cylinder bottom. */
function renderDatabaseArc(geo: DatabaseGeo, theme: ScaledTheme): string {
  const { x, width, inset, bodyBot, rx, capRy, strokeWidth } = geo;
  const d =
    `M ${fmt(x + inset)},${fmt(bodyBot)} A ${fmt(rx)},${fmt(capRy)} 0 0,0 ${fmt(x + width - inset)},${fmt(bodyBot)}`;
  return path(d, { fill: theme.colors.background, stroke: theme.colors.border, strokeWidth });
}

export function renderDatabaseShape(
  x: number,
  topY: number,
  width: number,
  height: number,
  theme: ScaledTheme,
): string {
  const geo = computeDatabaseGeo(x, topY, width, height, theme);
  return renderDatabaseBody(geo, theme) + renderDatabaseCap(geo, theme) + renderDatabaseArc(geo, theme);
}
