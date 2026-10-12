/**
 * Offline SVG-conformance RATCHET for the salt diagram engine
 * (`src/diagrams/salt/`, not yet built — mission `salt-engine-port` / T0b,
 * 2026-10-12).
 *
 * Mirrors `mindmap.golden.ratchet.test.ts` (mindmap-engine-port/T0b) exactly
 * in procedure — see that file's and `class.golden.ratchet.test.ts`'s doc
 * comments for the full rationale (offline, committed goldens;
 * `DeterministicMeasurer` so both sides measure text in the SAME system; a
 * fixture ratchets in once and then never regresses). Two differences from
 * the class ratchet, both structural and both shared with mindmap:
 *
 *   1. NO DOT-parity eligibility check (class's own AC3, `parity-class
 *      .json`'s `dotEqual`). Salt draws its widgets directly
 *      (`PSystemSalt#getTextBlock`, `salt/PSystemSalt.java:112`; no file under
 *      `salt/` references `svek` or Graphviz) and never
 *      shells out to Graphviz, so it never emits a `svek-N.dot` dump and has
 *      no DOT oracle to compare against (D6 of `plans/salt-engine-port/
 *      decisions.md`). The only eligibility condition here is byte-for-byte
 *      conformance.
 *   2. NO `unknown` tree (class's cdd5-T2/D4 router-repair mechanism) — out
 *      of scope for salt, which gets its own dispatcher entry once a plugin
 *      registers.
 *
 * `renderFixtureSalt` (`render-fixture-salt.ts`, `renderSync` under the
 * hood — there is no dedicated per-engine pipeline to call instead, since no
 * salt plugin exists yet) is the render helper.
 *
 * STARTS EMPTY (T0b): `ratchet.json` is `{ "fixtures": [] }`. No salt plugin
 * is registered (`src/index.ts:111-125`), so every fixture renders
 * `src/core/dispatcher.ts`'s `ERROR_SENTINEL` (`:361-375`) today, which can
 * never be zero-diff against a real jar salt render. AC1/AC2 below both
 * degrade to a documented placeholder assertion when `ratchet.json` is
 * empty, exactly as `mindmap.golden.ratchet.test.ts`'s AC1/AC2 did at its own
 * T0b.
 *
 * PINNING IS ORCHESTRATOR-ONLY, AT BATCH CLOSES (D6) — this task (T0b) pins
 * nothing. The pin tool is `plans/salt-engine-port/measurements/pin-salt.mts`;
 * `oracle/goldens/svg-salt/README.md`'s "Add rule" section names it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg } from './compare.js';
import { renderFixtureSalt } from './render-fixture-salt.js';

interface RatchetFixture {
  slug: string;
  addedAt: string;
  source: string;
}

interface RatchetManifest {
  fixtures: RatchetFixture[];
}

const GOLDENS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../oracle/goldens/svg-salt');

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
  return renderFixtureSalt(readSource(f), new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
}

// ---------------------------------------------------------------------------
// AC1 — every locked fixture stays conformant.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-salt conformance ratchet (AC1)', () => {
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
  it('has no pinned svg-salt goldens yet (skip gracefully, not a failure)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 — tamper detection: an in-memory golden mutation must be caught, and
// the failure message must name the slug + first diff path.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-salt conformance ratchet — tamper detection (AC2)', () => {
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
    // Salt rects sit at fractional x (`bireva-46-dalu382`: x="85.725"), so the
    // mindmap regex's `\d+` would not match; accept a decimal here.
    const tampered = golden.replace(/rect x="([\d.]+)"/, (_m, x: string) => `rect x="${Number(x) + 500}"`);
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
  it('has no pinned svg-salt golden yet to exercise tamper detection against (AC2, deferred)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}
