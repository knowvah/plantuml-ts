/**
 * renderer-classifier-box.ts — the generic name+members/rows classifier box
 * (every classifier kind not handled by `renderer.ts#tryRenderUSymbol`).
 * Split out of `renderer.ts` (G2 N16 -- that file is already over the
 * project's 500-line cap, "new code in new modules" per CLAUDE.md's own
 * engineering-constraints note) — mirrors the existing `renderer-
 * arrowhead.ts`/`renderer-group.ts`/`renderer-note.ts`/`renderer-url.ts`
 * split precedent; pure move for the pre-existing pieces (`classifierFill`/`renderRow`/`renderBadge`/
 * `mapColumnDividerEntries`), no behavior change (this note describes
 * the original G2 split -- see `MAP_JSON_DIVIDER_STROKE_WIDTH`'s own doc
 * comment for the G3/O3 map/json divider fix, which DID change behavior).
 *
 * `renderBadge`/`renderGenericTag` were further split out to
 * `renderer-classifier-badge-tag.ts`, purely to keep this file under the
 * 500-line cap once more -- another pure move, re-exported/imported back
 * here unchanged.
 */
import { roundedTopRectD } from '../../core/svg-path-builder.js';
import type { ClassifierGeo, JsonBodyItem } from './layout.js';
import { ROW_TEXT_LEFT_MARGIN } from './layout.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { rect, line, path } from '../../core/svg.js';
import {} from '../../core/klimt/color/HColorSet.js';
import {} from '../../core/color-override.js';
import { mapColumnDividerEntries } from './renderer-classifier-map-dividers.js';
import { hasBadge } from './class-badge.js';
import { renderBadge, renderGenericTag, renderBadgeSpriteImage } from './renderer-classifier-badge-tag.js';
import { renderVisibilityIcon, renderVisibilityUrlBackground } from './class-visibility-icon.js';
import { wrapClassifierBody, type UrlTaggedPrimitive } from './renderer-url.js';
import {} from '../../core/svg.js';
import {} from '../../core/klimt/shape/UText.js';
import type {} from './class-member-creole.js';
import { resolveClassTagCascadeEntry } from '../../core/style-cascade-class.js';
import {} from './renderer-openiconic.js';
import { buildEnhancedBodyPrimitives } from './renderer-body-enhanced.js';
import { classShadowFilterUrl } from './class-shadow.js';
import {
  resolveElementHeaderBackground,
  classifierFill,
  classBorder,
  classBorderLine,
  classBorderStrokeWidth,
  classBorderStrokeDasharray,
  MAP_JSON_DIVIDER_STROKE_WIDTH,
} from './renderer-classifier-colors.js';
import { renderRow, renderRowText, wrappedVisibilityIconOriginY } from './renderer-classifier-rows.js';
// CDD T20 (E1): see that module's own doc comment (500-line-cap split).
import {
  CLASS_HEADER_SPLIT_KINDS,
  resolveClassHeaderFill,
  classHeaderSplitRects,
} from './renderer-classifier-header-split.js';
export { renderRow };

// ---------------------------------------------------------------------------
// Classifier kind → fill color
// ---------------------------------------------------------------------------

/**
 * Builds the header bundle (rect + badge + stacked stereotype row(s) +
 * header name, ALWAYS drawn together as one unit -- see
 * `renderClassifierBox`'s draw-order doc comment) as a single url-tagged
 * primitive. The header never carries its OWN url (only member rows can,
 * via `[[[url]]]`) -- its effective url is always the classifier's own
 * fallback (`geo.url`, possibly `undefined`).
 *
 * `geo.headerRowCount` (G2 N24, default 1) is the number of LEADING
 * `rows[]` entries that belong to this bundle -- normally just the name
 * row, but `1 + N` when the classifier has N stacked `<<stereotype>>`
 * lines (`class-stereotype.ts`'s own doc comment for the jar derivation).
 * Every header row draws via `renderRowText` (never `renderRow` -- a
 * header row can never carry a visibility icon).
 */
