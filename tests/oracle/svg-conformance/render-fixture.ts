/**
 * Shared low-level render helper for svg-description conformance tests
 * (T18). Renders a fixture through the description engine's low-level
 * pipeline — `parseDescription` -> `layoutDescription` -> `renderDescription`
 * — injecting ONE measurer instance into BOTH the layout and render stages.
 *
 * Mirrors `scripts/svg-conformance-census.ts#renderFixtureDescription` (and
 * its `buildThemeForFixture` helper), including its rationale for
 * bypassing `renderSync`/`descriptionPlugin.render`: the public
 * `SyncPlugin#render(geo, theme)` contract has no measurer parameter (by
 * design — production always draws with `jarMeasurer`, see `renderer.ts`'s
 * own doc comment), so comparing against a deterministic-text-mode golden
 * requires calling the lower-level functions directly with the SAME
 * measurer on both stages. Theme resolution is inlined for the same reason
 * the census script inlines it: `buildTheme` in `src/index.ts` is private
 * and not exported, and this task's write-set does not include widening
 * that module's exports.
 *
 * ONE DELTA remains against the census, deliberate. This comment used
 * to claim the mirroring was "exact"; it was not, and the delta below
 * is what that inaccurate claim concealed (si8 T5).
 *
 *   1. THE SEED. This harness seeds from the RAW block source
 *      (`first.rawSource`, directives and `@start…@end` included), matching
 *      the jar's `UmlSource.seed()` and production `descriptionPlugin.parse`.
 *      The census still seeds from `['@startuml', ...block.lines, '@enduml']`,
 *      which is directive-stripped and so diverges the shadow/gradient/uid
 *      ids for any fixture carrying `skin`/`!define`/etc. See the inline
 *      comment at the `seeded` binding. The census is the one that is behind;
 *      correcting it is outside this task's write-set.
 *
 * The include store is no longer a delta of any kind: every harness that
 * renders a fixture now shares one seam,
 * `tests/helpers/fixture-include-store.ts`. It used to be copied into seven
 * places, and they drifted — see that module's header.
 *
 * The store itself is NOT a delta any more, and that is this file's other si8
 * change: `buildBlockUmls` was called here with no options at all, so no
 * golden in any suite could use `!include`. That is why the sprite fixtures
 * had to inline their sprite declarations rather than write the
 * `!include <bundle/thing>` a user actually writes.
 */
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import type { PreprocessorResult } from '../../../src/core/preprocessor.js';
import { resolveTheme } from '../../../src/core/theme.js';
import { resolveSkinparam, parseStyleBlock } from '../../../src/core/skinparam.js';
import { applyStyleMap } from '../../../src/core/style-map-theme.js';
import { applySkinLayer } from '../../../src/core/skin-loader.js';
import type { Theme } from '../../../src/core/theme.js';
import type { StyleMap } from '../../../src/core/skinparam.js';
import type { StringMeasurer } from '../../../src/core/measurer.js';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { layoutDescription } from '../../../src/diagrams/description/layout.js';
import { renderDescription, unwrapKlimtSvg } from '../../../src/diagrams/description/renderer.js';
import { seedOf } from '../../../src/core/klimt/drawing/svg/svg-graphics-core.js';
import { applyChrome, isEmpty } from '../../../src/core/annotations/index.js';
import { resolveAnnotationStyles } from '../../../src/core/annotations/style.js';
import { assembleSvg } from '../../../src/index.js';

interface ResolvedThemeAndStyles {
  readonly theme: Theme;
  readonly styleMap: StyleMap;
}

function buildThemeForFixture(preprocessed: PreprocessorResult): ResolvedThemeAndStyles {
  const base = resolveTheme(preprocessed.theme ?? 'default');
  // mission skin-file-loading Batch 1 (D6) / deferred D3 item: mirrors
  // src/index.ts#buildTheme's own Stage 1.5 -- applied BEFORE the
  // document's own skinparam so the document always wins. Previously
  // missing from this harness (only render-fixture-state.ts had it).
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
  const theme = applyStyleMap(styleMap, withStyles);
  return { theme, styleMap };
}

/** Renders a `.puml` fixture through the description engine's low-level
 * pipeline with `measurer` injected into both the layout and render stages.
 * Throws if the markup contains no diagram block. */
export function renderFixture(markup: string, measurer: StringMeasurer): string {
  // Same stage order as `renderSync` (SI7): split the `@start…@end` blocks on
  // RAW lines, then run the preprocessor over the first block's interior.
  // si8 T5: the vendored-stdlib store, so a fixture may write the
  // `!include <bundle/thing>` a user actually writes instead of inlining what
  // the bundle would have defined (mirrors the census's SI5b wiring).
  const blocks = buildBlockUmls(markup, { includeStore: fixtureIncludeStore() });
  const first = blocks[0];
  if (first === undefined) throw new Error('no diagram block found');
  if (!first.ok) throw first.failure.cause;

  const preprocessed = first.preprocessed;
  const { theme, styleMap } = buildThemeForFixture(preprocessed);
  const block = { ...first.source, rawStyles: preprocessed.styles };
  const ast = parseDescription(block);
  // Seed over the RAW block source (directives + @start/@end included),
  // matching the jar's `UmlSource.seed()` and production
  // `descriptionPlugin.parse` -- `block.lines` is directive-stripped, which
  // omits `skin`/`!define`/etc. and diverges the shadow/gradient/uid id
  // (see `UmlSource.rawSourceLines`'s doc comment).
  const seeded = { ...ast, seed: seedOf(first.rawSource.map((s) => s.getString()).join('\n')) };
  const geo = layoutDescription(seeded, theme, measurer);
  const completeSvg = renderDescription(geo, theme, measurer);

  // T7 -- wire chrome into this bypass path too (same rationale as
  // src/index.ts#applyAnnotationChrome), so a titled description fixture
  // measures with its chrome present rather than a title-less render.
  const annotations = ast.annotations;
  if (annotations === undefined || isEmpty(annotations)) return completeSvg;

  const styles = resolveAnnotationStyles(theme, preprocessed.skinparam, styleMap);
  const unwrapped = unwrapKlimtSvg(completeSvg, theme.colors.background);
  return assembleSvg(applyChrome(unwrapped, annotations, styles, measurer));
}
