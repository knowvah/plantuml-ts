/**
 * class-magic-arrow.ts — G2 item 44 / M4 cause D: the "magic arrow" edge-label
 * glyph (`StringWithArrow.java`, `TextBlockArrow2`, `SvekEdge
 * #getArrowDirectionInRadian`). A relationship label ending in `" >"`/
 * `" <"` (or the bare `>`/`<`/`"< "`/`"> "` forms) strips the arrow
 * character and draws a small inline triangle glyph before the remaining
 * text — `svek/SvekEdge.java:59,284,297,304` (the SAME class `descdiagram`
 * uses; confirmed applicable to class diagrams via `CommandLinkClass`'s own
 * shared `Labels` construction, `classdiagram/command/CommandLinkClass
 * .java:342-366`).
 *
 * `parseMagicArrowLabel`/`MagicArrowLabel`/`MagicArrowDirection` moved to
 * `core/edge-label-box.ts` (2026-08-16, T12c, decisions.md D1) — description
 * (`link-edge-attrs.ts`) needs the SAME token-strip, and D1 names exactly
 * this situation ("two engines needing the same arrow handling") as the
 * shared-seam signal. Re-exported below so every existing import of THIS
 * file (`class-layout-edge-labels.ts`, `class-edge-geo.ts`) keeps working
 * unchanged — same re-export precedent as `class-edge-label-lines.ts`. The
 * triangle-glyph render geometry below (`magicArrowAngle`,
 * `magicArrowGlyphPoints`, `ARROW_GLYPH_SIZE`) stays HERE: only the class
 * engine draws the glyph, so it is not shared behavior under D1.
 *
 * Scope: single-line labels only (`splitEdgeLabelLines(label).lines.length
 * === 1`) — jar itself only strips a top-level arrow when
 * `Display.hasSeveralGuideLines(completeLabel)` is false
 * (`StringWithArrow.java:63-65`); a multi-line label defers arrow-parsing
 * to a PER-LINE re-check inside `addSeveralMagicArrows`
 * (`StringWithArrow.java:115-127`), a genuinely separate sub-mechanism with
 * zero corpus reach in this mission's item-43/44 fixtures (no fixture
 * combines a `\n`/`\l`/`\r` line break with a magic-arrow token) —
 * unimplemented, named here rather than guessed at.
 *
 * Also scoped OUT: the self-loop (`isAutolink()`) angle formula
 * (`dotPath.getStartAngle()`, a bezier tangent, NOT the straight
 * start-to-end vector below) — `dorelu-66-lixu637`'s own reach, a separate
 * geometry primitive this port has not built (`ledger.md` item 44). The
 * general (non-autolink) formula below is jar-verified byte-exact SHAPE
 * against `lojepe-37-liri985`'s golden triangle `<polygon>`.
 */

import {
  type MagicArrowDirection,
  type MagicArrowLabel,
  parseMagicArrowLabel,
} from '../../core/edge-label-box.js';
import { splitEdgeLabelLines } from './class-edge-label-lines.js';

export { type MagicArrowDirection, type MagicArrowLabel, parseMagicArrowLabel };

/**
 * `TextBlockArrow2#drawU`'s DRAW-ONLY ink size — `(int) (size * .80)`
 * (`klimt/shape/TextBlockArrow2.java:64-65`), `size` = the arrow's own font
 * size (13 default). This is `triSize`, the triangle's actual painted
 * radius basis (`getPoint(triSize/2, angle...)`, `:72-75`) and the glyph's
 * horizontal translate (`UTranslate(triSize/2, size/2)`, `:68`) — it is
 * NEVER the reserved BLOCK width. `TextBlockArrow2#calculateDimension`
 * (`:87-89`, the MEASUREMENT the DOT box and the merged-block layout are
 * built from) returns `(size, size)`, not `(triSize, triSize)` — the trap
 * T12c's brief names explicitly. Every width/position formula that reserves
 * or positions the ARROW BLOCK (not its ink) must use the caller's own font
 * size, never this constant — see {@link magicArrowGlyphPoints}'s `y`
 * parameter and `class-edge-geo.ts#attachMagicArrow`.
 */
export const ARROW_GLYPH_SIZE = Math.trunc(13 * 0.8);