/**
 * G3/O4: `EntityImageObject`/`Map`/`Json#drawU`'s conditional header-
 * background split -- when the resolved header BackgroundColor differs
 * from the box's own body fill, a SEPARATE half-rounded rect is drawn on
 * TOP of the body rect, covering ONLY the title/header area (`URectangle
 * .halfRounded`, `EntityImageObject.java:199-203`). Reuses `URectangle
 * .ts#halfRounded`'s own already-ported arc math (verified byte-exact
 * against this SAME jar sample before writing this string-builder) rather
 * than re-deriving the geometry a second time -- see that method's own
 * doc comment for the ARC/LINE sequence this mirrors.
 *
 * `headerHeight` is `geo.dividerYs[0]` (the title block's own height, only
 * present when a divider is actually drawn -- `measureObjectClassifier`'s
 * own `dividerYs: showFields ? [title.height] : []`) -- gated on its
 * presence rather than re-deriving `title.height` independently; a
 * suppressed-fields object/map/json (no divider) is a real but UNSAMPLED
 * combination (no corpus fixture combines `hide fields` with a `.header`
 * BackgroundColor override) and is left undrawn rather than guessed.
 */
function headerBackgroundPath(geo: ClassifierGeo, theme: ScaledTheme, roundCorner: number, fill: string): string {
  const headerHeight = geo.dividerYs[0];
  if (headerHeight === undefined) return '';
  const r = roundCorner / 2;
  const x0 = geo.x;
  const y0 = geo.y;
  const x1 = geo.x + geo.width;
  const y1 = geo.y + headerHeight;
  const d = roundedTopRectD(x0, y0, x1, y1, r);
  const dasharray = classBorderStrokeDasharray(geo, theme.scaleK);
  return path(d, {
    fill,
    stroke: classBorder(geo, theme),
    strokeWidth: classBorderStrokeWidth(geo, theme),
    ...(dasharray !== undefined ? { strokeDasharray: dasharray } : {}),
  });
}

/**
 * CDD T20 (E1): the outer box's shape -- either the plain single rect
 * (the pre-T20, and still object/map/json/roundCorner==0, form) or the
 * class-family four-shape header split (`classHeaderSplitRects`'s own doc
 * comment), gated on {@link CLASS_HEADER_SPLIT_KINDS} and a resolved
 * header fill. `roundCorner == 0` is deliberately left on the plain-rect
 * path -- `EntityImageClass.java:198-206`'s sibling TWO-shape branch (no
 * `rect3`, header rect stroked with the BORDER colour not the header
 * colour) is a genuine, DIFFERENT shape this task's corpus reach does not
 * exercise (no sampled fixture combines a header split with `RoundCorner
 * 0`) -- left undrawn rather than guessed, same precedent `headerBackground
 * Path`'s own doc comment already established for a suppressed-fields
 * object/map/json.
 */
// mission skin-file-loading (deferred D3 item): `geo.shadowing`'s own doc
// comment -- the outer bordered rect is the ONE shape jar's
// `EntityImageClass`/`Object`/`Map`/`Json` all draw the shadow on
// (`rect.setDeltaShadow(shadow)`), matching state's identical
// `renderer-box.ts` precedent. Returns a plain variable (never a
// spread-ternary object literal -- `buildSectionRows`'s own doc comment
// names that construct as a lizard NLOC/CCN mis-parse trap) since `rect`'s
// `attrs()` already drops an `undefined` `filter` cleanly.
function boxShadowFilter(geo: ClassifierGeo): string | undefined {
  return geo.shadowing !== undefined && geo.shadowing > 0 ? classShadowFilterUrl() : undefined;
}

function buildBoxShape(geo: ClassifierGeo, theme: ScaledTheme, roundCorner: number): string {
  const bodyFill = classifierFill(geo, theme);
  const border = classBorder(geo, theme);
  const strokeWidth = classBorderStrokeWidth(geo, theme);
  const dasharray = classBorderStrokeDasharray(geo, theme.scaleK);
  const filter = boxShadowFilter(geo);
  const headerFill =
    roundCorner !== 0 && CLASS_HEADER_SPLIT_KINDS.has(geo.kind)
      ? resolveClassHeaderFill(geo, bodyFill, theme)
      : undefined;
  if (headerFill !== undefined) {
    return classHeaderSplitRects({ geo, roundCorner, bodyFill, border, strokeWidth, dasharray, headerFill, filter });
  }
  return rect(geo.x, geo.y, geo.width, geo.height, {
    fill: bodyFill,
    stroke: border,
    strokeWidth,
    rx: roundCorner / 2,
    ry: roundCorner / 2,
    ...(dasharray !== undefined ? { strokeDasharray: dasharray } : {}),
    ...(filter !== undefined ? { filter } : {}),
  });
}

