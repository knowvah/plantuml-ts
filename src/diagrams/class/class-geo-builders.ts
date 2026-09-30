/**
 * class-geo-builders.ts — pure `ClassifierGeo`/`NamespaceGeo`/`EdgeGeo`
 * builders + the degenerate single-classifier skip, split out of
 * `layout.ts` to keep that file under the project's per-file size cap
 * (mirrors the existing `class-layout-helpers.ts` split precedent — see
 * `layout.ts`'s own file-header doc comment). Every function here was
 * originally a verbatim move; G2 N17 changed `buildNamespaceGeos`'s
 * footprint formula (was an invented flat padding, now the jar-verified
 * folder-tab-driven formula — see `class-namespace-shape.ts`).
 */
import type { ClassDiagramAST, Classifier } from './ast.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { MeasuredClassifier } from './class-layout-helpers.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { namespaceFolderTitle } from './class-namespace-title-table.js';
import { buildClusterHeaderStereo } from './class-cluster-header.js';
import { resolveStyleStereotypeTags, stereotypeLabelFields, splitStereotypeStyleTags } from './class-stereotype.js';
import { applyClassDocumentMargin } from './layout-ink-extent.js';
import { drawnEnhancedBodyEmbeds } from './class-ink-box.js';
import { namespaceDrawnInk } from './class-namespace-title-ink.js';
import { degenerateNoteGeo, DEGENERATE_NEAR_MARGIN } from './class-geo-builders-degenerate-note.js';
import { degenerateEnsureVisibleInk } from './class-geo-builders-degenerate-ink.js';
import {
  inkBodyFields,
  badgeFields,
  protectedBorderField,
  assocCircleBookkeepingFields,
} from './class-geo-builders-fields.js';
import type { ClassifierGeo, NamespaceGeo, ClassGeometry } from './layout.js';
import { clusterFrontierBox, graphvizClusterBoxes, stampEntityPortLeaves } from './class-geo-builders-port.js';
import { resolveNamespaceInkShape } from './class-namespace-ink-shape.js';

/**
 * The drawn box for a laid-out leaf — `SvekNode#getRectangleArea()`
 * (svek/SvekNode.java:380), which is ALWAYS `minXY + the IMAGE dimension`,
 * never graphviz's node size.
 *
 * For every ordinary shape the two agree, because the jar emits an explicit
 * `width=`/`height=` and graphviz honours it. A `RECTANGLE_HTML_FOR_PORTS`
 * node is the exception (B1/M4): it is emitted with NO width/height, so
 * graphviz pads the label by 4·GAP x 2·GAP and floors it at 54x36, making the
 * node strictly larger than the entity. The jar never sees that padded box —
 * `DotStringFactory#solve:386-389` takes the minXY of the rendered TABLE
 * polygon, i.e. the label's own top-left, and `moveDelta`s the node there,
 * keeping `getWidth()`/`getHeight()` at the measured image dimension.
 * Graphviz centres the label inside the padded node, so that top-left is the
 * node centre minus half the image — which is what this reconstructs.
 *
 * The padding is therefore SPACING that keeps neighbours apart, and is
 * deliberately NOT drawn.
 *
 * Gated on `kind === 'map'`, which must track `class-port-rows.ts
 * #applyShapeAndPorts`'s own `portRows` gate: every OTHER kind whose DOT node
 * size differs from `measured` differs on purpose and must keep the laid-out
 * box — a `lollipop`/`assoc-circle` is a fixed 10x10/4x4 with its generic text
 * measurement discarded, and an `EntityImageProtected` class is measured+2x20
 * because upstream's image dimension genuinely includes that border
 * (`EntityImageProtected.java:77-79`).
 */
function contentBox(
  classifier: Classifier,
  pos: DotLayoutResult['nodes'][number],
  measured: MeasuredClassifier,
): { x: number; y: number; width: number; height: number } {
  if (classifier.kind !== 'map') {
    return { x: pos.x, y: pos.y, width: pos.width, height: pos.height };
  }
  return {
    x: pos.x + (pos.width - measured.width) / 2,
    y: pos.y + (pos.height - measured.height) / 2,
    width: measured.width,
    height: measured.height,
  };
}

