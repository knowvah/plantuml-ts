/**
 * renderer-participant-shapes.ts — the `actor`/`database` participant
 * ICONS, split out of `renderer.ts` (which was already at 493 of the
 * repo's 500-line cap — the same reason `renderer-arrowhead.ts` split off
 * its own file, see that module's header) so this iteration's scale
 * threading (T13, dispatch-by-parse-attempt) had room to land.
 *
 * `database` no longer lives here in any real sense: T2 replaced its
 * hand-rolled `rect + line + line + ellipse` cylinder with a call into
 * `renderer-participant-symbol.ts`, which drives the ported
 * `USymbolDatabase` through klimt. Only the thin dispatch remains, so the
 * call sites in `renderer.ts` keep their shape. `actor` is still hand-rolled
 * and is the subject of T6 (`skinparam actorStyle`, D4).
 *
 * Every pixel-literal constant left here (`headR`, `armSpan`, `legSpan`, the
 * `1.5` stroke width, the `+2`/`-8` offsets, …) is scaled by `theme.scaleK`
 * at its point of use: none of it flows through `SequenceGeometry` (these
 * shapes are computed fresh from an already-positioned point, not looked
 * up), so `scale-geo.ts`'s geometry scaling never reaches it — see that
 * module's header, "Exhaustiveness". Upstream's `SvgGraphics#format` would
 * scale these same numbers regardless of their origin, so this port must
 * too. The database seam handles the same problem differently, through
 * klimt's own `SvgOption.scale` — see that module's header.
 */

import type { ScaledTheme } from './scale-geo.js';
import type { ParticipantGeo } from './ast.js';
import { ellipse, path } from '../../core/svg.js';
import { renderParticipantSymbol } from './renderer-participant-symbol.js';
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

/**
 * The `database` head/tail glyph, drawn through T1's faithful seam.
 *
 * This used to hand-roll the cylinder as `rect + line + line + ellipse` —
 * four top-level children where `USymbolDatabase#drawDatabase`
 * (`USymbolDatabase.java:62-79`) draws exactly two `UPath`s, a body and a
 * `getClosingPath` lid. The excess is per-database and per-diagram (header and
 * footer rows both draw one), which is the whole `+2 rect, +4 line,
 * +2 ellipse, −2 path` delta measured on `junaxa-14-biko373`.
 *
 * `blockTopY` is the top of the participant BLOCK, not of the glyph:
 * `ComponentRoseDatabase#drawInternalU` (`:81-87`) places the glyph inside
 * that block itself, at the top when `head` and below the text when not.
 *
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseDatabase.java:75-89
 */
export function renderDatabaseShape(
  p: ParticipantGeo,
  blockTopY: number,
  head: boolean,
  theme: ScaledTheme,
): string {
  return renderParticipantSymbol(
    'database',
    { x: p.x, y: blockTopY, width: p.width, height: p.height, background: p.background, border: p.border },
    { head, display: p.display, theme },
  );
}
