/**
 * Dispatcher: holds a registry of DiagramPlugin instances and resolves which
 * one owns a given UmlSource **by attempting the parse**, exactly as upstream
 * does (`PSystemBuilder#createPSystem`, `:257-283`).
 *
 * There is no `accepts()` any more, and no heuristic of any kind. The block's
 * `@start` line yields a candidate set (`DiagramType#findStartTypes`); every
 * plugin whose type is not in that set is skipped, as upstream skips a factory
 * whose `getDiagramType()` is not in `diagramTypes` (`:259-260`); the rest are
 * tried in registration order and **the first whose parse does not refuse
 * wins** (`:264-273`, `isOk` at `:298-303`). When every candidate refuses, the
 * highest-scoring refusal owns the error page (`PSystemErrorUtils#mergeV2`,
 * `:140-147`); when there is no candidate at all, upstream returns
 * `PSystemUnsupported` (`:282-283`) and this port returns its error sentinel.
 *
 * The parse performed during resolution IS the parse the render pipeline uses
 * — `resolve()` hands the AST back with the plugin. Parsing twice would be
 * two parse paths, which D0 forbids, and would double the cost D3 asks us to
 * measure rather than prefilter.
 */

import type { DiagramType, UmlSource } from './block-extractor.js';
import { upstreamTypeOf } from './block-extractor.js';
import type { ParseRefusal } from './parse-refusal.js';
import { mergeRefusals } from './parse-refusal.js';
import { rect, text } from './svg.js';
import type { Theme } from './theme.js';
import type { StringMeasurer } from './measurer.js';
import type { AssetStore } from './asset-store.js';

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
 * A plugin that performs layout synchronously.
 * Discriminated from AsyncPlugin by the presence of `layoutSync`.
 */
export interface SyncPlugin<AST = unknown, Geo = unknown> {
  readonly type: DiagramType;
  parse(source: UmlSource, options?: ParseOptions): AST | ParseRefusal;
  layoutSync(ast: AST, theme: Theme, measurer: StringMeasurer): Geo;
  render(geo: Geo, theme: Theme): AssembledSvg;
}

/**
 * A plugin that performs layout asynchronously (e.g. web-worker, WASM).
 * Discriminated from SyncPlugin by the absence of `layoutSync` and the
 * presence of `layout`.
 */
export interface AsyncPlugin<AST = unknown, Geo = unknown> {
  readonly type: DiagramType;
  parse(source: UmlSource, options?: ParseOptions): AST | ParseRefusal;
  layout(ast: AST, theme: Theme, measurer: StringMeasurer): Promise<Geo>;
  render(geo: Geo, theme: Theme): AssembledSvg;
}

/**
 * Union of all plugin shapes accepted by the registry.
 *
 * Type-narrow at call sites with `'layoutSync' in plugin` to detect SyncPlugin.
 */
export type DiagramPlugin<AST = unknown, Geo = unknown> =
  | SyncPlugin<AST, Geo>
  | AsyncPlugin<AST, Geo>;

/**
 * Narrows a `parse()` result to the refusal arm.
 *
 * The registry erases each plugin's AST type parameter to `unknown`, so at the
 * pipeline's call sites `AST | ParseRefusal` collapses to `unknown` and a
 * plain discriminant check does not typecheck. This is the same structural
 * `in` narrowing `src/index.ts#annotationsOf` uses, and for the same reason:
 * the value is THIS pipeline's own trusted `parse()` output, not external
 * input, so it is a stage boundary rather than a validation boundary.
 *
 * `refused` is the discriminant because no engine AST carries that field (T1);
 * absence of a field is never the test.
 */
export function parseRefusalOf(parsed: unknown): ParseRefusal | undefined {
  if (typeof parsed !== 'object' || parsed === null) return undefined;
  return 'refused' in parsed ? (parsed as ParseRefusal) : undefined;
}