/** {@link buildClassifierGeos}'s trailing options -- bundled to stay under
 *  this repo's 5-param cap once `protectedIds` (cdd-B10FU) joined
 *  `hiddenIds`/`theme`. */
export interface ClassifierGeoOptions {
  hiddenIds: ReadonlySet<string>;
  theme: Theme;
  /** cdd-B10FU: the SAME set `class-dot-graph.ts#buildDotGraph` already
   *  returns and `buildEdgeGeos` already threads via
   *  `EdgeGeoTextContext.protectedIds` -- gates `ClassifierGeo
   *  .protectedBorder` (see that field's own doc comment). */
  protectedIds: ReadonlySet<string>;
}

/**
 * Build ClassifierGeo entries from pre-measured sizes + dot-assigned
 * positions.
 *
 * mission skin-file-loading (deferred D3 item): `theme` is a NEW param,
 * consumed ONLY for `shadowing` (`drawsBorderedBox` below) -- every other
 * field's derivation is unchanged (theme-independent, pre-existing).
 */
export function buildClassifierGeos(
  ast: ClassDiagramAST,
  measuredMap: Map<string, MeasuredClassifier>,
  posMap: Map<string, DotLayoutResult['nodes'][number]>,
  options: ClassifierGeoOptions,
): ClassifierGeo[] {
  const classifiers: ClassifierGeo[] = [];
  for (const classifier of ast.classifiers) {
    const pos = posMap.get(classifier.id);
    const measured = measuredMap.get(classifier.id);
    if (pos === undefined || measured === undefined) continue;

    classifiers.push({
      id: classifier.id,
      kind: classifier.kind,
      ...contentBox(classifier, pos, measured),
      dividerYs: measured.dividerYs,
      rows: measured.rows,
      ...protectedBorderField(classifier, options.protectedIds),
      ...(measured.headerRowCount !== undefined ? { headerRowCount: measured.headerRowCount } : {}),
      ...(measured.nameRowCount !== undefined ? { nameRowCount: measured.nameRowCount } : {}),
      ...badgeFields(measured),
      ...inkBodyFields(measured),
      ...(measured.genericTag !== undefined ? { genericTag: measured.genericTag } : {}),
      ...(measured.folderTab !== undefined ? { folderTab: measured.folderTab } : {}),
      ...(measured.enhancedBody !== undefined ? { enhancedBody: measured.enhancedBody } : {}),
      ...(measured.jsonBody !== undefined ? { jsonBody: measured.jsonBody } : {}),
      ...(classifier.hideCircle === true ? { hideCircle: true } : {}),
      ...(classifier.usymbol !== undefined ? { usymbol: classifier.usymbol } : {}),
      ...(classifier.creationIndex !== undefined ? { creationIndex: classifier.creationIndex } : {}),
      ...(classifier.url !== undefined ? { url: classifier.url } : {}),
      ...(classifier.color !== undefined ? { color: classifier.color } : {}),
      ...(classifier.syntheticIdName !== undefined ? { syntheticIdName: classifier.syntheticIdName } : {}),
      ...(classifier.phantomSlot === true ? { phantomSlot: true as const } : {}),
      ...(classifier.noUidSlot === true ? { noUidSlot: true as const } : {}),
      ...assocCircleBookkeepingFields(classifier),
      ...(options.hiddenIds.has(classifier.id) ? { hidden: true } : {}),
      ...stereotypeLabelFields(classifier),
      ...(classifier.styleGeneration !== undefined ? { styleGeneration: classifier.styleGeneration } : {}),
      // mission skin-file-loading (deferred D3 item): see
      // `ClassifierGeo.shadowing`'s doc comment (class-geo-types.ts) for the
      // full jar-verified mechanism the `drawsBorderedBox` gate reproduces.
      ...(options.theme.shadowing !== undefined && options.theme.shadowing > 0 && drawsBorderedBox(classifier, measured)
        ? { shadowing: options.theme.shadowing }
        : {}),
    });
  }
  return classifiers;
}