function buildHeaderPrimitive(geo: ClassifierGeo, theme: ScaledTheme): UrlTaggedPrimitive {
  // #lizard forgives(nloc,cyclomatic_complexity) -- pre-existing lizard
  // span mis-detection (confirmed against the pre-T20 HEAD revision of
  // this SAME file: lizard already mis-bounds this function there too,
  // `buildHeaderPrimitive@153-176` instead of its real 153-207 -- the
  // brace-counter bleeds past this function's own closing `}` into later
  // code, `skinparam-style-block.ts#normalizeStyleInput`'s own identical
  // precedent). CDD T20 changed exactly ONE line inside this function's
  // real body (`rect(...)` -> `buildBoxShape(...)`), which REMOVES
  // branches (moved to that new function), not adds them.
  // G2 N37: `RoundCorner` -- tag cascade wins over the ancestor cascade,
  // which wins over the pre-existing hardcoded jar-default 5 (`rx`/`ry` =
  // roundCorner / 2, `URectangle.ts#build().rounded()`'s halving
  // convention) -- see `theme.ts#classCascadeRoundCorner`'s own doc
  // comment. Zero behavior change for every classifier with no `<style>`
  // RoundCorner declaration.
  // cdd-T29 R2: `rx`/`ry` scale like any coordinate (`SvgGraphics.java:
  // 466-472`) -- scaled ONCE here so downstream readers need no changes.
  const roundCorner =
    (resolveClassTagCascadeEntry(theme, geo.stereotypeLabels, geo.styleGeneration)?.roundCorner ??
      theme.colors.graph.classCascadeRoundCorner ??
      5) * theme.scaleK;
  let body = buildBoxShape(geo, theme, roundCorner);
  // G3/O4: `<style> <sname> { header { BackgroundColor } } }` -- object/
  // map/json only (`headerBackgroundPath`'s own doc comment); drawn ONLY
  // when it genuinely differs from the body's own fill (jar's own
  // `backcolor.equals(headerBackcolor) == false` gate).
  if (geo.kind === 'object' || geo.kind === 'map' || geo.kind === 'json') {
    const headerBg = resolveElementHeaderBackground(theme, geo.kind);
    const bodyBg = classifierFill(geo, theme);
    if (headerBg !== undefined && headerBg !== bodyBg) {
      body += headerBackgroundPath(geo, theme, roundCorner, headerBg);
    }
  }
  // G2 N58 item 40: `strictuml` suppresses the badge. CDD B7FU-R2 (c-b): a resolved sprite badge wins over the default one.
  if (geo.hideCircle !== true && hasBadge(geo.kind) && theme.strictUml !== true) {
    body +=
      geo.badgeSpriteImage !== undefined
        ? renderBadgeSpriteImage(geo, geo.badgeSpriteImage, theme.scaleK)
        : renderBadge(geo, theme);
  }
  const headerRowCount = geo.headerRowCount ?? 1;
  // G2 N64 item 45: `nameRowCount` (new field, default 1) generalizes the
  // pre-existing "exactly one trailing name row" assumption to N trailing
  // NAME-LINE rows (a multi-line `\n`/`\l`/`\r`-split display name) --
  // only rows BEFORE `firstNameRowIndex` are genuine `<<stereotype>>` label
  // rows (`isStereoLabelRow`); every name-line row (including line 2+)
  // gets the SAME treatment line 1 always had. Reduces to the OLD
  // `nameRowIndex = headerRowCount - 1` single-row check exactly when
  // `nameRowCount` is absent (default 1). CDD B7FU-R2 (c): a pure-sprite
  // row's text fallback is '' -- `row.atoms` (when set) is still drawable.
  const firstNameRowIndex = headerRowCount - (geo.nameRowCount ?? 1);
  geo.rows.slice(0, headerRowCount).forEach((row, i) => {
    if (row.text !== '' || row.atoms !== undefined) body += renderRowText(geo, row, theme, true, i < firstNameRowIndex);
  });
  if (geo.genericTag !== undefined) body += renderGenericTag(geo, geo.genericTag, theme);
  return { url: geo.url, body };
}

