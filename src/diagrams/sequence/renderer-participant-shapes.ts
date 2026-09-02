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
import type { ParticipantBadge, ParticipantGeo, ParticipantType, TextRun } from './ast.js';
import { ellipse, image, rect, linkWrap } from '../../core/svg.js';
import { sequenceText } from './sequence-text.js';
import { participantBadgeGeo, participantLabelCy } from './sequence-layout-participant-sizing.js';
import {
  COLLECTIONS_DELTA,
  renderParticipantSymbol,
  type GlyphParticipantType,
} from './renderer-participant-symbol.js';

/** The seven participant kinds `Rose.java#createComponentParticipant` gives a
 *  glyph to. `participant` is the only one left out: `ComponentRoseParticipant`
 *  with `collections=false` draws a bare rectangle and nothing else. */
const GLYPH_TYPES: ReadonlySet<string> = new Set<GlyphParticipantType>([
  'actor',
  'database',
  'collections',
  'queue',
  'entity',
  'boundary',
  'control',
]);

function hasParticipantGlyph(type: ParticipantType): type is GlyphParticipantType {
  return GLYPH_TYPES.has(type);
}

/**
 * A participant's glyph, drawn through the seam.
 *
 * `database` and `actor` used to be hand-rolled here — the cylinder as
 * `rect + line + line + ellipse` (five top-level elements per glyph where
 * `USymbolDatabase#drawDatabase`, `USymbolDatabase.java:62-79`, draws two
 * `UPath`s) and the stick man as an `ellipse` plus a four-segment `path` with
 * `skinparam actorStyle` ignored entirely. The other five kinds were not drawn
 * at all: they fell through to the plain participant rectangle.
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
  if (!hasParticipantGlyph(p.type)) return '';
  return renderParticipantSymbol(
    p.type,
    { x: p.x, y: blockTopY, width: p.width, height: p.height, background: p.background, border: p.border },
    { head, display: p.display, theme },
  );
}

// ---------------------------------------------------------------------------
// Participant head / footer blocks
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Participant helpers
// ---------------------------------------------------------------------------

/**
 * One carried label run, shifted vertically by `dy`.
 *
 * A3: this used to take a CENTRE and lean on `text-anchor="middle"` plus
 * `dominant-baseline="middle"` — two attributes the jar never emits on any of
 * its 70 622 sequence `<text>` elements. The run already carries its own left
 * edge and baseline, both resolved in layout (D1, D4), so all that is left
 * here is the head/foot translation the run cannot know.
 *
 * C4: and its own STYLE, when creole set one. Every field below is the run's
 * where it has one and the head's ambient value where it has not, which is
 * `DriverTextSvg#draw` reading one `FontConfiguration` per `UText`
 * (`:104-160,177-180`) — a markup-free name carries a family and a size equal
 * to the ambient pair and none of the flags, so it emits byte-identically to
 * the pre-C4 single run. `url` WRAPS rather than decorates
 * (`SvgGraphics#openLink`/`closeLink`, `:1105-1150`) and `sequence-text.ts`
 * owns that wrap, so there is no second `<a>` emitter here. No measurer is
 * touched: every metric was resolved in layout and scaled with the geometry
 * (D5).
 */
