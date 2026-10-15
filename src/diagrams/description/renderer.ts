/**
 * renderer.ts — T17: klimt-backed public entry point for the description
 * (component/use-case/deployment) diagram engine. Replaces the pre-T17
 * `core/svg.ts`-based renderer (which delegated node drawing to the
 * now-deleted `renderer-helpers.ts`) with a real `UGraphicSvg` document,
 * assembled from the T10-T16 klimt/svek port: `renderer-uid.ts` (uid
 * assignment), `renderer-cluster.ts` (container chrome via `Cluster`),
 * `renderer-entity.ts` (leaf chrome via `EntityImageDescription`), and
 * `renderer-edge.ts` (edges via `SvekEdge`).
 *
 * Draw order mirrors upstream `SvekResult#drawU`
 * (svek/SvekResult.java:70-107) exactly: every cluster first
 * (`Bibliotekon#allCluster()`, creation/declaration order — see
 * `renderer-uid.ts`'s doc comment for why a pre-order tree walk
 * reproduces that order), then every leaf node (`allNodes()`), then every
 * edge (`allLines()`). A cluster's own `drawU` resolves its absolute
 * position internally (`renderer-cluster.ts`); a leaf entity is drawn
 * translated to its absolute position by this module, matching
 * `SvekResult#drawU`'s own `image.drawU(ug2.apply(new UTranslate(minX,
 * minY)))` call for `SvekNode`s (`renderer-entity.ts`).
 *
 * SVG document preamble (`SvgOption`) mirrors upstream's
 * `TextBlockExporter#createUGraphicSVG` (net/sourceforge/plantuml/core/
 * TextBlockExporter.java:281-308): `minDim` = the diagram's own computed
 * image dimension — `SvekResult#calculateDimension` + the `CucaDiagram`
 * outer margin (G0/T3, `renderer-ink-extent.ts#computeDocumentDims`; NOT
 * `geo.totalWidth`/`totalHeight` as of this task — see that module's own
 * doc comment for the full recipe and the F4 defect it fixes). Upstream's
 * `SvgGraphics` derives the FINAL emitted width/height from the union of
 * every drawn shape's own extent via `ensureVisible`, not from `minDim`
 * directly; `minDim` is a floor that, for the description engine's
 * typical content, is the binding constraint (verified: real drawn ink
 * for the F4 fixtures falls well short of `minDim`, so `minDim` — not
 * per-shape `ensureVisible` growth — determines the final document size).
 * `backcolor` = the diagram's resolved background paint, and
 * `rootAttributes` carries `data-diagram-type` = `diagramType.name()`
 * (`DiagramType.DESCRIPTION` — verified against `DiagramType.java:45`;
 * matches every description-diagram jar fixture, e.g.
 * `test-results/dot-cache/component/sacuso-94-gugi476/in.svg`'s
 * `data-diagram-type="DESCRIPTION"`). `version` is `'$version$'` (D4′,
 * `svg-graphics-core.ts`'s own doc comment) — every cached jar fixture
 * carries this literal placeholder token, not a real version string.
 *
 * `driverBounderFor` (moved to `renderer-ink-extent.ts` as of G1b/J1, so
 * `layout-ink-shift.ts#computeInkShift` can share it -- see that function's
 * own doc comment there for why): wires `UGraphicSvg`'s
 * `DriverTextSvg`-scoped `StringBounder` seam (`driver-text-svg.ts`,
 * width-only) to whichever `StringMeasurer` this render call was given, so
 * the `<text>` `textLength` attribute agrees with the same measurer that
 * already sized every entity/cluster during layout
 * (`src/index.ts`'s `resolveMeasurer`) — an un-wired mismatch would
 * silently desync draw-time text width from layout-time text width.
 * Local adapter, not a new shared module: every other klimt conformance
 * test (`entity-image-description.test.ts`, `symbols-component.test.ts`)
 * independently defines the identical shape for the identical reason.
 *
 * `measurer` param (this task — dual-measurer conformance/ratchet seam,
 * decision-journal 2026-07-10 "DUAL MEASURER"): defaults to `jarMeasurer`
 * for hand-built geometries. cdd3-T28 (E3-9): the public plugin path
 * (`descriptionPlugin.render`, `src/index.ts#renderSync`) now passes the
 * layout's own measurer (`DescriptionGeometry.measurer`) -- the default had
 * drawn `textLength` with `jarMeasurer` while layout used the renderSync
 * measurer (`sokevu-87-toce485`: 92.962 vs the jar's 81.55). The conformance/ratchet render
 * path (survey/census scripts) calls `renderDescription(geo, theme,
 * new DeterministicMeasurer())` directly, bypassing the public
 * `SyncPlugin#render(geo, theme)` two-arg contract (which has no measurer
 * param — same established pattern this module's own doc comment already
 * cites for `scripts/dot-sync-report.ts`'s oracle-DOT-emission measurer).
 * Threaded to EXACTLY ONE place: `UGraphicSvg.build`'s `stringBounder`
 * (draw-time `textLength`, via `driverBounderFor`) AND its 5th `measurer`
 * param (draw-time `getStringBounder()` width/height/descent — see that
 * method's own doc comment for the bug this fixes). This is deliberately
 * the ONLY injection point beyond `layoutSync`'s own pre-existing
 * `measurer` param (maintainer course-correction, 2026-07-10: no
 * prop-drilling through `drawEntity`/`EntityImageDescription`/
 * `buildTextBlock` — every draw-time text measurement reads the active
 * measurer off `ug.getStringBounder()`, which this render call already
 * populated, mirroring upstream's own pattern of threading `StringBounder`
 * via the `UGraphic` itself rather than as a separate parameter). Clusters/
 * edges do not read a measurer anywhere in this port (verified:
 * `renderer-cluster.ts`/`renderer-edge.ts`/`renderer-uid.ts` have zero
 * `jarMeasurer`/`StringMeasurer` references) — their geometry is already
 * fully fixed by the layout pass.
 */

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import type { Theme } from '../../core/theme.js';
import type { DescriptionGeometry } from './layout.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { jarMeasurer } from '../../core/measurer-jar.js';
import { buildUidPlan } from './renderer-uid.js';
import { collectByKind, drawClusters, drawEntities, drawEdges } from './renderer-draw-sequence.js';
import { computeDocumentDims, driverBounderFor } from './renderer-ink-extent.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
import { CUCA_DOCUMENT_MARGIN, calculateMargin, type DocumentMargin } from '../../core/document-margin.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { extractViewBoxDims, extractFlatContent, VERSION_PLACEHOLDER } from '../../core/klimt/document-shell.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';