/**
 * One section-divider `<line>` -- split out of {@link buildBodyPrimitives}
 * purely to keep that function under the project's NLOC cap (pure
 * extraction, no behavior change). G3/O3: map/json use a DIFFERENT
 * drawing convention (full box width, fixed stroke-width 1, never
 * `classBorderStrokeWidth`/`classBorderStrokeDasharray` -- {@link
 * MAP_JSON_DIVIDER_STROKE_WIDTH}'s own doc comment: `TextBlockMap`/
 * `TextBlockCucaJSon` bypass the classifier's own border-stroke UGraphic
 * context entirely, so a `line.dashed`/`.bold` override never reaches
 * them either). CDD T20 (M1): class/interface/enum's OWN dividers DO draw
 * through that context, so they inherit it -- jar-verified `sosono-24-
 * vuro518`'s divider lines.
 */
function dividerLine(geo: ClassifierGeo, theme: ScaledTheme, divY: number, isMapOrJsonDivider: boolean): string {
  if (isMapOrJsonDivider) {
    return line(geo.x, geo.y + divY, geo.x + geo.width, geo.y + divY, {
      stroke: classBorderLine(geo, theme),
      strokeWidth: MAP_JSON_DIVIDER_STROKE_WIDTH * theme.scaleK,
    });
  }
  const dasharray = classBorderStrokeDasharray(geo, theme.scaleK);
  // cdd-T29 R2: the 1px inset is a render-time pixel-literal constant, not
  // geo-sourced -- scaled here like every other local literal this round's
  // audit found (D4/journal row 175).
  return line(geo.x + theme.scaleK, geo.y + divY, geo.x + geo.width - theme.scaleK, geo.y + divY, {
    stroke: classBorderLine(geo, theme),
    strokeWidth: classBorderStrokeWidth(geo, theme),
    ...(dasharray !== undefined ? { strokeDasharray: dasharray } : {}),
  });
}

/**
 * CDD T20 (A5/M6): `visibilityIconOriginY`'s `rowHeight` param is a single
 * physical LINE's own font metric (ascent/descent), never the multi-line
 * block total -- see that function's own doc comment. A WRAPPED member's
 * icon must still centre on the WHOLE block (`klimt/geom/PlacementStrategy
 * Visibility.java:56-62`'s real `height2` term), so only the BASELINE
 * input shifts, by half the block's excess height over one line --
 * algebraically equivalent to that Java formula (derivation: `.agent-
 * notes/cdd-T20.md`), without touching `class-visibility-icon.ts`'s locked
 * internals. Zero change for every non-wrapped row (`visibilityBlockHeight`
 * absent).
 */
// CDD T6FU: the formula moved to `renderer-classifier-rows.ts
// #wrappedVisibilityIconOriginY` so `renderRow` (the OTHER icon draw path,
// reached from `renderer.ts:108` and `renderer-body-enhanced.ts:90,116`)
// applies the SAME centring rather than a second copy of it. This module
// imports `renderRow` from there already, so the dependency direction is
// unchanged.
const wrappedIconOriginY = wrappedVisibilityIconOriginY;

/**
 * An icon-bearing row's 2-or-3 primitives (icon-column url background,
 * icon, text) -- split out of {@link buildBodyPrimitives}'s loop purely to
 * keep that function under the project's NLOC cap (pure extraction, no
 * behavior change). See that function's own G2 N21/N40 doc comments for
 * the upstream mechanism each primitive mirrors.
 */
/** One `{ y, item: { url, preWrapped: true, body } }` entry -- split out of
 *  {@link pushIconRowPrimitives} purely to shrink that function's own NLOC
 *  below this project's cap (pure extraction, no behavior change). */
function iconEntry(y: number, url: UrlTaggedPrimitive['url'], body: string): { y: number; item: UrlTaggedPrimitive } {
  return { y, item: { url, preWrapped: true, body } };
}

/** CDD T23: exported so `renderer-body-enhanced.ts#buildRowsPartPrimitives`
 *  can reuse this SAME icon-row primitive split for an enhanced-body row --
 *  no logic change, visibility only (see that module's own doc comment for
 *  why the enhanced-body path needs the identical `<g data-visibility-
 *  modifier>`-boundary handling the classic path already has). */
