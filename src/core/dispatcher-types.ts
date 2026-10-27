/**
 * The plugin contract and the fragment shapes the dispatcher resolves to:
 * `ParseOptions`, `RenderFragment`, `CompleteSvg`, `AssembledSvg`,
 * `PaginatedPlugin`, `SyncPlugin`, `AsyncPlugin`, `DiagramPlugin`. Moved
 * verbatim out of `dispatcher.ts` as a pure move (sdd3 batch 2, 500-line
 * cap); `dispatcher.ts` re-exports every name, so callers are unchanged.
 */
import type { DiagramType, UmlSource } from './block-extractor.js';
import type { ParseRefusal } from './parse-refusal.js';
import type { LayoutServices } from './elk/elk-backend.js';
import type { RootLengthAdjust } from './svg.js';
import type { Gradient } from './paint.js';
import type { ClockwiseTopRightBottomLeft } from './klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { Theme } from './theme.js';
import type { StringMeasurer } from './measurer.js';
import type { AssetStore } from './asset-store.js';
import type { InkBox } from './annotations/body-ink.js';
import type { ScaleSpec } from './scale-command.js';
import type { PreprocessorResult } from './preprocessor.js';
import type { Clock } from './clock.js';

/**
 * The per-render inputs a plugin's `parse()` may need beyond the source
 * text itself. Optional at every level: a plugin that ignores it declares
 * `parse(source)` and stays assignable, and `renderSync`/`render` pass one
 * unconditionally.
 *
 * Today it carries exactly one thing — ADR-2's synchronous asset channel
 * (`plans/s1l-tail-fix/decisions.md`). `SkinParam#getSprite` falls back to
 * `SpriteImage.fromInternal`'s jar-resident `/sprites/**` classpath bundle
 * (`core/internal-sprite-store.ts`), and BOTH halves of that lookup happen
 * during parsing: `sprite $N jar:<path>` resolves at command-execution time
 * (`CommandSpriteFile.java:108-112`), and a `<<$archimate/x>>` stereotype
 * resolves off the same registry later. A browser-safe port has no
 * classpath, so the bytes have to arrive here.
 *
 * Deliberately NOT `RenderOptions` itself: a plugin has no business reading
 * `theme`, `maxWidth` or the async fetcher, and widening the parse contract
 * to the whole option bag would invite exactly that.
 */
export interface ParseOptions {
  /** `RenderOptions.assetStore`, forwarded verbatim. */
  readonly assetStore?: AssetStore | undefined;
  /** The render's clock (`renderClock(options)`), for the engines that read "today" (gantt, `GanttDiagram`). */
  readonly clock?: Clock | undefined;
}

// ---------------------------------------------------------------------------
// SyncPlugin / AsyncPlugin / DiagramPlugin union
// ---------------------------------------------------------------------------

/**
 * The fragment a plugin returns from `render()` in the common case: inner
 * SVG markup plus the dimensions/background/defs the central `assembleSvg`
 * (src/index.ts) needs to call `svgRoot` exactly once, after chrome (T7)
 * has had a chance to decorate. This re-mirrors upstream's
 * `getTextBlock -> addChrome -> exporter` order (decisions.md D2).
 */
