/**
 * State-diagram transition rendering: path building, endpoint id
 * resolution, local scope naming, and the wrapped transition markup. Split
 * out of `renderer.ts` (line cap); self-contained leaf consumed by renderer.
 */

import { splinePathD } from '../../core/svg-path-builder.js';
import type { TransitionGeo } from './layout.js';
import type { Theme } from '../../core/theme.js';
import type {} from '../../core/dispatcher.js';
import { path, text } from '../../core/svg.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { INITIAL_ID, FINAL_ID } from './state-dot-graph.js';
import {} from './renderer-uid.js';
import type { StateUidPlan } from './renderer-uid.js';
import { wrapLink } from './renderer-group.js';
import { buildTransitionArrowhead, applyHeadTrim, buildCircleEndMarkup, buildCrossStartMarkup } from './renderer-arrowhead.js';
import {} from './renderer-pseudostate.js';
import {} from './renderer-box.js';
import { resolveStateArrowLineColor, resolveStateArrowHeadColor } from './state-render-colors.js';
import {} from './renderer-composite-box.js';
import { renderNoteOnLink } from './renderer-note.js';
import {} from './state-shadow.js';

import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';

/**
 * mission G4 S8 (mechanism 19): `TransitionGeo.points` is a well-formed
 * `1 + 3*n` cubic-bezier spline for every real dot-layout-driven transition
 * -- confirmed by direct inspection of `layoutState()`'s own raw output
 * (`state-manual-arrowheads.test.ts`'s doc comment) -- jar's own `DotPath`
 * draws it as a genuine SVG cubic bezier chain (`Mx,y Cx1,y1 x2,y2 x,y
 * [Cx1,y1 x2,y2 x,y ...]`, repeating the `C` command once per 3-point
 * group), NOT a polyline OR a re-interpolated Catmull-Rom curve through the
 * control points -- the pre-S8 implementation's own Catmull-Rom smoothing
 * was WRONG: it discarded the already-correct bezier control-point
 * structure `applyHeadTrim` (renderer-arrowhead.ts) already assumes and
 * re-derived extra, spurious segments (jar-verified regression:
 * `nelupe-49-xova546`'s `*start*s7_2-to-chat1` -- jar draws ONE 4-point
 * segment, the pre-S8 port drew THREE). Mirrors `class/renderer.ts
 * #buildPathData` exactly (G2 N5), including its straight-`L`-segment
 * fallback for any point list that ISN'T `1 + 3*n`
 * (`points.length < 4` or `(points.length - 1) % 3 !== 0`) -- the
 * degenerate/hand-built 2-point secant case a caller might still construct
 * outside the real layout pipeline (unit tests).
 */
export function buildPathD(points: ReadonlyArray<{ x: number; y: number }>): string {
  return splinePathD(points);
}

/** `Link#idCommentForSvg`-ish `<path id="...">` value — jar names the
 *  pseudo-start/end endpoints `*start*`/`*end*` in this attribute (byte-
 *  compared, unlike `data-qualified-name`) regardless of this port's own
 *  internal `__initial__`/`__final__` ids (`state-dot-graph.ts`).
 *  Jar-verified `moleco-69-sida106` (`id="*start*-to-Main_Libre"`),
 *  `bajelo-54-dixe684` (`id="Track_FSM-to-*end*"`).
 *
 *  mission G4 S7 (discovered while jar-verifying mechanism 10's own fix):
 *  the COMPOSITE pipeline's own scope-local pseudo anchors
 *  (`state-composite-pass.ts#scopedPseudoIds`, `__init_<scopeId>`/
 *  `__final_<scopeId>`) also need this `*start*<name>`/`*end*<name>` form
 *  -- jar's real `StateDiagram#getStart`/`#getEnd` build the SAME
 *  `"*start*" + g.getName()` string upstream regardless of nesting depth,
 *  where `g.getName()` is the OWNING GROUP's own LOCAL (never fully-
 *  qualified) name. For a CONCURRENT_STATE region, that local name is the
 *  bare synthetic `CONC<n>` segment (`StateDiagram#concurrentState`'s own
 *  `getUniqueSequence2(CONCURRENT_PREFIX)`), NOT this port's own
 *  internally-qualified `concurrentRegionScopeId` (`<ownerId>::CONC<n>`,
 *  deliberately over-qualified for THIS port's own cross-region dedup) --
 *  so a `::`-qualified scope id is stripped to its trailing `CONC<n>`
 *  segment. jar-verified `nelupe-49-xova546`: `*start*s7_2-to-chat1`
 *  (owner-level, unqualified already), `*start*toutou9-to-leo` (nested
 *  composite, unqualified already), `*start*CONC1-to-toutou9` (region,
 *  qualified `s7_2::CONC1` stripped to `CONC1`). */
