/**
 * Class-diagram edge SVG rendering (path data, link-id escaping,
 * renderEdge). Split out of `renderer.ts` (line cap); independent of the
 * entity renderers. renderEdge/linkIdForSvg/uniqLinkId consumed by renderClass.
 */

import { splinePathD } from '../../core/svg-path-builder.js';
import type { EdgeGeo } from './layout.js';
import {} from './renderer-note.js';
import type {} from './note-layout.js';
import type { Theme } from '../../core/theme.js';
import type {} from '../../core/dispatcher.js';
import { text, path, attrs } from '../../core/svg.js';
import { formatDecimal, DEFAULT_SVG_DECIMALS } from '../../core/svg-format.js';
import {} from '../../core/usymbol-shapes.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import {} from './class-monochrome.js';
import { buildEdgeArrowheads, decorName, applyDecorTrim } from './renderer-arrowhead.js';
import { looksLikeRevertedForSvg, looksLikeNoDecorAtAllSvg } from '../../core/svek/extremity/link-decor.js';
import {} from './renderer-uid.js';
import { leafPortion } from './renderer-group.js';
import {} from './class-lollipop.js';
import {} from './renderer-classifier-box.js';
import {} from './class-namespace-shape.js';
import { CARDINALITY_FONT_SIZE } from './class-layout-helpers.js';
import {} from './class-shadow.js';

/**
 * G2 N5: `EdgeGeo.points` is a well-formed `1 + 3*n` cubic-bezier spline
 * for every real dot-layout-driven edge (N2 ledger, verified against all
 * 718 corpus fixtures) — jar's own `DotPath` draws it as a genuine SVG
 * cubic bezier chain (`M x,y C x1,y1 x2,y2 x,y [C x1,y1 x2,y2 x,y ...]`,
 * repeating the `C` command once per 3-point group; jar-verified against
 * `ririlu-13-zipi740`/`befasi-62-vimu310`'s own multi-segment edges), NOT
 * a polyline through the control points. Falls back to straight `L`
 * segments for any point list that ISN'T `1 + 3*n` (`points.length < 4`
 * or `(points.length - 1) % 3 !== 0`) — the degenerate/hand-built 2-point
 * secant case `renderer-arrowhead.ts#segmentAngle`'s own doc comment
 * describes, which carries no bezier control-point data to draw a curve
 * from.
 */
function buildPathData(points: EdgeGeo['points']): string {
  return splinePathD(points);
}

/**
 * G2 N1 (mechanism 2 part C): arrowheads are drawn as inline
 * polygons/paths (`renderer-arrowhead.ts#buildEdgeArrowheads`), matching
 * jar's class-diagram corpus (zero `<marker>`/`markerEnd` anywhere,
 * `plans/g2-class-svg/ledger.md` N0) -- the old `targetMarker`/
 * `sourceMarker` (`url(#...)` SVG-`<marker>`-reference) functions are
 * removed, not just unused, since `svgRoot`'s automatic `ALL_ARROW_TYPES`
 * marker-def injection no longer runs for class at all (`renderClass`
 * bypasses `svgRoot` entirely via `classShell` -- `assembleClassShell`
 * emits an empty `<defs/>`, matching jar).
 *
 * Returns `extraDefs` alongside `body` so `renderClass` can thread any
 * non-empty extremity `<defs>` payload (gradients -- see
 * `buildEdgeArrowheads`'s own doc comment) into the fragment's overall
 * `extraDefs`, the same role `svgRoot`'s `extraDefs` param used to serve.
 */
/**
 * Upstream: `Link#idCommentForSvg()` (Link.java:106-114), the `<path
 * id="...">` attribute -- a three-way branch on whether the arrowhead
 * sits at `idEntity1`'s end, `idEntity2`'s end, both, or neither. Reads
 * `EdgeGeo.idEntity1`/`.idEntity2`/`.idEntity1Decor`/`.idEntity2Decor`
 * (Java's cl1/cl2 + LinkType.decor2/decor1 -- see `ast.ts
 * #Relationship.idEntity1`'s doc comment for why these are DISTINCT from
 * `.from`/`.to`/`.sourceDecor`/`.targetDecor`, which are swapped for DOT
 * layout direction instead of `Link#getInv()`'s `-left-`/`-up-` swap).
 * Falls back to `.from`/`.to` + `.sourceDecor`/`.targetDecor` for
 * relationships built outside the arrow-token grammar (no `idEntity1`/
 * `idEntity2` -- couples/lollipop/map rows; documented best-effort, out
 * of this iteration's arrow-matrix scope). `ids` de-dupes a diagram-wide
 * collision exactly like `core/svek/SvekEdge.ts#uniq` (Link.java's own
 * `SvekEdge#uniq`, duplicated per this codebase's small-helper-per-call-
 * site convention -- see `renderer-group.ts`'s own `escAttr` precedent).
 */
