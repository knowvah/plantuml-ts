/**
 * Offline SVG-conformance RATCHET for the activity diagram engine
 * (`src/diagrams/activity/`), mission `activity-divergence-drive` / T0b
 * (D5, 2026-09-30).
 *
 * Mirrors `mindmap.golden.ratchet.test.ts` (T0b, mindmap-engine-port)
 * exactly in procedure — see that file's doc comment for the full
 * rationale (offline, committed goldens; `DeterministicMeasurer` so both
 * sides measure text in the SAME system; a fixture ratchets in once and
 * then never regresses). Two differences from the mindmap template, both
 * carried over verbatim from activity's OWN diff-baseline sibling
 * (`activity.diff-baseline.ratchet.test.ts`), not reinvented here:
 *
 *   1. NO DOT-parity eligibility check. Activity never shells out to
 *      Graphviz (verified: zero `svek-*.dot` across 28 jar-rendered
 *      activity fixtures, D9 of `plans/activity-oracle-harness/
 *      decisions.md`), so there is no DOT oracle to compare against and no
 *      `parity-activity.json`-style second condition.
 *   2. NO `unknown` tree. Activity has its own dedicated dispatcher entry
 *      (`activityPlugin`, `src/diagrams/activity/index.ts`) — there is no
 *      router-misclassification case this ratchet needs to reach.
 *
 * `renderFixtureActivity` (`render-fixture-activity.ts`) is the render
 * helper — the SAME seam `activity.diff-baseline.ratchet.test.ts` and
 * `plans/activity-divergence-drive/tools/pin-goldens.mts` both use, so a
 * fixture that is zero-diff by one measurement is zero-diff by all three.
 *
 * STARTS EMPTY (T0b): `ratchet.json` is `{ "fixtures": [] }`. Of the 373
 * fixtures in `oracle/goldens/svg-activity/diff-baseline.json`, 0 are
 * zero-diff today (`activity-divergence-drive/decisions.md`'s own D10 exit
 * bar: "ZERO fixtures reach 0 diffs" as of the mission's own start), so
 * this ratchet has nothing to freeze yet. AC1/AC2 below both degrade
 * gracefully to a documented placeholder assertion when `ratchet.json` is
 * empty, exactly as the mindmap and class templates' own AC1/AC2 already
 * do for their own N0 starting states.
 *
 * PINNING IS ORCHESTRATOR-ONLY, AT BATCH CLOSES (decisions.md D5, D10) —
 * this task (T0b) pins nothing. `plans/activity-divergence-drive/tools/
 * pin-goldens.mts` is the tool a future close runs; `oracle/goldens/
 * svg-activity/README.md`'s "Pinned (golden ratchet)" section documents
 * the procedure.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg } from './compare.js';
import { renderFixtureActivity } from './render-fixture-activity.js';

interface RatchetFixture {
  slug: string;
  addedAt: string;
  source: string;
}

interface RatchetManifest {
  fixtures: RatchetFixture[];
}

const GOLDENS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../oracle/goldens/svg-activity');

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
  return renderFixtureActivity(readSource(f), new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
}

// ---------------------------------------------------------------------------
// AC1 — every locked fixture stays conformant.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-activity conformance ratchet (AC1)', () => {
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
  it('has no pinned svg-activity goldens yet (skip gracefully, not a failure)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 — tamper detection: an in-memory golden mutation must be caught, and
// the failure message must name the slug + first diff path.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-activity conformance ratchet — tamper detection (AC2)', () => {
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
    const tampered = golden.replace(/rect x="(\d+)"/, (_m, x: string) => `rect x="${Number(x) + 500}"`);
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
  it('has no pinned svg-activity golden yet to exercise tamper detection against (AC2, deferred)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}
