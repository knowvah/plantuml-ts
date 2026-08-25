/**
 * Shared low-level render helper for svg-class conformance tests (G2/N0).
 *
 * Mirrors `render-fixture.ts` (svg-description) exactly, but routes through
 * the CLASS engine's own pipeline (`parseClass` -> `layoutClass` ->
 * `renderClass`) instead of description's. `renderClass` -- unlike
 * `renderDescription` -- takes no `measurer` parameter: every text metric it
 * needs is already baked into the `ClassGeometry` layoutClass produces, so
 * `DeterministicMeasurer` is injected once, at the layout stage only.
 *
 * Chrome (title/caption/legend/header/footer) wiring mirrors `src/index.ts
 * #applyAnnotationChrome`'s GENERIC (non-klimt) branch: `renderClass` always
 * returns a `RenderFragment` (never a klimt `CompleteSvg`), so this goes
 * straight through the shared `applyChrome` + `assembleSvg` -- no
 * `unwrapKlimtSvg` dance (that machinery is description/klimt-specific only,
 * per `renderClass`'s own doc comment: "Pure function: ClassGeometry + Theme
 * -> SVG string. No DOM, no async").
 */
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { PreprocessOptions, PreprocessorResult } from '../../../src/core/preprocessor.js';
import { resolveTheme } from '../../../src/core/theme.js';
import { resolveSkinparam, parseStyleBlock } from '../../../src/core/skinparam.js';
import { applyStyleMap } from '../../../src/core/style-map-theme.js';
import { applySkinLayer } from '../../../src/core/skin-loader.js';
import { computeClassTagCascadeGenerations } from '../../../src/core/style-cascade-class.js';
import type { Theme } from '../../../src/core/theme.js';
import type { StyleMap } from '../../../src/core/skinparam.js';
import type { StringMeasurer } from '../../../src/core/measurer.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { parseClass } from '../../../src/diagrams/class/parser.js';
import { layoutClass } from '../../../src/diagrams/class/layout.js';
import { renderClass } from '../../../src/diagrams/class/renderer.js';
import { applyChrome, isEmpty } from '../../../src/core/annotations/index.js';
import { resolveAnnotationStyles } from '../../../src/core/annotations/style.js';
import { assembleSvg } from '../../../src/index.js';
import { applyClassDocumentMargin } from '../../../src/diagrams/class/layout-ink-extent.js';

interface ResolvedThemeAndStyles {
  readonly theme: Theme;
  readonly styleMap: StyleMap;
}

function buildThemeForFixture(preprocessed: PreprocessorResult): ResolvedThemeAndStyles {
  const base = resolveTheme(preprocessed.theme ?? 'default');
  // mission skin-file-loading Batch 1 (D6) / deferred D3 item: mirrors
  // src/index.ts#buildTheme's own Stage 1.5 -- applied BEFORE the
  // document's own skinparam so the document always wins. Previously
  // missing from this harness (only render-fixture-state.ts had it),
  // so a `skin rose` class fixture never saw its loaded Shadowing value
  // under this test pipeline even though production (`src/index.ts`)
  // already resolved it correctly.
  const withSkin = applySkinLayer(preprocessed, base);
  const withSkinparam = resolveSkinparam(preprocessed.skinparam, withSkin).theme;

  const styleMap = preprocessed.styles
    .map(parseStyleBlock)
    .reduce<StyleMap>((acc, m) => {
      m.forEach((props, selector) => {
        const existing = acc.get(selector) ?? new Map<string, string>();
        props.forEach((v, k) => existing.set(k, v));
        acc.set(selector, existing);
      });
      return acc;
    }, new Map());

  const flatRoot = styleMap.get('') ?? new Map<string, string>();
  const withStyles = resolveSkinparam(flatRoot, withSkinparam).theme;
  const withStyleMap = applyStyleMap(styleMap, withStyles);

  // G2 N39: mirrors src/index.ts#buildTheme's own Stage 3a extension --
  // see that function's doc comment.
  const classTagCascadeGenerations = computeClassTagCascadeGenerations(preprocessed.styles);
  const theme =
    classTagCascadeGenerations === undefined
      ? withStyleMap
      : {
          ...withStyleMap,
          colors: {
            ...withStyleMap.colors,
            graph: { ...withStyleMap.colors.graph, classTagCascadeGenerations },
          },
        };
  return { theme, styleMap };
}

