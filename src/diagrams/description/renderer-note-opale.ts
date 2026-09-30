/**
 * renderer-note-opale.ts — T1e (opale note port): draws a `symbol ===
 * 'note'` leaf's Opale fold-outline + corner triangle instead of a plain
 * box, when `DescriptionNodeGeo.opale` resolved
 * (`layout-geo-post.ts#applyOpaleNote`, the SAME `Opale.ts
 * #resolveOpaleConnector` call `class/note-opale.ts#buildOpaleNoteGeo`
 * makes for the class engine's own note renderer). Split out of
 * `renderer-entity.ts` purely to keep that file under the project's
 * 500-line cap (it was already at 481 lines before this task) — no
 * behavior change to anything already in that file.
 *
 * `class/renderer-note.ts#renderOpaleNote` is the in-repo precedent this
 * mirrors, adapted from that engine's plain-string `path()` template
 * renderer to this engine's `UGraphic`-based one: `Opale.ts`'s
 * `opalePolygonLeft`/`Right`/`Up`/`Down`/`opaleCorner` return an SVG `d`
 * string (deliberately engine-agnostic — see `svg-path-builder.ts`'s own
 * doc comment on why those helpers target "renderers that draw plain SVG
 * strings"), so this module round-trips that string through
 * `SvgPath.ts#parseSvgPath` (the same adapter the sprite/`<$name>` glyph
 * renderer uses, `SvgNanoParser.ts#drawPath`) into a drawable `UPath`,
 * rather than duplicating the polygon arithmetic via `UPath`'s own
 * builder methods.
 *
 * @see ~/git/plantuml/.../svek/image/EntityImageNote.java:207-243 (drawU's opale branch)
 * @see ~/git/plantuml/.../svek/image/Opale.java:104-125 (drawU: polygon, corner, text —
 *      SAME marginX1/marginY translate as the plain-box case, applied by the CALLER,
 *      `renderer-entity.ts#drawNoteFallback`, unchanged for both branches)
 */
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { Theme } from '../../core/theme.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { parseSvgPath } from '../../core/klimt/sprite/SvgPath.js';
import type { DescriptionNodeGeo } from './layout-helpers.js';
import {
  opalePolygonLeft,
  opalePolygonRight,
  opalePolygonUp,
  opalePolygonDown,
  opaleCorner,
  type OpaleBox,
  type OpaleConnector,
  type OpaleDirection,
} from '../../core/svek/image/Opale.js';
import {
  decorateEntityDrawing,
  type EntityDecorationInfo,
  type UGraphicWithGroups,
} from '../../core/svek/DecorateEntityImage.js';

/** `plantuml.skin:322-326`'s `note { LineThickness 0.5 }` — the SAME
 *  default `class/renderer-note-stroke.ts#NOTE_STROKE_WIDTH` ports,
 *  jar-verified against this row's own nested fixture (`tefeco-12-rato895`,
 *  and a fresh standalone `cloud cloud` / `note right: cloud's note`
 *  oracle probe): both the already-correct outer CLASS-engine opale note
 *  AND the jar's nested/standalone DESCRIPTION opale note draw
 *  `stroke-width="0.5"`, independent of `drawFallbackBox`'s own
 *  (pre-existing, out of this task's scope) ambient stroke default. The
 *  full per-element `NoteBorderThickness`/`<style> note { LineThickness }`
 *  cascade `class/renderer-note-stroke.ts#resolveNoteStroke` applies is
 *  NOT threaded here — no description-corpus fixture in this task's scope
 *  overrides it, and `theme` carries no matching cascade lookup wired for
 *  description notes yet (documented residual, cdd7-T1e report). */
const NOTE_STROKE_WIDTH = 0.5;

/** Dispatch table mirroring `class/renderer-note.ts#opaleOutline`'s own
 *  switch (`Opale.java:106-115`'s `strategy` dispatch). */
const OPALE_OUTLINE_BUILDERS: Record<OpaleDirection, (box: OpaleBox, connector: OpaleConnector, k?: number) => string> =
  {
    left: opalePolygonLeft,
    right: opalePolygonRight,
    up: opalePolygonUp,
    down: opalePolygonDown,
  };

/** Narrows `ug` to `UGraphicWithGroups` (duplicated locally per this
 *  codebase's established one-helper-per-call-site convention — see
 *  `renderer-entity.ts#requireGroups`'s own doc comment). */
function requireGroups(ug: UGraphic): UGraphicWithGroups {
  const candidate = ug as Partial<UGraphicWithGroups>;
  if (typeof candidate.startGroup !== 'function' || typeof candidate.closeGroup !== 'function') {
    throw new Error('renderer-note-opale: ug does not support startGroup/closeGroup (see UGraphicSvg)');
  }
  return ug as UGraphicWithGroups;
}

/**
 * Draws the fold-outline + corner triangle (`Opale.java:207-220`'s
 * `ug.draw(polygon); ug.draw(getCorner(...))`) for a note whose
 * `DescriptionNodeGeo.opale` resolved. The note's own box origin is LOCAL
 * (0,0) here — `drawEntity`'s caller already applied the node's absolute
 * `UTranslate(node.x, node.y)` (see `renderer-entity.ts#drawEntity`'s own
 * doc comment), matching `drawFallbackBox`'s identical convention for the
 * plain-box case. `k` stays 1 (unscaled): description has no
 * `theme.scaleK`/`ScaledTheme` the way the class engine's `NoteGeo` does
 * (`Opale.ts#opalePolygonLeft`'s own `k` doc comment: "every pre-existing
 * caller...is unscaled").
 */
export function drawOpaleShape(
  ug: UGraphic,
  node: DescriptionNodeGeo,
  uid: string,
  theme: Theme,
  opale: NonNullable<DescriptionNodeGeo['opale']>,
): void {
  const info: EntityDecorationInfo = { name: node.id, qualifiedName: node.id, uid, location: null };
  decorateEntityDrawing(
    requireGroups(ug),
    info,
    {
      drawU(inner: UGraphic): void {
        const box: OpaleBox = { origin: { x: 0, y: 0 }, width: node.width, height: node.height };
        const connector: OpaleConnector = { pp1: opale.pp1, pp2: opale.pp2 };
        const outline = parseSvgPath(OPALE_OUTLINE_BUILDERS[opale.direction](box, connector), UTranslate.none());
        const corner = parseSvgPath(opaleCorner(box.origin, box.width), UTranslate.none());
        const styled = inner
          .apply(new Fore(theme.colors.border))
          .apply(new Back(theme.colors.noteBackground))
          .apply(UStroke.withThickness(NOTE_STROKE_WIDTH));
        styled.draw(outline);
        styled.draw(corner);
      },
    },
    { withComment: false },
  );
}
