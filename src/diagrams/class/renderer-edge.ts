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
import type { ScaledTheme } from './class-scale-geo.js';
import { scaleDashArrayString } from './class-scale-geo-row.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type {} from '../../core/dispatcher.js';
import { path, linkWrap } from '../../core/svg.js';
import {} from '../../core/usymbol-shapes.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import {} from './class-monochrome.js';
import { buildEdgeArrowheads, decorName, applyDecorTrim, buildMiddleDecorMarkup } from './renderer-arrowhead.js';
import type { ContactRect } from './renderer-arrowhead-contact.js';
import { looksLikeRevertedForSvg, looksLikeNoDecorAtAllSvg } from '../../core/svek/extremity/link-decor.js';
import {} from './renderer-uid.js';
import { leafPortion } from './renderer-group.js';
import {} from './class-lollipop.js';
import {} from './renderer-classifier-box.js';
import {} from './class-namespace-shape.js';
import {} from './class-shadow.js';
import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';
import { arrowLabelTextAttrs, magicArrowPolygon, renderEdgeMainLabel } from './renderer-edge-label.js';
import {
  renderEdgeVisibilityIcon,
  renderEdgeNoteBox,
  renderEdgeConstraint,
  renderEdgeCardinalityLabels,
  renderEdgeKalBoxes,
} from './renderer-edge-extras.js';

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
 * marker-def injection no longer runs for class at all (`renderClass` sets
 * `diagramType: 'CLASS'`, bypassing `svgRoot` entirely -- `core/assemble-
 * svg.ts` routes through `assembleDocumentShell`, which emits an empty
 * `<defs/>`, matching jar).
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
  // SI-saea T3a/D2: raw here -- `path()`'s `attrs()` now escapes `id`
  // (a classifier name may carry `<`/`&`/`"`, e.g. a C++ template type,
  // nagega-30-poso418: `boost::function<ResultE(...)>`). A local pre-escape
  // here (removed) double-escaped once `attrs()` started escaping.
  const ent1 = geo.idEntity1 ?? syntheticNames.get(geo.from) ?? leafPortion(geo.from);
  const ent2 = geo.idEntity2 ?? syntheticNames.get(geo.to) ?? leafPortion(geo.to);
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
 * D3/D4: the main-label `<text>` font attrs, resolved the SAME way
 * `class-dot-graph.ts` resolves the DOT-measurement font
 * (`resolveArrowLabelFont`, D3) so the reserved box and the drawn glyph
 * never disagree (`GraphvizImageBuilder.java:234-235`). Absent any
 * `<style> arrow { ... }` / `skinparam ClassArrowFont*` override this
 * resolves to `{fontSize:13, fontFamily:theme.fontFamily}` -- byte-identical
 * to the pre-T5 hardcoded `CARDINALITY_FONT_SIZE` literal every `label`/
 * `labelLines` `<text>` used before. `font-weight="700"` (the raw numeric
 * jar's deterministic-text SVG emits, never the `"bold"` keyword --
 * `core/svg.ts`'s own `fontWeight` doc comment, corpus-verified 184/184
 * class fixtures) matches `camuna-58-veca254`'s oracle `foo1`/`foo2` labels
 * exactly. Applies ONLY to the main label -- `tailLabel`/`headLabel`
 * (cardinality/quantifier) use their own `CARDINALITY_FONT_SIZE` font,
 * scaled in `renderer-edge-extras.ts#renderEdgeCardinalityLabels` (cdd-B8FU).
 */
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

/** cdd-T29 R2: `geo.strokeWidth` is ALREADY scaled (`class-scale-geo-
 *  edge.ts`); the `tagStyle?.thickness ?? 1` fallback is not, and needs
 *  the SAME materialization `class-scale-geo-row.ts#scaleRow`'s `row.
 *  fontSize` fallback already gets -- split out for {@link renderEdge}'s NLOC cap. */