/** `net.sourceforge.plantuml.core.DiagramType#DESCRIPTION` — verified
 *  against `DiagramType.java:45` and every cached jar description-diagram
 *  fixture's `data-diagram-type` attribute. */
const DIAGRAM_TYPE_DESCRIPTION = 'DESCRIPTION';

/**
 * `GraphvizImageBuilder.buildImage:211-222` (`DotData
 * .isDegeneratedWithFewEntities`): a diagram with zero groups, zero links,
 * and exactly one root leaf (excluding hexagons, which "take the normal
 * svek path" per that same upstream method) never reaches `SvekResult` at
 * all — it is drawn as `EntityImageDegenerated`
 * (svek/EntityImageDegenerated.java), a COMPLETELY DIFFERENT class with
 * its own, unrelated dimension formula: `orig.calculateDimension(sb)
 * .delta(14, 14)` (`delta=7` doubled, svek/EntityImageDegenerated.java:52,
 * 74) — the leaf's OWN natural size plus a flat (7,7) draw-position
 * offset on each side — THEN the same `CucaDiagram` outer margin
 * (`renderer-ink-extent.ts`'s doc comment) on top, same as every other
 * cuca-family diagram. This port's own `degenerateSingleLeaf`
 * (`layout-helpers.ts:413-455`, mirroring the SAME upstream predicate)
 * already computes `geo.totalWidth`/`totalHeight` as `dims.width +
 * LAYOUT_MARGIN_LEADING(7) + LAYOUT_MARGIN(12)` — `7+12=19` = upstream's
 * `14 + 5` (delta*2 + the CucaDiagram right/bottom margin) EXACTLY — so
 * `geo.totalWidth`/`totalHeight` is ALREADY the correct, jar-verified
 * `minDim` for this one shape of geometry (jar-verified: `buduni-98-
 * bima526`/`vacuxi-18-baxu582`/`vumija-03-xise495`/`majuma-84-loma401`/
 * `kevipe-39-gaji640`, the five `oracle/goldens/svg-description/
 * ratchet.json`-pinned fixtures, all single-leaf/no-edge diagrams). The
 * `computeDocumentDims` SvekResult recipe (this module's other doc
 * comment) must NOT run for these — it would apply the WRONG formula
 * (jar-verified: 1px too large in each dimension, since `EntityImage
 * Degenerated`'s `+14` plus a `+5` margin totals `+19`, one less than
 * SvekResult's own `+15` ink-walk delta plus `+5` margin `= +20` on an
 * ink-min that, for a lone leaf, coincides with the leaf's own box size).
 *
 * codd-T4: the predicate is `DotData#isDegeneratedWithFewEntities`
 * (`dot/DotData.java:69-71`), which counts the entities, groups and links a
 * `remove` hides, so it cannot be recomputed from the surviving `geo`
 * (cenoja/gogosu/sobobi/sodoza: a lone survivor beside removed entities
 * takes the SvekResult path, 1px larger each way). The layout, which sees
 * the raw AST (`degenerateSingleLeaf`), flags `geo.degenerate` instead.
 */