export interface RenderFragment {
  /** Inner SVG markup — svgRoot's `children` argument (already joined). */
  body: string;
  width: number;
  height: number;
  /** svgRoot's `bgColor` argument. Omit to take svgRoot's own default. */
  background?: string;
  /** T2d-a pass 2 (row DOCGRAD): the recovered `Gradient` half of a
   *  `skinparam backgroundColor <c1>-<c2>` document background --
   *  `theme.colors.backgroundGradient`'s own doc comment for why
   *  `background` above stays a plain string. Set by activity's own
   *  `renderer.ts` only; read by `assemble-svg.ts`'s activity finalizer
   *  and `document-shell.ts#assembleDocumentShell` (to omit the root
   *  `style="background:...;"` property the jar also omits for a
   *  gradient, `SvgGraphics.java:178-183`). */
  backgroundGradient?: Gradient;
  /** svgRoot's `extraDefs` argument. Omit to take svgRoot's own default. */
  extraDefs?: string;
  /**
   * T8 (decisions.md D2): the jar's `data-diagram-type` root attribute
   * value (`CLASS`, `STATE`, `DESCRIPTION`, `JSON`, `YAML`, `HCL`, ...).
   * Set by the producing engine's own renderer/plugin -- never by
   * `assembleSvg` itself. When present, `assembleSvg` (`core/assemble-
   * svg.ts`) reassembles the document via `core/klimt/document-shell.ts
   * #assembleDocumentShell(fragment, diagramType)` -- jar's shared
   * root-attribute/prolog/defs conventions, `TextBlockExporter
   * .java:293`'s `withRootAttribute("data-diagram-type", ...)` -- instead
   * of the generic `svgRoot` (`core/svg.ts`) that a `diagramType`-less
   * fragment (sequence, dot, chart, ...) still goes through. Replaces the
   * four separate per-engine boolean/string discriminant fields T8
   * collapsed into this one field -- see
   * `core/assemble-svg.ts`'s own doc comment for the per-diagram-type body
   * finalization (background/border-rect splice, single-`<g>`-wrap) that
   * used to live in four separate `diagrams/<engine>/renderer-shell.ts`
   * files and now runs there, generically, keyed off this field's value.
   */
  diagramType?: string;
  /**
   * add2 T2d: the resolved root `preserveAspectRatio` attribute value --
   * forwarded verbatim to `core/klimt/document-shell.ts#ShellFragment
   * .preserveAspectRatio` (see that field's own doc comment for the jar
   * cascade, `TextBlockExporter.java:380-386`). `undefined` takes the
   * jar default (`core/klimt/document-shell.ts#DEFAULT_PRESERVE_ASPECT_RATIO`).
   * No producer sets this yet -- the `skinparam preserveAspectRatio`
   * value has no `Theme` field to read it from (T2d's write-set excludes
   * `core/theme.ts` and the skinparam key handlers; see
   * `plans/activity-divergence-drive-2/batch-2b/T2d-klimt-exception.md`).
   */
  preserveAspectRatio?: string;
  /**
   * G2 N1: set by `core/annotations/chrome.ts#applyChrome` whenever it
   * added its OWN single bare `<g>` wrap around a decorated fragment's body
   * (i.e. `decorated === true` inside that function). A description-engine
   * fragment never reads this flag -- `unwrapKlimtSvg` already strips
   * klimt's own content `<g>` before chrome runs, so `applyChrome`'s wrap
   * is the ONLY one for that path. A class/state/json-shaped fragment DOES
   * read it (`core/assemble-svg.ts`'s per-type finalize functions): the
   * finalizer must wrap `fragment.body` in exactly one bare `<g>` itself
   * for the UNANNOTATED case (nothing else would), but must NOT wrap a
   * second time when chrome already did -- this flag is the signal that
   * distinguishes the two. Every other engine ignores it (harmless,
   * unread).
   */
  bodyWrapped?: true;
  /**
   * G2 N46: set ONLY by `class/renderer.ts#renderClass` -- the diagram
   * body's PRE-document-margin/PRE-`SvgGraphics#ensureVisible`-quirk ink
   * dims (`class/layout-ink-extent.ts#computeClassRawInkDims`), distinct
   * from `width`/`height` above (which stay the POST-margin/quirk value a
   * no-chrome canvas needs). `core/annotations/chrome.ts#applyChrome` uses
   * these -- instead of `width`/`height` -- as the "original" diagram-body
   * size fed into `decorateEntityImage`'s centering math, matching jar's
   * own `DiagramChromeFactory.create`/`DecorateEntityImage` composition
   * order (margin applied AFTER chrome, not before -- see
   * `plans/g2-class-svg/ledger.md` N46 for the jar-verified mechanism).
   * `undefined` for every other engine (unread, harmless) and for class's
   * OWN degenerate/empty/multi-page geometries (`class/layout.ts
   * #ClassGeometry.rawWidth`'s own doc comment).
   */
  preChromeWidth?: number;
  preChromeHeight?: number;
  /**
   * G2 N48: set ONLY by `class/renderer.ts#renderClass` -- the resolved SVG
   * hex to fill a full-FINAL-canvas background `<rect>` with, when the
   * diagram background is neither the default black/white nor fully
   * transparent (this function's own doc comment carries the jar-verified
   * exclusion list). `core/assemble-svg.ts`'s class finalize function draws
   * this rect as the outer `<g>`'s FIRST child, sized to `width`/`height`
   * ABOVE (the FINAL, post-chrome/post-document-margin canvas) -- not
   * `renderClass` itself, which only ever sees the PRE-chrome body size
   * (jar-verified `xalaco-64-vuzu312`: the rect spans the WHOLE canvas,
   * including the title strip above the diagram body, and precedes
   * `<g class="title">` -- this is WHY the splice cannot run inside
   * `renderClass`: chrome has not composed the title band yet at that
   * point). `undefined` for every other engine (unread, harmless) and for
   * class's own default-background diagrams.
   */
  documentBackgroundRect?: string;
  /**
   * G2 N66: set ONLY by `class/renderer.ts#renderClass` -- the resolved SVG
   * hex for `skinparam diagramBorderColor` (`theme.ts#diagramBorderColor`'s
   * own doc comment). `core/assemble-svg.ts`'s class finalize function
   * draws a whole-canvas `<rect fill="none">` border as the outer `<g>`'s
   * FIRST child (OUTSIDE `documentBackgroundRect`, matching jar's
   * `TextBlockExporter#maybeDrawBorder` wrapping the ENTIRE diagram export,
   * including its own background) -- ONLY when `preChromeWidth`/
   * `preChromeHeight` are set AND chrome did not inflate the canvas beyond
   * them (a chrome-present + diagramBorderColor combination has zero
   * corpus reach and is declared out of this item's verified scope -- see
   * `core/assemble-svg.ts`'s own `withDiagramBorderRect` doc comment).
   * `undefined` for every other engine (unread, harmless) and for class
   * diagrams with no such skinparam.
   */
  diagramBorderColor?: string;
  /** Sequence: `maybeDrawBorder`'s stroke thickness (`TextBlockExporter.java:221-223`; unset = 1). */
  diagramBorderThickness?: number;
  /** Sequence: `maybeDrawBorder`'s `CornerParam.diagramBorder` round corner (unset/0 = square). */
  diagramBorderRoundCorner?: number;
  /**
   * The diagram's OWN `scale ...` directive (`ScaleSpec`, unresolved) and
   * `skinparam dpi`: the inputs of `TextBlockExporter#computeScaleFactor`
   * (`TextBlockExporter.java:205-209`, `scale.getScale(dim.w, dim.h) * dpi /
   * 96`). A producer cannot resolve the factor itself, because chrome (title,
   * header, footer, legend) is composed OUTSIDE klimt as a string splice and
   * upstream reads the CHROME-INCLUDED, margin-included dimension
   * (`calculateFinalDimension()`, `:198-203`; jar-verified on zebuzi: the
   * pre-chrome body gives 1.682, the golden's 1.495). So the ONE exporter tail
   * `TextBlockExporter.ts#exportTo` resolves `resolveScaleFactor(scaleSpec,
   * dim.w, dim.h, dpi)` against that dimension -- see `exportMargin` and
   * `exportedDimension` for which it is -- for every engine that sets either
   * field: mindmap, wbs, salt, activity, description and sequence.
   * `scaleSpec === undefined` is a no-op (dpi-only factor, or 1 at dpi 96).
   */
  scaleSpec?: ScaleSpec;
  dpi?: number;
  /**
   * isw-T2c-scale: `body` was drawn inside `svg-format.ts#withDeferredFormat`
   * -- its numbers are lossless doubles, and the export's scale pass is
   * their single `SvgGraphics#format` (`SvgGraphics.java:468-475`). Set by a
   * producer whose document will be scaled (activity, description, sequence:
   * `scale-command.ts#isExportScaled`); every step that draws more into the
   * body (warning banner, chrome) draws deferred too, and
   * `TextBlockExporter.ts#exportTo` formats even at factor 1.
   */
  numbersDeferred?: true;
  /**
   * isw-T2c-scale: `width`/`height` are `SvgGraphics`'s integer `maxX`/`maxY`
   * times `option.getScale()`. `finalizeRootAttributes` truncates that
   * product for `style` and `viewBox` but prints the root `width`/`height`
   * attributes as `format(maxX) + "px"` -- scaled, at 3 decimals
   * (`SvgGraphics.java:800-813`). Set by the finalizers that apply a
   * document scale (`assemble-svg-activity.ts`, `TextBlockExporter.ts`).
   */
  scaledCanvas?: true;
  /** `skinparam lengthAdjust` (`SkinParam.java:1258-1270`): the root `<g>` and every `<text>`'s `textLength` (`SvgGraphics.java:155-158,703-705`). Unset = `spacing`. */
  lengthAdjust?: RootLengthAdjust;
  /**
   * T6h: the raw text block drawn through ONE klimt `UGraphic` at the
   * resolved `scale`, translated by `(dx, dy)` BEFORE the scale
   * (TextBlockExporter.java:165-176) — for a MINDMAP fragment whose `body`
   * is only the `TextBlockExporter.ts#BODY_ANCHOR` placeholder. Chrome
   * composes around the anchor; `finalizeTitledDiagramFragment` reads the
   * anchor's shifted translate as `(dx, dy)` and swaps in this draw, so the
   * body's numbers are rounded once, after the scale. Returns the flat body.
   */
  drawBodyAt?: (scale: number, dx: number, dy: number) => string;
  /** sep-T5a: `TextBlockExporter`'s `margin` -- the producer's `Builder#calculateMargin` (style `Margin`, else
   *  `getDefaultMargins()`, TextBlockExporter.java:510-516). Its presence selects `TextBlockExporter.ts#exportTo`'s
   *  first arm: the producer handed over the RAW chromed block, so the exporter shifts the body by `(left, top)`
   *  (`:173`), takes `dim = width/height + margin` (`:198-203`) and the canvas `(int)(dim + 1)` itself. Set by the
   *  MINDMAP, WBS and SALT chrome paths. Absent: the producer already baked its margin (second arm). */
  exportMargin?: ClockwiseTopRightBottomLeft;
  /** codd-T4: `TextBlockExporter#calculateFinalDimension` (`:198-203`) -- chrome plus margin, BEFORE `SvgGraphics
   *  #ensureVisible` floors it; set by `document-margin.ts#applyDocumentMargin` (sequence's finalizer sets it when
   *  chrome did not). On the margin-baked arm it IS `dim`: `computeScaleFactor` (`:205-209`) resolves a width/height
   *  `scale` against this, not against the floored canvas in `width`/`height`, which is then the canvas itself. */
  exportedDimension?: { readonly width: number; readonly height: number };
  /** codd-T4: the document margin this fragment was exported with when it is NOT its diagram class's default
   *  (`TextBlockExporter.Builder#calculateMargin`, a style `Margin`; `document-margin.ts#calculateMargin`).
   *  Read by `document-margin.ts#documentMarginOf`; absent means the per-`diagramType` default. */
  documentMargin?: { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number };
  /**
   * lgm-T1a: the `LimitFinder` ink (`TextBlockUtils.getMinMax(block, sb,
   * false)`) of the block `DiagramChromeFactory.decorateWithFrame` frames,
   * in the block's own coordinates -- for a producer that draws through the
   * ported klimt `UGraphic` and can therefore run that very pass, which is
   * the only way to see ink the serialized SVG does not carry (a
   * `TextBlockMarged`'s `UEmpty` reservation, `TextBlockMarged.java:79-85`).
   * `core/annotations/chrome.ts#applyChrome` frames the mainframe from it;
   * without it the ink of a `diagramType` it knows is recovered from `body`
   * (`core/annotations/body-ink.ts`). Set by `diagrams/mindmap/index.ts`.
   */
  frameInk?: InkBox;
  /**
   * sdd3-T8g, INTERNAL (not re-exported by `src/index.ts`): the sequence page graphic's own `ensureVisible` fold --
   * `SvgGraphics#maxX`/`maxY`, a running maximum over every drawn primitive seeded with the document dimension
   * (`SvgGraphics.java:129-135,142-143`) -- in the coordinates of `body`. A shift of `body` (`coord-shift.ts
   * #shiftFragmentBody`: the warning banner, the margin removal and re-application, chrome) shifts these by the same
   * amount, as `UGraphic#apply(UTranslate)` moves every coordinate `ensureVisible` later sees.
   * `core/assemble-svg-sequence.ts#finalizeSequenceFragment` canvases `max(seed composed from chrome and margin,
   * fold)`. Absent: the producer has no fold (every engine but sequence).
   */
  drawnMaxX?: number;
  drawnMaxY?: number;
}