function renderLabelRun(run: TextRun, dy: number, theme: Theme): string {
  return sequenceText({
    leftX: run.x,
    baselineY: run.y + dy,
    text: run.text,
    width: run.textWidth,
    // `""mono""` sets its own family; `=heading`/`<size:N>` its own size.
    fontFamily: run.fontFamily ?? theme.fontFamily,
    fontSize: run.fontSize ?? theme.fontSize,
    fill: run.color ?? theme.colors.text,
    // `'700'`, not `'bold'`: the deterministic-text jar writes the numeric CSS
    // weight (`sequence-text.ts#SequenceTextSpec.fontWeight`).
    ...(run.bold === true ? { fontWeight: '700' as const } : {}),
    ...(run.italic === true ? { fontStyle: 'italic' as const } : {}),
    ...(run.decoration !== undefined ? { textDecoration: run.decoration } : {}),
    ...(run.url !== undefined ? { url: run.url } : {}),
    // A `<math>`/`<latex>` run draws its image instead of a `<text>`
    // (`sequence-text.ts#SequenceRunImage`, `AtomMath.java:78-97`); `dy`
    // shifts its top exactly as it shifts the baseline beside it.
    ...(run.image !== undefined ? { image: { ...run.image, y: run.image.y + dy } } : {}),
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
  const badge = participantBadgeGeo(p.badge, p.x, p.width, theme);
  const badgeEl =
    badge === undefined || p.badge === undefined ? '' : renderBadge(p.badge, badge.x, cy, theme);
  // The runs were placed against the HEAD's own centre; every other row of the
  // diagram draws the same text translated. `dy` is a difference of two
  // `participantLabelCy` values rather than of two block tops, because a
  // glyph-bearing kind puts its label BELOW the glyph at the head and ABOVE it
  // at the tail (`ComponentRoseDatabase.java:81-87`) — the offset is not the
  // same on both rows, so a block-top delta would be wrong for exactly those
  // kinds.
  const dy = cy - participantLabelCy(p.type, p.height, p.y, true, theme);
  return badgeEl + p.labelRuns.map((run) => renderLabelRun(run, dy, theme)).join('');
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
  theme: ScaledTheme,
): string {
  const label = renderNameBlock(p, participantLabelCy(p.type, p.height, blockTopY, head, theme), theme);
  if (hasParticipantGlyph(p.type)) {
    const glyph = renderSymbolShape(p, blockTopY, head, theme);
    // DRAW ORDER, and it is not the obvious one. Every stacked
    // `ComponentRose*#drawInternalU` calls `textBlock.drawU(...)` in BOTH arms
    // of its `head` branch and `stickman.drawU(ug)` only afterwards
    // (`ComponentRoseDatabase.java:81-88`, `ComponentRoseActor.java:73-80`,
    // and the identical bodies in Boundary/Control/Entity) -- so the label
    // precedes the glyph in document order whether it sits above it or below.
    // `queue` and `collections` are the two exceptions, and they are
    // exceptions in upstream too: `ComponentRoseQueue#drawInternalU` draws
    // only the glyph (its text is `asSmall`'s own label, drawn inside it), and
    // `ComponentRoseParticipant` draws both rectangles before its text.
    if (p.type === 'queue') return glyph + label;
    if (p.type === 'collections') return glyph + collectionsFrontBox(p, blockTopY) + label;
    return label + glyph;
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
  return withParticipantUrl(p, renderParticipantBlock(p, p.y, true, theme));
}

/**
 * B3: the jar's hyperlink around a participant row.
 *
 * ```java
 * final Url url = getParticipant().getUrl();
 * if (url != null) ug.startUrl(url);
 * comp.drawU(ug, area, context);
 * if (url != null) ug.closeUrl();
 * ```
 * @see ~/git/plantuml/.../sequencediagram/teoz/LivingSpace.java:205-212
 *
 * It wraps `comp.drawU` — the WHOLE component, label and glyph together, not
 * the label alone. And `drawHeadOrTail` is the shared body of both `drawHead`
 * and `drawTail` (`:181-189`), so the head row and the footer row each get
 * their own `<a>`: `boparo-11-pema294` carries four for two participants.
 *
 * `linkWrap` is `core/svg.ts`'s existing emitter, whose eight attributes and
 * their order are already jar-verified against the class engine's goldens. A
 * second one is not needed here and would be a second thing to keep right.
 *
 * A MESSAGE-level url is deliberately not drawn — see
 * `renderer-message.ts`'s own note, which records that the jar emits no `<a>`
 * for `A -> B [[url]] : label`.
 */
function withParticipantUrl(p: ParticipantGeo, drawn: string): string {
  return p.url === undefined ? drawn : linkWrap(drawn, p.url);
}

/** The footer row (`isShowFootbox`), drawn from `lifelineEndY` down. Every
 *  kind derives its own glyph offset from the block, so the layout's
 *  pre-computed `footerShapeY` is no longer threaded here. */
export function renderFooterBox(p: ParticipantGeo, lifelineEndY: number, theme: ScaledTheme): string {
  return withParticipantUrl(p, renderParticipantBlock(p, lifelineEndY, false, theme));
}
