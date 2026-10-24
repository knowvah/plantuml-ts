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
 * drawn at scale 1: the export scale is the exporter's single `SvgGraphics
 * #format` pass (`core/TextBlockExporter.ts#exportTo`), never a multiply
 * here.
 */

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UFontFactory } from '../../core/klimt/font/UFontFactory.js';
import { CircledCharacter } from '../../core/klimt/shape/CircledCharacter.js';
import { UImage } from '../../core/klimt/shape/UImage.js';
import { PAINT_NONE } from '../../core/svg.js';
import type { PageTheme } from './renderer-ug.js';
import type { ParticipantGeo } from './ast.js';
import { drawRun, withUrl, type RunAmbient } from './renderer-text.js';
import {
  participantBadgeGeo,
  participantLabelCy,
  participantLabelMetricsOf,
  type ParticipantLabelMetrics,
} from './sequence-layout-participant-sizing.js';
import { participantBoxOf } from './sequence-layout-participants.js';
import { paintOfGeo } from './sequence-participant-paints.js';
import { drawParticipantSymbol, measureParticipantSymbol } from './renderer-participant-symbol.js';
import { BADGE_GAP } from './sequence-layout-participant-label.js';

/** The unit the layout's participant helpers measure in -- the page is drawn at scale 1
 *  (`renderer.ts#DRAW_SCALE`), as `sequence-layout-participant-label.ts` calls them. */
const PAGE_SCALE = 1;

/**
 * A participant's glyph -- or, for `participant`/`collections`, its
 * rectangle(s) (`ComponentRoseParticipant#drawInternalU:101-111`) -- drawn
 * through the seam graphic with the merged style's paint (sdd1 T2a).
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
function drawSymbolShape(ug: UGraphic, p: ParticipantGeo, blockTopY: number, head: boolean, theme: PageTheme): void {
  drawParticipantSymbol(
    ug,
    p.type,
    { x: p.x, y: blockTopY, width: p.width, height: p.height, paint: paintOfGeo(p), shadow: p.shadow ?? 0 },
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
 * The ink and font a label run falls back to where creole set none: the
 * head's ambient value (`DriverTextSvg#draw` reading one `FontConfiguration`
 * per `UText`, `:104-160,177-180` -- a markup-free name carries a family and a
 * size equal to the ambient pair and none of the flags, so it draws
 * byte-identically to a single plain run).
 *
 * A3: a run draws at its own left edge and baseline, both resolved in layout
 * (D1, D4) -- no `text-anchor`, no `dominant-baseline`, which the jar never
 * emits on any of its 70 622 sequence `<text>` elements; `renderer-text.ts
 * #drawRun` shifts it by the head/foot translation `dy` the run cannot know
 * (an image's top is absolute: `dy` shifts it as it shifts the baseline
 * beside it). A `url` WRAPS rather than decorates (`SvgGraphics#openLink`/
 * `closeLink`, `:1105-1150`): `drawRun` brackets the run in `startUrl`/
 * `closeUrl`, so there is no second `<a>` emitter here.
 */