/**
 * Escape hatch for plugins that emit a complete `<svg>` document themselves
 * and do not go through the shared `svgRoot` assembler — the description
 * (klimt) engine, and any renderer's own inline error-document path (e.g.
 * chart's `renderErrorDiagram`). `assembleSvg` returns `completeSvg` as-is.
 */
export interface CompleteSvg {
  completeSvg: string;
}

/** Union of everything a plugin's `render()` may hand back. */
export type AssembledSvg = RenderFragment | CompleteSvg;

/**
 * The three members an engine adds when ONE source can produce MORE THAN ONE
 * image — upstream's `FileMaker#getNbPages` / `#getTextBlock(num, …)` pair,
 * plus the per-page title swap `TitledDiagram#addChrome(index, …)` performs
 * (`:469-476`).
 *
 * Optional, and all three together or none: only the sequence engine
 * implements them (`newpage`, `plans/sequence-newpage-pagination`), and every
 * other engine behaves as a single page. `render()` stays the entry point for
 * page 0 — upstream's exporter calls `getTextBlock(0)` for it too — so a
 * caller that never asks for pages sees no change at all.
 *
 * `pageAst` exists because chrome is composed OUTSIDE `render()`, from the
 * AST: `addChrome` takes the page index and substitutes the title for
 * `index > 0`, leaving caption/legend/header/footer alone. An engine with no
 * per-page chrome may return its input.
 *
 * @see ~/git/plantuml/.../sequencediagram/teoz/SequenceDiagramFileMakerTeoz.java:123-146
 * @see ~/git/plantuml/.../TitledDiagram.java:469-476
 */
