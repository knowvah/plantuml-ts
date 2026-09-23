/**
 * renderer-body-enhanced.ts — draws a classifier's `EnhancedBodyGeo`
 * (`class-body-enhanced-layout.ts`) primitives in EXACT jar draw order —
 * NOT the classic path's Y-sort merge (`renderer-classifier-box.ts
 * #buildBodyPrimitives`'s own doc comment): a titled divider draws its
 * CONTENT first, then the divider+label (`TextBlockLineBefore#drawU`'s
 * title!=null branch), the OPPOSITE order a plain Y-sort would produce
 * (divider.y sorts before its own content's higher y) — see `class-body-
 * enhanced-layout.ts`'s own module doc comment for the full derivation.
 *
 * G2 N42 (mission priority 1). Tree-connector geometry (bullet/hline/vline)
 * mirrors `Skeleton2#draw`'s exact draw order (hline THEN vline, per cell,
 * in cell order) — every stroke is the hardcoded `#000000` this file's
 * sibling `renderRowText` already uses as its own text-color default (the
 * SAME `FontConfiguration.getColor()` -- upstream's `AtomTree` ctor takes
 * the row's own font color as `lineColor`; every target fixture uses the
 * theme default, so the wider per-row-font-color threading is a named,
 * unverified remainder, not attempted this iteration). Bullet fill is the
 * classifier's OWN ambient background (`classifierFill`, mirroring `class-
 * visibility-icon.ts#renderVisibilityUrlBackground`'s identical "ambient
 * fill, explicit stroke" precedent, G2 N40).
 *
 * CDD T23: {@link buildEnhancedBodyPrimitives} (was `renderEnhancedBody`,
 * a single joined-string return) now returns one `UrlTaggedPrimitive` PER
 * divider/tree part and PER ROW inside a 'rows' part, instead of one opaque
 * string tagged with the classifier's own fallback url. Upstream draws each
 * enhanced-body "rows" block via `new MethodsOrFieldsArea(display, ...)`
 * (`BodyEnhanced1.java:186-190`) — the SAME class the classic (non-
 * enhanced) path uses — so its `TextBlockTracer` (`MethodsOrFieldsArea
 * .java:305-323`) opens/closes each member atom's OWN `Url` independently
 * of the classifier-level `startUrl`/`closeUrl` (`EntityImageClass.java:
 * 141-158`) on THIS path too, not just the classic one.
 * `class-body-enhanced-layout.ts:201`'s per-row `m.ownUrl` (already
 * threaded, previously unread by any render-side url logic) is now read
 * here exactly like the classic path's `row.url ?? geo.url` fallback
 * (`renderer-classifier-box.ts#pushMemberRowPrimitives`). An icon-bearing
 * row reuses `pushIconRowPrimitives` (exported for this call) verbatim —
 * the icon's own `<g data-visibility-modifier>` boundary needs the SAME
 * independent `<a>` run / `preWrapped` handling the classic path already
 * has (`renderer-url.ts`'s "link-flush on group boundary" doc comment;
 * jar-verified `xogixe-78-zuro619`'s `Observation`, every member row
 * explicit-visibility + its own `[[[url]]]`).
 *
 * @see ~/git/plantuml/.../klimt/creole/atom/AtomTree.java#drawU
 * @see ~/git/plantuml/.../salt/element/Skeleton2.java#draw
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java:305-323
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:186-190
 */
import type { ClassifierGeo } from './layout.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { rect, line, image } from '../../core/svg.js';
import type { Paint } from '../../core/paint.js';
import { text as svgText } from '../../core/svg.js';
import { renderRow, pushIconRowPrimitives } from './renderer-classifier-box.js';
import type { EnhancedBodyGeo, EnhancedBodyPart } from './class-body-enhanced-layout.js';
import { BODY_ENHANCED_MARGIN_X } from './class-body-enhanced-geometry.js';
import type { UrlTaggedPrimitive } from './renderer-url.js';

/** The classifier box's OWN divider stroke color (`class-border`'s own
 *  ancestor cascade) — a plain `<line>`, matching `dividerYs`' identical
 *  existing convention (`renderer-classifier-box.ts#buildBodyPrimitives`). */