/**
 * True for every classifier kind that reaches `renderer-classifier-box.ts
 * #renderClassifierBox`'s bordered-rect draw path -- mirrors `renderer.ts
 * #renderClassifier`'s own dispatch order EXACTLY (assoc-circle and a
 * folder-tab leaf are unwrapped BEFORE `renderClassifier` is ever called,
 * `renderer.ts`'s own classifier-loop comments; lollipop and a
 * `tryRenderUSymbol`-served icon kind decline inside it). See
 * `ClassifierGeo.shadowing`'s own doc comment for why only THESE kinds are
 * eligible (jar draws the shadow via `EntityImageClass`/`Object`/`Map`/
 * `Json`'s shared `setDeltaShadow` on the outer bordered rect -- a
 * different jar image class, with no shadow, draws every other kind here).
 */
function drawsBorderedBox(classifier: ClassDiagramAST['classifiers'][number], measured: MeasuredClassifier): boolean {
  if (classifier.kind === 'assoc-circle' || classifier.kind === 'lollipop') return false;
  if (measured.folderTab !== undefined) return false;
  if (classifier.kind === 'usecase') return false;
  if (classifier.usymbol !== undefined) return false;
  return true;
}

/** One entry of `DotLayoutResult.clusters` — the real graphviz-returned
 *  cluster polygon, keyed by our synthetic `clusterN` id. */
type ClusterBox = NonNullable<DotLayoutResult['clusters']>[number];

/**
 * One namespace's geo from its already-laid-out cluster box -- split out of
 * `buildNamespaceGeos` to keep that function under the per-function NLOC cap.
 * `x`/`y`/`width`/`height` are `box` verbatim (no padding), mirroring
 * `Cluster#setPosition` (Cluster.java:511-512). `wtitle`/`htitle`/
 * `baselineOffset` are unchanged from before T5: still pre-computed here so
 * the render phase never needs its own `StringMeasurer` (see `NamespaceGeo`'s
 * own doc comment in `layout.ts`).
 *
 * T7 (`plans/namespace-cluster-box/`) investigated reading `baselineOffset`
 * from `box.label` (the layout-placed title-table reservation @knowvah/
 * dot-engine now publishes, `ClusterGeometry.label` per docs/graphviz-issues/
 * 14's RESOLVED note) instead of `getTitleBaselineOffset`'s fixed-offset
 * re-derivation. **Deliberately NOT wired in** -- read the Java first:
 * `Cluster#setTitlePosition`/`xyTitle` (`DotStringFactory.java:436-439`,
 * the mechanism the issue cites) is consumed ONLY by `Cluster#drawUState`
 * and `#drawSwinLinesState` (state-diagram/swimlane draw paths,
 * `Cluster.java:439,497`) -- NEVER by `ClusterDecoration.drawU`, the path
 * `buildNamespaceGeos` mirrors for a class/object package. That path calls
 * `asBig.drawU(ug.apply(rectangleArea.getPosition()))`
 * (`ClusterDecoration.java:78`), and `USymbolFolder#asBig` draws the title
 * at a FIXED local `(4, 2)` (`USymbolFolder.java:228`) -- a property of the
 * shape's own draw routine, independent of wherever graphviz placed the
 * title-table reservation. Measured directly: `@knowvah/dot-engine` places
 * that reservation ~4px below the cluster box's own top (verified via a
 * standalone probe at both `innerMarginLevels` 1 and 2: `box.y=16,
 * label.y=24.5, label.height=9` -> `label.y - label.height/2 - box.y = 4`),
 * not jar's real 2px -- wiring it in shifts every titled namespace's
 * `<text>` down by the 2px difference and cost 333 matched shapes on the
 * full corpus (`scripts/shape-match-report.ts`: 25403 -> 25070, doc-size-
 * exact held at 769/1073), confirming the mechanism empirically. The
 * `label` field IS surfaced through the seam (`graph-layout.ts#mapClusters`,
 * `graph-layout-result.types.ts`) for a consumer that genuinely needs
 * graphviz's placed position -- state's `drawUState`-equivalent composite
 * title, not this one.
 */