export interface PaginatedPlugin<AST = unknown, Geo = unknown> {
  getNbPages(geo: Geo): number;
  renderPage(geo: Geo, theme: Theme, pageIndex: number, measurer?: StringMeasurer): AssembledSvg;
  pageAst(ast: AST, pageIndex: number): AST;
}

/**
 * A plugin that performs layout synchronously.
 * Discriminated from AsyncPlugin by the presence of `layoutSync`.
 */
export interface SyncPlugin<AST = unknown, Geo = unknown> extends Partial<PaginatedPlugin<AST, Geo>> {
  readonly type: DiagramType;
  parse(source: UmlSource, options?: ParseOptions): AST | ParseRefusal;
  /**
   * `services` (cdd8 D2b): what the render supplies beyond the AST — an
   * `ElkBackend` for a diagram whose {@link SyncPlugin.requiresElk} is true.
   */
  layoutSync(ast: AST, theme: Theme, measurer: StringMeasurer, services?: LayoutServices): Geo;
  /**
   * True when this AST is laid out by ELK, upstream's `isUseElk()` choosing
   * `CucaDiagramFileMakerElk` (`net/atmp/CucaDiagram.java:478-479`). Absent = never.
   */
  requiresElk?(ast: AST): boolean;
  /**
   * `measurer` is the render's own measurer (the one `layout*` received),
   * handed through additively so an engine's draw side measures with the
   * same instrument as its layout side. Plugins that ignore it are unchanged.
   */
  render(geo: Geo, theme: Theme, measurer?: StringMeasurer): AssembledSvg;
  /**
   * The jar-compatible normalisation of this engine's style input: the style
   * sources the JAR builds its theme from, for an engine whose jar path does
   * NOT execute every `skinparam`/`!theme` the preprocessor collected. Applied
   * ONLY when the internal `jarCompatibleStyleInput` option is set (conformance
   * renders, `InternalRenderOptions`); the library default honours the full
   * input as a documented port extension (lad D9, user ruling 2026-10-23).
   * Absent = nothing is cut, which is every engine with a command table. The
   * json family (`@startjson`/`@startyaml`/`@starthcl`) has none upstream and
   * keeps only `skinparam handwritten` (`StyleExtractor.java:88-97`).
   */
  styleInput?(preprocessed: PreprocessorResult, source: UmlSource): PreprocessorResult;
}