function isDegenerateGeo(geo: DescriptionGeometry): boolean {
  return geo.degenerate === true;
}

/**
 * `EntityImageDegenerated#calculateDimension` (`svek/EntityImageDegenerated
 * .java:73-75`, `orig.calculateDimension(sb).delta(delta * 2, delta * 2)`)
 * plus the exporter margin (`TextBlockExporter#calculateFinalDimension`,
 * `:198-203`). The layout's `geo.totalWidth` bakes in the cuca default margin
 * (`degenerateSingleLeaf`), so a style `Margin` is applied from the leaf's own
 * size instead.
 */
function degenerateDims(geo: DescriptionGeometry, margin: DocumentMargin): DocumentBody['dims'] {
  if (margin === CUCA_DOCUMENT_MARGIN) return { width: geo.totalWidth, height: geo.totalHeight };
  const leaf = geo.nodes[0]!;
  return {
    width: leaf.width + DEGENERATE_DELTA * 2 + margin.left + margin.right,
    height: leaf.height + DEGENERATE_DELTA * 2 + margin.top + margin.bottom,
  };
}

/** `EntityImageDegenerated#delta` (`svek/EntityImageDegenerated.java:55`). */
const DEGENERATE_DELTA = 7;

/**
 * The margin-less block `DiagramChromeFactory.create` receives for a degenerate geometry:
 * `EntityImageDegenerated#calculateDimension` (`svek/EntityImageDegenerated.java:73-75`), i.e. the leaf plus
 * `delta * 2` -- no document margin (`UgDiagram.java:123-135` adds that after chrome).
 */
export function degenerateBlockDims(geo: DescriptionGeometry): { width: number; height: number } {
  const leaf = geo.nodes[0]!;
  return { width: leaf.width + DEGENERATE_DELTA * 2, height: leaf.height + DEGENERATE_DELTA * 2 };
}