function renderDividerPart(
  geo: ClassifierGeo,
  part: Extract<EnhancedBodyPart, { kind: 'divider' }>,
  theme: ScaledTheme,
  borderColor: string,
): string {
  const y = geo.y + part.y;
  // G2 N44: threads `part.strokeDasharray` (the `..` separator's `1,2` dash
  // pattern, `class-body-enhanced-layout.ts#separatorStrokeDasharray`) into
  // every `<line>` this function draws -- `undefined` for every other
  // separator char, matching `core/svg.ts#line`'s existing "omit when
  // undefined" convention (same as `strokeWidth` itself needs no gating).
  const dashField = part.strokeDasharray !== undefined ? { strokeDasharray: part.strokeDasharray } : {};
  // G3/O4: `UHorizontalLine#drawHLine`'s `style == '='` branch -- draws
  // EVERY segment below TWICE, once at its own `y`, once at `y+2` (SAME
  // x1/x2 span) -- see `EnhancedDividerPart.doubleLine`'s own doc comment.
  const segment = (x1: number, y1: number, x2: number): string => {
    const one = line(x1, y1, x2, y1, { stroke: borderColor, strokeWidth: part.strokeWidth, ...dashField });
    return part.doubleLine === true
      ? one + line(x1, y1 + 2, x2, y1 + 2, { stroke: borderColor, strokeWidth: part.strokeWidth, ...dashField })
      : one;
  };
  if (part.title === undefined) {
    return segment(geo.x + 1, y, geo.x + geo.width - 1);
  }
  const fullStart = geo.x + 1;
  const fullEnd = geo.x + geo.width - 1;
  const gap = (fullEnd - fullStart - part.title.width) / 2;
  const labelStart = fullStart + gap;
  const labelEnd = fullEnd - gap;
  return (
    segment(fullStart, y, labelStart) +
    svgText(labelStart, geo.y + part.title.y, part.title.text, {
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      fill: '#000000',
      lengthAdjust: 'spacing',
      textLength: part.title.width,
    }) +
    segment(labelEnd, y, fullEnd)
  );
}

/**
 * CDD T23: one `UrlTaggedPrimitive` PER ROW in this 'rows' part -- was
 * `renderRowsPart`, a single joined string tagged (by the caller) with the
 * classifier's own fallback url ONLY, silently merging every member row's
 * OWN `[[[url]]]` into that fallback. `class-body-enhanced-layout.ts:201`
 * already sets `row.url` from `member.ownUrl`; this mirrors the classic
 * path's `renderer-classifier-box.ts#pushMemberRowPrimitives` `effectiveUrl
 * = row.url ?? geo.url` exactly, including reusing that same file's
 * `pushIconRowPrimitives` verbatim for an icon-bearing row (the icon's own
 * `<g data-visibility-modifier>` boundary needs its own independent `<a>`
 * run -- see this module's own doc comment). G2 N44 mechanism 2 (still
 * applies): a non-icon row draws via `renderRow` (icon+text combined, but
 * with no icon present this is identical to `renderRowText` alone) --
 * jar-verified `benemi-22-dufo622`'s `public_member` (PUBLIC_FIELD circle)
 * and `xosiza-60-sobu480`'s `identifying_attribute`/`mandatory_attribute`
 * (IE_MANDATORY circles, both rows) for the icon glyph itself, `xogixe-78-
 * zuro619`'s `Observation` for the per-row url split this iteration adds.
 */
function buildRowsPartPrimitives(
  geo: ClassifierGeo,
  part: Extract<EnhancedBodyPart, { kind: 'rows' }>,
  theme: ScaledTheme,
): UrlTaggedPrimitive[] {
  const primitives: UrlTaggedPrimitive[] = [];
  for (const row of part.rows) {
    const effectiveUrl = row.url ?? geo.url;
    if (row.visibilityIcon === undefined) {
      primitives.push({ url: effectiveUrl, body: renderRow(geo, row, theme) });
      continue;
    }
    // `pushIconRowPrimitives` pushes `{ y, item }` entries for the classic
    // path's Y-sort accumulator; this path draws in part order already (no
    // sort), so a throwaway `y` and a straight `.map` to `.item` recovers
    // the SAME 2-or-3 primitives (url background?, icon, text) in push
    // order, with zero change to that function's own logic.
    const scratch: Array<{ y: number; item: UrlTaggedPrimitive }> = [];
    pushIconRowPrimitives(scratch, geo, theme, row, effectiveUrl);
    primitives.push(...scratch.map((entry) => entry.item));
  }
  primitives.push(...buildEmbedPrimitives(geo, part));
  return primitives;
}

/**
 * CDD T27FU: one `UrlTaggedPrimitive` per `{{ }}` block in this 'rows' part
 * -- `MethodsOrFieldsArea.java:429-440`'s embed draw loop, AFTER every
 * member row (upstream translates past the member group's own height
 * first, then draws each embed in turn). No per-embed url source exists
 * upstream either (the embed draw loop is OUTSIDE the member
 * `TextBlockTracer` url-wrap loop entirely) -- tagged with the classifier's
 * own fallback url, same convention as a divider/tree part. A `href`-less
 * entry (`EmbeddedBlockGeo`'s own doc comment: the `(42,42)` render-failure
 * fallback) reserves its height but draws nothing, matching `EmbeddedDiagram
 * .java:191-193`'s own independent `drawU` catch.
 */
