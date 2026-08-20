#!/usr/bin/env node
/**
 * SVG conformance census — dual-measurer mission deliverable.
 *
 * Renders every cached component/usecase/class/object/state fixture (`test-
 * results/dot-cache/`, captured from the jar under
 * `-DPLANTUML_DETERMINISTIC_TEXT=true` — see `oracle/patches/0002-oracle-
 * deterministic-text.patch`). component/usecase route through the
 * description engine's LOW-LEVEL pipeline (`parseDescription` ->
 * `layoutDescription` -> `renderDescription`, via
 * `renderFixtureDescription`); `class` AND `object` both route through the
 * CLASS engine's OWN pipeline (`parseClass` -> `layoutClass` ->
 * `renderClass`, via `render-fixture-class.ts#renderFixtureClass` — G2/N0,
 * G3/O0) — object diagrams have no separate engine upstream
 * (`ClassDiagramFactory` registers the object/map commands alongside the
 * class ones; see `tests/unit/object/renderer.test.ts`'s own doc comment),
 * so reusing the identical helper is correct, not a shortcut. `state` routes
 * through its OWN dedicated engine (`parseState` -> `layoutState` ->
 * `renderState`, via `render-fixture-state.ts#renderFixtureState` — G4/S0):
 * unlike object, state diagrams DO have a separate upstream package
 * (`statediagram/`), so this is a genuinely new pipeline dispatch, not a
 * reuse. `sequence` likewise routes through its OWN dedicated engine
 * (`parseSequence` -> `layoutSequence` -> `renderSequence`, via
 * `render-fixture-sequence.ts#renderFixtureSequence` — T5 of
 * sequence-oracle-harness): like state, sequence has its own upstream
 * package (`src/diagrams/sequence/`), so this is a new dispatch, not a
 * reuse — see that helper's own doc comment for the three structural
 * deltas from `render-fixture-state.ts` (no multi-page stripping, no
 * post-chrome margin re-application, no augmented-block construction for
 * parse). `renderFixtureFor` dispatches on `type`. Each pass injects ONE
 * measurer instance into BOTH the layout and render stages, and compares
 * the result against the cached golden via `compareSvg(..., 'deterministic')`.
 *
 * Two passes over the same corpus:
 *   - `deterministic`: measurer = `DeterministicMeasurer` (this task) — the
 *     actual conformance/ratchet metric. A real cohort should now reach
 *     zero-diff, since both sides measure text in the SAME system.
 *   - `jar`: measurer = `jarMeasurer` (production's own default) — proves
 *     production's own choice of measurer is unaffected by this task: the
 *     gap against the deterministic-mode golden should look like the
 *     existing, already-documented D12 apples-to-oranges gap (see
 *     `tests/integration/description.test.ts`'s E2E suite), not a NEW
 *     regression this task introduced.
 *
 * Theme resolution is inlined (not imported from `src/index.ts#buildTheme`,
 * which is a private, unexported function) rather than widening that
 * module's exports outside this task's declared write-set — mirrors its
 * exact 4-stage algorithm (see that function's own doc comment) using the
 * same already-exported building blocks.
 *
 * Usage: npx tsx scripts/svg-conformance-census.ts [component] [usecase] [class]
 *          [object] [state] [sequence] [dot] [json] [yaml] [hcl]
 *   (defaults to component + usecase; every other type must be requested
 *   explicitly)
 *
 * Two triage flags, each of which prints and then SKIPS the jar pass:
 *   --per-fixture  one line per fixture with its diff count, name-sorted, so
 *                  two runs diff mechanically. Use this to decide whether an
 *                  engine bump or a fix actually moved a fixture: the bucket
 *                  report alone cannot show movement inside a bucket.
 *   --families     diff paths de-indexed into structural families, ranked by
 *                  how many fixtures each reaches.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildBlockUmls } from '../src/core/BlockUmlBuilder.js';
import type { PreprocessorResult } from '../src/core/preprocessor.js';
import { resolveTheme, deepMergeTheme } from '../src/core/theme.js';
import { resolveSkinparam, parseStyleBlock } from '../src/core/skinparam.js';
import { applyStyleMap } from '../src/core/style-map-theme.js';
import { computeClassTagCascadeGenerations } from '../src/core/style-cascade-class.js';
import type { Theme } from '../src/core/theme.js';
import type { StyleMap } from '../src/core/skinparam.js';
import type { StringMeasurer } from '../src/core/measurer.js';
import { jarMeasurer } from '../src/core/measurer-jar.js';
import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { parseDescription } from '../src/diagrams/description/parser.js';
import { layoutDescription } from '../src/diagrams/description/layout.js';
import { renderDescription, unwrapKlimtSvg } from '../src/diagrams/description/renderer.js';
import { seedOf } from '../src/core/klimt/drawing/svg/svg-graphics-core.js';
import { applyChrome, isEmpty } from '../src/core/annotations/index.js';
import { resolveAnnotationStyles } from '../src/core/annotations/style.js';
import { assembleSvg, renderSync } from '../src/index.js';
import { compareSvg } from '../tests/oracle/svg-conformance/compare.js';
import { withStdlib } from '../src/core/tim/StdlibStore.js';
import { buildStdlibAssetsStore } from './stdlib-assets-store.js';
import { normalizeSvg } from '../tests/oracle/svg-conformance/normalize.js';
import { renderFixtureClass } from '../tests/oracle/svg-conformance/render-fixture-class.js';
import { renderFixtureState } from '../tests/oracle/svg-conformance/render-fixture-state.js';
import { renderFixtureSequence } from '../tests/oracle/svg-conformance/render-fixture-sequence.js';
import { renderFixtureJson } from '../tests/oracle/svg-conformance/render-fixture-json.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(REPO, 'test-results', 'dot-cache');
const DEFAULT_TYPES = ['component', 'usecase'];

// ---------------------------------------------------------------------------
// Theme resolution — mirrors src/index.ts#buildTheme (private, not exported).
// ---------------------------------------------------------------------------

interface ResolvedThemeAndStyles {
  readonly theme: Theme;
  readonly styleMap: StyleMap;
}

function buildThemeForFixture(preprocessed: PreprocessorResult): ResolvedThemeAndStyles {
  const base = resolveTheme(preprocessed.theme ?? 'default');
  const withSkinparam = resolveSkinparam(preprocessed.skinparam, base).theme;

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

// ---------------------------------------------------------------------------
// Fixture discovery (mirrors scripts/svg-parity-survey.ts#listFixtureDirs)
// ---------------------------------------------------------------------------

interface FixtureDir { slug: string; type: string; dir: string }

function listFixtureDirs(type: string): FixtureDir[] {
  const typeDir = join(CACHE_DIR, type);
  if (!existsSync(typeDir)) return [];
  const out: FixtureDir[] = [];
  for (const slug of readdirSync(typeDir)) {
    const dir = join(typeDir, slug);
    if (!statSync(dir).isDirectory()) continue;
    if (!existsSync(join(dir, '.done'))) continue;
    if (!existsSync(join(dir, 'in.puml')) || !existsSync(join(dir, 'in.svg'))) continue;
    out.push({ slug, type, dir });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

// ---------------------------------------------------------------------------
// Render one fixture through the low-level pipeline with a given measurer.
// ---------------------------------------------------------------------------

let cachedStore: ReturnType<typeof withStdlib> | undefined;
function censusIncludeStore(): ReturnType<typeof withStdlib> {
  cachedStore ??= withStdlib(
    { get: () => undefined, has: () => false },
    buildStdlibAssetsStore(),
  );
  return cachedStore;
}

// N0 (G2): renamed from `renderFixture` -- description-specific pipeline;
// dispatched by `renderFixtureFor` below, alongside the new class pipeline.
function renderFixtureDescription(markup: string, measurer: StringMeasurer): string {
  // Same stage order as `renderSync` (SI7): split on RAW lines, then preprocess
  // the first block's interior.
  // SI5b: the vendored-stdlib store, so <bundle/...> fixtures render instead
  // of erroring (mirrors the dot-sync-report/parity-ratchet wiring from T9).
  const blocks = buildBlockUmls(markup, { includeStore: censusIncludeStore() });
  const first = blocks[0];
  if (first === undefined) throw new Error('no diagram block found');
  if (!first.ok) throw first.failure.cause;

  const preprocessed = first.preprocessed;
  const { theme, styleMap } = buildThemeForFixture(preprocessed);
  const block = { ...first.source, rawStyles: preprocessed.styles };
  const ast = parseDescription(block);
  const seeded = { ...ast, seed: seedOf(['@startuml', ...block.lines, '@enduml'].join('\n')) };
  const geo = layoutDescription(seeded, theme, measurer);
  const completeSvg = renderDescription(geo, theme, measurer);

  // T7 -- wire chrome into the census path too, else a titled fixture
  // measures with a title-less render (mirrors render-fixture.ts's
  // identical wiring, both bypassing renderSync per this script's own
  // doc comment).
  const annotations = ast.annotations;
  if (annotations === undefined || isEmpty(annotations)) return completeSvg;

  const styles = resolveAnnotationStyles(theme, preprocessed.skinparam, styleMap);
  const unwrapped = unwrapKlimtSvg(completeSvg, theme.colors.background);
  return assembleSvg(applyChrome(unwrapped, annotations, styles, measurer));
}

/**
 * N0 (G2), extended O0 (G3), extended S0 (G4), extended T5 (sequence-oracle-
 * harness): dispatches to the CLASS pipeline for `class` AND `object`
 * fixtures, to the STATE pipeline for `state` fixtures, to the SEQUENCE
 * pipeline for `sequence` fixtures, else the pre-existing description
 * pipeline (component/usecase). `parseDescription` silently "succeeds" on
 * class/object/state/sequence markup -- it just drops the native syntax
 * (member compartments, nested classifiers inside `package{}` blocks,
 * `object`/`map` declarations, state transitions, `->` message arrows) --
 * so each of these fixture types MUST route through its own parser/layout/
 * renderer or every downstream family/error measurement is meaningless
 * (diagnosed N0, re-confirmed for object at O0, re-confirmed for state at
 * S0: state diagrams DO have a dedicated upstream engine, `statediagram/`,
 * unlike object's reuse of `classdiagram/` -- see `renderFixtureState`'s own
 * doc comment; sequence likewise has its own dedicated upstream engine,
 * `src/diagrams/sequence/`, via `render-fixture-sequence.ts#
 * renderFixtureSequence`).
 */