/** What a body contributes to the document: its draw pass and its dimension. */
interface DocumentBody {
  readonly draw: (target: UGraphic, respectHidden: boolean) => void;
  readonly dims: { readonly width: number; readonly height: number };
}

/**
 * The svek body: `SvekResult#drawU` (clusters, leaves, edges) and the document dimension recipe (see
 * `renderDescription`'s doc comment). Moved out of `renderDescription` verbatim (cdd8 T3b).
 */
function svekBody(
  geo: DescriptionGeometry,
  theme: Theme,
  measurer: StringMeasurer,
  margin: DocumentMargin,
): DocumentBody {
  const plan = buildUidPlan(geo);
  const { containers, leaves } = collectByKind(geo.nodes);
  // G1 I-hideshow: `respectHidden` distinguishes the LimitFinder ink-extent
  // pass (`false` -- see `drawClusters`'s doc comment for why jar's own
  // `LimitFinder`/`UGraphicNo` structurally cannot see a hidden flag at
  // all) from the real `UGraphicSvg` pass (`true` -- content-visible
  // suppression). Same `draw` closure either way, matching upstream's own
  // single shared `SvekResult#drawU` call site for both purposes.
  const draw = (target: UGraphic, respectHidden: boolean): void => {
    drawClusters(target, containers, theme, plan, respectHidden, geo.sprites);
    // T1e write-set expansion (journaled): `geo.edges` threaded through so
    // a note leaf can find its own Opale connector — see
    // `renderer-draw-sequence.ts#drawEntities`'s own doc comment.
    drawEntities(target, leaves, theme, plan, geo.sprites, respectHidden, geo.edges);
    drawEdges(target, geo.edges, theme, plan, respectHidden);
  };

  const driverBounder = driverBounderFor(measurer);
  const dims = isDegenerateGeo(geo)
    ? degenerateDims(geo, margin)
    : computeDocumentDims((target) => draw(target, false), driverBounder, measurer, margin);

  return { draw, dims };
}

/**
 * The ELK body: `MyElkDrawing#drawU` (clusters, nodes, edges; `MyElkDrawing.java:110-114`) with the document
 * dimension the geometry already carries (`MyElkDrawing#calculateDimension` plus the `CucaDiagram` margins).
 */
function elkBody(
  elk: NonNullable<DescriptionGeometry['elk']>,
  geo: DescriptionGeometry,
  margin: DocumentMargin,
): DocumentBody {
  const dims =
    margin === CUCA_DOCUMENT_MARGIN
      ? { width: geo.totalWidth, height: geo.totalHeight }
      : {
          width: geo.totalWidth - CUCA_DOCUMENT_MARGIN.left - CUCA_DOCUMENT_MARGIN.right + margin.left + margin.right,
          height: geo.totalHeight - CUCA_DOCUMENT_MARGIN.top - CUCA_DOCUMENT_MARGIN.bottom + margin.top + margin.bottom,
        };
  return { draw: (target) => elk.drawU(target), dims };
}

/**
 * Render a descriptive diagram geometry into an SVG document string.
 *
 * Accepts the output of {@link layoutDescription} and produces a complete,
 * klimt-drawn SVG document — see this module's doc comment for the
 * preamble/draw-order conformance details. Pure function (no DOM, no
 * async): every non-determinism (uid counters, gradient/shadow ids) is
 * seeded from `geo.seed` (T17 seed thread, `layout-helpers.ts`'s doc
 * comment), never real wall-clock or `Math.random()` state.
 *
 * Document dimensions (G0/T3 write-set expansion, journaled — see
 * `renderer-ink-extent.ts`'s own doc comment for the full upstream chain
 * and case analysis, and `isDegenerateGeo`'s doc comment above for why
 * degenerate geometries are excluded): `minDim` is the
 * `SvekResult#calculateDimension` recipe (`computeDocumentDims` — a
 * `LimitFinder` ink walk over the SAME `draw` callback used for the real
 * pass, plus the `CucaDiagram` outer margin) for every NORMAL geometry;
 * `geo.totalWidth`/`totalHeight` (`degenerateSingleLeaf`'s own,
 * already-correct formula — NOT `computeTotalDimensions`'s now-deprecated
 * hand-scan, `layout-geo-post.ts`) for degenerate single-leaf ones.
 */