export function pushIconRowPrimitives(
  interleaved: Array<{ y: number; item: UrlTaggedPrimitive }>,
  geo: ClassifierGeo,
  theme: ScaledTheme,
  row: ClassifierGeo['rows'][number],
  effectiveUrl: UrlTaggedPrimitive['url'],
): void {
  const icon = row.visibilityIcon;
  if (icon === undefined) return;
  const iconOriginX = geo.x + ROW_TEXT_LEFT_MARGIN;
  const iconOriginY = wrappedIconOriginY(geo, row, theme);
  if (row.url !== undefined) {
    const bg = renderVisibilityUrlBackground(iconOriginX, iconOriginY, classifierFill(geo, theme), row.url, theme.scaleK);
    interleaved.push(iconEntry(row.y, effectiveUrl, bg));
  }
  const isField = row.visibilityIsField === true;
  const shape = renderVisibilityIcon(icon, isField, iconOriginX, iconOriginY, effectiveUrl, theme);
  interleaved.push(iconEntry(row.y, effectiveUrl, shape));
  interleaved.push({ y: row.y, item: { url: effectiveUrl, body: renderRowText(geo, row, theme) } });
}

/**
 * Builds the divider/member-row primitives in jar's real interleaved
 * top-to-bottom draw order (see `renderClassifierBox`'s own doc comment for
 * why a plain Y-sort reproduces it). Each divider's effective url is always
 * the classifier's own fallback (dividers never have an "own" url); each
 * member row's effective url is its OWN `[[[url]]]` when set, else the
 * SAME classifier fallback (G2 N16, generalizing N15's whole-box-only rule
 * -- `renderer-url.ts`'s own module doc comment).
 */
/**
 * M3(c): draw a `json` leaf's entries area in `TextBlockCucaJSon#drawU`'s
 * OWN order — one primitive per {@link JsonBodyItem}, no Y-sort. Both line
 * kinds use the map/json divider convention
 * ({@link MAP_JSON_DIVIDER_STROKE_WIDTH}): full span, fixed stroke-width 1,
 * never `classBorderStrokeWidth` (`TextBlockCucaJSon` draws on a UGraphic
 * that never picked up the classifier's own border stroke).
 */
function buildJsonBodyPrimitives(
  geo: ClassifierGeo,
  body: readonly JsonBodyItem[],
  theme: ScaledTheme,
): UrlTaggedPrimitive[] {
  const stroke = { stroke: classBorderLine(geo, theme), strokeWidth: MAP_JSON_DIVIDER_STROKE_WIDTH * theme.scaleK };
  return body.map((item) => {
    if (item.kind === 'hline')
      return {
        url: geo.url,
        body: line(geo.x + item.x, geo.y + item.y, geo.x + item.x + item.width, geo.y + item.y, stroke),
      };
    if (item.kind === 'vline')
      return {
        url: geo.url,
        body: line(geo.x + item.x, geo.y + item.y, geo.x + item.x, geo.y + item.y + item.height, stroke),
      };
    return { url: item.row.url ?? geo.url, body: renderRowText(geo, item.row, theme) };
  });
}

/**
 * One compartment's member rows (excluding the empty-text map linked-value
 * cell, `mapColumnDividerEntries`'s own doc comment) -- split out of
 * {@link buildBodyPrimitives} purely to keep that function under the
 * project's CCN cap (pure extraction, no behavior change).
 */
function pushMemberRowPrimitives(
  interleaved: Array<{ y: number; item: UrlTaggedPrimitive }>,
  geo: ClassifierGeo,
  theme: ScaledTheme,
  memberRows: ClassifierGeo['rows'],
): void {
  for (const row of memberRows) {
    if (row.text === '') continue;
    const effectiveUrl = row.url ?? geo.url;
    if (row.visibilityIcon === undefined) {
      interleaved.push({ y: row.y, item: { url: effectiveUrl, body: renderRow(geo, row, theme) } });
      continue;
    }
    // G2 N21/N40: an icon-bearing row draws as 2-or-3 primitives (icon,
    // text, +url background) -- see {@link pushIconRowPrimitives}'s own
    // doc comment for the upstream mechanism.
    pushIconRowPrimitives(interleaved, geo, theme, row, effectiveUrl);
  }
}