function namespaceGeoFromBox(
  ns: ClassDiagramAST['namespaces'][number],
  box: ClusterBox,
  theme: Theme,
  measurer: StringMeasurer,
  inkShape: NamespaceGeo['inkShape'],
): NamespaceGeo {
  return {
    id: ns.id,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    label: ns.display,
    // cdd6-T3d: over `ClusterHeader#getTitle()` (icon + text, java:130-138).
    ...namespaceFolderTitle(ns, theme, measurer),
    ...(ns.creationIndex !== undefined ? { creationIndex: ns.creationIndex } : {}),
    ...(inkShape !== undefined ? { inkShape } : {}),
    // cdd-T12/cdd3-T21: carry-only copies -- see `class-geo-namespace-types.ts`.
    ...(ns.stereotype !== undefined ? { stereotypeTags: splitStereotypeStyleTags(ns.stereotype) } : {}),
    ...(ns.usymbol !== undefined ? { usymbol: ns.usymbol } : {}),
    ...(ns.color !== undefined ? { color: ns.color } : {}),
    ...(ns.url !== undefined ? { url: ns.url } : {}),
  };
}

/** `buildNamespaceGeos`'s inputs beyond the AST -- bundled into one object
 *  (5-param hook cap) once T31 round 2 added `hiddenIds` as a 6th. */
export interface NamespaceGeoInputs {
  theme: Theme;
  measurer: StringMeasurer;
  clusters: DotLayoutResult['clusters'];
  clusterIdByNs: ReadonlyMap<string, string>;
  /** cdd-T31 round 2 (E5 defect b): see `NamespaceGeo.hidden`'s own doc
   *  comment -- same `computeHiddenIds` set `buildClassifierGeos` already
   *  consumes, just also threaded here. */
  hiddenIds: ReadonlySet<string>;
  /** cdd7-T2a: the laid-out leaves (`buildClassifierGeos`) -- the port
   *  frontier's `insides`/`points` (`Cluster.java:412-417`); port leaves get
   *  `entityPortUp`/`symbolInk` stamped (`class-geo-builders-port.ts`). */
  leaves?: readonly ClassifierGeo[];
}

/**
 * Build NamespaceGeo entries by READING the box graphviz already computed,
 * mirroring `DotStringFactory.java:425-433`: upstream does not compute a
 * package box, it scrapes the rendered `clusterN` polygon (`getMinXY`/
 * `getMaxXY`, no padding) and stores it verbatim (`Cluster#setPosition`,
 * Cluster.java:511-512). The box is looked up via `clusterIdByNs` (T4,
 * `class-dot-graph.ts#buildDotClusters`) -- no member-bbox walk, no padding
 * constants (T5, `plans/namespace-cluster-box/decisions.md#3`).
 *
 * A namespace with no matching cluster entry is skipped, exactly as the old
 * "no member positions" skip was -- decision 3 governs the no-cluster case
 * (T6 proves no namespace draws a box while having no cluster).
 */
export function buildNamespaceGeos(ast: ClassDiagramAST, inputs: NamespaceGeoInputs): NamespaceGeo[] {
  const { theme, measurer, hiddenIds } = inputs;
  const leaves = inputs.leaves ?? [];
  // cdd7-T2a: `Cluster.rectangleArea` per namespace, as mutated so far.
  const boxes = graphvizClusterBoxes(ast, inputs.clusters ?? [], inputs.clusterIdByNs);
  const namespaces: NamespaceGeo[] = [];
  for (const ns of ast.namespaces) {
    const graphvizBox = boxes.get(ns.id);
    if (graphvizBox === undefined) continue;
    // cdd7-T2a (D4): `Cluster.java:344-345` -- see `class-geo-builders-port.ts`.
    const box = clusterFrontierBox(ns, graphvizBox, { ast, boxes, leaves, theme, measurer });
    boxes.set(ns.id, box);
    const geo = namespaceGeoFromBox(ns, box, theme, measurer, resolveNamespaceInkShape(theme, ns.usymbol));
    const header = buildClusterHeaderStereo(ns, ast, theme, measurer); // cdd2-T19b: ClusterHeader#getStereo
    if (header !== undefined) geo.clusterHeaderStereo = header;
    Object.assign(geo, namespaceDrawnInk(geo, theme, measurer)); // cdd3-T31: E1-2/E2-8, E1-5
    namespaces.push(hiddenIds.has(ns.id) ? { ...geo, hidden: true } : geo);
  }
  stampEntityPortLeaves(ast, leaves, namespaces, { theme, measurer });
  return namespaces;
}