export function renderDescription(
  geo: DescriptionGeometry,
  theme: Theme,
  measurer: StringMeasurer = jarMeasurer,
): string {
  const margin = calculateMargin(theme, CUCA_DOCUMENT_MARGIN);
  const body = geo.elk === undefined ? svekBody(geo, theme, measurer, margin) : elkBody(geo.elk, geo, margin);
  const { dims } = body;
  const { width, height } = dims;
  const driverBounder = driverBounderFor(measurer);

  // Mission G1 I-scale: `geo.scale` (the `scale ...` directive, if any) is
  // resolved against the UNSCALED document dims above -- mirrors
  // `TextBlockExporter#computeScaleFactor(dim)` reading
  // `calculateFinalDimension()`'s own pre-scale result (see
  // `scale-command.ts`'s module doc for the full mechanism). The resulting
  // factor is applied ONLY inside `SvgGraphicsCore#format`/
  // `#finalizeRootAttributes` (already-faithful, pre-existing code -- see
  // that module's own doc comment) -- `minDim` itself stays unscaled,
  // matching upstream's `ensureVisible(minDim.getWidth(), minDim.getHeight())`.
  // cdd-T30: `theme.dpi` -- `skinParam.getDpi()`
  // (`core/TextBlockExporter.java:206`), default 96 when `skinparam dpi` was
  // never declared (`Theme.dpi`'s own doc comment).
  // codd-T4: a chromed geometry is scaled AFTER chrome (`assemble-svg.ts#finalizeDescriptionFragment`), as the jar
  // scales the chrome-composed block (`TextBlockExporter.java:159-177`).
  const scale = geo.chromed === true ? 1 : resolveScaleFactor(geo.scale, width, height, theme.dpi);

  const option = basicSvgOption({
    minDim: { width, height },
    backcolor: theme.colors.background,
    scale,
    rootAttributes: new Map([['data-diagram-type', DIAGRAM_TYPE_DESCRIPTION]]),
  });
  const ug = UGraphicSvg.build(geo.seed ?? 0n, option, VERSION_PLACEHOLDER, driverBounder, measurer);

  // `TextBlockExporter#exportTo`: `ug.apply(new UTranslate(margin.getLeft(), margin.getTop()))`.
  body.draw(ug.apply(new UTranslate(margin.left, margin.top)), true);

  return ug.getSvgString();
}

// ---------------------------------------------------------------------------
// T7 -- klimt CompleteSvg -> RenderFragment unwrap (decisions.md D2 "klimt
// fragment feasibility" evidence)
// ---------------------------------------------------------------------------