function renderFixtureFor(type: string, markup: string, measurer: StringMeasurer): string {
  if (type === 'class' || type === 'object') {
    return renderFixtureClass(markup, measurer, { includeStore: censusIncludeStore() });
  }
  if (type === 'state') {
    return renderFixtureState(markup, measurer, { includeStore: censusIncludeStore() });
  }
  if (type === 'sequence') {
    return renderFixtureSequence(markup, measurer, { includeStore: censusIncludeStore() });
  }
  if (type === 'json' || type === 'yaml' || type === 'hcl') {
    // Mission A5. ONE helper serves all three: yaml and hcl have no layout or
    // renderer of their own (`yaml/index.ts` and `hcl/index.ts` both import
    // `layoutJson`/`renderJson`), so only the parse differs and
    // `renderFixtureJson` dispatches that internally on the block type.
    return renderFixtureJson(markup, measurer, { includeStore: censusIncludeStore() });
  }
  if (type === 'dot') {
    // Mission D14. The ONE type with no low-level pipeline to dispatch to, and
    // no `measurer` to inject: `@startdot` is a passthrough to graphviz (see
    // `src/diagrams/dot/ast.ts`), so this port makes no drawing or measurement
    // decision the census could vary. Both of the census's two passes
    // therefore produce the identical result for dot, by construction -- that
    // is the type's nature, not a wiring miss. See
    // `oracle/goldens/svg-dot/README.md`.
    return renderSync(markup);
  }
  return renderFixtureDescription(markup, measurer);
}

