/**
 * Offline SVG-conformance RATCHET for the utility factories (single-line
 * easter eggs, listings, version family; mission `utility-factories-port` /
 * T0b, D9).
 *
 * Mirrors `wbs.golden.ratchet.test.ts` (wbs-engine-port/T0b) in procedure --
 * offline committed goldens, `DeterministicMeasurer` so both sides measure
 * text in the SAME system, a fixture ratchets in once and never regresses.
 * Same structural differences as wbs: NO DOT-parity eligibility check (none
 * of these factories shells out to Graphviz) and the population is the FIXED
 * `UTILITY_SLUGS` list of 17 `test-results/dot-cache/unknown/` rows, not a
 * whole cache dir.
 *
 * STARTS EMPTY (T0b): `ratchet.json` is `{ "fixtures": [] }`. No utility
 * plugin is registered (`src/index.ts`), so every row renders our error page
 * today, which can never be zero-diff against a real jar render. AC1/AC2
 * degrade to a documented placeholder assertion while the manifest is empty.
 *
 * PINNING IS ORCHESTRATOR-ONLY, AT BATCH CLOSES -- this task pins nothing.
 * The pin tool is `plans/utility-factories-port/measurements/pin-utility.mts`;
 * `oracle/goldens/svg-utility/README.md`'s "Add rule" section names it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg } from './compare.js';
import { renderFixtureUtility } from './render-fixture-utility.js';

interface RatchetFixture {
  slug: string;
  addedAt: string;
  source: string;
}

interface RatchetManifest {
  fixtures: RatchetFixture[];
}

const GOLDENS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../oracle/goldens/svg-utility');

const manifest = JSON.parse(readFileSync(join(GOLDENS_ROOT, 'ratchet.json'), 'utf8')) as RatchetManifest;

function fixtureDir(f: RatchetFixture): string {
  return join(GOLDENS_ROOT, f.slug);
}

function readGolden(f: RatchetFixture): string {
  return readFileSync(join(fixtureDir(f), 'golden.svg'), 'utf8');
}

function readSource(f: RatchetFixture): string {
  return readFileSync(join(fixtureDir(f), 'in.puml'), 'utf8');
}

function firstDiffPath(diffs: readonly { path: string }[]): string {
  return diffs.length > 0 ? diffs[0]!.path : '(none)';
}

function renderPinned(f: RatchetFixture): string {
  return renderFixtureUtility(readSource(f), new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
}

// ---------------------------------------------------------------------------
// AC1 — every locked fixture stays conformant.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-utility conformance ratchet (AC1)', () => {
  for (const f of manifest.fixtures) {
    it(`${f.slug}: stays zero-diff against the pinned golden`, () => {
      const golden = readGolden(f);
      const ours = renderPinned(f);
      const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
      expect(
        pass,
        `${f.slug}: conformance regression — first diff: ${firstDiffPath(diffs)} — ${JSON.stringify(diffs[0])}`,
      ).toBe(true);
      expect(diffs).toEqual([]);
    });
  }
});

if (manifest.fixtures.length === 0) {
  it('has no pinned svg-utility goldens yet (skip gracefully, not a failure)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 — tamper detection: an in-memory golden mutation must be caught, and
// the failure message must name the slug + first diff path.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-utility conformance ratchet — tamper detection (AC2)', () => {
  it('a mutated golden (in-memory only) produces a failure naming slug + diff path', () => {
    const target = manifest.fixtures[0];
    expect(target, 'expected at least one seeded fixture to exercise tamper detection').toBeDefined();
    const f = target!;

    const golden = readGolden(f);
    const ours = renderPinned(f);

    // Confirm the untampered pair really is zero-diff first, so the
    // tampered-case failure below is attributable to the mutation alone.
    const clean = compareSvg(ours, golden, 'deterministic');
    expect(clean.pass, `${f.slug}: expected zero-diff baseline`).toBe(true);

    // Mutate a numeric attribute in-memory — never touches disk.
    // First numeric `x`/`width` attribute, decimals accepted: a utility page
    // may be text-only (no rect), so the wbs `rect x=` anchor would not match.
    const tampered = golden.replace(
      /(\s(?:x|width))="([\d.]+)"/,
      (_m, a: string, n: string) => `${a}="${Number(n) + 500}"`,
    );
    expect(tampered).not.toBe(golden);

    const { pass, diffs } = compareSvg(ours, tampered, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs.length).toBeGreaterThan(0);

    const message = `${f.slug}: conformance regression — first diff: ${firstDiffPath(diffs)} — ${JSON.stringify(diffs[0])}`;
    expect(message).toContain(f.slug);
    expect(message).toContain(diffs[0]!.path);
  });
});

if (manifest.fixtures.length === 0) {
  it('has no pinned svg-utility golden yet to exercise tamper detection against (AC2, deferred)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}
