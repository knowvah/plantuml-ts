/**
 * Shared low-level render helper for the svg-sequence conformance suite
 * (sequence-oracle-harness / T1).
 *
 * Mirrors `render-fixture-state.ts` procedurally — see that file's doc
 * comment for the rationale common to every one of these helpers (one
 * measurer instance injected into BOTH the layout and render stages; the
 * low-level pipeline rather than `renderSync`, so production's own measurer
 * default cannot leak into a conformance measurement).
 *
 * Sequence routes through its OWN dedicated engine
 * (`parseSequence` -> `layoutSequence` -> `renderSequence`,
 * `src/diagrams/sequence/index.ts`'s `sequencePlugin`), not a shared one —
 * unlike json/yaml/hcl's shared `layoutJson`/`renderJson` (`render-fixture-
 * json.ts`). `renderSequence`, like `renderState` and `renderClass`, takes
 * no `measurer` parameter of its own: every text metric it needs is already
 * baked into the `SequenceGeometry` `layoutSequence` produces, so the
 * measurer is injected once, at the layout stage, and reused (never
 * recreated) for the chrome stage below.
 *
 * Three deltas from `render-fixture-state.ts`, each because
 * `SequenceDiagramAST` differs structurally from `StateDiagramAST`:
 *
 *   1. NO MULTI-PAGE STRIPPING. `SequenceDiagramAST` has no `.pages` field
 *      (`src/diagrams/sequence/ast.ts`) — same absence state relies on, so
 *      the same no-op applies here (G2 N28's `render-fixture-class.ts`
 *      rationale does not apply to either engine).
 *   2. NO POST-CHROME DOCUMENT-MARGIN RE-APPLICATION. `renderSequence`
 *      (`src/diagrams/sequence/renderer.ts:433`) returns a `RenderFragment`
 *      literal that never sets `preChromeWidth` — confirmed by inspection:
 *      the object literal it returns has only `body`/`width`/`height`/
 *      `background`. `RenderFragment.preChromeWidth` is what gates
 *      `applyClassDocumentMargin` in `render-fixture-class.ts` and in
 *      `src/index.ts#applyAnnotationChrome`'s own generic (non-class)
 *      branch; an always-`undefined` field makes that branch a guaranteed
 *      no-op here too, so it is omitted rather than carried as dead code.
 *   3. NO AUGMENTED-BLOCK CONSTRUCTION FOR PARSE. `parseState`/`parseClass`/
 *      `parseForType` (json) all take a `UmlSource`-shaped `block` object
 *      that the caller widens with `rawStyles`/`stylePositions` from the
 *      preprocessor result before parsing. `parseSequence`
 *      (`src/diagrams/sequence/parser.ts:104`) takes only
 *      `readonly string[]` — confirmed by `sequencePlugin.parse` itself
 *      (`src/diagrams/sequence/index.ts:45-47`), which discards the rest of
 *      its `UmlSource` argument and passes only `source.lines` through.
 *      There is nothing for a widened block to carry into that call, so
 *      none is built; `first.source.lines` is passed directly.
 *
 * `sprites` (parsed onto `SequenceDiagramAST`, `ast.ts:151`) is NOT
 * threaded through to geometry/render the way `render-fixture-class.ts`
 * threads it onto `geo.sprites` for `renderClass`'s actor/usecase icon
 * path: `renderSequence` never reads a `sprites` field (confirmed by
 * inspection of `src/diagrams/sequence/renderer.ts` — no `sprite` token
 * appears in it), so there is no consumer to wire it into here.
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
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { renderSequence } from '../../../src/diagrams/sequence/renderer.js';
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
  // mirrors render-fixture-state.ts#buildThemeForFixture's own Stage 1.5 --
  // see that function's doc comment for the rationale (applied BEFORE the
  // document's own skinparam so the document always wins; rawSourceLines
  // threads bare `!define` flags into a preprocessor-grammar skin).
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

/** Renders a `.puml` fixture through the SEQUENCE engine's low-level
 * pipeline with `measurer` injected at the layout stage and reused
 * (never recreated) for the chrome stage. `options` (e.g. `{
 * includeStore }`) passes through to `buildBlockUmls` verbatim. Throws if
 * the markup contains no diagram block. */
export function renderFixtureSequence(
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
  const parsed = parseSequence(first.source.lines);
  // T4: `parseSequence` now returns `SequenceDiagramAST | ParseRefusal`
  // (D1). This harness bypasses `src/index.ts`'s production narrowing (it
  // drives the engine directly), so a refusal surfaces the same way
  // `tests/helpers/parse-ast.ts` does for plugin-level callers: thrown,
  // naming line/kind/message, rather than silently swallowed.
  if ('refused' in parsed) {
    throw new Error(`sequence refused this source at line ${String(parsed.line)} (${parsed.kind}): ${parsed.message}`);
  }
  const ast = parsed;
  const geo = layoutSequence(ast, theme, measurer);
  const fragment = renderSequence(geo, theme);

  const annotations = ast.annotations;
  if (annotations === undefined || isEmpty(annotations)) return assembleSvg(fragment);

  const styles = resolveAnnotationStyles(theme, preprocessed.skinparam, styleMap);
  const chromed = applyChrome(fragment, annotations, styles, measurer);
  return assembleSvg(chromed);
}