function labelAmbientOf(theme: PageTheme): RunAmbient {
  return { fontFamily: theme.fontFamily, fontSize: theme.fontSize, color: theme.colors.text };
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
 * The badge itself: a rasterised `UImage` for a sprite, or for a circled
 * character the `CircledCharacter` (`CircledCharacter#drawU`,
 * `CircledCharacter.java:65-74`: border `Fore`, spot `Back`, the `UEllipse`,
 * then the font colour at `translate(radius, radius)` and the
 * `UCenteredCharacter` -> `DriverCenteredCharacterSvg#draw:56-81`). Drawn at
 * the block ORIGIN, as is the text beside it (`TextBlockSprited.java:70-77`),
 * so `top` is the block's top.
 */
function drawBadge(
  ug: UGraphic,
  p: ParticipantGeo,
  at: { readonly x: number; readonly top: number },
  theme: PageTheme,
): void {
  const badge = p.badge!;
  const origin = ug.apply(new UTranslate(at.x, at.top));
  if (badge.kind === 'sprite') {
    origin.draw(UImage.build(badge.width, badge.height, badge.dataUri));
    return;
  }
  // `CircledCharacter` is built with a null border (`Display.java:677-678`)
  // and draws in the head's current colour: the style's `LineColor`, at the
  // `UStroke.simple()` the component reset to before its text
  // (`ComponentRoseParticipant.java:94-95,112`).
  // The glyph fills with the label font's colour (`ug.apply(fontColor)`, `:66`;
  // `fontColor` is `fontConfiguration.getColor()`, `Display.java:677-678`),
  // centred on the circle's centre (`UTranslate(radius, radius)`, `:67`).
  const font = UFontFactory.build(theme.fontFamily, undefined, badge.fontSize);
  const fill = badge.color ?? theme.colors.background;
  new CircledCharacter(
    badge.character,
    badge.width / 2,
    font,
    fill,
    p.border,
    paintOfGeo(p).font.color ?? PAINT_NONE,
  ).drawU(origin.apply(UStroke.simple()));
}

/**
 * The name block of the row whose label is centred on `cy`. `p` is the HEAD
 * row's painted box (the runs were placed against it in layout).
 */
function drawNameBlock(
  ug: UGraphic,
  p: ParticipantGeo,
  cy: number,
  metrics: ParticipantLabelMetrics,
  theme: PageTheme,
): void {
  // The runs were placed against the HEAD's own centre; every other row of the
  // diagram draws the same text translated. `dy` is a difference of two
  // `participantLabelCy` values rather than of two block tops, because a
  // glyph-bearing kind puts its label BELOW the glyph at the head and ABOVE it
  // at the tail (`ComponentRoseDatabase.java:81-87`) — the offset is not the
  // same on both rows, so a block-top delta would be wrong for exactly those
  // kinds.
  const dy = cy - participantLabelCy(p.type, p.height, p.y, true, metrics);
  if (p.badge !== undefined) drawBadge(ug, p, badgeOriginOf(p, dy), theme);
  const ambient = labelAmbientOf(theme);
  for (const run of p.labelRuns) drawRun(ug, run, ambient, dy);
}

/**
 * Where the badge draws: the text block's origin, whose rows were placed beside
 * it in layout (`TextBlockSprited.java:70-77`: sprite at `(0, 0)`, rows at
 * `dx = sprite.width + 6`, both from the block top). The rows' left edge is the
 * widest row's, i.e. the leftmost run, which is `badge.width + 6` right of the
 * origin for the glyph kinds, whose block is the rows' own width. A
 * `participant` is sized by its box, which can be wider than the block, so it
 * keeps the padding-based origin `participantBadgeGeo` derives.
 */
function badgeOriginOf(p: ParticipantGeo, dy: number): { readonly x: number; readonly top: number } {
  const badge = p.badge!;
  const rowsTop = Math.min(...p.labelRuns.map((r) => r.y - r.textAscent)) + dy;
  const top = p.labelRuns.length === 0 ? p.y + (p.height - badge.height) / 2 : rowsTop;
  if (p.type === 'participant' || p.type === 'collections' || p.labelRuns.length === 0) {
    return { x: participantBadgeGeo(p.badge, p.x, paintOfGeo(p).padding)!.x, top };
  }
  return { x: Math.min(...p.labelRuns.map((r) => r.x)) - BADGE_GAP - badge.width, top };
}

/**
 * The stick kinds' text-block height: the component's height less the glyph's
 * (`getPreferredHeight` = `dimStickman.getHeight() + getTextHeight()`,
 * `ComponentRoseActor.java:92-95`), in the caller's scaled units. `undefined`
 * for the kinds that place their label some other way.
 */
function stickLabelHeight(p: ParticipantGeo, theme: PageTheme): number | undefined {
  if (
    p.type !== 'actor' &&
    p.type !== 'boundary' &&
    p.type !== 'control' &&
    p.type !== 'entity' &&
    p.type !== 'database'
  ) {
    return undefined;
  }
  const glyph = measureParticipantSymbol(p.type, paintOfGeo(p), theme, theme.measurer);
  return p.height - glyph.height;
}

/**
 * One participant's head or footer block, starting at `blockTopY`.
 *
 * `head` is upstream's own `ComponentType.*_HEAD` vs `*_TAIL` split
 * (`Rose.java#createComponentParticipant`), which every glyph-bearing
 * `ComponentRose*` threads into `drawInternalU` to flip the glyph/text order.
 */
function drawParticipantBlock(
  ug: UGraphic,
  geo: ParticipantGeo,
  blockTopY: number,
  head: boolean,
  theme: PageTheme,
): void {
  // The painted box, not the preferred one: a `participant`/`collections`
  // head reserves its shadow and margin outside the rectangle it draws.
  const p = participantBoxOf(geo);
  const rowTop = p.y + (blockTopY - geo.y);
  const metrics = participantLabelMetricsOf(paintOfGeo(geo), PAGE_SCALE, stickLabelHeight(p, theme));
  const label = (): void =>
    drawNameBlock(ug, p, participantLabelCy(p.type, p.height, rowTop, head, metrics), metrics, theme);
  const shape = (): void => drawSymbolShape(ug, p, rowTop, head, theme);
  // DRAW ORDER, and it is not the obvious one. Every stacked
  // `ComponentRose*#drawInternalU` calls `textBlock.drawU(...)` in BOTH arms
  // of its `head` branch and `stickman.drawU(ug)` only afterwards
  // (`ComponentRoseDatabase.java:81-88`, `ComponentRoseActor.java:73-80`,
  // and the identical bodies in Boundary/Control/Entity) -- so the label
  // precedes the glyph in document order whether it sits above it or below.
  // `queue`, `participant` and `collections` are the exceptions, and they are
  // exceptions in upstream too: `ComponentRoseQueue#drawInternalU` draws
  // only the glyph (its text is `asSmall`'s own label, drawn inside it), and
  // `ComponentRoseParticipant` draws its rectangle(s) before its text
  // (`ComponentRoseParticipant.java:99-112`).
  const glyphFirst = p.type === 'queue' || p.type === 'participant' || p.type === 'collections';
  for (const part of glyphFirst ? [shape, label] : [label, shape]) part();
}

/** The head a create message draws at its tile top
 *  (`LivingSpace#drawHead(ug, context, TOP, LEFT|RIGHT)`). */
export function drawCreatedHead(
  ug: UGraphic,
  head: { participant: ParticipantGeo; y: number },
  theme: PageTheme,
): void {
  withUrl(ug, head.participant.url, () => drawParticipantBlock(ug, head.participant, head.y, true, theme));
}

/**
 * The header row: `LivingSpace#drawHead` -> `drawHeadOrTail`
 * (`LivingSpace.java:181-215`).
 *
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
 * A MESSAGE-level url is deliberately not drawn — see
 * `renderer-message.ts`'s own note, which records that the jar emits no `<a>`
 * for `A -> B [[url]] : label`.
 */
export function drawParticipantBox(ug: UGraphic, p: ParticipantGeo, theme: PageTheme): void {
  withUrl(ug, p.url, () => drawParticipantBlock(ug, p, p.y, true, theme));
}

/** The footer row (`isShowFootbox`), drawn from `footerShapeY` down --
 *  `dy(pageHeight + headHeight)`, `PlayingSpaceWithParticipants.java:225-226`.
 *  Every kind derives its own glyph offset from the block. */
export function drawFooterBox(ug: UGraphic, p: ParticipantGeo, footerShapeY: number, theme: PageTheme): void {
  withUrl(ug, p.url, () => drawParticipantBlock(ug, p, footerShapeY, false, theme));
}