// Edge geometry moved to a sibling module (line cap); re-exported.
export { buildEdgeGeos } from './class-edge-geo.js';

/**
 * `EntityImageDegenerated.java`: `delta = 7`, applied as a translate on
 * BOTH edges (`drawU`: `orig.drawU(ug.apply(new UTranslate(delta,
 * delta)))`, then an empty `(delta, delta)` block appended at the far
 * corner) -- so `calculateDimension` grows by `delta*2 = 14` total. A
 * FURTHER flat +6 (both axes) is added upstream of `GraphvizImageBuilder`
 * (page-level margin; exact Java origin not pinned this iteration): total
 * near-edge margin (left/top) = 7; far-edge margin (right/bottom) = 13.
 * Jar's own canvas `width`/`height`/`viewBox` are whole-pixel, even though
 * internal element geometry stays fractional -- G2 N4: the whole-pixel
 * conversion is TRUNCATION (`Math.floor`), NOT rounding -- N3's own
 * `Math.round` was verified against only integer/near-integer totals (68
 * exactly, twice) and one width whose fractional part happened to be < 0.5,
 * masking the direction; jar-verified with ZERO residual against 7 fresh
 * fixtures whose fractional part is >= 0.5 (e.g. `dimile-20-saki799`:
 * `54.575 + 20 = 74.575` -> jar `74`, NOT the `75` `Math.round` would
 * produce -- `plans/g2-class-svg/ledger.md` N4). G2 N48: the far-edge
 * margin (13 = near-edge delta 7 + `applyClassDocumentMargin`'s own `5 + 1`
 * recipe) is no longer a separate literal -- computed via
 * `applyClassDocumentMargin` directly in {@link degenerateClassifierDims},
 * the SAME shared recipe the main DOT-driven path uses (see that
 * function's own return-statement doc comment for the value-preserving
 * proof). Split out of {@link degenerateSingleClassifier} purely to keep
 * that function under the project's per-function NLOC cap (R2j precedent).
 */
function buildDegenerateClassifierLeaf(classifier: Classifier, measured: MeasuredClassifier): ClassifierGeo {
  return {
    id: classifier.id,
    kind: classifier.kind,
    x: DEGENERATE_NEAR_MARGIN,
    y: DEGENERATE_NEAR_MARGIN,
    width: measured.width,
    height: measured.height,
    dividerYs: measured.dividerYs,
    rows: measured.rows,
    ...(measured.headerRowCount !== undefined ? { headerRowCount: measured.headerRowCount } : {}),
    ...(measured.nameRowCount !== undefined ? { nameRowCount: measured.nameRowCount } : {}),
    ...badgeFields(measured),
    ...inkBodyFields(measured),
    ...(measured.genericTag !== undefined ? { genericTag: measured.genericTag } : {}),
    ...(measured.folderTab !== undefined ? { folderTab: measured.folderTab } : {}),
    ...(measured.enhancedBody !== undefined ? { enhancedBody: measured.enhancedBody } : {}),
    ...(measured.jsonBody !== undefined ? { jsonBody: measured.jsonBody } : {}),
    ...(classifier.hideCircle === true ? { hideCircle: true } : {}),
    ...(classifier.usymbol !== undefined ? { usymbol: classifier.usymbol } : {}),
    ...(classifier.url !== undefined ? { url: classifier.url } : {}),
    ...(classifier.color !== undefined ? { color: classifier.color } : {}),
    ...(classifier.stereotype !== undefined ? { stereotypeLabels: resolveStyleStereotypeTags(classifier) } : {}),
    ...(classifier.styleGeneration !== undefined ? { styleGeneration: classifier.styleGeneration } : {}),
  };
}