/**
 * M4 cause D bare-arrow sub-case (`.agent-notes/m4-single-line-width.md`,
 * T12c): true when `label` is a BARE `<`/`>` magic-arrow token with no
 * remaining text — the `Display.isNull` arm (`SvekEdge.java:281-285`),
 * which prepends the arrow block but never calls `addVisibilityModifier`,
 * so NO `marginLabel` is added at all (unlike the text-bearing arrow case,
 * `:296-306`, which runs `addVisibilityModifier` — margin included — BEFORE
 * the arrow block is merged on, `:302,304`). Single-line only, mirroring
 * `StringWithArrow`'s own `hasSeveralGuideLines` guard
 * (`StringWithArrow.java:63-65`): a multi-line label is never read as an
 * arrow token upstream, whatever its first line looks like.
 */
export function isBareMagicArrowLabel(label: string): boolean {
  if (splitEdgeLabelLines(label).lines.length !== 1) return false;
  const magic = parseMagicArrowLabel(label);
  return magic !== undefined && magic.text === undefined;
}

/**
 * `SvekEdge#getArrowDirectionInRadianInternal` (non-autolink branch,
 * SvekEdge.java:208-217): `Math.atan2(end.x-start.x, end.y-start.y)` over
 * the edge's OWN start/end points (a "compass" angle — 0 = straight down
 * in SVG's y-down space, NOT the usual `atan2(dy,dx)` math convention).
 * `start`/`end` are the ALREADY from-to-normalized spline endpoints
 * (`class-geo-builders.ts#normalizeEdgePoints`'s own doc comment — mirrors
 * jar's post-`solveLine` `dotPath`). BACKWARD adds `Math.PI`
 * (`getArrowDirectionInRadian`, SvekEdge.java:201-206).
 */
export function magicArrowAngle(
  points: ReadonlyArray<{ x: number; y: number }>,
  direction: MagicArrowDirection,
): number {
  const start = points[0]!;
  const end = points[points.length - 1]!;
  const internal = Math.atan2(end.x - start.x, end.y - start.y);
  return direction === 'backward' ? Math.PI + internal : internal;
}

/** `getPoint(len, alpha)` (`TextBlockArrow2.java:79-82`). */
function arrowPoint(len: number, alpha: number): { x: number; y: number } {
  return { x: len * Math.sin(alpha), y: len * Math.cos(alpha) };
}

/**
 * The 3 triangle vertices of the magic-arrow glyph, in ABSOLUTE
 * coordinates — `TextBlockArrow2#drawU` (klimt/shape/TextBlockArrow2.java:
 * 63-77), jar-verified byte-exact SHAPE against `lojepe-37-liri985`'s
 * golden `<polygon>` (tip + two back corners; relative deltas match to the
 * hundredth). `originX`/`originY` is the ARROW BLOCK's own top-left corner
 * — the block is `arrowFontSize` square (`TextBlockArrow2.calculateDimension`,
 * `:87-89`), NOT `ARROW_GLYPH_SIZE` square (that is the ink-only `triSize`,
 * draw-only, `:64-65`) — see `class-geo-builders.ts#attachEdgeLabel`'s doc
 * comment for the block layout this glyph sits within. `cx` uses
 * `triSize/2` (`UTranslate(triSize/2, ...)`, `:68`, x-translate is
 * draw-only and stays `ARROW_GLYPH_SIZE`-based); `cy` uses
 * `arrowFontSize/2` (`UTranslate(..., size/2)`, same line, y-translate is
 * the FULL font size, not `triSize`).
 */
export function magicArrowGlyphPoints(
  originX: number,
  originY: number,
  angleRadians: number,
  arrowFontSize: number,
): Array<{ x: number; y: number }> {
  const half = ARROW_GLYPH_SIZE / 2;
  const beta = (Math.PI * 4) / 5;
  const cx = originX + half;
  const cy = originY + arrowFontSize / 2;
  const tip = arrowPoint(half, angleRadians);
  const a = arrowPoint(half, angleRadians + beta);
  const b = arrowPoint(half, angleRadians - beta);
  return [
    { x: cx + tip.x, y: cy + tip.y },
    { x: cx + a.x, y: cy + a.y },
    { x: cx + b.x, y: cy + b.y },
  ];
}
