/**
 * Shared low-level render helper for svg-state conformance tests (G4/S0).
 *
 * Mirrors `render-fixture-class.ts` (svg-class/svg-object) procedurally, but
 * routes through the STATE engine's own pipeline (`parseState` ->
 * `layoutState` -> `renderState`) — state diagrams DO have a dedicated
 * engine upstream (`statediagram/` package, `net/atmp/CucaDiagram` via
 * `AbstractEntityDiagram`, distinct from `classdiagram/`'s
 * `ClassDiagramFactory`), unlike object's reuse of the class engine (G3/O0).
 * `renderState`, like `renderClass`, takes no `measurer` parameter and
 * always returns a `RenderFragment` (never a klimt `CompleteSvg`) — no
 * `unwrapKlimtSvg` dance.
 *
 * Two differences from `render-fixture-class.ts`, both because
 * `StateDiagramAST` is structurally simpler than `ClassDiagramAST`:
 *   - no `.pages` field exists on `StateDiagramAST` at all, so there is no
 *     multi-page stripping to do (G2 N28's rationale does not apply here).
 *   - `renderState` never sets `RenderFragment.preChromeWidth` (confirmed by
 *     inspection of `src/diagrams/state/renderer.ts`), so the class-specific
 *     post-chrome margin re-application (`applyClassDocumentMargin`) is a
 *     guaranteed no-op for state and is omitted — this mirrors `src/index.ts
 *     #applyAnnotationChrome`'s own generic `RenderFragment` branch exactly
 *     for a plugin whose `preChromeWidth` is always `undefined`.
 */
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { PreprocessOptions } from '../../../src/core/preprocessor.js';
import { buildTheme } from '../../../src/core/build-theme.js';
import type { StringMeasurer } from '../../../src/core/measurer.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { parseState } from '../../../src/diagrams/state/parser.js';
import { layoutState } from '../../../src/diagrams/state/layout.js';
import { renderState } from '../../../src/diagrams/state/renderer.js';
import { applyChrome, isEmpty } from '../../../src/core/annotations/index.js';
import { resolveAnnotationStyles } from '../../../src/core/annotations/style.js';
import { assembleSvg } from '../../../src/index.js';

/** Renders a `.puml` fixture through the STATE engine's low-level pipeline
 * with `measurer` injected at the layout stage. `options` (e.g. `{
 * includeStore }`) passes through to `buildBlockUmls` verbatim — additive,
 * optional, mirrors `render-fixture-class.ts`'s own stdlib-store wiring so
 * `<bundle/...>` state fixtures can render instead of erroring. Throws if
 * the markup contains no diagram block. */
export function renderFixtureState(markup: string, measurer: StringMeasurer, options?: PreprocessOptions): string {
  const blocks = buildBlockUmls(markup, options);
  const first = blocks[0];
  if (first === undefined) throw new Error('no diagram block found');
  if (!first.ok) throw first.failure.cause;

  const preprocessed = first.preprocessed;
  const rawSourceLines = first.rawSource.map((s) => s.getString());
  // cdd4-T7b: the shipped `buildTheme`, not a copy of it -- a copy measured a
  // path no shipped code takes once theme styling moved into it.
  const { theme, styleMap } = buildTheme(preprocessed, undefined, rawSourceLines);
  const block = { ...first.source, rawStyles: preprocessed.styles };
  const ast = astOrThrow(parseState(block), 'state');
  const geo = layoutState(ast, theme, measurer);
  const fragment = renderState(geo, theme);

  const annotations = ast.annotations;
  if (annotations === undefined || isEmpty(annotations)) return assembleSvg(fragment);

  const styles = resolveAnnotationStyles(theme, preprocessed, styleMap);
  const chromed = applyChrome(fragment, annotations, styles, measurer, ast.sprites);
  return assembleSvg(chromed);
}