function svgEndpointId(
  nodeId: string,
  concurrentGlobalIds: ReadonlyMap<string, number>,
): string {
  if (nodeId === INITIAL_ID) return '*start*';
  if (nodeId === FINAL_ID) return '*end*';
  const scopedInit = /^__init_(.*)$/.exec(nodeId);
  if (scopedInit !== null) return `*start*${localScopeName(scopedInit[1]!, concurrentGlobalIds)}`;
  const scopedFinal = /^__final_(.*)$/.exec(nodeId);
  if (scopedFinal !== null) return `*end*${localScopeName(scopedFinal[1]!, concurrentGlobalIds)}`;
  return nodeId;
}

/** Strips this port's own `<ownerId>::CONC<n>` internal qualification down
 *  to the bare trailing segment jar's own unqualified `getName()` produces
 *  -- see {@link svgEndpointId}'s own doc comment for the full mechanism.
 *  A non-region scope id (no `::`) is already local, unchanged.
 *
 *  mission G4 S14 (CONC-region bare-name global numbering): a `::`-qualified
 *  region scope id (e.g. `"State2::CONC1"`) is FIRST looked up in
 *  `concurrentGlobalIds` (`StateGeometry.concurrentGlobalIds`, ultimately
 *  `ast.concurrentGlobalIds` -- see that field's own doc comment, ast.ts)
 *  to translate this port's own owner-local region number into jar's real
 *  diagram-global `net.atmp.CucaDiagram#cpt2` one -- e.g. `State2`'s own
 *  FIRST region is locally `"CONC1"` but renders as jar's real `"CONC2"`
 *  when it is the SECOND `--` encountered anywhere in the document
 *  (jar-verified `lalava-26-zosi801`/`tegali-39-molu382`). Falls back to
 *  the pre-S14 bare-suffix strip when the key is absent (a hand-built test
 *  geometry with no `concurrentGlobalIds`, or -- defensively -- an
 *  internal id shape this map was never populated for). */
function localScopeName(scopeId: string, concurrentGlobalIds: ReadonlyMap<string, number>): string {
  const globalId = concurrentGlobalIds.get(scopeId);
  if (globalId !== undefined) return `CONC${globalId}`;
  const i = scopeId.lastIndexOf('::');
  return i === -1 ? scopeId : scopeId.slice(i + 2);
}

/** T7/D3/D4/T5: the transition-label `<text>` font attrs (family/size/
 *  weight/style) AND fill colour, resolved the SAME way
 *  `state-dot-graph.ts`/`state-composite-pass.ts` resolve the DOT-
 *  measurement font (`resolveArrowLabelFont`, D2/D3) so the reserved box
 *  and the drawn glyph never disagree (`GraphvizImageBuilder.java:234-235`),
 *  NOT `theme.fontSize`/`theme.colors.text` (14/`#181818`, the STATE
 *  body/title-text defaults). `color` defaults to `#000000`, the jar's
 *  root `FontColor black` (`skin/plantuml.skin:9`; the `arrow` block at
 *  `:306-310` sets no FontColor of its own -- D3). Mirrors
 *  `description/renderer-edge.ts#arrowLabelFontConfig`'s weight/style
 *  mapping. */
function transitionLabelFontAttrs(theme: Theme): {
  fontFamily: string;
  fontSize: number;
  fontWeight?: 'bold';
  fontStyle?: 'italic';
  color: string;
} {
  const font = resolveArrowLabelFont(theme);
  return {
    fontFamily: font.family,
    fontSize: font.size,
    ...(font.weight === 'bold' ? { fontWeight: 'bold' } : {}),
    ...(font.style === 'italic' ? { fontStyle: 'italic' } : {}),
    color: font.color,
  };
}

/** Split out of {@link buildTransitionInnerMarkup} to stay under this
 *  project's per-function NLOC cap -- the transition label `<text>`,
 *  font AND fill both from {@link transitionLabelFontAttrs} (T5/D3).
 *
 *  T4 (`note-on-link`): `transition.label.noteLines !== undefined` ⇒ a
 *  `note ... on link` -- draw the real `EntityImageNoteLink`/
 *  `ComponentRoseNote` folded-corner box (`renderer-note.ts#renderNoteOnLink`)
 *  instead of a plain `<text>` glyph; `label.x`/`label.y`/`label.width`/
 *  `label.height` are then the box's own top-left corner + dims
 *  (`TransitionGeo.label`'s own doc comment), not a baseline anchor. */
