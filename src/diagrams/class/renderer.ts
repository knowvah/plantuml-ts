/**
 * Class diagram SVG renderer.
 *
 * Pure function: ClassGeometry + Theme → SVG string.
 * No DOM, no async.
 */

import { sliceClassGeometryPage, type ClassGeometry, type NamespaceGeo, type EdgeGeo } from './layout.js';
import { classifierLeaves, noteLeaves } from './class-geo-types.js';
import { resolveTips } from './note-tips-resolve.js';
import type { NoteRenderContext, NoteConnector } from './renderer-note-dispatch.js';
import type { Theme } from '../../core/theme.js';
import type { ScaledTheme } from './class-scale-geo.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import { decorName } from './renderer-arrowhead.js';
import {} from '../../core/svek/extremity/link-decor.js';
import { buildClassUidPlan } from './renderer-uid.js';
import { wrapCluster, wrapLink } from './renderer-group.js';
import {
  renderNamespaceFolder,
  renderNamespaceRect,
  namespaceFill,
  PACKAGE_ROUND_CORNER,
} from './class-namespace-shape.js';
import { DEFAULT_GROUP_FONT_COLOR } from './class-package-style.js';
import { renderNamespaceUSymbol } from './class-namespace-usymbol-shape.js';
import type { StringMeasurer } from '../../core/measurer.js';
import {} from './class-layout-helpers.js';
import { beginClassDocument, finishClassDocument } from './renderer-document.js';
import { renderClassElk } from './renderer-elk.js';
import { renderClassLeaf, type ClassLeafRenderContext, type ClassLeafSink } from './renderer-leaf.js';
import { mergeFragmentDefs, type DrawableFragment } from '../../core/klimt/document-shell.js';

// ---------------------------------------------------------------------------
// Namespace box
// ---------------------------------------------------------------------------

/** G2 N17: the folder-tab outline (`USymbolFolder`'s tab-notch shape) --
 *  was a plain dashed rect, the single largest named G2 mechanism
 *  (104/718 fixtures). See `class-namespace-shape.ts` for the ported
 *  geometry + jar evidence. G2 N59: `skinparam packageStyle rect` selects
 *  the plain-`<rect>` `PackageStyle.RECTANGLE` variant instead -- see
 *  `renderNamespaceRect`'s own doc comment (measurer threaded, cdd-T26). */
function renderNamespace(geo: NamespaceGeo, theme: ScaledTheme, measurer: StringMeasurer | undefined): string {
  // cdd-T12 (A2b E3): a container whose header stereotype NAMES a USymbol
  // (`package X <<Node>>`) draws that symbol's own `asBig` chrome instead
  // (`svek/Cluster.java:367-374` -> `ClusterDecoration.java:66-91`). Needs
  // a real `StringMeasurer` for the klimt draw seam -- absent only for
  // hand-built test fixtures (`class-geo-types.ts#ClassGeometry.measurer`),
  // which fall through to the plain-string folder path below exactly as
  // they did pre-T12.
  if (measurer !== undefined) {
    const drawn = renderNamespaceUSymbol(geo, theme, measurer, {
      backColor: namespaceFill(geo, theme),
      // `plantuml.skin:102-114` scopes the cluster's `LineColor black` /
      // `LineThickness 1.5` to the FOLDER family only; every other group
      // USymbol keeps the generic element default. cdd5-T5c: the cluster
      // signature carries `group` (`Cluster.java:291`), and `skinparam
      // packageBorderColor` is a `group` LineColor (`FromSkinparamToStyle
      // .java:128`), so it reaches every USymbol cluster (jar gigoru-88).
      // The per-symbol tier (`elements[<usymbol>].border`) still outranks it
      // (`class-namespace-usymbol-shape.ts#resolveClusterUSymbolPaint`).
      borderColor: theme.colors.graph.packageBorder ?? theme.colors.border,
      // cdd-B8FU: renderNamespaceUSymbol draws through renderDrawableToFragment
      // at scale=1 (no SvgOption.scale threading, class-namespace-usymbol-
      // shape.ts's own citation) -- this literal needs its own scaleK factor.
      roundCorner: (theme.strictUml === true ? 0 : PACKAGE_ROUND_CORNER) * theme.scaleK,
      // cdd3-T21: a USymbol group's title style is `{..., <usymbol>,
      // composite, title}` (`ClusterHeader.java:150-153`) -- no `package_`,
      // so `packageFontColor` never reaches it (jar gigoru-88: `#000`).
      fontColor: DEFAULT_GROUP_FONT_COLOR,
    });
    if (drawn !== undefined) return drawn;
  }
  return theme.packageStyle === 'rect'
    ? renderNamespaceRect(geo, theme, measurer)
    : renderNamespaceFolder(geo, theme, measurer);
}