/** Renders a `.puml` fixture through the CLASS engine's low-level pipeline
 * with `measurer` injected at the layout stage. `options` (e.g. `{
 * includeStore }`) passes through to `buildBlockUmls` verbatim -- additive,
 * optional, mirrors `scripts/svg-conformance-census.ts`'s own stdlib-store
 * wiring for the description pipeline (SI5b/T9) so `<bundle/...>` class
 * fixtures can render instead of erroring. Throws if the markup contains no
 * diagram block.
 *
 * G2 N28: multi-page (`newpage`) sources render ONLY the first page's
 * geometry -- this doc comment's own PRE-EXISTING claim ("same fidelity
 * level as `render-fixture.ts`"), which the implementation never actually
 * honored (`layoutClass` was called on the full, `.pages`-carrying AST,
 * which its own `ast.pages !== undefined` branch stacks EVERY page into one
 * geometry -- `layout.ts:654`, `layoutMultiPage`). Jar-verified necessary:
 * the reference CLI this harness's own oracle (`test-results/dot-cache/`)
 * comes from never exports page 2+ at all (`AbstractDiagram
 * .getNbImages()` => 1, unconditionally -- `NewpagedDiagram.java:87-162`'s
 * per-page cardinality is dead code upstream, per `class-newpage-layout
 * .test.ts`'s own header doc), so comparing this port's DELIBERATE
 * all-pages-stacked PRODUCTION behavior (D1/T7 -- a real value-add over
 * jar, kept unchanged in `renderClass`/`layoutClass` themselves) against a
 * single-page oracle SVG can never reach zero-diff regardless of any
 * per-element fidelity. Stripping `.pages` here (test-harness-only) routes
 * `layoutClass` through its EXISTING single-page branch -- no new
 * production code, matching what the doc comment already promised. */
export function renderFixtureClass(
  markup: string,
  measurer: StringMeasurer,
  options?: PreprocessOptions,
): string {
  const blocks = buildBlockUmls(markup, options);
  const first = blocks[0];
  if (first === undefined) throw new Error('no diagram block found');
  if (!first.ok) throw first.failure.cause;

  const preprocessed = first.preprocessed;
  const { theme, styleMap } = buildThemeForFixture(preprocessed);
  const block = { ...first.source, rawStyles: preprocessed.styles, stylePositions: preprocessed.stylePositions };
  const fullAst = astOrThrow(parseClass(block), 'class');
  // G2 N28: page-1-only view -- see this function's own doc comment.
  const { pages: _pages, ...firstPageAst } = fullAst;
  // SI14 T3/T4: mirrors `class/index.ts#classPlugin.layoutSync`'s own
  // post-layout `measurer`/`sprites` passthrough exactly -- `layoutClass`
  // itself does not set either field (T3's `SyncPlugin.render(geo, theme)`
  // dispatcher contract note: only `layoutSync` sees the measurer). Without
  // this, `geo.measurer` stays `undefined` here and `renderClass`'s T4
  // usecase/actor draw path silently falls back to the pre-T4 renderer for
  // EVERY fixture this harness runs, never exercising the code this task
  // adds. Reproduces production's exact behavior, not new test-only logic.
  const spritesField = firstPageAst.sprites !== undefined ? { sprites: firstPageAst.sprites } : {};
  const geo = { ...layoutClass(firstPageAst, theme, measurer), measurer, ...spritesField };
  const fragment = renderClass(geo, theme);

  const annotations = firstPageAst.annotations;
  if (annotations === undefined || isEmpty(annotations)) return assembleSvg(fragment);

  const styles = resolveAnnotationStyles(theme, preprocessed.skinparam, styleMap);
  const chromed = applyChrome(fragment, annotations, styles, measurer);
  // G2 N46: mirrors `index.ts#applyAnnotationChrome`'s class-specific
  // margin re-application exactly -- see that function's own doc comment
  // and `RenderFragment.preChromeWidth`'s doc comment for the jar-verified
  // mechanism. `renderClass` always sets `preChromeWidth` (non-degenerate
  // single-page path), so this always re-margins when annotations are
  // present.
  if (fragment.preChromeWidth === undefined) return assembleSvg(chromed);
  const margined = applyClassDocumentMargin({ width: chromed.width, height: chromed.height });
  return assembleSvg({ ...chromed, width: margined.width, height: margined.height });
}