// XML-attribute-value escaping for `linkIdForSvg` -- a local duplicate of
// `core/svg.ts`'s own (module-private) `escapeXml`/`renderer-group.ts`'s
// `escAttr`, per this codebase's established one-small-helper-per-call-site
// convention. `path()`'s own `attrs()` never escapes its values (every
// OTHER caller passes colors/keywords with no XML-significant chars), so a
// classifier name containing `<`/`>`/`&`/`"` (a C++ template type,
// nagega-30-poso418: `boost::function<ResultE(...)>`) needs escaping here,
// at the one call site that can carry arbitrary user text into an attribute.
// `>` deliberately NOT escaped -- jar-verified (nagega-30-poso418's own
// template-syntax id): Java's XML serializer escapes `&`/`<`/the attribute
// quote char but leaves a literal `>` in an attribute value untouched (only
// `&`/`<`/quote are STRICTLY required by the XML spec; `>` escaping is
// optional and this serializer skips it).
const ID_XML_UNSAFE_RE = new RegExp('[&<"]', 'g');
const ID_XML_REPLACEMENTS: Record<string, string> = { '&': '&amp;', '<': '&lt;', '"': '&quot;' };
function escapeIdAttr(value: string): string {
  return value.replace(ID_XML_UNSAFE_RE, (ch) => ID_XML_REPLACEMENTS[ch]!);
}

export function linkIdForSvg(geo: EdgeGeo, ids: Set<string>, syntheticNames: ReadonlyMap<string, string>): string {
  // G2 N9: `idEntity1`/`idEntity2` are ALREADY the nsSep-aware leaf name
  // (`class-relationship-parser.ts#idLeaf`, computed at parse time from the
  // diagram's ACTUAL `set namespaceSeparator` -- see that function's doc
  // comment for why a blind `.`-split is wrong here). The fallback
  // (`.from`/`.to`, used when no arrow-token endpoint exists -- couples/
  // lollipop/map rows) needs `syntheticNames` FIRST (G2 N19: the jar
  // `Entity.getName()` value for an assoc-circle/lollipop endpoint --
  // `"apointN"`/`"<existing>lolN"`, NOT the raw AST id `leafPortion` would
  // otherwise return), falling back further to `leafPortion` for every
  // other (real, user-declared) endpoint.
  const ent1 = escapeIdAttr(geo.idEntity1 ?? syntheticNames.get(geo.from) ?? leafPortion(geo.from));
  const ent2 = escapeIdAttr(geo.idEntity2 ?? syntheticNames.get(geo.to) ?? leafPortion(geo.to));
  const decorAtEnt1 = decorName(geo.idEntity1Decor ?? geo.sourceDecor);
  const decorAtEnt2 = decorName(geo.idEntity2Decor ?? geo.targetDecor);
  let base: string;
  if (looksLikeRevertedForSvg(decorAtEnt2, decorAtEnt1)) base = `${ent1}-backto-${ent2}`;
  else if (looksLikeNoDecorAtAllSvg(decorAtEnt2, decorAtEnt1)) base = `${ent1}-${ent2}`;
  else base = `${ent1}-to-${ent2}`;
  return uniqLinkId(ids, base);
  // #lizard forgives -- pre-existing (unrelated to T7b): three-way
  // idEntity1/idEntity2-vs-from/to fallback chain mirrors Link
  // #idCommentForSvg's own branching (module doc comment above).
}

/** Upstream: `SvekEdge#uniq` (SvekEdge.java:1093), verbatim -- same
 *  collision-suffix scheme `core/svek/SvekEdge.ts#uniq` already ports for
 *  description. */
export function uniqLinkId(ids: Set<string>, base: string): string {
  if (!ids.has(base)) {
    ids.add(base);
    return base;
  }
  let i = 1;
  for (;;) {
    const candidate = `${base}-${i}`;
    if (!ids.has(candidate)) {
      ids.add(candidate);
      return candidate;
    }
    i++;
  }
}


/**
 * B7/M8: the arrow style a link's own `<<tag>>` labels resolve to, or
 * `undefined` when the link carries none / none of them has an
 * arrow-relevant `<style>` declaration.
 *
 * `theme.colors.graph.arrowTagCascade` is precomputed per cleaned tag at
 * Theme-build time (`style-cascade-class.ts#arrowTagCascadeEntry`) because
 * the renderer has no `StyleMap` — only the resolved Theme. Where a link
 * carries several labels, the LAST matching one wins, mirroring
 * `StyleStorage#computeMergedStyle`'s own last-registered-wins merge rather
 * than inventing a specificity rule upstream does not have.
 */