function resolveEdgeStrokeWidth(
  geo: EdgeGeo,
  tagStyle: { thickness?: number } | undefined,
  theme: ScaledTheme,
): number {
  return geo.strokeWidth ?? (tagStyle?.thickness ?? 1) * theme.scaleK;
}

/**
 * G2 N31: the extremity's own stroke color must match the connecting
 * path's -- `geo.colorOverride` (`-[#color]->`, N26) was only ever
 * applied to the `<path>` itself; resolved ONCE here so both the path
 * AND `buildEdgeArrowheads` draw the SAME color, matching `SvekEdge.ts
 * #drawU`'s single `this.input.color` field feeding both `lined.draw
 * (this.dotPath)` and `drawExtremity`.
 * G2 N36: `theme.colors.graph.classCascadeArrowColor` -- the `<style>
 * classDiagram { LineColor }`/`root { LineColor }`/nested `classDiagram
 * { arrow { LineColor } } }` ancestor cascade (`SvekEdge.java:819`'s
 * `{root,element,classDiagram,arrow}` style signature, jar-verified
 * `bikuka-40-pezi068`/`rakici-44-tivo701`) -- sits BELOW the per-edge
 * `-[#color]->` bracket override, ABOVE the cross-diagram-type
 * `theme.colors.arrow` default (never overwritten directly -- this Theme
 * shape is shared with description/other diagram types).
 * B7/M8: a link's own `<<tag>>` resolves against the ARROW signature with
 * the tag as its stereotype label (`SvekEdge.java:817-822` ->
 * `StyleSignatureBasic#withTOBECHANGED`'s per-label fan-out), and both the
 * colour and the thickness come off that ONE merged style
 * (`SvekEdge.java:874-876`). It sits BELOW an explicit `-[#color]->`
 * bracket override and ABOVE the diagram-wide arrow cascade -- the same
 * order the bracket/cascade/default chain below already uses. Last tag
 * wins, mirroring the merge's own last-registered-wins rule.
 *
 * Split out of {@link renderEdge} (cdd3-T33, NLOC cap -- adding
 * `contactRects` threading pushed it over) -- pure extraction, no
 * behavior change.
 */
function resolveStrokeAndArrowheads(
  geo: EdgeGeo,
  theme: ScaledTheme,
  contactRects: ReadonlyMap<string, ContactRect> | undefined,
): { strokeColor: string; edgeStrokeWidth: number; arrowheads: ReturnType<typeof buildEdgeArrowheads> } {
  const tagStyle = resolveArrowTagStyle(geo.stereotypeTags, theme);
  const strokeColor =
    geo.colorOverride !== undefined
      ? resolveColorToSvgHex(geo.colorOverride)
      : (tagStyle?.color ?? theme.colors.graph.classCascadeArrowColor ?? theme.colors.arrow);
  const edgeStrokeWidth = resolveEdgeStrokeWidth(geo, tagStyle, theme);
  const arrowheads = buildEdgeArrowheads(geo, strokeColor, theme.colors.background, {
    resolvedStrokeWidth: edgeStrokeWidth,
    k: theme.scaleK,
    contactRects, // cdd3-T33 (C-11)
  });
  return { strokeColor, edgeStrokeWidth, arrowheads };
}

/**
 * T3c (D8, `smetana-pragma-ignored`): the connecting `<path>`'s stroke/dash
 * attributes, plus (SvekEdge draw shape only) `id`/`codeLine` --
 * `linkId === undefined` for a smetana edge, since `SmetanaEdge#drawU`
 * never calls `Link#idCommentForSvg()` at all (no equivalent anywhere in
 * its body) and this port's caller ({@link renderEdge}) skips computing one
 * -- upstream never reserves an id-collision slot for it either.
 */
interface EdgePathStyle {
  readonly strokeColor: string;
  readonly edgeStrokeWidth: number;
  readonly linkId: string | undefined;
}

