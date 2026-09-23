/**
 * Class diagram SVG renderer.
 *
 * Pure function: ClassGeometry + Theme → SVG string.
 * No DOM, no async.
 */

import { sliceClassGeometryPage, type ClassGeometry, type ClassifierGeo, type NamespaceGeo } from './layout.js';
import { classifierLeaves, noteLeaves, isNoteGeo } from './class-geo-types.js';
import { resolveTips } from './note-tips-resolve.js';
import { renderOneNote, type NoteRenderContext, type NoteConnector } from './renderer-note-dispatch.js';
import type { Theme } from '../../core/theme.js';
import { scaleClassTheme, type ScaledTheme } from './class-scale-geo.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import { renderUSymbolIcon } from '../../core/usymbol-shapes.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { applyMonochromeHex, applyMonochromeToFragment } from './class-monochrome.js';
import { decorName } from './renderer-arrowhead.js';
import {} from '../../core/svek/extremity/link-decor.js';
import { buildClassUidPlan } from './renderer-uid.js';
import {
  wrapCluster,
  wrapEntity,
  wrapLink,
  leafPortion,
  renderGroupInheritanceNeighborhood,
} from './renderer-group.js';
import { renderAssocPoint, renderAssociationDiamond, renderLollipop } from './renderer-assoc-lollipop.js';
import { renderClassifierBox } from './renderer-classifier-box.js';
import {
  renderNamespaceFolder,
  renderNamespaceRect,
  renderEmptyPackageIcon,
  namespaceFill,
  titleFontColor,
  PACKAGE_ROUND_CORNER,
} from './class-namespace-shape.js';
import { renderNamespaceUSymbol } from './class-namespace-usymbol-shape.js';
import type { StringMeasurer } from '../../core/measurer.js';
import {} from './class-layout-helpers.js';
import { buildClassShadowFilterDef } from './class-shadow.js';
import { renderClassUSymbolEntity, usesClassUSymbolEntity } from './renderer-usymbol-entity.js';
import { mergeFragmentDefs, type DrawableFragment } from '../../core/klimt/document-shell.js';

/** `net.sourceforge.plantuml.core.DiagramType#CLASS` -- verified against
 *  every cached jar class-diagram fixture's `data-diagram-type` root
 *  attribute (e.g. `test-results/dot-cache/class/bajotu-30-soku184/in.svg`).
 *  T8: was `class/renderer-shell.ts`'s own copy of this constant. */
const DIAGRAM_TYPE_CLASS = 'CLASS';

/** Descriptive elements (database/component/actor/usecase) draw their USymbol
 *  icon instead of the class box; usecase carries no usymbol (its kind is
 *  enough). Returns undefined when this classifier has no icon to draw (the
 *  normal box path below applies) or the icon renderer declines. Split out of
 *  renderClassifier purely to keep that function's own NLOC/CCN under cap. */
function tryRenderUSymbol(geo: ClassifierGeo, theme: ScaledTheme): string | undefined {
  const usymbol = geo.kind === 'usecase' ? 'usecase' : geo.usymbol;
  if (usymbol === undefined) return undefined;
  const display = geo.rows[0]?.text ?? geo.id;
  return renderUSymbolIcon(usymbol, { ...geo, display }, theme);
}

function renderClassifier(geo: ClassifierGeo, theme: ScaledTheme): string {
  const icon = tryRenderUSymbol(geo, theme);
  if (icon !== undefined) return icon;
  return renderClassifierBox(geo, theme);
}

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
      // USymbol keeps the generic element default. A per-symbol `<style>
      // node { LineColor ... }` override is NOT modeled (no corpus sample;
      // named remainder, `.agent-notes/cdd-T12.md`).
      borderColor: theme.colors.border,
      // cdd-B8FU: renderNamespaceUSymbol draws through renderDrawableToFragment
      // at scale=1 (no SvgOption.scale threading, class-namespace-usymbol-
      // shape.ts's own citation) -- this literal needs its own scaleK factor.
      roundCorner: (theme.strictUml === true ? 0 : PACKAGE_ROUND_CORNER) * theme.scaleK,
      fontColor: titleFontColor(theme),
    });
    if (drawn !== undefined) return drawn;
  }
  return theme.packageStyle === 'rect'
    ? renderNamespaceRect(geo, theme, measurer)
    : renderNamespaceFolder(geo, theme, measurer);
}