function buildTransitionLabelMarkup(transition: TransitionGeo, theme: Theme): string {
  if (transition.label === undefined) return '';
  if (transition.label.noteLines !== undefined) {
    const { x, y, width = 0, height = 0, noteLines } = transition.label;
    return renderNoteOnLink({ x, y, width, height }, noteLines, theme);
  }
  const { color, ...fontAttrs } = transitionLabelFontAttrs(theme);
  return text(transition.label.x, transition.label.y, transition.label.text, {
    ...fontAttrs,
    fill: color,
  });
}

/** Path + inline arrowhead + optional label — the wrapped `<g class=
 *  "link">`'s inner content, split out of {@link renderTransitionWrapped}
 *  to stay under this project's per-function NLOC cap. mission G4 S1
 *  mechanism 3: inline `<polygon>` arrowhead instead of a `<marker>`
 *  reference -- `ExtremityArrow`'s decorationLength-based path trim
 *  (`applyHeadTrim`) must run BEFORE `buildPathD` so the connecting line
 *  stops at the arrow's outer edge, matching jar exactly. mission G4 S15:
 *  `circleEnd`/`crossStart` decorations (`renderer-arrowhead.ts
 *  #buildCircleEndMarkup`/`#buildCrossStartMarkup`) draw AT the transition's
 *  own RAW (pre-trim) endpoints -- neither decoration changes `applyHeadTrim`
 *  itself (see that module's own top doc comment for the jar-verified
 *  derivation showing the head trim is UNCHANGED by `circleEnd`). */
function buildTransitionInnerMarkup(
  transition: TransitionGeo,
  theme: Theme,
  concurrentGlobalIds: ReadonlyMap<string, number>,
): string {
  // mission G4 S16: <style> stateDiagram { arrow { LineColor HeadColor
  // } } } -- see state-render-colors.ts#resolveStateArrowLineColor's own
  // doc comment.
  const arrowLineColor = resolveStateArrowLineColor(theme, theme.colors.arrow);
  const arrowHeadColor = resolveStateArrowHeadColor(theme, theme.colors.arrow);
  const arrowhead = buildTransitionArrowhead(transition, arrowHeadColor, 1);
  const points = applyHeadTrim(transition.points, arrowhead.trim);
  const d = buildPathD(points);
  if (d === '') return '';

  // mission G4 S15 (`Link#idCommentForSvg`): the `-to-` separator only
  // fires when EXACTLY ONE side carries a non-NONE decor -- a plain forward
  // transition always has a non-NONE HEAD decor (the trailing arrowhead), so
  // `crossStart` (a non-NONE TAIL decor too) makes BOTH sides non-NONE,
  // collapsing to a bare `-` separator (`looksLikeNoDecorAtAllSvg`, already
  // ported in `core/svek/extremity/link-decor.ts` for the class engine's own
  // use -- jar-verified `xexika-61-fedu273`'s own self-loop:
  // `id="foo-foo"`, not `"foo-to-foo"`). `circleEnd` alone does not
  // trigger this (the head side was already non-NONE) -- jar-verified
  // `id="*start*-to-foo"` on the SAME fixture's other edge.
  const idSep = transition.crossStart === true ? '-' : '-to-';
  const pathEl = path(d, {
    stroke: arrowLineColor,
    strokeWidth: 1,
    id: `${svgEndpointId(transition.from, concurrentGlobalIds)}${idSep}${svgEndpointId(transition.to, concurrentGlobalIds)}`,
  });

  const decorBackground = resolveColorToSvgHex(theme.colors.background);
  const circleEndEl = transition.circleEnd === true
    ? buildCircleEndMarkup(transition, arrowHeadColor, decorBackground)
    : '';
  const crossStartEl = transition.crossStart === true
    ? buildCrossStartMarkup(transition, arrowHeadColor, decorBackground)
    : '';

  const labelEl = buildTransitionLabelMarkup(transition, theme);

  return pathEl + crossStartEl + arrowhead.markup + circleEndEl + labelEl;
}

export function renderTransitionWrapped(
  transition: TransitionGeo,
  theme: Theme,
  uidPlan: StateUidPlan,
  concurrentGlobalIds: ReadonlyMap<string, number>,
): string {
  const inner = buildTransitionInnerMarkup(transition, theme, concurrentGlobalIds);
  if (inner === '') return '';
  const uid = uidPlan.edgeUid.get(transition) ?? '';
  return wrapLink(
    {
      from: transition.from,
      to: transition.to,
      uid,
      fromUid: uidPlan.resolveNodeUid(transition.from),
      toUid: uidPlan.resolveNodeUid(transition.to),
    },
    inner,
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