/**
 * G2 N48 (item 24): expose `rawWidth`/`rawHeight` (the PRE-`applyClass
 * DocumentMargin` ink dims, `ClassGeometry.rawWidth`'s own doc comment) so a
 * titled/legend'd/etc degenerate-single-classifier diagram's chrome centers
 * against the SAME raw value the main DOT-driven path already does (N46)
 * instead of silently falling back to the POST-margin `totalWidth`/
 * `totalHeight` -- jar-verified `dipune-93-sare489`/`farinu-74-fuco238`/
 * `takeze-87-zuge906` (all single-classifier, titled): centering the title
 * against the OLD `totalWidth` produced `x=18.7875`, 2.8937px right of
 * jar's real `x=15.8938`; `rawWidth` here reuses the EXACT SAME
 * `applyClassDocumentMargin` recipe the main path calls, so `totalWidth`/
 * `totalHeight`'s OWN numeric value is unchanged for every no-chrome
 * degenerate fixture (jar-verified unchanged: `bovuze-89-noja934`).
 *
 * CDD B7FU-R2 item (e): a body whose DRAWN embedded `{{ }}` diagram
 * overflows its own (42,42)-fallback-sized row reservation still pushes the
 * canvas out to its real footprint -- `SvgGraphics#svgImageUnsecure`'s own
 * `ensureVisible` calls (`klimt/drawing/svg/SvgGraphics.java:987-999`) track
 * a drawn embed's REAL absolute corner directly, `Math.floor(v)+1`,
 * independent of the `CucaDiagram`-margin recipe `applyClassDocumentMargin`
 * folds into `totalDims` -- so the embed's contribution is a MAX against
 * the box-driven total, never routed through that recipe a second time
 * (jar-verified `zikabo-17-gugi332`/`gadufu-56-votu808`). `drawnEnhanced
 * BodyEmbeds` returns `[]` (a no-op) for every classifier with no drawn
 * embed -- the overwhelming majority of degenerate diagrams.
 *
 * cdd5-T4a/cdd6-T2c (D4, degenerate-text-ensurevisible): the SAME
 * `ensureVisible` mechanism (`SvgGraphics.java:129-133`,`:757-758`) ALSO
 * tracks a `symbolInk`-bearing leaf's own real drawn corner -- e.g. a
 * `circle`/`() "name"` interface's label drawn BELOW its fixed 18x18 icon
 * (`measureCircleInterfaceInk`), or a `frame X [ {{ nested }} ]`'s embedded
 * raster -- which the box-only `rawDims` below never sees. Folded into the
 * SAME embed-right/embed-bottom max via {@link degenerateEnsureVisibleInk}
 * (NOT `symbolInk` directly -- see that function's own doc comment for why
 * the two disagree); `undefined` contributes `0`, a no-op matching
 * `drawnEnhancedBodyEmbeds`'s established contract. `rawWidth`/`rawHeight`
 * stay box-only: no fixture combines a title/chrome with a symbolInk
 * overflow, so extending them the same way would be unverified.
 */
function degenerateClassifierDims(geo: ClassifierGeo, measured: MeasuredClassifier): ClassGeometry {
  const rawDims = {
    width: measured.width + DEGENERATE_NEAR_MARGIN * 2,
    height: measured.height + DEGENERATE_NEAR_MARGIN * 2,
  };
  const totalDims = applyClassDocumentMargin(rawDims);
  const embeds = drawnEnhancedBodyEmbeds(geo);
  const embedRight = Math.max(0, ...embeds.map((e) => e.x + e.width));
  const embedBottom = Math.max(0, ...embeds.map((e) => e.y + e.height));
  const ensureVisible = degenerateEnsureVisibleInk(measured);
  const inkRight = ensureVisible !== undefined ? geo.x + ensureVisible.maxX : 0;
  const inkBottom = ensureVisible !== undefined ? geo.y + ensureVisible.maxY : 0;
  return {
    totalWidth: Math.max(totalDims.width, Math.floor(embedRight) + 1, Math.floor(inkRight) + 1),
    totalHeight: Math.max(totalDims.height, Math.floor(embedBottom) + 1, Math.floor(inkBottom) + 1),
    rawWidth: rawDims.width,
    rawHeight: rawDims.height,
    leaves: [geo],
    edges: [],
    namespaces: [],
  };
}