/**
 * The connecting `<path>` element, or `''` for a degenerate/empty point
 * list (see {@link buildPathData}'s own doc comment). Split out of
 * {@link renderEdge} (T3c) so the id/codeLine computation -- SvekEdge-only,
 * see {@link EdgePathStyle}'s doc comment -- stays a single, easily-gated
 * spot rather than an inline branch inside the `path()` call.
 * @see ~/git/plantuml/.../sdot/SmetanaEdge.java:215-217
 */
function buildEdgePathMarkup(d: string, geo: EdgeGeo, theme: ScaledTheme, style: EdgePathStyle): string {
  if (d === '') return '';
  const { strokeColor, edgeStrokeWidth, linkId } = style;
  return path(d, {
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
    // list, so the literal separator must match too).
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
      : geo.dashed
        ? { strokeDasharray: scaleDashArrayString('7,7', theme.scaleK) }
        : {}),
    // G2 N9 / T3c D8: `id`/`codeLine` -- see `linkIdForSvg`'s doc comment
    // and {@link EdgePathStyle}'s own doc comment for why `linkId` is
    // `undefined` (both attributes vanish) on a smetana edge.
    ...(linkId !== undefined
      ? { id: linkId, ...(geo.sourceLine !== undefined ? { codeLine: String(geo.sourceLine) } : {}) }
      : {}),
  });
}

/**
 * cdd-T7: `ids`/`syntheticNames` (pre-existing) plus `measurer` (new,
 * optional) folded into one options object -- a bare 5th positional
 * parameter would have crossed this repo's hook-enforced param cap.
 * `measurer` is `undefined` only for a hand-built `ClassGeometry` test
 * literal that omits it (`ClassGeometry.measurer`'s own doc comment); only
 * `renderEdgeConstraint` (A2a/M9's text centring) reads it.
 */
export interface RenderEdgeContext {
  readonly ids: Set<string>;
  readonly syntheticNames: ReadonlyMap<string, string>;
  readonly measurer?: StringMeasurer | undefined;
  /** cdd3-T33 (C-11): `classifierId -> rect` — see `renderer-arrowhead-
   *  contact.ts`'s doc comment. Built once per diagram (`renderer.ts`). */
  readonly contactRects?: ReadonlyMap<string, ContactRect>;
}