function buildBodyPrimitives(geo: ClassifierGeo, theme: ScaledTheme): UrlTaggedPrimitive[] {
  // G2 N42: an enhanced body (`--`/`==`/`..`/`__` block separator or a
  // `|_` tree-list line) draws its OWN part list, in EXACT jar draw order
  // (never the Y-sort merge below -- `renderer-body-enhanced.ts`'s own
  // module doc comment for why the two orderings genuinely differ).
  // CDD T23: `buildEnhancedBodyPrimitives` now returns one primitive PER
  // divider/tree part and PER ROW (each already tagged with its own
  // effective url, `row.url ?? geo.url`) instead of one primitive
  // collapsing the WHOLE body under `geo.url` -- see that function's own
  // doc comment. `wrapClassifierBody` (below, via `renderClassifierBox`)
  // merges/breaks runs exactly as it already does for the classic path;
  // no change needed there.
  if (geo.enhancedBody !== undefined) {
    return buildEnhancedBodyPrimitives(
      geo,
      geo.enhancedBody,
      theme,
      classifierFill(geo, theme),
      classBorderLine(geo, theme),
    );
  }
  // M3(c): a `json` leaf's entries area owns its own draw order
  // (`TextBlockCucaJSon#drawU` is a pre-order traversal, not a Y-order) --
  // same "return the part list verbatim" dispatch as `enhancedBody` above.
  if (geo.jsonBody !== undefined) return buildJsonBodyPrimitives(geo, geo.jsonBody, theme);
  const memberRows = geo.rows.slice(geo.headerRowCount ?? 1);
  // G3/O3: `map`/`json` horizontal row dividers use a DIFFERENT drawing
  // convention from class/interface/enum's own body dividers -- full box
  // width (no 1px inset) and a fixed stroke-width of 1 (never
  // `classBorderStrokeWidth`) -- see `MAP_JSON_DIVIDER_STROKE_WIDTH`'s own
  // doc comment for the upstream mechanism (`TextBlockMap`/
  // `TextBlockCucaJSon` bypass the classifier's own border-stroke UGraphic
  // context entirely).
  const isMapOrJsonDivider = geo.kind === 'map' || geo.kind === 'json';
  const interleaved: Array<{ y: number; item: UrlTaggedPrimitive }> = geo.dividerYs.map((divY) => ({
    y: divY,
    item: { url: geo.url, body: dividerLine(geo, theme, divY, isMapOrJsonDivider) },
  }));
  pushMemberRowPrimitives(interleaved, geo, theme, memberRows);
  // G3/O3: map's own vertical column dividers, merged into the SAME
  // stable Y-sort (see mapColumnDividerEntries' own doc comment for why
  // this reproduces jar's real per-row interleaved draw order).
  interleaved.push(...mapColumnDividerEntries(geo, theme));
  interleaved.sort((a, b) => a.y - b.y);
  return interleaved.map((entry) => entry.item);
}

/** The plain name+members/rows box (every classifier kind not handled by
 *  `renderer.ts#tryRenderUSymbol`).
 *
 * Draw order matters (positional comparator): jar draws rect, THEN the
 * badge (if any), THEN the header name, THEN EVERY divider/member-row
 * INTERLEAVED in top-to-bottom visual (Y) order -- NOT all dividers as
 * one batch followed by all rows (`EntityImageClass#drawInternal` draws
 * the rect+badge via `header.drawU`, then `body.drawU` draws the fields
 * divider, fields rows, methods divider, methods rows IN THAT SEQUENCE;
 * G2 N4, jar-verified: a single-field/no-methods classifier draws
 * divider(32), row("Bar", local y 46.89), divider(54) -- the SECOND
 * divider comes AFTER the field row, not immediately after the first
 * divider -- `jobuco-44-zife032`). A plain ascending sort by each
 * element's own local Y position reproduces this generically: every
 * divider's Y is its section's TOP, every row's Y is its OWN baseline
 * (always inside its own section's [top, next-divider) range), so
 * sorting the merged (divider, row) sequence by Y alone yields the exact
 * interleaved order jar draws, without this port needing to track a
 * separate fields/methods row-count split on `ClassifierGeo`.
 *
 * G2 N16 (generalizing N15's README item #7 whole-box wrap): the header
 * bundle, every divider, and every member row are each tagged with their
 * OWN effective url and merged into `<a>` runs by `renderer-url.ts
 * #wrapClassifierBody` -- see that module's own doc comment for the full
 * mechanism.
 */
export function renderClassifierBox(geo: ClassifierGeo, theme: ScaledTheme): string {
  // G3/O3: map's own vertical column dividers now interleave INSIDE
  // buildBodyPrimitives' own Y-sort (mapColumnDividerEntries), not appended
  // here as one extra batched-at-the-end primitive (pre-O3 bug).
  const primitives: UrlTaggedPrimitive[] = [buildHeaderPrimitive(geo, theme), ...buildBodyPrimitives(geo, theme)];
  return wrapClassifierBody(geo, primitives);
}
