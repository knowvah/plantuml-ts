/**
 * renderer-participant-shapes.ts — one participant's head or footer BLOCK:
 * its glyph, its label, and the dispatch between them. Split out of
 * `renderer.ts` (which was already at 493 of the repo's 500-line cap — the
 * same reason `renderer-arrowhead.ts` split off its own file, see that
 * module's header) so this iteration's scale threading (T13,
 * dispatch-by-parse-attempt) had room to land, and kept here as
 * `renderer.ts` grew again.
 *
 * This is the port's `Rose.java#createComponentParticipant`
 * (`skin/rose/Rose.java:137-190`): eight participant kinds, three families.
 * `database`, `collections`, `queue`, `entity`, `boundary` and `control` all
 * route through `renderer-participant-symbol.ts`, which drives the ported
 * primitives through klimt; `participant` draws the bare rectangle
 * `ComponentRoseParticipant` draws; `actor` is still hand-rolled here and is
 * the subject of T6 (`skinparam actorStyle`, D4).
 *
 * Every pixel-literal constant left here (`headR`, `armSpan`, `legSpan`, the
 * `1.5` stroke width, the `+2`/`-8` offsets, …) belongs to the actor and is
 * scaled by `theme.scaleK` at its point of use: none of it flows through
 * `SequenceGeometry` (these shapes are computed fresh from an
 * already-positioned point, not looked up), so `scale-geo.ts`'s geometry
 * scaling never reaches it — see that module's header, "Exhaustiveness".
 * Upstream's `SvgGraphics#format` would scale these same numbers regardless
 * of their origin, so this port must too. The symbol seam handles the same
 * problem differently, through klimt's own `SvgOption.scale` — see that
 * module's header.
 */