/**
 * A plugin that performs layout asynchronously (e.g. web-worker, WASM).
 * Discriminated from SyncPlugin by the absence of `layoutSync` and the
 * presence of `layout`.
 */
export interface AsyncPlugin<AST = unknown, Geo = unknown> extends Partial<PaginatedPlugin<AST, Geo>> {
  readonly type: DiagramType;
  parse(source: UmlSource, options?: ParseOptions): AST | ParseRefusal;
  layout(ast: AST, theme: Theme, measurer: StringMeasurer): Promise<Geo>;
  /**
   * `measurer` is the render's own measurer (the one `layout*` received),
   * handed through additively so an engine's draw side measures with the
   * same instrument as its layout side. Plugins that ignore it are unchanged.
   */
  render(geo: Geo, theme: Theme, measurer?: StringMeasurer): AssembledSvg;
  /** See {@link SyncPlugin.styleInput} (jar-compatible mode only, D9). */
  styleInput?(preprocessed: PreprocessorResult, source: UmlSource): PreprocessorResult;
}

/**
 * Union of all plugin shapes accepted by the registry.
 *
 * Type-narrow at call sites with `'layoutSync' in plugin` to detect SyncPlugin.
 */
export type DiagramPlugin<AST = unknown, Geo = unknown> = SyncPlugin<AST, Geo> | AsyncPlugin<AST, Geo>;
