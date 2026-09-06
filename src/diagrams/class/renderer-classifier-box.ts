/**
 * renderer-classifier-box.ts — the generic name+members/rows classifier box
 * (every classifier kind not handled by `renderer.ts#tryRenderUSymbol`).
 * Split out of `renderer.ts` (G2 N16 -- that file is already over the
 * project's 500-line cap, "new code in new modules" per CLAUDE.md's own
 * engineering-constraints note) — mirrors the existing `renderer-
 * arrowhead.ts`/`renderer-group.ts`/`renderer-note.ts`/`renderer-url.ts`
 * split precedent for a renderer sub-concern; pure move for the
 * pre-existing pieces (`classifierFill`/`renderRow`/`renderBadge`/
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
import type { Theme } from '../../core/theme.js';
import { rect, line, path } from '../../core/svg.js';
import {} from '../../core/klimt/color/HColorSet.js';
import {} from '../../core/color-override.js';
import { MAP_CELL_MARGIN_X } from './class-map-sizing.js';
import { hasBadge } from './class-badge.js';
import { renderBadge, renderGenericTag } from './renderer-classifier-badge-tag.js';
import { renderVisibilityIcon, renderVisibilityUrlBackground, visibilityIconOriginY } from './class-visibility-icon.js';
import { wrapClassifierBody, type UrlTaggedPrimitive } from './renderer-url.js';
import {} from '../../core/svg.js';
import {} from '../../core/klimt/shape/UText.js';
import type {} from './class-member-creole.js';
import { resolveClassTagCascadeEntry } from '../../core/style-cascade-class.js';
import {} from './renderer-openiconic.js';
import { renderEnhancedBody } from './renderer-body-enhanced.js';
import { classShadowFilterUrl } from './class-shadow.js';
import {
  resolveElementHeaderBackground,
  classifierFill,
  classBorder,
  classBorderStrokeWidth,
  MAP_JSON_DIVIDER_STROKE_WIDTH,
} from './renderer-classifier-colors.js';
import { renderRow, renderRowText, attributeFontSize } from './renderer-classifier-rows.js';
export { renderRow };

// ---------------------------------------------------------------------------
// Classifier kind → fill color
// ---------------------------------------------------------------------------

/**
 * Map-only: the column-B vertical divider per non-linked data row
 * (`TextBlockMap#drawU`'s per-row `ULine.vline`, drawn immediately after
 * that row's key+value text). Returns Y-tagged entries (NOT a joined
 * string, G3/O3) so `buildBodyPrimitives` can merge them into its own
 * stable Y-sort at the CORRECT interleaved position -- jar draws
 * `[hline, key, value, vline]` per row, never batching every vline after
 * every row (this port's pre-O3 bug: the old string-returning form was
 * appended as one extra primitive at the very end of `renderClassifierBox`,
 * after every row's own text). Each entry's sort `y` is deliberately the
 * row's OWN text baseline -- identical to the value text primitive's own
 * `y` -- so the stable sort preserves jar's `[key, value, vline]` relative
 * order for that row without needing a secondary sort key (both were
 * pushed into `buildBodyPrimitives`' array via the SAME `memberRows` loop
 * iteration order, key then value, before this function's own entries are
 * appended).
 *
 * Row/column geometry is reconstructed from rows[]/dividerYs alone (no
 * ClassifierGeo schema change — see class-map-sizing.ts#buildMapRowGeo for
 * why): every data row contributes exactly two rows[] entries (key, value)
 * after the header entries (those with y below dividerYs[0]); a linked
 * row's value entry has empty text and is skipped (upstream never draws
 * that cell either).
 *
 * NOT used for `json` — a json entries area can nest arbitrarily deep, so it
 * does not fit the "exactly two rows[] entries per data row" invariant this
 * relies on; see class-json-sizing.ts's file doc for the documented
 * rendering simplification (row/column TEXT is exact at every depth, only
 * the vertical divider lines are omitted).
 */
