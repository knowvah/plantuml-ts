/**
 * Shared low-level render helper for the svg-json / svg-yaml / svg-hcl
 * conformance suites (mission A5, Batch 1 / T1).
 *
 * Mirrors `render-fixture-state.ts` procedurally — see that file's doc comment
 * for the rationale common to every one of these helpers (one measurer
 * instance injected into BOTH the layout and render stages; the low-level
 * pipeline rather than `renderSync`, so production's own measurer default
 * cannot leak into a conformance measurement).
 *
 * ONE structural difference from every sibling helper, and it is the reason
 * this file serves three suites instead of one: **yaml and hcl have no layout
 * or renderer of their own.** `yaml/index.ts` and `hcl/index.ts` both import
 * `layoutJson` and `renderJson` directly from `../json/`, and all three
 * parsers return the same `JsonDiagramAST`. So the only per-type step is the
 * PARSE, dispatched here on the block's own `type`; everything downstream is
 * literally the same code path. A json layout change is transitively yaml's
 * and hcl's, which is why mission A5 measures all three from the start
 * (ADR-4) rather than verifying yaml/hcl at the end.
 *
 * Unlike `render-fixture-class.ts`, there is no multi-page stripping (no
 * `.pages` on `JsonDiagramAST`) and no post-chrome document-margin
 * re-application (`renderJson` never sets `RenderFragment.preChromeWidth`) —
 * both would be guaranteed no-ops here, so both are omitted deliberately
 * rather than by oversight.
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
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { JsonDiagramAST } from '../../../src/diagrams/json/ast.js';
import { parseJson } from '../../../src/diagrams/json/parser.js';
import { parseYaml } from '../../../src/diagrams/yaml/parser.js';
import { parseHcl } from '../../../src/diagrams/hcl/parser.js';
import { layoutJson } from '../../../src/diagrams/json/layout.js';
import { renderJson } from '../../../src/diagrams/json/renderer.js';
import { applyChrome, isEmpty } from '../../../src/core/annotations/index.js';
import { resolveAnnotationStyles } from '../../../src/core/annotations/style.js';
import { assembleSvg } from '../../../src/index.js';

interface ResolvedThemeAndStyles {
  readonly theme: Theme;
  readonly styleMap: StyleMap;
}

/** Mirrors `render-fixture-state.ts#buildThemeForFixture` — same 4-stage
 *  algorithm as `src/index.ts#buildTheme` (a private, unexported function),
 *  assembled from the same already-exported building blocks rather than
 *  widening that module's exports for a test helper. */
function buildThemeForFixture(
  preprocessed: PreprocessorResult,
  rawSourceLines?: readonly string[],
): ResolvedThemeAndStyles {
  const base = resolveTheme(preprocessed.theme ?? 'default');
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

/** The one per-type step. All three parsers share the signature
 *  `(UmlSource) => JsonDiagramAST`; everything after this is shared code. */
function parseForType(block: UmlSource): JsonDiagramAST {
  if (block.type === 'yaml') return parseYaml(block);
  if (block.type === 'hcl') return parseHcl(block);
  return parseJson(block);
}

/**
 * The jar's `data-diagram-type`, and the `jsonShell` discriminant that routes
 * the fragment through the shared jar-faithful document shell.
 *
 * This helper renders through the LOW-LEVEL pipeline, so it calls `renderJson`
 * directly and never reaches the plugin's own `render()` — which is where
 * production sets this (A5/T4). Mirroring it here is therefore load-bearing,
 * not redundant: without it the harness measures a document shell no shipped
 * code path produces, and reports a gap that is purely its own.
 */
function shellTypeFor(block: UmlSource): string {
  if (block.type === 'yaml') return 'YAML';
  if (block.type === 'hcl') return 'HCL';
  return 'JSON';
}

/**
 * Renders a `.puml` fixture through the json-family low-level pipeline with
 * `measurer` injected at the layout stage. Handles `@startjson`, `@startyaml`
 * and `@starthcl` — dispatching only the parse, since the three share
 * `layoutJson`/`renderJson`. `options` passes through to `buildBlockUmls`
 * verbatim. Throws if the markup contains no diagram block.
 */
export function renderFixtureJson(
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
  const block: UmlSource = { ...first.source, rawStyles: preprocessed.styles };

  const ast = parseForType(block);
  const geo = layoutJson(ast, theme, measurer);
  const fragment = { ...renderJson(geo, theme), jsonShell: shellTypeFor(block) };

  const annotations = ast.annotations;
  if (annotations === undefined || isEmpty(annotations)) return assembleSvg(fragment);

  const styles = resolveAnnotationStyles(theme, preprocessed.skinparam, styleMap);
  return assembleSvg(applyChrome(fragment, annotations, styles, measurer));
}
