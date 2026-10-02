/**
 * `renderSync` vs. `renderFixtureActivity` harness-parity gate (add2 / T0b,
 * D4 of `plans/activity-divergence-drive-2/decisions.md`).
 *
 * `render-fixture-activity.ts` rebuilds the activity pipeline by hand
 * (`buildBlockUmls` -> `parseActivity` -> `layoutActivity` -> `renderActivity`
 * -> chrome) instead of calling production's own `renderSync`
 * (`src/index.ts`). A prior mission's copy of this helper missed chrome
 * composition (title/legend/caption/header/footer) entirely, and every
 * activity conformance gate — the diff-baseline ratchet and the golden
 * ratchet alike — silently measured that drift instead of the port (memory
 * `conformance-harness-mirrors-index-ts`). This file makes a future
 * re-divergence a named, failing test instead of a second silent drift.
 *
 * POPULATION: every `diff-baseline.json` fixture with `status: "baseline"`
 * or `status: "pinned"` (the two statuses the diff-baseline and golden
 * ratchets actually measure — `error`/`jar-error` rows render nothing
 * comparable either way, mirroring `activity.diff-baseline.ratchet.test.ts`'s
 * own `baselineFixtures`/`pinnedFixtures` filters). A `"baseline"` fixture's
 * `in.puml` lives under `test-results/dot-cache/activity/<slug>/` (the
 * committed jar-oracle cache); a `"pinned"` fixture's lives under
 * `oracle/goldens/svg-activity/<slug>/` (the byte-freeze golden tree) —
 * same split `activity.diff-baseline.ratchet.test.ts#hasCachedFixture` and
 * `activity.golden.ratchet.test.ts#fixtureDir` each use for their own half.
 *
 * SELECTION, not the full 312-fixture population (keeping this file's own
 * wall time well inside vitest's budget while still proving the exact thing
 * D4 asks for):
 *
 *   1. Every fixture whose `in.puml` carries a `title`/`legend`/`caption`/
 *      `header`/`footer` chrome command — the exact code path
 *      `render-fixture-activity.ts`'s doc comment (lines 150-162) names as
 *      the one that diverged. `CHROME_RE` matches the same keyword set
 *      `src/core/annotations/commands.ts`'s `TITLE_RE`/`CAPTION_RE`/
 *      `LEGEND_RE`/`HEADER_RE`/`FOOTER_RE`/`*_START_RE` family parses,
 *      loosened to a start-of-line keyword probe (this is a test-selection
 *      heuristic, not a parser) rather than re-deriving each command's full
 *      grammar.
 *   2. A deterministic stratified sample: every 8th slug (0-indexed) of the
 *      combined baseline+pinned population, sorted — cheap insurance that a
 *      FUTURE chrome-unrelated divergence between the two pipelines still
 *      has a chance to surface here, without measuring all 312.
 *
 * Both sets come from the SAME manifest + path convention
 * `activity.diff-baseline.ratchet.test.ts` and `activity.golden.ratchet.test
 * .ts` already use, so a slug this file can't find means a broken checkout,
 * matching those two files' own AC0.
 *
 * COMPARISON: `normalizeSvg` (attribute order, numeric rounding, whitespace
 * — `./normalize.ts`) applied to EACH side, then `toEqual` — strict
 * structural equality, not `compareSvg`'s tolerance-banded diff. The two
 * pipelines are supposed to be the SAME pipeline observed two ways; any
 * tolerance here would hide the exact class of drift this file exists to
 * catch.
 *
 * Re-measure by hand:
 *   npx vitest run tests/oracle/svg-conformance/activity.harness-parity.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { normalizeSvg } from './normalize.js';
import { renderFixtureActivity } from './render-fixture-activity.js';

interface ManifestFixture {
  readonly slug: string;
  readonly status: 'baseline' | 'error' | 'jar-error' | 'pinned';
}

interface Manifest {
  readonly fixtures: readonly ManifestFixture[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDENS_ROOT = join(HERE, '../../../oracle/goldens/svg-activity');
const CACHE_ROOT = join(HERE, '../../../test-results/dot-cache/activity');
const MANIFEST_PATH = join(GOLDENS_ROOT, 'diff-baseline.json');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;

/** `"pinned"` reads from the byte-freeze golden tree; `"baseline"` reads from
 *  the committed jar-oracle cache — the same split each ratchet test's own
 *  `fixtureDir`/`hasCachedFixture` helper applies for its own half. */
function fixtureDir(f: ManifestFixture): string {
  return f.status === 'pinned' ? join(GOLDENS_ROOT, f.slug) : join(CACHE_ROOT, f.slug);
}

function readSource(f: ManifestFixture): string {
  return readFileSync(join(fixtureDir(f), 'in.puml'), 'utf8');
}

// Start-of-line keyword probe mirroring the command set `commands.ts`'s
// TITLE_RE/CAPTION_RE/LEGEND_RE/HEADER_RE/FOOTER_RE family parses, loosened
// to allow up to two leading position words (`legend top left`, `header
// right`, ...) ahead of the keyword itself.
const CHROME_RE = /^[ \t]*(?:(?:left|right|center|top|bottom)[ \t]+){0,2}(title|legend|caption|header|footer)\b/im;

function hasChromeCommand(source: string): boolean {
  return CHROME_RE.test(source);
}

const selectable = manifest.fixtures.filter((f) => f.status === 'baseline' || f.status === 'pinned');

const missing = selectable.filter((f) => !existsSync(join(fixtureDir(f), 'in.puml')));
if (missing.length > 0) {
  throw new Error(
    `activity.harness-parity.test.ts: ${missing.length} fixture(s) are missing their committed in.puml — ` +
      `a broken checkout, not a corpus to regenerate. First missing: ${fixtureDir(missing[0]!)}`,
  );
}

const chromeBearing = selectable.filter((f) => hasChromeCommand(readSource(f)));

const sortedBySlug = [...selectable].sort((a, b) => a.slug.localeCompare(b.slug));
const stratifiedSample = sortedBySlug.filter((_f, index) => index % 8 === 0);

const caseMap = new Map<string, ManifestFixture>();
for (const f of [...chromeBearing, ...stratifiedSample]) caseMap.set(f.slug, f);
const cases = [...caseMap.values()].sort((a, b) => a.slug.localeCompare(b.slug));

describe('svg-activity harness parity — renderSync vs. renderFixtureActivity', () => {
  it('selects at least one chrome-bearing and one stratified-sample fixture', () => {
    expect(chromeBearing.length).toBeGreaterThan(0);
    expect(cases.length).toBeGreaterThan(0);
  });

  it.each(cases.map((f) => [f.slug, f] as const))('%s: renderSync matches the conformance harness', (_slug, f) => {
    const markup = readSource(f);
    const options = { includeStore: fixtureIncludeStore() };

    const viaRenderSync = renderSync(markup, { measurer: new DeterministicMeasurer(), ...options });
    const viaHarness = renderFixtureActivity(markup, new DeterministicMeasurer(), options);

    expect(
      normalizeSvg(viaRenderSync),
      `${f.slug}: renderSync and renderFixtureActivity diverge — the harness is no longer ` +
        `measuring the production pipeline (D4, activity-divergence-drive-2).`,
    ).toEqual(normalizeSvg(viaHarness));
  });
});