function mapColumnDividerEntries(geo: ClassifierGeo, theme: Theme): Array<{ y: number; item: UrlTaggedPrimitive }> {
  if (geo.kind !== 'map' || geo.dividerYs.length === 0) return [];
  const dataRows = geo.rows.filter((r) => r.y >= geo.dividerYs[0]!);
  const entries: Array<{ y: number; item: UrlTaggedPrimitive }> = [];
  for (let i = 0; i < geo.dividerYs.length; i++) {
    const value = dataRows[2 * i + 1];
    if (value === undefined || value.text === '') continue; // linked/point row
    const top = geo.dividerYs[i]!;
    const bottom = geo.dividerYs[i + 1] ?? geo.height;
    const dividerX = geo.x + value.indent - MAP_CELL_MARGIN_X;
    entries.push({
      y: value.y,
      item: {
        url: geo.url,
        body: line(dividerX, geo.y + top, dividerX, geo.y + bottom, {
          stroke: classBorder(geo, theme),
          strokeWidth: MAP_JSON_DIVIDER_STROKE_WIDTH,
        }),
      },
    });
  }
  return entries;
}

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
function headerBackgroundPath(geo: ClassifierGeo, theme: Theme, roundCorner: number, fill: string): string {
  const headerHeight = geo.dividerYs[0];
  if (headerHeight === undefined) return '';
  const r = roundCorner / 2;
  const x0 = geo.x;
  const y0 = geo.y;
  const x1 = geo.x + geo.width;
  const y1 = geo.y + headerHeight;
  const d = roundedTopRectD(x0, y0, x1, y1, r);
  return path(d, { fill, stroke: classBorder(geo, theme), strokeWidth: classBorderStrokeWidth(geo, theme) });
}

