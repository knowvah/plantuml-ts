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
import type { ParticipantGeo } from './ast.js';
import { rect, line, ellipse, path } from '../../core/svg.js';
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

/**
 * The stick man's four strokes as ONE path, in upstream's own order and with
 * upstream's own `moveTo`/`lineTo` sequence:
 *
 *   moveTo(0, 0)                 lineTo(0, bodyLenght)
 *   moveTo(-armsLenght, armsY)   lineTo(armsLenght, armsY)
 *   moveTo(0, bodyLenght)        lineTo(-legsX, bodyLenght + legsY)
 *   moveTo(0, bodyLenght)        lineTo(legsX, bodyLenght + legsY)
 *
 * — body, arms, left leg, right leg (`ActorStickMan.java:76-85`). It is one
 * `UPath`, drawn once, so it reaches SVG as a single `<path>`; the jar's own
 * output for `actor 春` is
 * `d="M80,26.5 L80,53.5 M67,34.5 L93,34.5 M80,53.5 L67,68.5 M80,53.5 L93,68.5"`.
 *
 * @see ~/git/plantuml/.../skin/ActorStickMan.java#drawU
 */
function actorPathD(geo: ActorGeo): string {
  const { cx, bodyTop, bodyBot, armY, armSpan, legSpan, legY } = geo;
  return (
    `M${fmt(cx)},${fmt(bodyTop)} L${fmt(cx)},${fmt(bodyBot)}` +
    ` M${fmt(cx - armSpan)},${fmt(armY)} L${fmt(cx + armSpan)},${fmt(armY)}` +
    ` M${fmt(cx)},${fmt(bodyBot)} L${fmt(cx - legSpan)},${fmt(legY)}` +
    ` M${fmt(cx)},${fmt(bodyBot)} L${fmt(cx + legSpan)},${fmt(legY)}`
  );
}

/**
 * Head + body, as the jar draws them: ONE `<ellipse>` and ONE `<path>`.
 *
 * `ActorStickMan#drawU` builds `UEllipse.build(headDiam, headDiam)` and a
 * single `UPath`, and draws each exactly once (`:73`, `:77-85`, `:91`, `:95`).
 * This used to emit a `<circle>` and FOUR `<line>`s — five top-level children
 * where the jar has two. The excess is per-actor and per-diagram (header and
 * footer rows both draw one), so it scaled with how much of a diagram this
 * port managed to render, and it is what pushed 14 fixtures' top-level child
 * count past the golden's once T13 stopped dropping their content.
 *
 * The path carries no fill: upstream applies `HColors.none().bg()` before
 * drawing it (`:95`).
 */
export function renderActorShape(p: ParticipantGeo, topY: number, theme: ScaledTheme): string {
  const geo = computeActorGeo(p.centerX, topY, p.height, theme);
  // `ellipse` takes a RAW attribute record (unlike `circle`, which has a typed
  // `BoxStyle`), so the stroke width is spelled kebab-case here -- see
  // `state/renderer-pseudostate.ts:58` for the same call shape.
  //
  // `svg-shapes.ts#circle`'s own doc says rewriting a `circle` call site as an
  // equal-radii `ellipse` "would change the emitted element for no benefit".
  // Here there IS a benefit and it is the whole point: the jar emits
  // `<ellipse cx=... rx=8 ry=8>` for an actor head (`ActorStickMan.java:73`,
  // `UEllipse.build`), so matching the element is matching upstream.
  // `Participant#getUsedStyles` -- the `actor {}` bucket and any inline
  // colour, resolved in layout onto the geo.
  const head = ellipse(geo.cx, geo.headCy, geo.headR, geo.headR, {
    fill: p.background,
    stroke: p.border,
    'stroke-width': geo.strokeWidth,
  });
  const body = path(actorPathD(geo), {
    stroke: p.border,
    strokeWidth: geo.strokeWidth,
  });
  return head + body;
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
function renderDatabaseBody(geo: DatabaseGeo, p: ParticipantGeo): string {
  const { x, width, inset, bodyTop, bodyBot, bodyH, capRy, strokeWidth } = geo;
  const bodyRect = rect(x + inset, bodyTop, width - 2 * inset, bodyH - capRy, {
    fill: p.background,
    stroke: 'none',
  });
  const leftLine = line(x + inset, bodyTop, x + inset, bodyBot, { stroke: p.border, strokeWidth });
  const rightLine = line(x + width - inset, bodyTop, x + width - inset, bodyBot, {
    stroke: p.border,
    strokeWidth,
  });
  return bodyRect + leftLine + rightLine;
}

/** Top ellipse (full, visible). */
function renderDatabaseCap(geo: DatabaseGeo, p: ParticipantGeo): string {
  return ellipse(geo.cx, geo.bodyTop, geo.rx, geo.capRy, {
    fill: p.background,
    stroke: p.border,
    'stroke-width': fmt(geo.strokeWidth),
  });
}

/** Bottom arc — sweep=0 (counter-clockwise from left to right) routes
 *  through (cx, bodyBot+capRy), bowing the arc downward for a convex
 *  cylinder bottom. */
function renderDatabaseArc(geo: DatabaseGeo, p: ParticipantGeo): string {
  const { x, width, inset, bodyBot, rx, capRy, strokeWidth } = geo;
  const d =
    `M ${fmt(x + inset)},${fmt(bodyBot)} A ${fmt(rx)},${fmt(capRy)} 0 0,0 ${fmt(x + width - inset)},${fmt(bodyBot)}`;
  return path(d, { fill: p.background, stroke: p.border, strokeWidth });
}

export function renderDatabaseShape(p: ParticipantGeo, topY: number, theme: ScaledTheme): string {
  const geo = computeDatabaseGeo(p.x, topY, p.width, p.height, theme);
  return renderDatabaseBody(geo, p) + renderDatabaseCap(geo, p) + renderDatabaseArc(geo, p);
}
