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
import type { Paint } from '../../core/paint.js';
import type { UStroke } from '../../core/klimt/UStroke.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { parseSvgPath } from '../../core/klimt/sprite/SvgPath.js';
import { moveTo, lineTo } from '../../core/svg-path-builder.js';
import type { DescriptionNodeGeo } from './layout-helpers.js';
import {
  OPALE_CORNERSIZE,
  opalePolygonLeft,
  opalePolygonRight,
  opalePolygonUp,
  opalePolygonDown,
  opaleCorner,
  type OpaleBox,
  type OpaleConnector,
  type OpaleDirection,
} from '../../core/svek/image/Opale.js';

/** `plantuml.skin:322-326`'s `note { LineThickness 0.5 }` -- the default
 *  `style.getStroke()` (`EntityImageNote.java:269`) when no `<style> note {
 *  LineThickness }` override exists. Jar-verified against `tefeco-12-rato895`
 *  and a standalone `cloud cloud` / `note right: cloud's note` oracle probe. */
export const NOTE_STROKE_WIDTH = 0.5;

/** The note's resolved paints (`EntityImageNote.java:100-108`): `back` =
 *  `entity.getColors().getColor(BACK)` else the style `BackGroundColor`;
 *  `border` = the style `LineColor`; `stroke` = `style.getStroke()`. */
export interface NotePaints {
  readonly back: Paint;
  readonly border: Paint;
  readonly stroke: UStroke;
}

/** Dispatch table mirroring `class/renderer-note.ts#opaleOutline`'s own
 *  switch (`Opale.java:106-115`'s `strategy` dispatch). */
const OPALE_OUTLINE_BUILDERS: Record<OpaleDirection, (box: OpaleBox, connector: OpaleConnector, k?: number) => string> =
  {
    left: opalePolygonLeft,
    right: opalePolygonRight,
    up: opalePolygonUp,
    down: opalePolygonDown,
  };

/**
 * `Opale.getPolygonNormal(width, height, roundCorner)` with `roundCorner`
 * fixed at 0 (`getRoundCorner()` = `skinParam.getRoundCorner(CornerParam
 * .DEFAULT, null)`, 0 unless `skinparam roundCorner` is set -- the same
 * simplification every sibling `opalePolygon*` makes): `moveTo(0,0)
 * lineTo(0,height) lineTo(width,height) lineTo(width,cornersize)
 * lineTo(width-cornersize,0) lineTo(0,0)`.
 * @see ~/git/plantuml/.../svek/image/Opale.java:149-157
 */
export function opalePolygonNormal(width: number, height: number): string {
  return [
    moveTo(0, 0),
    lineTo(0, height),
    lineTo(width, height),
    lineTo(width, OPALE_CORNERSIZE),
    lineTo(width - OPALE_CORNERSIZE, 0),
    lineTo(0, 0),
  ].join(' ');
}

/**
 * Draws the note's outline polygon and fold triangle. The note's own box
 * origin is LOCAL (0,0) -- `drawEntity`'s caller already applied the node's
 * absolute `UTranslate`.
 *
 * - `node.opale` resolved: `Opale.drawU` (`Opale.java:104-127`) applies
 *   `bg`, `border`, THEN `stroke`, and draws the connector-notched polygon
 *   and the corner with that stroked graphic.
 * - otherwise: `EntityImageNote#drawNormal` (`EntityImageNote.java:272-286`)
 *   applies `bg` and `border`, strokes ONLY the polygon (`stroked.draw
 *   (polygon)`) and draws the corner (`ug.draw(Opale.getCorner(...))`) on the
 *   UNstroked graphic, so the fold keeps the default stroke width (1).
 *
 * `k` stays 1 (unscaled): description has no `ScaledTheme`.
 */
export function drawNoteShape(ug: UGraphic, node: DescriptionNodeGeo, paints: NotePaints): void {
  const box: OpaleBox = { origin: { x: 0, y: 0 }, width: node.width, height: node.height };
  const colored = ug.apply(new Back(paints.back)).apply(new Fore(paints.border));
  const corner = parseSvgPath(opaleCorner(box.origin, box.width), UTranslate.none());
  const opale = node.opale;
  if (opale === undefined) {
    colored.apply(paints.stroke).draw(parseSvgPath(opalePolygonNormal(box.width, box.height), UTranslate.none()));
    colored.draw(corner);
    return;
  }
  const connector: OpaleConnector = { pp1: opale.pp1, pp2: opale.pp2 };
  const styled = colored.apply(paints.stroke);
  styled.draw(parseSvgPath(OPALE_OUTLINE_BUILDERS[opale.direction](box, connector), UTranslate.none()));
  styled.draw(corner);
}