function buildHeaderPrimitive(geo: ClassifierGeo, theme: Theme): UrlTaggedPrimitive {
  // G2 N37: `RoundCorner` -- tag cascade wins over the ancestor cascade,
  // which wins over the pre-existing hardcoded jar-default 5 (`rx`/`ry` =
  // roundCorner / 2, `URectangle.ts#build().rounded()`'s halving
  // convention) -- see `theme.ts#classCascadeRoundCorner`'s own doc
  // comment. Zero behavior change for every classifier with no `<style>`
  // RoundCorner declaration.
  const roundCorner =
    resolveClassTagCascadeEntry(theme, geo.stereotypeLabels, geo.styleGeneration)?.roundCorner ??
    theme.colors.graph.classCascadeRoundCorner ??
    5;
  let body = rect(geo.x, geo.y, geo.width, geo.height, {
    fill: classifierFill(geo, theme),
    stroke: classBorder(geo, theme),
    strokeWidth: classBorderStrokeWidth(geo, theme),
    rx: roundCorner / 2,
    ry: roundCorner / 2,
    // mission skin-file-loading (deferred D3 item): `geo.shadowing`'s own
    // doc comment -- the outer bordered rect is the ONE shape jar's
    // `EntityImageClass`/`Object`/`Map`/`Json` all draw the shadow on
    // (`rect.setDeltaShadow(shadow)`), matching state's identical
    // `renderer-box.ts` precedent.
    ...(geo.shadowing !== undefined && geo.shadowing > 0 ? { filter: classShadowFilterUrl() } : {}),
  });
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
  // G2 N58 item 40: `skinparam style strictuml` unconditionally suppresses
  // the circled-character badge (`CucaDiagram#showPortion`'s own doc comment
  // on the measurement side, class-layout-helpers.ts#measureGenericClassifier).
  if (geo.hideCircle !== true && hasBadge(geo.kind) && theme.strictUml !== true) body += renderBadge(geo, theme);
  const headerRowCount = geo.headerRowCount ?? 1;
  // G2 N64 item 45: `nameRowCount` (new field, default 1) generalizes the
  // pre-existing "exactly one trailing name row" assumption to N trailing
  // NAME-LINE rows (a multi-line `\n`/`\l`/`\r`-split display name) --
  // only rows BEFORE `firstNameRowIndex` are genuine `<<stereotype>>` label
  // rows (`isStereoLabelRow`); every name-line row (including line 2+)
  // gets the SAME treatment line 1 always had. Reduces to the OLD
  // `nameRowIndex = headerRowCount - 1` single-row check exactly when
  // `nameRowCount` is absent (default 1).
  const firstNameRowIndex = headerRowCount - (geo.nameRowCount ?? 1);
  geo.rows.slice(0, headerRowCount).forEach((row, i) => {
    if (row.text !== '') body += renderRowText(geo, row, theme, true, i < firstNameRowIndex);
  });
  if (geo.genericTag !== undefined) body += renderGenericTag(geo, geo.genericTag, theme);
  return { url: geo.url, body };
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
  theme: Theme,
): UrlTaggedPrimitive[] {
  const stroke = { stroke: classBorder(geo, theme), strokeWidth: MAP_JSON_DIVIDER_STROKE_WIDTH };
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

function buildBodyPrimitives(geo: ClassifierGeo, theme: Theme): UrlTaggedPrimitive[] {
  // G2 N42: an enhanced body (`--`/`==`/`..`/`__` block separator or a
  // `|_` tree-list line) draws its OWN part list, in EXACT jar draw order
  // (never the Y-sort merge below -- `renderer-body-enhanced.ts`'s own
  // module doc comment for why the two orderings genuinely differ).
  if (geo.enhancedBody !== undefined) {
    return [
      {
        url: geo.url,
        body: renderEnhancedBody(geo, geo.enhancedBody, theme, classifierFill(geo, theme), classBorder(geo, theme)),
      },
    ];
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
    item: {
      url: geo.url,
      body: isMapOrJsonDivider
        ? line(geo.x, geo.y + divY, geo.x + geo.width, geo.y + divY, {
            stroke: classBorder(geo, theme),
            strokeWidth: MAP_JSON_DIVIDER_STROKE_WIDTH,
          })
        : line(geo.x + 1, geo.y + divY, geo.x + geo.width - 1, geo.y + divY, {
            stroke: classBorder(geo, theme),
            strokeWidth: classBorderStrokeWidth(geo, theme),
          }),
    },
  }));
  // A map's linked-row value entry carries empty text (see
  // mapColumnDividerEntries doc) — upstream never draws that cell.
  for (const row of memberRows) {
    if (row.text === '') continue;
    const effectiveUrl = row.url ?? geo.url;
    if (row.visibilityIcon === undefined) {
      interleaved.push({ y: row.y, item: { url: effectiveUrl, body: renderRow(geo, row, theme) } });
      continue;
    }
    // G2 N21: an icon-bearing row draws as TWO primitives (icon, text), not
    // one -- the icon's OWN `<g data-visibility-modifier>` wrapper forces a
    // link-flush boundary in `SvgGraphics`, so it needs its own independent
    // `<a>` run (`class-visibility-icon.ts#renderVisibilityIcon` builds that
    // run internally, `preWrapped` tells `wrapClassifierBody` not to wrap it
    // again) while the row's text remains free to merge with the divider
    // that follows, exactly like a non-icon row.
    // G2 N40: when the ROW'S OWN url is set (not just the classifier
    // fallback -- `row.url`, matching `Member#getUrl()`), jar draws a THIRD
    // primitive first: an icon-column background rect, its own independent
    // `<a>` run, positioned at the SAME icon origin
    // (`class-visibility-icon.ts#renderVisibilityUrlBackground`'s own doc
    // comment -- `dasagu-52-vani172`/`fijali-69-pina030`).
    const iconOriginX = geo.x + ROW_TEXT_LEFT_MARGIN;
    const iconOriginY = visibilityIconOriginY(geo.y + row.y, attributeFontSize(theme), theme);
    if (row.url !== undefined) {
      interleaved.push({
        y: row.y,
        item: {
          url: effectiveUrl,
          preWrapped: true,
          body: renderVisibilityUrlBackground(iconOriginX, iconOriginY, classifierFill(geo, theme), row.url),
        },
      });
    }
    interleaved.push({
      y: row.y,
      item: {
        url: effectiveUrl,
        preWrapped: true,
        body: renderVisibilityIcon(
          row.visibilityIcon,
          row.visibilityIsField === true,
          iconOriginX,
          iconOriginY,
          effectiveUrl,
          theme,
        ),
      },
    });
    interleaved.push({ y: row.y, item: { url: effectiveUrl, body: renderRowText(geo, row, theme) } });
  }
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
export function renderClassifierBox(geo: ClassifierGeo, theme: Theme): string {
  // G3/O3: map's own vertical column dividers now interleave INSIDE
  // buildBodyPrimitives' own Y-sort (mapColumnDividerEntries), not appended
  // here as one extra batched-at-the-end primitive (pre-O3 bug).
  const primitives: UrlTaggedPrimitive[] = [buildHeaderPrimitive(geo, theme), ...buildBodyPrimitives(geo, theme)];
  return wrapClassifierBody(geo, primitives);
}