/**
 * G2 N33: a collapsed-empty `package`/`namespace` leaf (`ClassifierGeo
 * .folderTab` present, `class-magma.ts#isCollapsedGroup`'s doc comment)
 * draws its OWN small `EntityImageEmptyPackage` folder-tab icon -- the
 * SAME `renderNamespaceFolder`/`USymbolFolder#asBig` shape a non-empty
 * package's CLUSTER wrapper uses, just sized by
 * `measureEmptyPackageLeafDim`'s smaller formula instead of the cluster's
 * own content-driven dimension. Reuses `renderNamespaceFolder` by
 * constructing a `NamespaceGeo`-shaped view over the classifier's own
 * (DOT-driven) `x`/`y`/`width`/`height` plus the pre-computed `folderTab`
 * fields -- `id`/`creationIndex` are irrelevant to rendering (unused by
 * `renderNamespaceFolder`) so are filled with placeholders.
 */
function renderEmptyPackageLeaf(geo: ClassifierGeo, theme: ScaledTheme, measurer: StringMeasurer | undefined): string {
  const folderTab = geo.folderTab;
  if (folderTab === undefined) return '';
  const label = geo.rows[0]?.text ?? geo.id;
  const nsGeo: NamespaceGeo = {
    id: geo.id,
    x: geo.x,
    y: geo.y,
    width: geo.width,
    height: geo.height,
    label,
    wtitle: folderTab.wtitle,
    htitle: folderTab.htitle,
    baselineOffset: folderTab.baselineOffset,
  };
  return renderEmptyPackageIcon(nsGeo, theme, measurer);
}

// ---------------------------------------------------------------------------
// Edge
// ---------------------------------------------------------------------------

