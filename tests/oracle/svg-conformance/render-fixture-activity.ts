/**
 * Shared low-level render helper for the svg-activity conformance suite
 * (activity-oracle-harness / T1).
 *
 * Mirrors `render-fixture-sequence.ts` procedurally — see that file's doc
 * comment for the rationale common to every one of these helpers (one
 * measurer instance injected into BOTH the layout and render stages; the
 * low-level pipeline rather than `renderSync`, so production's own measurer
 * default cannot leak into a conformance measurement).
 *
 * Activity routes through its OWN dedicated engine (`parseActivity` ->
 * `layoutActivity` -> `renderActivity`, `src/diagrams/activity/index.ts`'s
 * `activityPlugin`), not a shared one. `renderActivity`, like `renderSequence`
 * and `renderState`, takes no `measurer` parameter of its own — every text
 * metric it needs is already baked into the `ActivityGeometry` `layoutActivity`
 * produces (`src/diagrams/activity/activity-layout-types.ts:43-49`: no
 * `measurer` field on the geometry either), so the measurer is injected once,
 * at the layout stage, and reused (never recreated) for the chrome stage
 * below.
 *
 * Activity's own answers to the three structural questions sequence's doc
 * comment asks (derived independently, NOT copied from sequence's
 * conclusions — two of the three land the same way, one does not):
 *
 *   1. NO MULTI-PAGE STRIPPING. `ActivityDiagramAST`
 *      (`src/diagrams/activity/ast.ts:140-163`) has exactly `nodes`,
 *      `swimlanes`, `annotations?`, `sprites?` — no `.pages` field, same
 *      absence sequence and state rely on, so the same no-op applies here.
 *   2. NO POST-CHROME DOCUMENT-MARGIN RE-APPLICATION. `renderActivity`
 *      (`src/diagrams/activity/renderer.ts:196`) returns the `RenderFragment`
 *      literal at lines 221-226 — `{ body, width: geo.totalWidth, height:
 *      geo.totalHeight, background }` — which never sets `preChromeWidth`.
 *      `RenderFragment.preChromeWidth` (`src/core/dispatcher.ts:124`) is what
 *      gates `applyClassDocumentMargin` in `render-fixture-class.ts` and in
 *      `src/index.ts#applyAnnotationChrome`'s own generic (non-class) branch;
 *      an always-`undefined` field makes that branch a guaranteed no-op here
 *      too, so it is omitted rather than carried as dead code.
 *   3. AUGMENTED-BLOCK CONSTRUCTION FOR PARSE IS NEEDED -- THIS IS WHERE
 *      ACTIVITY DIFFERS FROM SEQUENCE. `parseActivity`
 *      (`src/diagrams/activity/parser.ts:83`) takes a `UmlSource`-shaped
 *      `block` object, not `readonly string[]` — confirmed by
 *      `activityPlugin.parse` itself (`src/diagrams/activity/index.ts:20-22`),
 *      which passes `block` straight through to `parseActivity(block)`
 *      unchanged. This mirrors `parseState`/`parseClass`, NOT `parseSequence`
 *      (which discards everything but `.lines`, `src/diagrams/sequence/
 *      index.ts:45-47`), so the widened block (`rawStyles`/`stylePositions`
 *      from the preprocessor result, mirroring `render-fixture-state.ts` /
 *      `render-fixture-class.ts`) is built and passed here. Note
 *      `parseActivity` itself only ever reads `block.lines`
 *      (`src/diagrams/activity/parser.ts:84`) — confirmed by inspection, no
 *      `rawStyles`/`stylePositions` token appears in `parser.ts` or its
 *      `node-dispatch.ts`/`dispatch-support.ts` siblings — so the widened
 *      fields are inert for activity today. They are still threaded through,
 *      matching the state/class shape exactly rather than special-casing a
 *      currently-unconsumed field, since a future activity skinparam/style
 *      command could start reading them without this helper needing to
 *      change.
 *
 * `sprites` (parsed onto `ActivityDiagramAST`, `ast.ts:162`) is NOT threaded
 * through to geometry/render the way `render-fixture-class.ts` threads it
 * onto `geo.sprites` for `renderClass`'s actor/usecase icon path:
 * `ActivityGeometry` has no `sprites` field
 * (`src/diagrams/activity/activity-layout-types.ts:43-49`) and no `sprite`
 * token appears anywhere in `layout/tile-layout.ts`, `renderer.ts`, or
 * `activity-renderer-shapes.ts` (confirmed by inspection), so there is no
 * consumer to wire it into here — same situation as sequence.
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
import { parseActivity } from '../../../src/diagrams/activity/parser.js';
import { layoutActivity } from '../../../src/diagrams/activity/layout/tile-layout.js';
import { renderActivity } from '../../../src/diagrams/activity/renderer.js';
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

/** Renders a `.puml` fixture through the ACTIVITY engine's low-level
 * pipeline with `measurer` injected at the layout stage and reused (never
 * recreated) for the chrome stage. `options` (e.g. `{ includeStore }`)
 * passes through to `buildBlockUmls` verbatim. Throws if the markup contains
 * no diagram block. */
export function renderFixtureActivity(
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
  const block = { ...first.source, rawStyles: preprocessed.styles, stylePositions: preprocessed.stylePositions };
  const ast = astOrThrow(parseActivity(block), 'activity');
  const geo = layoutActivity(ast, theme, measurer);
  const fragment = renderActivity(geo, theme);

  const annotations = ast.annotations;
  if (annotations === undefined || isEmpty(annotations)) return assembleSvg(fragment);

  const styles = resolveAnnotationStyles(theme, preprocessed.skinparam, styleMap);
  const chromed = applyChrome(fragment, annotations, styles, measurer);
  return assembleSvg(chromed);
}