// ---------------------------------------------------------------------------
// Error-sentinel plugin
// ---------------------------------------------------------------------------

/** Returned when no registered plugin accepts a source block. */
const ERROR_SENTINEL: SyncPlugin = {
  type: 'unknown',
  parse: (_source: UmlSource) => ({}),
  layoutSync: (
    _ast: unknown,
    _theme: Theme,
    _measurer: StringMeasurer,
  ): unknown => ({}),
  render: (_geo: unknown, theme: Theme): AssembledSvg => ({
    completeSvg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60">` +
      rect(0, 0, 300, 60, { fill: '#fff8f8', stroke: theme.colors.error }) +
      text(10, 35, 'Error: unknown diagram type', {
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
        fill: theme.colors.error,
      }) +
      `</svg>`,
  }),
};

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * What `resolve()` hands back: the winning plugin and the parse it won with,
 * or — when every candidate refused — the refusal that owns the error page and
 * the plugin that produced it, whose type names the assumed diagram type on
 * that page (`ErrorUml#getError`).
 */
export type Resolution =
  | { readonly plugin: DiagramPlugin; readonly ast: unknown; readonly refusal?: undefined }
  | { readonly plugin: DiagramPlugin; readonly ast?: undefined; readonly refusal: ParseRefusal };

/** One candidate's failed attempt, kept paired so the merge winner can be
 *  traced back to the plugin that produced it. */
interface Attempt {
  readonly plugin: DiagramPlugin;
  readonly refusal: ParseRefusal;
}

// ---------------------------------------------------------------------------
// DiagramRegistry class
// ---------------------------------------------------------------------------

export class DiagramRegistry {
  private readonly plugins: DiagramPlugin[] = [];

  /**
   * Register a plugin. Registration order IS upstream's factory order and is
   * load-bearing: it decides which candidate gets to try first, and therefore
   * which one wins a source both could parse. See `src/index.ts`.
   */
  register(plugin: DiagramPlugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Attempt the parse with each candidate in registration order; the first
   * that does not refuse owns the source.
   *
   * A plugin whose type is not in `source.types` is skipped — upstream's
   * `if (!diagramTypes.contains(f.getDiagramType())) continue;`
   * (`PSystemBuilder.java:259-260`). A source with no candidate set at all
   * (a hand-built fixture, see `UmlSource.types`) states no constraint, so
   * every plugin is a candidate.
   */
  resolve(source: UmlSource, options?: ParseOptions): Resolution {
    const attempts: Attempt[] = [];
    for (const plugin of this.plugins) {
      if (source.types !== undefined && !source.types.has(upstreamTypeOf(plugin.type))) continue;
      const parsed = plugin.parse(source, options);
      const refusal = parseRefusalOf(parsed);
      if (refusal === undefined) return { plugin, ast: parsed };
      attempts.push({ plugin, refusal });
    }
    return resolveAllRefused(attempts);
  }
}

/**
 * Every candidate refused, or there were none.
 *
 * With none, upstream returns `PSystemUnsupported` (`PSystemBuilder.java:282-283`)
 * — a document that is neither a diagram nor a syntax-error page. This port's
 * nearest equivalent is the error sentinel.
 *
 * Otherwise the winner is the highest-scoring refusal (D2, ported verbatim in
 * `mergeRefusals`), and the pair it came from is recovered by identity so the
 * error page can name the engine that got furthest.
 */
function resolveAllRefused(attempts: readonly Attempt[]): Resolution {
  if (attempts.length === 0) return { plugin: ERROR_SENTINEL, ast: {} };
  const winner = mergeRefusals(attempts.map((a) => a.refusal));
  const owner = attempts.find((a) => a.refusal === winner) ?? attempts[0]!;
  return { plugin: owner.plugin, refusal: winner };
}

// ---------------------------------------------------------------------------
// Module-level singleton registry
// ---------------------------------------------------------------------------

export const registry: DiagramRegistry = new DiagramRegistry();
