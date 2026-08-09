/**
 * `RenderOptions` and measurer resolution — extracted from `src/index.ts`
 * (mission A5 / T4).
 *
 * Same reason `buildTheme` was extracted before it (see `build-theme.ts`, and
 * `index.ts#renderSync`'s own comment recording that move): `index.ts` sits at
 * the repo's 500-line hook cap, so it cannot take an addition until something
 * cohesive comes out. This is the "what the caller asked for, and which
 * measurer that implies" unit — a public options type plus the two functions
 * that turn it into a `StringMeasurer`.
 *
 * `RenderOptions` remains exported from `src/index.ts`, which is the package's
 * only "exports" subpath, so this move is invisible to consumers.
 */
import { CanvasMeasurer, FormulaMeasurer } from './measurer.js';
import { jarMeasurer } from './measurer-jar.js';
import type { StringMeasurer } from './measurer.js';
import type { Theme } from './theme.js';
import type { DiagramType } from './block-extractor.js';
import type { IncludeFetcher, IncludeStore } from './include-resolver.js';
import type { StdlibRegistry } from './tim/StdlibRegistry.js';
import type { AssetStore } from './asset-store.js';

export interface RenderOptions {
  theme?: 'default' | 'dark' | 'sketchy' | 'monochrome' | Partial<Theme>;
  measurer?: StringMeasurer;
  maxWidth?: number;
  /** Async include fetcher used by `render()` / `renderAll()` to PREFILL the include store. Ignored by `renderSync` (which cannot await). */
  fetcher?: IncludeFetcher;
  /**
   * Pre-populated include content: `path -> source`, read SYNCHRONOUSLY by the TIM interpreter wherever
   * upstream would open a file (`src/core/tim/IncludeStore.ts`). Two reasons to pass one:
   *  - `renderSync` cannot fetch. A store is the ONLY way it resolves includes.
   *  - Stdlib bundles. `!include <c4/C4_Context.puml>` resolves from the store
   *    and nowhere else — this port vendors no stdlib asset (mission SI5b).
   * `render()` treats it as a base: it fetches the rest on top, and never
   * mutates it. An include that neither the store nor the fetcher can serve is a
   * typed error naming the path, never a silent skip.
   */
  includeStore?: IncludeStore;
  /**
   * Lazily-loaded stdlib bundles for `!include <bundle/thing>`, built with
   * `stdlibRegistry()` (`core/tim/StdlibRegistry.ts`): each bundle's payload
   * loads on first use rather than up front, which matters at these sizes (`tupadr3` alone is 19.54 MB).
   * Consulted ONLY after `includeStore` misses on both channels, so passing one
   * never changes the outcome for a target that already resolved. `render()` / `renderAll()` only —
   * `renderSync` cannot await a dynamic `import()`; sync callers await `prepareIncludeStore` and pass its result as `includeStore`.
   */
  stdlibRegistry?: StdlibRegistry;
  /** si11b sprite diagnostics (`surfaceSpriteWarnings`, `core/sprite-commands.js`): `onWarning` fires once per name collision found during parse (ADR-7; free when omitted); `sprites` is the escape hatch for macro-produced `<$name>` refs a source scan can't see (ADR-5b), consumed by the per-sprite prefetch scan. */
  onWarning?: ((message: string) => void) | undefined;
  sprites?: readonly string[] | undefined;
  /** ADR-2 (plans/s1l-tail-fix): pre-populated vendored asset store (jar `/sprites/**`, F4-a; Twemoji artwork, F4-b), read SYNCHRONOUSLY like `includeStore` — `renderSync` can't await `import()`. A miss (`undefined`) makes the caller degrade to its existing fallback, never throw. */
  assetStore?: AssetStore | undefined;
}

export function getDefaultMeasurer(): StringMeasurer {
  try {
    return new CanvasMeasurer();
  } catch {
    return new FormulaMeasurer();
  }
}

/**
 * Per-plugin default measurer resolution (T17, D12): the description
 * engine's production default is the jar-faithful measurer — its klimt
 * text emission is already jar-calibrated (D12), and mismatched layout vs
 * render metrics would misposition every entity/cluster/edge it draws.
 * Every other diagram type keeps the existing Canvas/Formula default
 * unchanged (acceptance criterion 3 — no cross-engine bleed). An explicit
 * `options.measurer` always wins, for both branches (e.g.
 * `scripts/dot-sync-report.ts`'s own oracle-DOT-emission measurer, which
 * bypasses this resolution entirely by calling `layoutDescription`
 * directly rather than going through `render()`/`renderSync()`).
 */
export function resolveMeasurer(pluginType: DiagramType, options?: RenderOptions): StringMeasurer {
  if (options?.measurer !== undefined) return options.measurer;
  if (pluginType === 'description') return jarMeasurer;
  return getDefaultMeasurer();
}