/**
 * `GraphvizImageBuilder.buildImage:211-223` gates graphviz entirely on
 * `dotData.isDegeneratedWithFewEntities(nb)` (`dot/DotData.java:69-71`):
 * `entityFactory.groups().size() == 0 && getLinks().size() == 0 &&
 * getLeafs().size() == nb`. "Groups" means ANY declared namespace/package —
 * even an empty one still creates a group entity -- `rawNamespaceCount`
 * (`ast.namespaces.length`, read BEFORE this port's `collapseEmptyNamespaces
 * Final`, layout.ts's own call-site doc comment) is the exact raw-group
 * proxy; no "non-empty namespace" filtering like `buildDotClusters` applies
 * here, and unlike `ast.namespaces.length` on the (possibly-collapsed) `ast`
 * param below, it stays accurate for a namespace this port's parse-time
 * collapse has already muted to a leaf (cdd5-T4a degenerate-check-after-
 * group-mute — upstream defers the SAME mute to DOT-export time,
 * `svek/GraphvizImageBuilder.java:416-418`, strictly AFTER this gate).
 * "Leafs" (`CucaDiagram#leafs()`) counts every non-group entity, INCLUDING
 * notes (`LeafType.NOTE` created via `reallyCreateLeaf`) -- so a class with
 * one attached or floating note is NOT degenerate (2 leafs), but a LONE
 * note (0 classifiers, 1 note) IS (cdd5-T4a degenerate-excludes-notes):
 * see {@link degenerateNoteGeo}.
 *
 * cdd6-T2c (D4, mechanism A, `empty usymbol { }` containers): a `queue`/
 * `frame`/`stack`/etc container with NO members is collapsed to a LEAF at
 * PARSE time by this port (`class-container.ts#closeContainer` ->
 * `class-namespace.ts`'s `collapseEmptyNamespace`, stamping
 * `Classifier.collapsedGroup = true`), so it is already gone from
 * `ast.namespaces` here and `rawNamespaceCount` alone misses it. Upstream
 * counts it as a GROUP regardless -- `dot/DotData.java:69-70` reads the
 * group count BEFORE the mute to `EMPTY_PACKAGE`, deferred to DOT-export
 * time (`svek/GraphvizImageBuilder.java:416-418`, strictly AFTER this
 * gate) -- so `collapsedGroup === true` is the "was a group pre-collapse"
 * proxy. Jar-verified: febuli-89/fezaro-08 become byte-conformant once
 * excluded (`diagnosis/verify.md`'s "empty usymbol containers"); beboke-62
 * needs this PLUS its own queue-cap residual (`USymbolQueue.ts`).
 *
 * The single-*classifier* leaf case (the `nb === 1` path:
 * `createEntityImageBlock` + the hexagon guard at
 * `GraphvizImageBuilder.java:217`, `single.getUSymbol() instanceof
 * USymbolHexagon == false`) delegates to {@link buildDegenerateClassifierLeaf}
 * + {@link degenerateClassifierDims}.
 */
export function degenerateSingleClassifier(
  ast: ClassDiagramAST,
  measuredMap: Map<string, MeasuredClassifier>,
  rawNamespaceCount: number,
  theme: Theme,
  measurer: StringMeasurer,
): ClassGeometry | undefined {
  if (rawNamespaceCount !== 0) return undefined;
  if (ast.classifiers.some((c) => c.collapsedGroup === true)) return undefined;
  if (ast.relationships.length !== 0) return undefined;
  if (ast.classifiers.length + ast.notes.length !== 1) return undefined;
  if (ast.notes.length === 1) return degenerateNoteGeo(ast.notes[0]!, theme, measurer);
  const classifier = ast.classifiers[0]!;
  if (classifier.kind === 'descriptive' && classifier.usymbol === 'hexagon') return undefined;
  const measured = measuredMap.get(classifier.id)!;
  const geo = buildDegenerateClassifierLeaf(classifier, measured);
  return degenerateClassifierDims(geo, measured);
  // #lizard forgives — flat chain of early-return guards encoding upstream's
  // single conjunctive predicate (isDegeneratedWithFewEntities) plus the
  // hexagon exclusion, mirroring description's degenerateSingleLeaf; not
  // reducible without splitting one upstream check across functions.
}