function resolveArrowTagStyle(
  tags: readonly string[] | undefined,
  theme: Theme,
): { color?: string; thickness?: number } | undefined {
  const cascade = theme.colors.graph.arrowTagCascade;
  if (tags === undefined || cascade === undefined) return undefined;
  let found: { color?: string; thickness?: number } | undefined;
  for (const tag of tags) {
    const entry = cascade[tag];
    if (entry !== undefined) found = entry;
  }
  return found;
}

export function renderEdge(
  geo: EdgeGeo,
  theme: Theme,
  ids: Set<string>,
  syntheticNames: ReadonlyMap<string, string>,
): { body: string; extraDefs: string } {
  const parts: string[] = [];
  // G2 N28: arrowheads must be resolved BEFORE the path is built -- the
  // connecting `<path>` is shortened by each decor's own trim delta
  // (`renderer-arrowhead.ts#applyDecorTrim`), matching `SvekEdge#drawU`'s
  // own trim-then-draw order (`dotPath.moveStartPoint`/`.moveEndPoint`
  // BEFORE `lined.draw(this.dotPath)` -- `SvekEdge.ts:178-200,279`).
  // G2 N31: the extremity's own stroke color must match the connecting
  // path's -- `geo.colorOverride` (`-[#color]->`, N26) was only ever
  // applied to the `<path>` itself; resolve it ONCE here so both the path
  // AND `buildEdgeArrowheads` (below) draw the SAME color, matching
  // `SvekEdge.ts#drawU`'s single `this.input.color` field feeding both
  // `lined.draw(this.dotPath)` and `drawExtremity`.
  // G2 N36: `theme.colors.graph.classCascadeArrowColor` -- the `<style>
  // classDiagram { LineColor }`/`root { LineColor }`/nested `classDiagram
  // { arrow { LineColor } } }` ancestor cascade (`SvekEdge.java:819`'s
  // `{root,element,classDiagram,arrow}` style signature, jar-verified
  // `bikuka-40-pezi068`/`rakici-44-tivo701`) -- sits BELOW the per-edge
  // `-[#color]->` bracket override, ABOVE the cross-diagram-type
  // `theme.colors.arrow` default (never overwritten directly -- this Theme
  // shape is shared with description/other diagram types).
  // B7/M8: a link's own `<<tag>>` resolves against the ARROW signature with
  // the tag as its stereotype label (`SvekEdge.java:817-822` ->
  // `StyleSignatureBasic#withTOBECHANGED`'s per-label fan-out), and both the
  // colour and the thickness come off that ONE merged style
  // (`SvekEdge.java:874-876`). It sits BELOW an explicit `-[#color]->`
  // bracket override and ABOVE the diagram-wide arrow cascade -- the same
  // order the bracket/cascade/default chain below already uses. Last tag
  // wins, mirroring the merge's own last-registered-wins rule.
  const tagStyle = resolveArrowTagStyle(geo.stereotypeTags, theme);
  const strokeColor = geo.colorOverride !== undefined
    ? resolveColorToSvgHex(geo.colorOverride)
    : tagStyle?.color ?? theme.colors.graph.classCascadeArrowColor ?? theme.colors.arrow;
  const edgeStrokeWidth = geo.strokeWidth ?? tagStyle?.thickness ?? 1;
  const arrowheads = buildEdgeArrowheads(geo, strokeColor, theme.colors.background, edgeStrokeWidth);
  const trimmedPoints = applyDecorTrim(geo.points, arrowheads.tailTrim, arrowheads.headTrim);
  const d = buildPathData(trimmedPoints);
  if (d !== '') {
    parts.push(
      path(d, {
        // G2 N8: `strokeWidth: 1` (was `1.5`) and `strokeDasharray: '7,7'`
        // (was `'5 5'`) -- discovered while jar-verifying the `(A,B)` couple
        // fixture's own edges (bosiki-11-xaza958), then corpus-surveyed
        // (`test-results/dot-cache/class/*/in.svg`, every `<g class="link">`
        // edge's own inline `style`): 504/510 sampled edges carry
        // `stroke-width:1` (the handful of others are explicit
        // `[thickness=N]` skinparam overrides, out of scope here) and
        // 383/388 dashed edges carry `stroke-dasharray:7,7` exactly (comma,
        // no space -- `compareSvg`'s attribute comparator treats
        // `stroke-dasharray` as a plain string, not a numeric-tolerant
        // list, so the literal separator must match too). Neither value was
        // ever jar-verified before this iteration -- no ratchet-pinned
        // fixture exercises an edge at all (grepped `oracle/goldens/
        // svg-class/`).
        //
        // G2 N26: `geo.strokeWidth`/`.strokeDasharray`/`.colorOverride` --
        // set ONLY when the relationship carried a `-[...]->` bracket
        // override (`class-geo-builders.ts#buildStrokeOverride`); absent
        // for every other edge, so the `?? 1`/`geo.dashed` fallbacks below
        // reproduce this comment's own jar-verified defaults unchanged.
        stroke: strokeColor,
        strokeWidth: edgeStrokeWidth,
        ...(geo.strokeDasharray !== undefined
          ? { strokeDasharray: `${geo.strokeDasharray[0]},${geo.strokeDasharray[1]}` }
          : geo.dashed ? { strokeDasharray: '7,7' } : {}),
        // G2 N9: `id`/`codeLine` -- see `linkIdForSvg`'s doc comment.
        id: linkIdForSvg(geo, ids, syntheticNames),
        ...(geo.sourceLine !== undefined ? { codeLine: String(geo.sourceLine) } : {}),
      }),
    );
  }
  parts.push(arrowheads.tail, arrowheads.head);
  // G2 item 44: the magic-arrow glyph -- a small filled triangle, jar's
  // `TextBlockArrow2#drawU` (klimt/shape/TextBlockArrow2.java:63-77).
  // `fill`/`stroke` are ALWAYS `#000000` (the cardinality/label font's own
  // color, `FontConfiguration#getColor()` -- NOT the edge's own
  // `strokeColor`, unlike the main arrowhead polygons above), jar-verified
  // against `lojepe-37-liri985`'s golden `<polygon>`. Drawn as separate
  // presentation attributes (not one `style="..."` string like jar's own
  // klimt-pipeline output) -- semantically identical post-normalization
  // (`tests/oracle/svg-conformance/normalize.ts` expands `style` into
  // individual attributes before comparing), so the format difference
  // costs nothing.
  if (geo.arrowGlyph !== undefined) {
    const [p0, p1, p2] = geo.arrowGlyph.points;
    if (p0 !== undefined && p1 !== undefined && p2 !== undefined) {
      // T7b: routed through `attrs()` (was a raw template literal) --
      // formats each coordinate (ADR-1) while preserving the discrete
      // presentation-attribute shape the doc comment above already
      // documents as a deliberate, tested-equivalent divergence from
      // jar's combined `style=` (normalize.ts expands `style` before
      // comparing, so the attribute SHAPE is unaffected; only the raw
      // numeric formatting was the defect).
      const fmt = (n: number): string => formatDecimal(n, DEFAULT_SVG_DECIMALS);
      const pts = [p0, p1, p2, p0].map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(',');
      parts.push(
        `<polygon${attrs([
          ['points', pts], ['fill', '#000000'], ['stroke', '#000000'],
          ['stroke-width', 1], ['stroke-linejoin', 'miter'], ['stroke-miterlimit', 10],
        ])}/>`,
      );
    }
  }
  // G2/N25 (tailLabel/headLabel) + G2/N62 (label): a relationship's plain
  // text label AND its tail/head multiplicity-role labels all share ONE
  // jar-verified byte-exact attribute set (`kipure-14-suli112`/`dokego-92-
  // zilu832` `in.svg` for tail/head; `siteza-47-lixe343` for a plain
  // label -- see `class-geo-builders.ts#attachEdgeLabel`'s doc comment):
  // `fill="#000000"`, `font-size="13"`, `lengthAdjust="spacing"` +
  // `textLength`, `font-family="sans-serif"`, NO `text-anchor` (SVG default
  // "start" -- see `renderer-classifier-box.ts#renderRowText`'s identical
  // omission for the same reason). Both draw from `plantuml.skin`'s SAME
  // `arrow { FontSize 13 }` block (`GraphvizImageBuilder.java:235-238`).
  // G2 item 43: `geo.labelLines` (multi-line `label`) draws one `<text>`
  // per line with the SAME jar-verified attribute set as the single-line
  // `portLabel` loop below -- mutually exclusive with `geo.label`
  // (`class-geo-builders.ts#attachEdgeLabel` sets exactly one of the two).
  for (const line of geo.labelLines ?? []) {
    parts.push(
      text(line.x, line.y, line.text, {
        fill: '#000000', fontSize: CARDINALITY_FONT_SIZE, fontFamily: theme.fontFamily,
        lengthAdjust: 'spacing', textLength: line.width,
      }),
    );
  }
  for (const portLabel of [geo.label, geo.tailLabel, geo.headLabel]) {
    if (portLabel === undefined) continue;
    parts.push(
      text(portLabel.x, portLabel.y, portLabel.text, {
        fill: '#000000', fontSize: CARDINALITY_FONT_SIZE, fontFamily: theme.fontFamily,
        lengthAdjust: 'spacing', textLength: portLabel.width,
      }),
    );
  }
  return { body: parts.join(''), extraDefs: arrowheads.extraDefs };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