/**
 * `unwrapKlimtSvg` -- T7 chrome integration evidence (`plans/g0b-annotations/
 * batch-3/T7-pipeline-integration.md`, item 2 / decisions.md D2's
 * description footnote): `SvgGraphicsCore#createXml` (`svg-graphics-core.ts`)
 * unconditionally roots a `<svg>` document via `getRootNode` -- there is no
 * "emit body without document" mode anywhere in `u-graphic-svg.ts` /
 * `svg-graphics.ts` / `svg-graphics-core.ts` to call instead (confirmed by
 * reading all three per the task's read-set). Reworking `SvgGraphicsCore` to
 * add one would touch klimt's own emission behavior, which the task's
 * quality bar explicitly flags as a stop condition ("if klimt fragment
 * extraction requires touching svg-graphics-core.ts emission behavior, STOP
 * and journal the options").
 *
 * So this is the sanctioned fallback: a narrow, string-level unwrap of the
 * complete document `renderDescription` already produces, turning it into a
 * `RenderFragment` `applyChrome` + `assembleSvg` (`src/index.ts`) can compose
 * exactly like every other engine's fragment -- decorate once via the SAME
 * chrome geometry/blocks (`src/core/annotations/`), no third implementation.
 *
 * Only ever invoked when the diagram carries annotations (T7's
 * `applyAnnotationChrome` short-circuits on `isEmpty` first) -- every
 * annotation-free description fixture, including the golden ratchet
 * (`tests/oracle/svg-conformance/description.golden.ratchet.test.ts`),
 * never reaches this function at all, so D5 byte-stability holds trivially.
 *
 * Scoped to the EXACT shape `SvgGraphicsCore#createXml`/`#getRootNode`/
 * `#finalizeRootAttributes` are known to emit -- see `core/klimt/
 * document-shell.ts`'s own doc comments (`extractViewBoxDims`/
 * `extractFlatContent`, extracted from this function during mission G2 N1
 * so the class engine can reuse the same extraction machinery) for the
 * exact producer shape this stays scoped to.
 *
 * `background` is threaded through explicitly (mirrors every other engine's
 * `RenderFragment.background = theme.colors.background`, e.g.
 * `class/renderer.ts`) rather than left unset: klimt's own background rect
 * is already embedded IN `body` (sized to the ORIGINAL canvas, via
 * `SvgGraphicsCore#paintBackcolor`), so `svgRoot`'s own bg rect -- drawn
 * first, full new-canvas-sized -- is what actually covers the area chrome
 * adds (title/legend/caption/header/footer bands); leaving it unset would
 * fall through to `svgRoot`'s hardcoded `#FFFFFF` default regardless of
 * theme.
 */
export function unwrapKlimtSvg(svg: string, background: string): RenderFragment {
  const { width, height } = extractViewBoxDims(svg);
  const { body: klimtBody, extraDefs } = extractFlatContent(svg);
  const { body, documentBackgroundRect } = splitLeadingBackgroundRect(klimtBody);
  // The root `style="...background:"` carries the resolved hex the jar writes
  // (`gray` -> `#808080`), as class's own resolve-before-shell convention (N4).
  background = resolveColorToSvgHex(background);
  const fragment: RenderFragment = { body, width, height, background, diagramType: DIAGRAM_TYPE_DESCRIPTION };
  if (extraDefs.length > 0) fragment.extraDefs = extraDefs;
  if (documentBackgroundRect !== undefined) fragment.documentBackgroundRect = documentBackgroundRect;
  return fragment;
}

/** The background `<rect>` `SvgGraphicsCore#paintBackcolor` writes as the
 *  klimt body's first child (non-default backgrounds only): the canvas origin,
 *  the fill, and `stroke:none`. */
const LEADING_BACKGROUND_RECT_RE =
  /^<rect x="0" y="0" width="\d+" height="\d+" fill="(#[0-9A-Fa-f]{3,8})" style="stroke:none;"\/>/;

/**
 * codd-T4: the jar's background rect belongs to the FINAL canvas, not to the
 * klimt body. `UgDiagram#getExporter` (`UgDiagram.java:123-135`) runs
 * `addChrome` (title, caption, ...) and only then `TextBlockUtils
 * .addBackcolor`, so the rect spans the chrome-composed canvas and precedes
 * the title group (`component/sugaca-11-boma467`). The body's own rect, sized
 * to the margin-less block, is split off here and handed to the assembler as
 * `documentBackgroundRect` (the class engine's N48 mechanism).
 */
function splitLeadingBackgroundRect(body: string): { body: string; documentBackgroundRect?: string } {
  const match = LEADING_BACKGROUND_RECT_RE.exec(body);
  if (match === null) return { body };
  return { body: body.slice(match[0].length), documentBackgroundRect: match[1]! };
}