// ---------------------------------------------------------------------------
// Bucketing
// ---------------------------------------------------------------------------

type Bucket = '0' | '1-3' | '4-10' | '11-30' | '31+';

function bucketOf(diffCount: number): Bucket {
  if (diffCount === 0) return '0';
  if (diffCount <= 3) return '1-3';
  if (diffCount <= 10) return '4-10';
  if (diffCount <= 30) return '11-30';
  return '31+';
}

interface CensusResult {
  slug: string;
  type: string;
  diffCount: number | 'error';
  /** diff paths (present on non-error rows) for the --families report */
  paths?: readonly string[];
}

function census(fixtures: readonly FixtureDir[], measurer: StringMeasurer): CensusResult[] {
  const results: CensusResult[] = [];
  for (const f of fixtures) {
    const markup = readFileSync(join(f.dir, 'in.puml'), 'utf-8');
    const jarSvg = readFileSync(join(f.dir, 'in.svg'), 'utf-8');
    try {
      if (!isWellFormed(jarSvg)) {
        results.push({ slug: f.slug, type: f.type, diffCount: 'error' });
        continue;
      }
      const oursSvg = renderFixtureFor(f.type, markup, measurer);
      const { diffs } = compareSvg(oursSvg, jarSvg, 'deterministic');
      results.push({
        slug: f.slug,
        type: f.type,
        diffCount: diffs.length,
        paths: diffs.map((d) => d.path),
      });
    } catch {
      results.push({ slug: f.slug, type: f.type, diffCount: 'error' });
    }
  }
  return results;
}

function isWellFormed(svg: string): boolean {
  try {
    normalizeSvg(svg);
    return true;
  } catch {
    return false;
  }
}