// ---------------------------------------------------------------------------
// Edge
// ---------------------------------------------------------------------------

import { renderEdge } from './renderer-edge.js';
import { renderNoteConnectorLink } from './renderer-note-connector.js';
import { interleaveNoteLinks, relIndexOfDotEdgeId } from './class-link-order.js';

/**
 * Render a class diagram geometry into an SVG string.
 *
 * G2 N1 (mechanism 2, "SVG root shell"): the background is folded into the
 * root `<svg style="...background:...;">` attribute (`core/klimt/document-
 * shell.ts#assembleDocumentShell`, reached via `core/assemble-svg.ts`'s
 * `diagramType: 'CLASS'` dispatch, T8) -- `background` travels on the
 * returned fragment so the shell assembler's `style` attribute picks up the
 * theme's real color.
 *
 * G2 N4: `theme.colors.background` is the RAW skinparam value (e.g.
 * `"red"`, `resolveColor()`'s gradient-tail extraction only, never a
 * named-color-to-hex resolution -- `skinparam.ts` never runs it through
 * `HColorSet`). Every other fill/stroke in this port's SVG-emission layer
 * resolves through `klimt/color/HColorSet.ts#resolveColorToSvgHex`
 * (`paint.ts#paintToSvg`'s own doc comment: "the same table
 * `svg-graphics-core.ts` ... at `paintToSvg`") EXCEPT this one call site --
 * class draws no klimt `UGraphic` at all (pure-string renderer, see N2's
 * "class-local pure-string wrapping" design note), so nothing upstream of
 * this function ever normalizes it. Resolved once here, `canonicalBackground`
 * feeds BOTH the root style attribute AND the conditional body `<rect>`
 * below, matching `svg-graphics-core.ts#setupBackcolor`'s own single
 * resolve-once-reuse-twice shape.
 *
 * Also G2 N4: contrary to N1's own doc comment (WRONG -- diagnosed against
 * the fresh 2026-07-16 oracle re-capture, not the stale N0/N1 corpus),
 * jar's class SVGs DO draw an explicit full-canvas `<rect x="0" y="0"
 * width="W" height="H" fill="<bg>" style="stroke:none;stroke-width:1;"/>`
 * as the body `<g>`'s FIRST child -- but ONLY when the resolved background
 * is neither `#000000` nor `#FFFFFF` nor fully transparent (jar-verified
 * against 8/718 fixtures with a non-default `skinparam BackgroundColor`:
 * `bovuze-89-noja934`, `camuna-58-veca254`, `lurevi-57-reku842`,
 * `momaku-69-duxe918`, `nafiki-56-jixu680`, `nikoxo-78-dega884`,
 * `nomeza-10-laba367`, `zuramo-86-liku129` -- ALL 8 carry the rect, ALL
 * `#FFFFFF`-background fixtures in the corpus carry NONE). This is the
 * exact same exclusion list `svg-graphics-core.ts#setupBackcolor` already
 * applies for every klimt-drawn engine (`canonical !== '#00000000' &&
 * canonical !== '#000000' && canonical !== '#FFFFFF'`) -- class reproduces
 * the OBSERVABLE shape directly (pure string, no `UGraphic`/`paintBackcolor`
 * call) rather than routing through klimt, per this file's established
 * "class-local pure-string wrapping" precedent (N2).
 *
 * @param geo   - Pre-computed geometry from layoutClass().
 * @param theme - Visual theme.
 * @returns     RenderFragment carrying `diagramType: 'CLASS'` (T8: routes
 *              through `core/assemble-svg.ts`'s class finalize function,
 *              never the generic `svgRoot`).
 */