function buildEmbedPrimitives(
  geo: ClassifierGeo,
  part: Extract<EnhancedBodyPart, { kind: 'rows' }>,
): UrlTaggedPrimitive[] {
  const embeds = part.embeds ?? [];
  const primitives: UrlTaggedPrimitive[] = [];
  for (const embed of embeds) {
    if (embed.href === undefined) continue;
    const body = image(geo.x + BODY_ENHANCED_MARGIN_X, geo.y + embed.y, embed.width, embed.height, embed.href);
    primitives.push({ url: geo.url, body });
  }
  return primitives;
}

/** `Skeleton2#draw`'s per-entry draw: `drawHline` (a 2x2 bullet `<rect>` +
 *  an 8px `<line>`) THEN `drawVline` (a `<line>` up to the mother/sister
 *  entry). */
function renderTreeConnector(
  geo: ClassifierGeo,
  c: Extract<EnhancedBodyPart, { kind: 'tree' }>['connectors'][number],
  fill: Paint,
  k: number,
): string {
  // cdd-T29 R2: `bulletX`/`bulletY`/`hx1`/etc. are already-scaled geometry
  // (`class-scale-geo-body.ts#scaleTreeConnector`); the bullet's own `2,2`
  // size and the three `stroke-width:1` literals are NOT -- local
  // pixel-literal constants (`Skeleton2#draw`'s own fixed bullet/stroke),
  // scaled here like `sequence/scale-geo.ts`'s identical local-constant
  // precedent.
  return (
    rect(geo.x + c.bulletX, geo.y + c.bulletY, 2 * k, 2 * k, { fill, stroke: '#000000', strokeWidth: k }) +
    line(geo.x + c.hx1, geo.y + c.hy, geo.x + c.hx2, geo.y + c.hy, { stroke: '#000000', strokeWidth: k }) +
    line(geo.x + c.vx, geo.y + c.vy1, geo.x + c.vx, geo.y + c.vy2, { stroke: '#000000', strokeWidth: k })
  );
}

function renderTreePart(
  geo: ClassifierGeo,
  part: Extract<EnhancedBodyPart, { kind: 'tree' }>,
  theme: ScaledTheme,
  fill: Paint,
): string {
  let out = '';
  for (const row of part.rows) out += renderRow(geo, row, theme);
  for (const c of part.connectors) out += renderTreeConnector(geo, c, fill, theme.scaleK);
  return out;
}

/**
 * Builds one `UrlTaggedPrimitive` PER divider/tree part and PER ROW inside
 * a 'rows' part, IN ORDER (never Y-sorted — see this file's own module doc
 * comment) — was `renderEnhancedBody`, returning one joined string tagged
 * with a single url by the caller (CDD T23: see this module's own doc
 * comment for why that collapsed every member row's OWN `[[[url]]]`).
 * `classifierFill`/`classBorder` are threaded in by the caller
 * (`renderer-classifier-box.ts`, which already resolves both for the box
 * rect) rather than re-resolved here, avoiding a second style-cascade
 * lookup for the same classifier. A divider or tree part has no per-cell
 * url source (`EnhancedTreeCell` carries no `Member`), so each draws as
 * ONE primitive tagged the classifier's own fallback url, exactly as
 * before this iteration.
 *
 * CDD T18/D8: `fill` is a `Paint` (it reaches a `rect`, and
 * `DriverRectangleSvg#applyFillColor` emits a gradient def for one), while
 * `borderColor` stays a plain string -- it reaches only `line(...)`, and
 * `DriverLineSvg.java:76-82` flattens a gradient stroke to its first
 * colour. The caller passes `renderer-classifier-colors.ts#classBorderLine`
 * for exactly that reason; see its own doc comment.
 */
export function buildEnhancedBodyPrimitives(
  geo: ClassifierGeo,
  body: EnhancedBodyGeo,
  theme: ScaledTheme,
  fill: Paint,
  borderColor: string,
): UrlTaggedPrimitive[] {
  const primitives: UrlTaggedPrimitive[] = [];
  for (const part of body.parts) {
    if (part.kind === 'divider') {
      primitives.push({ url: geo.url, body: renderDividerPart(geo, part, theme, borderColor) });
    } else if (part.kind === 'rows') {
      primitives.push(...buildRowsPartPrimitives(geo, part, theme));
    } else {
      primitives.push({ url: geo.url, body: renderTreePart(geo, part, theme, fill) });
    }
  }
  return primitives;
}