function printReport(label: string, results: readonly CensusResult[]): void {
  const buckets: Record<Bucket | 'error', number> = { '0': 0, '1-3': 0, '4-10': 0, '11-30': 0, '31+': 0, error: 0 };
  const zeroDiff: string[] = [];
  for (const r of results) {
    if (r.diffCount === 'error') {
      buckets.error++;
      continue;
    }
    buckets[bucketOf(r.diffCount)]++;
    if (r.diffCount === 0) zeroDiff.push(`${r.type}/${r.slug}`);
  }
  console.log(`\n=== ${label} (${results.length} fixtures) ===`);
  console.log(`  0 diffs:     ${buckets['0']}`);
  console.log(`  1-3 diffs:   ${buckets['1-3']}`);
  console.log(`  4-10 diffs:  ${buckets['4-10']}`);
  console.log(`  11-30 diffs: ${buckets['11-30']}`);
  console.log(`  31+ diffs:   ${buckets['31+']}`);
  console.log(`  errors:      ${buckets.error}`);
  if (zeroDiff.length > 0) {
    console.log(`  zero-diff fixtures:`);
    for (const s of zeroDiff) console.log(`    - ${s}`);
  }
}

/**
 * Per-fixture diff counts, one line per fixture, stable-sorted by
 * `type/slug`.
 *
 * `printReport` above buckets counts and then names ONLY the zero-diff
 * fixtures, which makes every non-zero fixture unobservable: a fixture can
 * move 45 -> 44 diffs, or 45 -> 47, without moving a bucket boundary or
 * changing a single printed character. That is not a hypothetical — it is
 * why `docs/graphviz-issues/11` could not be verified against an engine bump
 * (its three fixtures all sit in the `31+` bucket, so "the fix does not reach
 * them" and "the fix lands but something else dominates" print identically).
 *
 * Sorted by name rather than by count so two runs diff cleanly with `diff(1)`
 * — a count-ordered table reshuffles rows whenever any single fixture moves,
 * burying the one real change in spurious line moves.
 */
function printPerFixture(label: string, results: readonly CensusResult[]): void {
  console.log(`\n=== ${label} — per-fixture diff counts (${results.length} fixtures) ===`);
  const rows = [...results].sort((a, b) =>
    (a.type + '/' + a.slug).localeCompare(b.type + '/' + b.slug),
  );
  for (const r of rows) {
    console.log(String(r.diffCount).padStart(8) + '  ' + r.type + '/' + r.slug);
  }
}

/** De-index a diff path into its structural family (svg/g[2]/text/@x -> svg/g/text/@x). */
function familyOf(path: string): string {
  const indexRe = new RegExp('\\[' + String.raw`\d` + '+\\]', 'g');
  return path.replace(indexRe, '');
}

function printFamilies(results: readonly CensusResult[]): void {
  const reach = new Map<string, Set<string>>();
  const counts = new Map<string, number>();
  for (const r of results) {
    if (r.paths === undefined) continue;
    for (const p of r.paths) {
      const f = familyOf(p);
      counts.set(f, (counts.get(f) ?? 0) + 1);
      const set = reach.get(f) ?? new Set<string>();
      set.add(r.type + '/' + r.slug);
      reach.set(f, set);
    }
  }
  const rows = [...reach.entries()]
    .map(([f, set]) => ({ family: f, fixtures: set.size, diffs: counts.get(f) ?? 0 }))
    .sort((a, b) => b.fixtures - a.fixtures);
  console.log('=== diff families (deterministic), by fixture reach ===');
  console.log('fixtures   diffs  family');
  for (const row of rows) {
    console.log(
      String(row.fixtures).padStart(8) + String(row.diffs).padStart(8) + '  ' + row.family,
    );
  }
}

function main(): void {
  const types = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const requested = types.length > 0 ? types : DEFAULT_TYPES;
  const fixtures = requested.flatMap((t) => listFixtureDirs(t));
  console.log(`Loaded ${fixtures.length} fixtures across types: ${requested.join(', ')}`);

  const deterministicResults = census(fixtures, new DeterministicMeasurer());
  printReport('DeterministicMeasurer (ratchet metric)', deterministicResults);

  if (process.argv.includes('--per-fixture')) {
    printPerFixture('DeterministicMeasurer', deterministicResults);
    return; // triage tool, like --families: skip the jar pass
  }

  if (process.argv.includes('--families')) {
    printFamilies(deterministicResults);
    return; // families mode skips the jar pass (triage tool, not the metric)
  }

  const jarResults = census(fixtures, jarMeasurer);
  printReport('jarMeasurer (production — should show the pre-existing D12 gap, not a regression)', jarResults);
}

main();