import type { Theme } from '../../core/theme.js';
import type { ScaledTheme } from './scale-geo.js';
import type { ParticipantBadge, ParticipantGeo, ParticipantType } from './ast.js';
import { ellipse, image, path, rect, text } from '../../core/svg.js';
import {
  COLLECTIONS_DELTA,
  renderParticipantSymbol,
  type SymbolParticipantType,
} from './renderer-participant-symbol.js';
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
function renderActorShape(p: ParticipantGeo, topY: number, theme: ScaledTheme): string {
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

/** The participant kinds `Rose.java#createComponentParticipant` gives a glyph
 *  to. `actor` is excluded on purpose: it is an `ActorStyle` case, not a
 *  symbol one (D4), and `participant` draws a bare box. */
const SYMBOL_TYPES: ReadonlySet<string> = new Set<SymbolParticipantType>([
  'database',
  'collections',
  'queue',
  'entity',
  'boundary',
  'control',
]);

function hasParticipantSymbol(type: ParticipantType): type is SymbolParticipantType {
  return SYMBOL_TYPES.has(type);
}

/**
 * A participant's glyph, drawn through T1's faithful seam.
 *
 * `database` used to be hand-rolled here as `rect + line + line + ellipse` —
 * five top-level elements per glyph where `USymbolDatabase#drawDatabase`
 * (`USymbolDatabase.java:62-79`) draws two `UPath`s. The other five kinds were
 * not drawn at all: they fell through to the plain participant rectangle.
 *
 * `blockTopY` is the top of the participant BLOCK, not of the glyph: every
 * `ComponentRose*` in this family places the glyph inside that block itself
 * (`ComponentRoseDatabase.java:79-88` and its siblings), so the seam derives
 * the offset from `head` and the block's own height.
 *
 * @see ~/git/plantuml/.../skin/rose/Rose.java:137-190
 */
function renderSymbolShape(
  p: ParticipantGeo,
  blockTopY: number,
  head: boolean,
  theme: ScaledTheme,
): string {
  if (!hasParticipantSymbol(p.type)) return '';
  return renderParticipantSymbol(
    p.type,
    { x: p.x, y: blockTopY, width: p.width, height: p.height, background: p.background, border: p.border },
    { head, display: p.display, theme },
  );
}

// ---------------------------------------------------------------------------
// Participant head / footer blocks
// ---------------------------------------------------------------------------

/** `TextBlockSprited`'s badge-to-label gap (`:65-67`) -- see
 *  `sequence-layout-participants.ts`'s own `BADGE_GAP`, which sizes the box
 *  this places into. */
const BADGE_GAP = 6;

// ---------------------------------------------------------------------------
// Participant helpers
// ---------------------------------------------------------------------------

function renderLabel(cx: number, cy: number, label: string, theme: Theme): string {
  return text(cx, cy, label, {
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    fill: theme.colors.text,
    textAnchor: 'middle',
    dominantBaseline: 'middle',
  });
}

/**
 * A participant's name, with its stereotype ABOVE it when it has a visible
 * one — two runs, not one string.
 *
 * `CommandParticipant` stores the stereotype on the Participant rather than
 * in its code (`:174-181`), and the jar draws it on its own line: the golden
 * for `birocu-87-xubi808` carries `«APIGateway»` and `OnlyLabel` as separate
 * `<text>` elements, stereotype first. `hide stereotype` removes it upstream
 * of here (`applyHideStereotype`), so `geo.stereotype` being absent is the
 * only signal this needs.
 *
 * Two gaps, both deliberate and both bounded:
 *
 *   1. The circled-character and sprite BADGE forms
 *      (`<< ($sprite, #color) Name >>`, `StereotypeDecoration#buildComplex`).
 *      `class-stereotype.ts` already models them, but it sits in the CLASS
 *      engine; sharing it means lifting the helper into `core/` the way SI27
 *      lifted the creole atom seam, not reaching across the boundary from
 *      here. A badge renders as its plain label text until then.
 * `ShowStereotype false` IS honoured, upstream of here: the layout resolves
 * it (`sequence-layout-participants.ts#visibleStereotype`) and simply leaves
 * `geo.stereotype` unset, so this function needs no style knowledge.
 */
/**
 * `TextBlockSprited#drawU` -- the badge draws at the block origin and the
 * label block is translated right by `sprite.width + 6.0` (`:70-77`). So the
 * badge sits at the box's left padding and the name block centres in what is
 * left, which is exactly the box layout sized it for.
 *
 * Jar-verified on `birocu-87-xubi808`: box x=172.938 w=177.363 with a 64-wide
 * image gives image x=179.938 (`x + 7`) and a name block centred on 296.62 --
 * `(179.938 + 64 + 6 + (172.938 + 177.363 - 7)) / 2`.
 */
function badgeGeo(p: ParticipantGeo, theme: ScaledTheme): { x: number; nameCx: number } | undefined {
  if (p.badge === undefined) return undefined;
  const pad = theme.sequence.participantPadding;
  const x = p.x + pad;
  return { x, nameCx: (x + p.badge.width + BADGE_GAP + (p.x + p.width - pad)) / 2 };
}

/**
 * The badge itself: a rasterised `<image>` for a sprite, or the plain filled
 * circle the jar draws for a circled character -- WITHOUT the character
 * (`ast.ts#ParticipantBadge` carries the three goldens that show this).
 * Vertically centred on the name block's own centre, which is what
 * `TextBlockSprited`'s `max(spriteHeight, textHeight)` box amounts to.
 */
function renderBadge(badge: ParticipantBadge, x: number, cy: number, theme: ScaledTheme): string {
  const top = cy - badge.height / 2;
  if (badge.kind === 'sprite') return image(x, top, badge.width, badge.height, badge.dataUri);
  const r = badge.width / 2;
  return ellipse(x + r, cy, r, r, {
    fill: badge.color ?? theme.colors.background,
    stroke: theme.colors.border,
    'stroke-width': 1 * theme.scaleK,
  });
}

function renderNameBlock(p: ParticipantGeo, cy: number, theme: ScaledTheme): string {
  const badge = badgeGeo(p, theme);
  const cx = badge?.nameCx ?? p.centerX;
  const badgeEl = badge === undefined || p.badge === undefined ? '' : renderBadge(p.badge, badge.x, cy, theme);
  const lines = p.stereotypeLines ?? [];
  if (lines.length === 0) return badgeEl + renderLabel(cx, cy, p.display, theme);
  // The block is centred on `cy`: N stereotype rows then the name, each one
  // font-size tall, so the name sits half a row below centre for a single
  // stereotype and proportionally lower for a stacked one.
  const rowH = theme.fontSize;
  const top = cy - (lines.length * rowH) / 2;
  const stereo = lines.map((l, i) => renderLabel(cx, top + i * rowH, l, theme)).join('');
  return badgeEl + stereo + renderLabel(cx, top + lines.length * rowH, p.display, theme);
}

/**
 * Where a participant's label sits inside its block, per the composition its
 * `ComponentRose*` uses.
 *
 * - `queue` puts the text INSIDE the glyph: `ComponentRoseQueue`'s constructor
 *   passes `getTextBlock()` as `USymbols.QUEUE.asSmall`'s label, and
 *   `USymbolQueue#getMargin()` is `Margin(5,15,5,5)`, so the text's vertical
 *   centre is the block's own centre.
 * - `collections` puts it inside the FRONT rectangle, which
 *   `ComponentRoseParticipant#drawInternalU:95` has already pushed down by
 *   `getDeltaCollection() = 4`.
 * - the glyph-above-text kinds (`database`, `boundary`, `control`, `entity`)
 *   put it below the glyph at the head and above it at the tail
 *   (`ComponentRoseDatabase.java:81-87`).
 */
function labelCy(p: ParticipantGeo, blockTopY: number, head: boolean, theme: ScaledTheme): number {
  if (p.type === 'queue') return blockTopY + p.height / 2;
  if (p.type === 'collections') return blockTopY + COLLECTIONS_DELTA + (p.height - COLLECTIONS_DELTA) / 2;
  const labelYOffset = theme.fontSize / 2 + 4 * theme.scaleK;
  return head ? blockTopY + p.height - labelYOffset : blockTopY + labelYOffset;
}

/** `ComponentRoseParticipant#drawInternalU:97` — the FRONT rectangle of a
 *  `collections` stack. The back one is the glyph the seam draws; this is the
 *  one the text goes in, pushed down by `getDeltaCollection()` and that much
 *  smaller in both axes. Empty for every other kind. */
function collectionsFrontBox(p: ParticipantGeo, blockTopY: number): string {
  if (p.type !== 'collections') return '';
  return rect(p.x, blockTopY + COLLECTIONS_DELTA, p.width - COLLECTIONS_DELTA, p.height - COLLECTIONS_DELTA, {
    fill: p.background,
    stroke: p.border,
  });
}

/**
 * One participant's head or footer block, starting at `blockTopY`.
 *
 * `head` is upstream's own `ComponentType.*_HEAD` vs `*_TAIL` split
 * (`Rose.java#createComponentParticipant`), which every glyph-bearing
 * `ComponentRose*` threads into `drawInternalU` to flip the glyph/text order.
 */
function renderParticipantBlock(
  p: ParticipantGeo,
  blockTopY: number,
  head: boolean,
  actorShapeY: number,
  theme: ScaledTheme,
): string {
  const label = renderNameBlock(p, labelCy(p, blockTopY, head, theme), theme);
  if (p.type === 'actor') {
    // T6 owns actor: it is an `ActorStyle` case, not a symbol one (D4). Its
    // shape Y still comes from the caller's own pre-computed `footerShapeY`,
    // unchanged by this task.
    const shape = renderActorShape(p, actorShapeY, theme);
    return head ? shape + label : label + shape;
  }
  if (hasParticipantSymbol(p.type)) {
    return renderSymbolShape(p, blockTopY, head, theme) + collectionsFrontBox(p, blockTopY) + label;
  }
  // `PARTICIPANT_HEAD` -> `ComponentRoseParticipant` with `collections=false`:
  // one plain rectangle with the text inside it.
  //
  // `Participant#getUsedStyles` -- the kind's `<style>` bucket merged with
  // the participant's own inline colour, resolved in layout
  // (`sequence-layout-participants.ts#resolveParticipantBackground`).
  const box = rect(p.x, blockTopY, p.width, p.height, { fill: p.background, stroke: p.border });
  return box + renderNameBlock(p, blockTopY + p.height / 2, theme);
}

/** The header row. */
export function renderParticipantBox(p: ParticipantGeo, theme: ScaledTheme): string {
  return renderParticipantBlock(p, p.y, true, p.y, theme);
}

/** The footer row (`isShowFootbox`), drawn from `lifelineEndY` down.
 *  `footerShapeY` is the layout's pre-computed actor shape top; every other
 *  kind derives its own offset from the block. */
export function renderFooterBox(
  p: ParticipantGeo,
  lifelineEndY: number,
  footerShapeY: number,
  theme: ScaledTheme,
): string {
  return renderParticipantBlock(p, lifelineEndY, false, footerShapeY, theme);
}