import { renderEdge } from './renderer-edge.js';
import { renderNoteConnectorLink } from './renderer-note-connector.js';

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
  // cdd-T29 R2 (D4/journal row 175): `index.ts`'s `render(geo, theme)` call
  // site (outside this task's write-set) passes the UNSCALED theme
  // unchanged -- this is the one remaining seam that can turn it into a
  // `ScaledTheme` for every render-time pixel-literal constant this file's
  // call tree carries (mirrors `sequence/scale-geo.ts`'s identical
  // `scaleSequenceTheme` derivation). Shadows `theme` for the REST of this
  // function so every existing read below (colors, `monochrome`,
  // `shadowing`, every internal call) picks up the scaled value with no
  // further changes.
  const theme = scaleClassTheme(rawTheme, geo.scaleK ?? 1);
  // G2 N61: `skinparam monochrome true|reverse` applies to the document
  // background too (jar's `ColorMapper` is universal, not scoped to
  // entity/link colors) -- transformed HERE so every downstream reader of
  // `canonicalBackground` (the returned `background` field, the
  // `documentBackgroundRect` derivation below) sees the already-mapped
  // value, matching `class-monochrome.ts`'s own "single choke point"
  // design (see that file's header doc comment).
  const resolvedBackground = resolveColorToSvgHex(theme.colors.background);
  const canonicalBackground =
    theme.monochrome !== undefined ? applyMonochromeHex(resolvedBackground, theme.monochrome) : resolvedBackground;
  const children: string[] = [];
  let extraDefs = '';
  // SI14 T4: per-node fragments (ADR-2) -- collected so their OWN
  // `extraDefs` de-dup ACROSS fragments via `mergeFragmentDefs` (T1).
  const usymbolEntityFragments: DrawableFragment[] = [];

  // G2 N40: `skinparam pathHoverColor <color>` -- a global CSS hover rule,
  // the SAME `<style type="text/css"><![CDATA[path:hover{...}]]></style>`
  // shape `core/klimt/drawing/svg/svg-graphics-core.ts#getPathHover`
  // already ports as shared (but unwired) machinery -- class's own
  // string-based `<defs>` assembly (this file's established "class-local
  // pure-string wrapping" precedent, N2) reproduces it directly rather
  // than routing through klimt. Jar-verified `dasagu-52-vani172`.
  if (theme.colors.graph.pathHoverColor !== undefined) {
    const resolvedHoverHex = resolveColorToSvgHex(theme.colors.graph.pathHoverColor);
    const hoverHex =
      theme.monochrome !== undefined ? applyMonochromeHex(resolvedHoverHex, theme.monochrome) : resolvedHoverHex;
    extraDefs += `<style type="text/css"><![CDATA[path:hover { stroke: ${hoverHex} !important;}]]></style>`;
  }

  // mission skin-file-loading (deferred D3 item): ONE shared shadow filter
  // def per diagram, gated on the SAME `theme.shadowing > 0` diagram-level
  // check `class-shadow.ts#buildClassShadowFilterDef`'s own doc comment
  // establishes (mirrors `state/renderer.ts`'s identical Batch-2 gate) --
  // byte-identical (empty extraDefs) for every pre-mission/shadow-off
  // fixture.
  if (theme.shadowing !== undefined && theme.shadowing > 0) {
    extraDefs += buildClassShadowFilterDef();
  }

  // G2 N4/N48: full-canvas background rect, ONLY for a non-default
  // (non-black, non-white, non-transparent) background -- see this
  // function's own doc comment for the jar-verified exclusion list and
  // evidence. N48: NOT drawn into `children` here any more -- jar's rect
  // spans the FINAL (post-chrome, post-document-margin) canvas and is the
  // outer `<g>`'s FIRST child even when a title/header/footer/legend/
  // caption sits ABOVE the diagram body (jar-verified `xalaco-64-vuzu312`:
  // `<rect x="0" y="0" width="81" height="213".../>` precedes `<g
  // class="title">`) -- this function only knows the PRE-chrome body
  // dims, so it can no longer draw the rect itself. Threaded instead as
  // `documentBackgroundRect` on the fragment; `core/assemble-svg.ts`'s
  // class finalize function (which runs AFTER chrome/margin) draws it at
  // the correct final size and position. A no-title fixture's `width`/`height`
  // already equal the final canvas at that point too (chrome is a no-op
  // there), so this is a strict behavior-preserving move for every
  // already-passing non-title fixture (jar-verified unchanged:
  // `bovuze-89-noja934`).
  const documentBackgroundRect =
    canonicalBackground !== '#00000000' && canonicalBackground !== '#000000' && canonicalBackground !== '#FFFFFF'
      ? canonicalBackground
      : undefined;
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
  for (const leaf of geo.leaves) {
    if (isNoteGeo(leaf)) {
      const drawn = renderOneNote(leaf, noteCtx, theme);
      children.push(...drawn.entity);
      if (drawn.connector !== undefined) noteConnectors.push(drawn.connector);
      continue;
    }
    const classifier = leaf;
    if (classifier.hidden === true) continue;
    // G2 N8: an association-class-couple "point" entity draws unwrapped --
    // no `<g class="entity">`, no id, no comment -- see `renderAssocPoint`'s
    // own doc comment.
    if (classifier.kind === 'assoc-circle') {
      children.push(renderAssocPoint(classifier, theme));
      continue;
    }
    if (classifier.kind === 'association') {
      children.push(renderAssociationDiamond(classifier, theme)); // cdd-T34
      continue;
    }
    // G2 N33: a collapsed-empty package/namespace draws its folder-tab icon
    // UNWRAPPED -- no `<g class="entity">`, no id, no `<!--class ...-->`
    // comment (jar-verified `gatula-10-bifu561`: `package foo {}`/
    // `namespace bar {}` emit bare `<path>`/`<line>`/`<text>` siblings,
    // identical to `renderAssocPoint`'s own established unwrapped
    // precedent above) -- see `renderEmptyPackageLeaf`'s doc comment.
    if (classifier.folderTab !== undefined) {
      children.push(renderEmptyPackageLeaf(classifier, theme, geo.measurer));
      continue;
    }
    // G2 N20: the lollipop circle DOES get a normal `<g class="entity">`
    // wrap (unlike assoc-circle above) but the label `<text>` is a plain,
    // unwrapped sibling -- see `renderLollipop`'s own doc comment.
    if (classifier.kind === 'lollipop') {
      const lollipopUid = uidPlan.classifierUid.get(classifier.id) ?? '';
      const { circle, label } = renderLollipop(classifier, theme);
      children.push(wrapEntity(leafPortion(classifier.id), lollipopUid, classifier.id, false, circle));
      if (label !== '') children.push(label);
      continue;
    }
    // SI14 T4 (ADR-1/ADR-2)/cdd-T22 (E8, cacoma-43-poxu615): usecase/actor/
    // circle/component draw via the SAME faithful `EntityImageDescription
    // .drawU` path description uses, when a real `StringMeasurer` reached
    // this geo (absent only for hand-built test fixtures --
    // `class-geo-types.ts#ClassGeometry.measurer`). The fragment's `body`
    // carries EntityImageDescription's OWN `<!--entity NAME-->` wrap
    // (`renderer-usymbol-entity.ts`) -- push UNWRAPPED, never through
    // `wrapEntity` (wrong `<!--class NAME-->` comment).
    if (usesClassUSymbolEntity(classifier) && geo.measurer !== undefined) {
      const entityUid = uidPlan.classifierUid.get(classifier.id) ?? '';
      const fragment = renderClassUSymbolEntity(classifier, theme, geo.measurer, geo.sprites, entityUid);
      usymbolEntityFragments.push(fragment);
      children.push(fragment.body);
      continue;
    }
    const uid = uidPlan.classifierUid.get(classifier.id) ?? '';
    children.push(
      wrapEntity(leafPortion(classifier.id), uid, classifier.id, true, renderClassifier(classifier, theme)),
    );
    // cdd-T16 (M7/E11, flagged write-set extension, SvekResult.java:82-89):
    children.push(...renderGroupInheritanceNeighborhood(classifier, geo.edges, theme));
  }

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
  geo.edges.forEach((edge, i) => {
    // G2/N16 Kind B: a freestanding note's connector, consumed by the
    // note's own Opale outline -- see `EdgeGeo.consumedByOpaleNote`'s doc
    // comment for why this edge stays IN `geo.edges` (uid numbering) but
    // must never draw its own `<g class="link">`.
    if (edge.consumedByOpaleNote === true) return;
    if (hiddenClassifierIds.has(edge.from) || hiddenClassifierIds.has(edge.to)) return;
    if (edge.hidden === true) return; // cdd-T7 A2a/M12: `-[hidden]-` (SvekEdge.java:835-836)
    const rendered = renderEdge(edge, theme, { ids: linkIds, syntheticNames, measurer: geo.measurer });
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
  });

  // cdd-T9 (E6 mechanism a): each note's connector, as its own `<g
  // class="link">` via the SAME `wrapLink` call an ordinary edge gets above
  // (`GraphvizImageBuilder.java:229`'s single draw loop over
  // `dotData.getLinks()`, which upstream mints the note-host connector into
  // as a real `Link`). Appended AFTER the real edges, matching upstream's
  // OWN draw order for every AC fixture (fogexa/pecabi/sanixi/zepeki carry
  // ZERO other edges); a diagram mixing note connectors with real
  // relationships needs `Bibliotekon#addLine`'s `sameConnections` insertion
  // (`Bibliotekon.java:83-107`) -- untouched, a named residual
  // (`.agent-notes/cdd-T9.md`). cdd-T9b: style/id/entity-order/uid now fully
  // resolved by `renderer-note-connector.ts#renderNoteConnectorLink` -- see
  // that function's own doc comment for why it must run AFTER `linkIds` is
  // populated above.
  for (const connector of noteConnectors) {
    children.push(renderNoteConnectorLink(connector, theme, uidPlan, linkIds));
  }

  // SI14 T4 (ADR-2): de-dup usecase/actor fragment defs (e.g. gradients)
  // across nodes before folding into the diagram-wide defs string.
  const mergedUsymbolDefs = mergeFragmentDefs(usymbolEntityFragments);
  if (mergedUsymbolDefs !== undefined) extraDefs += mergedUsymbolDefs;

  return {
    // G2 N61: the single monochrome choke point -- see `class-monochrome.ts`'s
    // own header doc comment for why a post-processing pass over the WHOLE
    // assembled fragment (rather than threading `theme.monochrome` through
    // every individual color-resolution call site) is the correct, low-risk
    // mirror of jar's real universal `ColorMapper` semantics. No-op when
    // `theme.monochrome` is `undefined` (every fixture that doesn't set this
    // skinparam is byte-identical to pre-N61 output).
    body: applyMonochromeToFragment(children.join(''), theme.monochrome),
    width: geo.totalWidth,
    height: geo.totalHeight,
    background: canonicalBackground,
    ...(extraDefs.length > 0 ? { extraDefs } : {}),
    // G2 N46: pre-margin/pre-quirk ink dims, present only when
    // `assembleShiftedGeometry` computed them (`ClassGeometry.rawWidth`'s
    // own doc comment) -- `core/annotations/chrome.ts#applyChrome` uses
    // these (not `width`/`height` above) as the chrome-composition
    // "original" size, and `index.ts#applyAnnotationChrome`'s class branch
    // re-applies the document margin/quirk to chrome's own output.
    ...(geo.rawWidth !== undefined && geo.rawHeight !== undefined
      ? { preChromeWidth: geo.rawWidth, preChromeHeight: geo.rawHeight }
      : {}),
    // G2 N48: see this function's own doc comment above -- drawn by
    // `core/assemble-svg.ts`'s class finalize function at the FINAL
    // (post-chrome) canvas size, not here.
    ...(documentBackgroundRect !== undefined ? { documentBackgroundRect } : {}),
    // G2 N66: `skinparam diagramBorderColor` -- resolved to an SVG-ready
    // hex HERE (mirrors `canonicalBackground`'s own resolution), drawn by
    // `core/assemble-svg.ts`'s class finalize function
    // (`RenderFragment.diagramBorderColor`'s own doc comment for the
    // chrome-scope guard).
    ...(theme.colors.graph.diagramBorderColor !== undefined
      ? { diagramBorderColor: resolveColorToSvgHex(theme.colors.graph.diagramBorderColor) }
      : {}),
    diagramType: DIAGRAM_TYPE_CLASS,
  };
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
