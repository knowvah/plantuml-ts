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
import type { PreprocessOptions, PreprocessorResult } from '../../../src/core/preprocessor.js';
import { resolveTheme } from '../../../src/core/theme.js';
import { resolveSkinparam, parseStyleBlock } from '../../../src/core/skinparam.js';
import { applyStyleMap } from '../../../src/core/style-map-theme.js';
import { applySkinLayer } from '../../../src/core/skin-loader.js';
import type { Theme } from '../../../src/core/theme.js';
import type { StyleMap } from '../../../src/core/skinparam.js';
import type { StringMeasurer } from '../../../src/core/measurer.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { parseState } from '../../../src/diagrams/state/parser.js';
import { layoutState } from '../../../src/diagrams/state/layout.js';
import { renderState } from '../../../src/diagrams/state/renderer.js';
import { applyChrome, isEmpty } from '../../../src/core/annotations/index.js';
import { resolveAnnotationStyles } from '../../../src/core/annotations/style.js';
import { assembleSvg } from '../../../src/index.js';

interface ResolvedThemeAndStyles {
  readonly theme: Theme;
  readonly styleMap: StyleMap;
}

function buildThemeForFixture(
  preprocessed: PreprocessorResult,
  rawSourceLines?: readonly string[],
): ResolvedThemeAndStyles {
  const base = resolveTheme(preprocessed.theme ?? 'default');
  // mission skin-file-loading Batch 1 (D6): mirrors src/index.ts#buildTheme's
  // own Stage 1.5 -- applied BEFORE the document's own skinparam so the
  // document always wins. `rawSourceLines` (Batch 4) threads the document's
  // own bare `!define NAME` flags into a preprocessor-grammar skin's
  // `!ifdef` branches -- see `skin-loader.ts#applySkinLayer`'s own doc
  // comment. NOT wired into `src/index.ts`'s own `buildTheme` (a deliberate,
  // journaled scope decision -- that file is already a pre-existing >500-
  // line complexity-hook violation outside this batch's write-set, and
  // splitting it is a materially larger, out-of-scope change). This harness
  // exercises the mechanism directly so the reddress `+DARKBLUE` fixture can
  // still be verified.
  const withSkin = applySkinLayer(preprocessed, base, rawSourceLines);
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
  const theme = applyStyleMap(styleMap, withStyles);
  return { theme, styleMap };
}

/** Renders a `.puml` fixture through the STATE engine's low-level pipeline
 * with `measurer` injected at the layout stage. `options` (e.g. `{
 * includeStore }`) passes through to `buildBlockUmls` verbatim — additive,
 * optional, mirrors `render-fixture-class.ts`'s own stdlib-store wiring so
 * `<bundle/...>` state fixtures can render instead of erroring. Throws if
 * the markup contains no diagram block. */
export function renderFixtureState(
  markup: string,
  measurer: StringMeasurer,
  options?: PreprocessOptions,
): string {
  const blocks = buildBlockUmls(markup, options);
  const first = blocks[0];
  if (first === undefined) throw new Error('no diagram block found');
  if (!first.ok) throw first.failure.cause;

  const preprocessed = first.preprocessed;
  const rawSourceLines = first.rawSource.map((s) => s.getString());
  const { theme, styleMap } = buildThemeForFixture(preprocessed, rawSourceLines);
  const block = { ...first.source, rawStyles: preprocessed.styles };
  const ast = astOrThrow(parseState(block), 'state');
  const geo = layoutState(ast, theme, measurer);
  const fragment = renderState(geo, theme);

  const annotations = ast.annotations;
  if (annotations === undefined || isEmpty(annotations)) return assembleSvg(fragment);

  const styles = resolveAnnotationStyles(theme, preprocessed.skinparam, styleMap);
  const chromed = applyChrome(fragment, annotations, styles, measurer);
  return assembleSvg(chromed);
}
