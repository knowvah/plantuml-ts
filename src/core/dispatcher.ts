/**
 * Dispatcher: holds a registry of DiagramPlugin instances and resolves
 * which plugin handles a given UmlSource by calling accepts() in
 * registration order. Unknown types produce an error-sentinel plugin
 * that renders a graceful error SVG.
 */

import type { DiagramType, UmlSource } from './block-extractor.js';
import { upstreamTypeOf } from './block-extractor.js';
import { DiagramType as UpstreamDiagramType } from './diagram-type-set.js';
import type { ParseRefusal } from './parse-refusal.js';
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
  accepts(lines: readonly string[]): boolean;
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
  accepts(lines: readonly string[]): boolean;
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
  accepts: (_lines: readonly string[]) => false,
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

/**
 * The three types `detectUmlType` can assign from `@startuml` CONTENT, plus
 * `UNKNOWN`. A block whose candidate set contains any of them must go through
 * `accepts()` scanning rather than being claimed on its tag alone, or content
 * probing stops being authoritative and `@startuml` sources misroute.
 *
 * `@startuml` is excluded by construction, not by a size test: its ten-member
 * candidate set (`DiagramType.java:198-201`) contains SEQUENCE, CLASS and
 * STATE. Every other tag yields a singleton, so this reads exactly as the
 * scalar `AMBIGUOUS_TYPES.has(source.type)` test it replaces.
 *
 * TRANSITIONAL. T12 deletes the whole three-tier shape along with `accepts()`
 * (D3'), replacing it with upstream's parse-attempt loop over these same
 * candidates.
 */
const AMBIGUOUS_CANDIDATES: ReadonlySet<UpstreamDiagramType> = new Set([
  UpstreamDiagramType.SEQUENCE,
  UpstreamDiagramType.CLASS,
  UpstreamDiagramType.STATE,
  UpstreamDiagramType.UNKNOWN,
]);

/** True when `types` is absent — a hand-built fixture states no candidate
 *  constraint (see `UmlSource.types`), and must not be claimed on a tag it
 *  does not have — or when it names a type `accepts()` has to arbitrate. */
function hasAmbiguousCandidate(types: UmlSource['types']): boolean {
  if (types === undefined) return true;
  for (const t of types) if (AMBIGUOUS_CANDIDATES.has(t)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// DiagramRegistry class
// ---------------------------------------------------------------------------

export class DiagramRegistry {
  private readonly plugins: DiagramPlugin[] = [];

  /**
   * Register a plugin. Plugins are probed in registration order;
   * the first plugin whose accepts() returns true wins.
   */
  register(plugin: DiagramPlugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Resolve the plugin that handles the given source block.
   *
   * For blocks with an explicit @start<type> directive (e.g. @startjson),
   * match by the block's CANDIDATE SET first — this avoids false positives
   * from broad heuristics in other plugins (e.g. the component plugin matching
   * JSON arrays via [...]). Candidate-based routing is skipped for the types
   * that can also be assigned by content probing in @startuml blocks
   * ('sequence', 'class', 'state'), where accepts() scanning must remain
   * authoritative.
   *
   * For @startuml blocks and ambiguous types, fall through to accepts() scanning.
   */
  resolve(source: UmlSource): DiagramPlugin {
    if (!hasAmbiguousCandidate(source.types)) {
      const typed = this.plugins.find(
        (p) => source.types?.has(upstreamTypeOf(p.type)) === true,
      );
      if (typed !== undefined) return typed;
    }
    for (const plugin of this.plugins) {
      if (plugin.accepts(source.lines)) {
        return plugin;
      }
    }
    // Nothing claimed the content. Upstream still has a diagram type in hand
    // (`DiagramType.findStartTypes` on the `@start` line) and still runs the
    // factories for it -- `@startuml` + `title X` is a CLASS diagram in the jar
    // even though no keyword in it says "class". So: fall back to the plugin
    // for the block's OWN type (for `@startuml`, the type `detectUmlType`
    // settled on, whose fallback is upstream's factory order). Only a type no
    // plugin implements reaches the sentinel.
    // @see ~/git/plantuml/.../PSystemBuilder.java#createPSystem
    const typed = this.plugins.find((p) => p.type === source.type);
    if (typed !== undefined) return typed;

    return ERROR_SENTINEL;
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton registry
// ---------------------------------------------------------------------------

export const registry: DiagramRegistry = new DiagramRegistry();