export function renderEdge(
  geo: EdgeGeo,
  theme: ScaledTheme,
  ctx: RenderEdgeContext,
): { body: string; extraDefs: string } {
  const { ids, syntheticNames, measurer, contactRects } = ctx;
  // T3c (D8, `smetana-pragma-ignored`): `!pragma layout smetana` swaps the
  // whole document onto `SmetanaEdge#drawU`, whose STRUCTURAL draw shape
  // differs from `SvekEdge#drawU`'s in exactly the two ways gated below --
  // see {@link EdgePathStyle} and the `core`/`rest` split's own doc
  // comments. `geo.smetana` is a carry-only copy of
  // `ClassDiagramAST.layoutEngine === 'smetana'` (`class-geo-types.ts`'s
  // doc comment).
  const smetana = geo.smetana === true;
  const parts: string[] = [];
  // G2 N28: arrowheads must be resolved BEFORE the path is built -- the
  // connecting `<path>` is shortened by each decor's own trim delta
  // (`renderer-arrowhead.ts#applyDecorTrim`), matching `SvekEdge#drawU`'s
  // own trim-then-draw order (`dotPath.moveStartPoint`/`.moveEndPoint`
  // BEFORE `lined.draw(this.dotPath)` -- `SvekEdge.ts:178-200,279`).
  // See {@link resolveStrokeAndArrowheads}'s own doc comment for the
  // colour/thickness cascade (G2 N31/N36, B7/M8) this hoists.
  const { strokeColor, edgeStrokeWidth, arrowheads } = resolveStrokeAndArrowheads(geo, theme, contactRects);
  const trimmedPoints = applyDecorTrim(geo.points, arrowheads.tailTrim, arrowheads.headTrim);
  const d = buildPathData(trimmedPoints);
  // G2 N9 / T3c D8: a smetana edge never reserves an id-collision slot --
  // see {@link EdgePathStyle}'s doc comment.
  const linkId = smetana ? undefined : linkIdForSvg(geo, ids, syntheticNames);
  const pathMarkup = buildEdgePathMarkup(d, geo, theme, { strokeColor, edgeStrokeWidth, linkId });
  // T3c (D8): `SmetanaEdge#drawU` draws BOTH extremities BEFORE the
  // connecting path (`printExtremityAtStart`/`printExtremityAtEnd` precede
  // `ug.apply(stroke).apply(color).draw(dotPath)`,
  // `sdot/SmetanaEdge.java:215-217`); `SvekEdge#drawU` draws the path
  // first (unchanged default). `core` is this engine-ordered pair, kept
  // separate from `rest` below so the SAME pair -- and only that pair --
  // is the url wrap's operand for a smetana edge (see the return
  // statement's own doc comment).
  const core = smetana
    ? arrowheads.tail + arrowheads.head + pathMarkup
    : pathMarkup + arrowheads.tail + arrowheads.head;
  // cdd-T7 (A2a/M2): the label's own visibility-modifier icon -- drawn
  // right after the extremities and BEFORE the label text, matching
  // `canuti-20-jotu614`'s golden child order (`SvekEdge.java:302`'s
  // `addVisibilityModifier` merges the icon LEFT of the label block, so it
  // paints first).
  const visibilityIconMarkup = renderEdgeVisibilityIcon(geo, theme);
  if (visibilityIconMarkup !== '') parts.push(visibilityIconMarkup);
  // T3: `labelColor` feeds the whole-label glyph and {@link renderEdgeMainLabel}'s
  // fills (`arrow-label-font.ts` D2/D5; cardinality resolves its own, T11).
  // cdd3-T10 (S-4t): `font.mute(link.getColors())` (`SvekEdge.java:260-262`).
  const labelColor =
    geo.labelTextColor !== undefined ? resolveColorToSvgHex(geo.labelTextColor) : resolveArrowLabelFont(theme).color;
  // G2 item 44: the whole-label magic-arrow glyph -- see {@link
  // magicArrowPolygon}. Drawn before the label text (`mergeLR(arrow,
  // label)`, `SvekEdge.java:284,304`) -- part of the SAME `labelOnly`
  // operand the note-on-link merge below orders against (`SvekEdge.java:
  // 302-306` builds the glyph+label block BEFORE `:318-325`'s note merge).
  const labelParts: string[] = [];
  if (geo.arrowGlyph !== undefined) {
    const glyph = magicArrowPolygon(geo.arrowGlyph.points, labelColor);
    if (glyph !== undefined) labelParts.push(glyph);
  }
  const labelFontAttrs = arrowLabelTextAttrs(theme);
  labelParts.push(...renderEdgeMainLabel(geo, labelFontAttrs, labelColor));
  // cdd-T7/cdd2-T19c (A2a/M5): `note on link`'s body, ordered against the
  // label per `SvekEdge.java:318-325`'s `mergeLR`/`mergeTB` operand order:
  // `Position.LEFT`/`TOP` draws the note FIRST (`mergeLR(noteOnly,
  // labelOnly)`/`mergeTB(noteOnly, labelOnly)`); `RIGHT`/`BOTTOM` (and no
  // note at all) keeps the label first. `geo.noteBox.position` carries the
  // SAME `Relationship.linkNotePosition` the layout-time merge already used
  // (`class-edge-note-box.ts#computeEdgeNoteBox`).
  const noteBoxResult = renderEdgeNoteBox(geo, theme);
  const notePosition = geo.noteBox?.position;
  if (notePosition === 'left' || notePosition === 'top') {
    parts.push(noteBoxResult.body, ...labelParts);
  } else {
    parts.push(...labelParts, noteBoxResult.body);
  }
  parts.push(...renderEdgeCardinalityLabels(geo, theme));
  // cdd-T7 (A5/M4, A2a/M6): the `-0)-` family's mid-link decoration --
  // `SvekEdge.java:982-988` draws it AFTER the tail/head cardinality text,
  // over the TRIMMED point list (the same `dotPath` object the earlier
  // extremity trim already mutated in upstream -- see `buildPathData`'s own
  // doc comment on why this port never builds a real `DotPath` for the
  // connecting line itself).
  const middleDecor = buildMiddleDecorMarkup(
    trimmedPoints,
    geo.middleDecor,
    strokeColor,
    theme.colors.background,
    theme.scaleK,
  );
  let extraDefs = arrowheads.extraDefs + noteBoxResult.extraDefs;
  if (middleDecor !== undefined) {
    parts.push(middleDecor.body);
    extraDefs += middleDecor.extraDefs;
  }
  // cdd-T7 (A2a/M9): `constraint on links` -- drawn after the middle decor,
  // matching `SvekEdge.java:993-1011`.
  parts.push(renderEdgeConstraint(geo, theme, measurer));
  // cdd-T15 (A2a/M1): the qualifier box(es) -- LAST in the group, matching
  // `SvekEdge.java:1015-1019`'s `kal1.drawU(ug)`/`kal2.drawU(ug)`
  // immediately before `ug.closeGroup()`.
  parts.push(renderEdgeKalBoxes(geo, theme));
  const rest = parts.join('');
  // cdd-T7 (A2a/M3): `[[url]]` on the relationship. SvekEdge wraps the
  // ENTIRE group body (path, arrowheads, label, note, constraint --
  // everything already emitted above) in ONE `<a>`, matching
  // `SvekEdge.java:859-861`'s `ug.startUrl(url)` immediately after
  // `ug.startGroup(...)` and `:990-991`'s `closeUrl()` immediately before
  // `ug.closeGroup()` -- i.e. the url spans the group's FULL lifetime, not
  // just one primitive. T3c (D8): SmetanaEdge wraps ONLY `core`
  // (extremities+path) -- `ug.startUrl(url)` / `printExtremityAtStart/End`
  // / `draw(dotPath)` / `ug.closeUrl()` (`sdot/SmetanaEdge.java:200-220`)
  // all run BEFORE the label is drawn (`:223-224`), so the label (and every
  // other `rest` piece) sits OUTSIDE the `<a>`, unlike SvekEdge's full-body
  // wrap.
  const wrapTarget = smetana ? core : core + rest;
  const wrapped = geo.url !== undefined ? linkWrap(wrapTarget, geo.url) : wrapTarget;
  return {
    body: smetana ? wrapped + rest : wrapped,
    extraDefs,
  };
  // #lizard forgives -- pre-existing (unrelated to T3): the
  // strokeColor/edgeStrokeWidth cascade (bracket override > tag style >
  // classCascadeArrowColor > default) plus the path/arrowhead/glyph/label
  // assembly mirror SvekEdge#drawU's own branching (comments above); T3
  // only added two `resolve*(theme)` reads and hoisted the label/
  // cardinality drawing into {@link renderEdgeMainLabel}/{@link
  // renderEdgeCardinalityLabels} -- see their own doc comments. cdd-T7
  // added six sequential, independent primitive emissions (icon/note/
  // middle-decor/constraint/url) mirroring `SvekEdge#drawU`'s own linear
  // draw-call sequence one-for-one -- not a new branch, no CCN growth. T3c
  // added the smetana core/rest split + wrap-target gate (comments above);
  // net CCN is roughly unchanged since the id/codeLine ternary chain moved
  // out to {@link buildEdgePathMarkup}.
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
