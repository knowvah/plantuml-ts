/**
 * class-namespace-ink-shape.ts -- `buildNamespaceGeos`'s per-namespace
 * `LimitFinder` ink-rule selection, moved verbatim out of
 * `class-geo-builders.ts` (cdd7-T2a file-cap move; no behaviour change).
 */
import type { Theme } from '../../core/theme.js';
import type { NamespaceGeo } from './class-geo-types.js';

/**
 * G2 N60 (item 42): mirrors `renderer.ts#renderNamespace`'s own
 * `theme.packageStyle === 'rect' ? renderNamespaceRect : renderNamespaceFolder`
 * dispatch, and `renderNamespaceFolder`'s own `theme.strictUml === true ?
 * <polygon> : <path>` branch inside that -- see `NamespaceGeo.inkShape`'s
 * own doc comment (`layout.ts`) for the jar-verified `LimitFinder` ink-rule
 * consequence of each shape. Resolved ONCE per diagram (every namespace in
 * a class diagram shares the SAME theme-level `packageStyle`/`strictUml` --
 * this port has no per-group `PackageStyle` override yet, matching
 * `renderer.ts`'s own established scope note) rather than per-namespace.
 */
export function resolveNamespaceInkShape(theme: Theme, usymbol: string | undefined): NamespaceGeo['inkShape'] {
  // cdd-T12 (A2b E3): an explicit group `USymbol` wins over the diagram-wide
  // `packageStyle` fallback -- `ClusterDecoration#guess`
  // (`svek/ClusterDecoration.java:66-71`) only consults the `PackageStyle`
  // when `symbol == null`, so a `<<Node>>`/`<<Rectangle>>` container's ink
  // rule follows ITS shape, not `theme.packageStyle`/`theme.strictUml`.
  const bySymbol = usymbol !== undefined ? USYMBOL_INK_SHAPE[usymbol] : undefined;
  if (bySymbol !== undefined) return bySymbol;
  if (usymbol !== undefined && !FOLDER_FAMILY_KEYWORDS.has(usymbol)) return undefined;
  if (theme.packageStyle === 'rect') return 'rect';
  if (theme.strictUml === true) return 'polygon';
  return undefined;
}

/** Group-`USymbol` keyword -> `LimitFinder` ink rule, for the shapes whose
 *  `asBig` draws something other than a plain `UPath` -- see
 *  `class-geo-namespace-types.ts#NamespaceGeo.inkShape` and
 *  `class-ink-shapes.ts` for the per-rule upstream citations. Every keyword
 *  absent here (`cloud`, `card`, `frame`, `artifact`, ...) draws a `UPath`,
 *  which is the plain rule (`undefined`). `rectangle`/`agent`/`archimate`/
 *  the rectangle-faced `component` all resolve to `USymbolRectangle`, whose
 *  `drawRect` emits a `URectangle` (`LimitFinder#drawRectangle`). */
const USYMBOL_INK_SHAPE: Readonly<Record<string, NamespaceGeo['inkShape']>> = {
  node: 'node',
  database: 'database',
  rectangle: 'rect',
  agent: 'rect',
  archimate: 'rect',
};

/** `USymbols.FOLDER`/`USymbols.PACKAGE` are both `USymbolFolder` instances,
 *  i.e. the shapes `renderNamespaceFolder` still draws -- so they keep the
 *  pre-cdd-T12 `theme.packageStyle`/`theme.strictUml` dispatch. */
const FOLDER_FAMILY_KEYWORDS: ReadonlySet<string> = new Set(['package', 'folder']);
