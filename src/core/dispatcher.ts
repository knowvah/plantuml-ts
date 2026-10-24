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

import type { UmlSource } from './block-extractor.js';
import { upstreamTypeOf } from './block-extractor.js';
import type { ParseRefusal } from './parse-refusal.js';
import { mergeRefusals, parseRefusalOf } from './parse-refusal.js';
import type { SkinCut } from './skin-command.js';
import { rect, text } from './svg.js';
import type { Theme } from './theme.js';
import type { StringMeasurer } from './measurer.js';
import type { AssembledSvg, DiagramPlugin, ParseOptions, SyncPlugin } from './dispatcher-types.js';
export type {
  ParseOptions,
  RenderFragment,
  CompleteSvg,
  AssembledSvg,
  PaginatedPlugin,
  SyncPlugin,
  AsyncPlugin,
  DiagramPlugin,
} from './dispatcher-types.js';

export { parseRefusalOf } from './parse-refusal.js';

// ---------------------------------------------------------------------------
// Error-sentinel plugin
// ---------------------------------------------------------------------------

/** Returned when no registered plugin accepts a source block. */
const ERROR_SENTINEL: SyncPlugin = {
  type: 'unknown',
  parse: (_source: UmlSource) => ({}),
  layoutSync: (_ast: unknown, _theme: Theme, _measurer: StringMeasurer): unknown => ({}),
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
   *
   * `cut` (unwind2-S8): a hoisted command line that fails for every engine
   * reaching it (`skin-command.ts`). Each candidate then parses only the
   * lines before it; one that accepts them is refused AT the cut, one that
   * refuses earlier keeps its own refusal, and the merge picks the page as
   * upstream's `PSystemErrorUtils#merge` does.
   */
  resolve(source: UmlSource, options?: ParseOptions, cut?: SkinCut): Resolution {
    const attempts: Attempt[] = [];
    const parsed = cut === undefined ? source : truncated(source, cut.index);
    for (const plugin of this.plugins) {
      if (source.types !== undefined && !source.types.has(upstreamTypeOf(plugin.type))) continue;
      const outcome = attempt(plugin, parsed, options, cut);
      if (outcome.refusal === undefined) return { plugin, ast: outcome.ast };
      attempts.push({ plugin, refusal: outcome.refusal });
    }
    return resolveAllRefused(attempts);
  }
}

/** `source` with only its first `count` body lines. */
function truncated(source: UmlSource, count: number): UmlSource {
  return {
    ...source,
    lines: source.lines.slice(0, count),
    ...(source.linePositions === undefined ? {} : { linePositions: source.linePositions.slice(0, count) }),
  };
}

/**
 * One candidate's parse: its AST, or its refusal. Under a `cut`, a candidate
 * that gets through the lines before it (an empty prefix included: the
 * command fails on the block's first line) is refused at the cut, so a cut
 * never yields an AST.
 */
function attempt(
  plugin: DiagramPlugin,
  source: UmlSource,
  options: ParseOptions | undefined,
  cut: SkinCut | undefined,
): { readonly ast: unknown; readonly refusal?: undefined } | { readonly refusal: ParseRefusal } {
  if (cut !== undefined && cut.index === 0) return { refusal: cut.refusal };
  const ast = plugin.parse(source, options);
  const refusal = parseRefusalOf(ast) ?? cut?.refusal;
  return refusal === undefined ? { ast } : { refusal };
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