export function renderClass(geo: ClassGeometry, rawTheme: Theme): RenderFragment {
  // #lizard forgives(nloc, cyclomatic_complexity) -- pre-existing (verified
  // via `git show HEAD`, unchanged by T4's diff): one orchestrator
  // dispatching every drawn-element kind. Metric-specific form + placed
  // FIRST (not "near fn end"): plain `forgives` gets reset by this
  // function's own nested closures before its `end_of_function()` fires
  // -- see `.agent-notes/N16-lizard-forgive-nested-closures.md`.
  // cdd8 T3a: `!pragma layout elk` -- `CucaDiagram.java:478-479` picks the
  // ELK maker; its drawing replaces the svek body inside the same document.
  if (geo.elk !== undefined) return renderClassElk(geo, rawTheme);
  // cdd8 T3a: the document preamble, shared with the ELK body (`renderer-document.ts`).
  const doc = beginClassDocument(geo, rawTheme);
  const theme = doc.theme;
  const children: string[] = [];
  let extraDefs = '';
  // SI14 T4: per-node fragments (ADR-2) -- collected so their OWN
  // `extraDefs` de-dup ACROSS fragments via `mergeFragmentDefs` (T1).
  const usymbolEntityFragments: DrawableFragment[] = [];
  // T3/T4: `geo.leaves` replaces the former `classifiers`/`notes` split
  // (`class-leaf-geo.ts`) AND is now jar's own draw order (D3) -- these
  // views feed the uid plan / tip resolution below; the leaf loop further
  // down reads `geo.leaves` directly, in order, not these views.
  const classifiers = classifierLeaves(geo.leaves);
  const notes = noteLeaves(geo.leaves);
  // G2 N2 (mechanism 3): every drawn element gets an `ent%04d`/`lnk%d` uid
  // + `<g class="entity"/"cluster"/"link">` wrapper -- see `renderer-uid.ts
  // #buildClassUidPlan`'s own doc comment for the scheme/exact-fallback
  // gate; `ClassUidPlanInput` is structural, so the views above suffice.
  const uidPlan = buildClassUidPlan({ ...geo, classifiers, notes });
  const noteCtx: NoteRenderContext = { uidPlan, tips: resolveTips(notes, classifiers) };
  // cdd-T9 (E6 mechanism a): every plain note's connector, deferred here and
  // drawn in the edges phase (step 3) as its own `<g class="link">` --
  // `renderOneNote`'s own doc comment (`renderer-note-dispatch.ts`).
  const noteConnectors: NoteConnector[] = [];

  // 1. Namespace boxes (behind classifiers) -- jar draws every CLUSTER
  // before any node (`svek/SvekResult.java:72-74`).
  for (const ns of geo.namespaces) {
    // cdd-T31 round 2 (E5 defect b): `Cluster#drawU` returns immediately
    // when `group.isHidden()` (svek/Cluster.java:298-300) -- the cluster's
    // border/title/decoration never draws. DOT/uid numbering is unaffected
    // (see `NamespaceGeo.hidden`'s own doc comment), so only this push is
    // skipped -- `uidPlan.namespaceUid` still carries the slot.
    if (ns.hidden === true) continue;
    const uid = uidPlan.namespaceUid.get(ns.id) ?? '';
    // cdd-T12 (A2b E4): `ns.url` opens an `<a>` INSIDE the cluster group and
    // before the decoration (`svek/Cluster.java:337-341`, closed at
    // `:379-382`) -- see `renderer-group.ts#wrapCluster`.
    children.push(wrapCluster(ns.label, uid, ns.id, renderNamespace(ns, theme, geo.measurer), ns.url));
  }

  // G2 N7: a `hide <entity|$tag|...>` match (`layout.ts#buildClassifierGeos`'s
  // own doc comment on `ClassifierGeo.hidden`) suppresses ALL drawn content
  // for that classifier -- matching jar (`net/atmp/CucaDiagram.java#isHidden`
  // -> `SvekResult`'s `UHidden` wrap). Layout/uid numbering already ran as if
  // it were visible, so skipping the push in the loop below is enough -- no
  // renumbering needed. Also feeds the edge-suppression check (step 3).
  const hiddenClassifierIds = new Set(classifiers.filter((c) => c.hidden === true).map((c) => c.id));

  // 2. Every leaf (classifier OR note/tips), ONE loop, in jar's own node
  // order (D3, `svek/SvekResult.java:82-90`) -- `bibliotekon.allNodes()`
  // draws EVERY node, hidden ones through `UHidden` (nothing), strictly
  // before any edge. D5: a note/tips leaf draws regardless of its host's
  // `hidden` -- `UHidden` wraps only the HOST node's own image, never a
  // separate note/tips node (see `renderOneNote`'s own doc comment).
  const leafCtx: ClassLeafRenderContext = {
    theme,
    uidPlan,
    noteCtx,
    measurer: geo.measurer,
    sprites: geo.sprites,
    edges: geo.edges,
  };
  const leafSink: ClassLeafSink = { children, noteConnectors, usymbolEntityFragments };
  for (const leaf of geo.leaves) renderClassLeaf(leaf, leafCtx, leafSink);

  // 3. Edges (last, matching jar: `svek/SvekResult.java:97-101` draws every
  // node before any edge) — `Link#isHidden` ORs its own flag with EITHER endpoint's
  // `isHidden()` (`abel/Link.java:459`): an edge touching a hidden
  // classifier is suppressed too, even though the classifier itself may not
  // be an edge endpoint's "hide" target (jar-verified: `lafama-65-zoci799`'s
  // `Foo2 *-- Foo3` disappears entirely once `Foo3` is hidden).
  // G2 N9: shared, diagram-wide id-collision set -- `Link#idCommentForSvg`'s
  // `-1`/`-2` suffix scheme (`linkIdForSvg`/`uniqLinkId`), one Set for every
  // edge in the diagram (matches `core/svek/SvekEdge.ts#setSharedIds`'s own
  // per-diagram scope).
  // G2 N19: `Classifier.id` (`__assocN`/`__lolN`) -> jar's real
  // `Entity.getName()` for an assoc-circle/lollipop endpoint -- see
  // `linkIdForSvg`'s doc comment.
  const syntheticNames = new Map<string, string>();
  for (const classifier of classifiers) {
    if (classifier.syntheticIdName !== undefined) {
      syntheticNames.set(classifier.id, classifier.syntheticIdName);
    }
  }
  const linkIds = new Set<string>();
  // cdd3-T33 (C-11): `SvekNode.getRectangleArea()`, keyed by classifier id
  // -- `getExtremitySimplier`'s `nodeContact.getRectangleArea()
  // .getClosestSide(center)` lookup (`SvekEdge.java:544-546`) resolves
  // against this map, via `renderer-arrowhead-contact.ts#resolveContactSide`.
  // `classifiers` is already SCALED (same `scaleClassGeometry` pass as
  // `geo.edges`), matching `EdgeGeo.points`' coordinate space.
  const contactRects = new Map(classifiers.map((c) => [c.id, c]));
  const drawEdge = (edge: EdgeGeo, i: number): void => {
    // G2/N16 Kind B: a freestanding note's connector, consumed by the
    // note's own Opale outline -- see `EdgeGeo.consumedByOpaleNote`'s doc
    // comment for why this edge stays IN `geo.edges` (uid numbering) but
    // must never draw its own `<g class="link">`.
    if (edge.consumedByOpaleNote === true) return;
    if (hiddenClassifierIds.has(edge.from) || hiddenClassifierIds.has(edge.to)) return;
    if (edge.hidden === true) return; // cdd-T7 A2a/M12: `-[hidden]-` (SvekEdge.java:835-836)
    const rendered = renderEdge(edge, theme, { ids: linkIds, syntheticNames, measurer: geo.measurer, contactRects });
    extraDefs += rendered.extraDefs;
    children.push(
      wrapLink(
        {
          from: edge.from,
          to: edge.to,
          uid: uidPlan.edgeUid[i] ?? '',
          fromUid: uidPlan.resolveEntityUid(edge.from),
          toUid: uidPlan.resolveEntityUid(edge.to),
          decor1: decorName(edge.targetDecor),
          decor2: decorName(edge.sourceDecor),
        },
        rendered.body,
      ),
    );
  };

  // cdd-T9 (E6 mechanism a): each note's connector is its own `<g
  // class="link">` via the SAME `wrapLink` call an ordinary edge gets
  // (`renderer-note-connector.ts#renderNoteConnectorLink`). cdd3-T14 (C-14):
  // drawn at its OWN slot in upstream's one `getLinks()` walk
  // (`GraphvizImageBuilder.java:229`, `Bibliotekon#allLines`), not after
  // every relationship -- `NoteGeo.linkSlot`, merged by the SAME
  // `interleaveNoteLinks` the DOT edge list goes through
  // (`class-creation-order.ts`), so draw order, the shared `linkIds`
  // de-dup sequence and DOT order agree.
  const indexedEdges = geo.edges.map((edge, i) => ({ edge, i }));
  for (const item of interleaveNoteLinks(
    indexedEdges,
    ({ edge }) => relIndexOfDotEdgeId(edge.id),
    noteConnectors,
    (connector) => connector.note.linkSlot,
  )) {
    if ('rel' in item) drawEdge(item.rel.edge, item.rel.i);
    else children.push(renderNoteConnectorLink(item.note, theme, uidPlan, linkIds));
  }

  // SI14 T4 (ADR-2): de-dup usecase/actor fragment defs (e.g. gradients)
  // across nodes before folding into the diagram-wide defs string.
  const mergedUsymbolDefs = mergeFragmentDefs(usymbolEntityFragments);
  if (mergedUsymbolDefs !== undefined) extraDefs += mergedUsymbolDefs;

  return finishClassDocument(doc, geo, {
    body: children.join(''),
    // cdd6 T3b: `SvgGraphics#ensureVisible` (`SvgGraphics.java:129-133,
    // 1033-1034`) -- each USymbol leaf fragment's own `UGraphicSvg` extent,
    // which carries a `{{ }}` label embed the ink walk never sees.
    width: Math.max(geo.totalWidth, ...usymbolEntityFragments.map((f) => f.width)),
    height: Math.max(geo.totalHeight, ...usymbolEntityFragments.map((f) => f.height)),
    extraDefs,
  });
}

/**
 * `renderClass` for exactly ONE page of `geo`, 0-based — cdd-T34 (E14
 * `newpage`), mirrors `sequence/renderer.ts#renderSequencePage`'s identical
 * "slice, then run the normal single-geometry renderer" shape. `geo` for
 * page 0 of a single-page document IS `geo` itself (`sliceClassGeometryPage`
 * returns its input unchanged, `===`, whenever `pageBoundaries` is absent
 * or has one entry), so this is a true zero-cost superset of `renderClass`
 * for the overwhelmingly common non-`newpage` case.
 */
export function renderClassPage(geo: ClassGeometry, theme: Theme, pageIndex: number): RenderFragment {
  return renderClass(sliceClassGeometryPage(geo, pageIndex), theme);
}
