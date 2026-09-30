/**
 * Offline SVG-conformance RATCHET for the mindmap diagram engine
 * (`src/diagrams/mindmap/`, not yet built — mission `mindmap-engine-port`
 * / T0b, 2026-09-29).
 *
 * Mirrors `class.golden.ratchet.test.ts` (G2/N0) exactly in procedure — see
 * that file's doc comment for the full rationale (offline, committed
 * goldens; `DeterministicMeasurer` so both sides measure text in the SAME
 * system; a fixture ratchets in once and then never regresses). Two
 * differences from the class ratchet, both structural:
 *
 *   1. NO DOT-parity eligibility check (class's own AC3, `parity-class
 *      .json`'s `dotEqual`). Mindmap draws on the klimt substrate directly
 *      (`TextBlock.drawU` -> `UGraphicSvg`, D3 of `plans/mindmap-engine-port
 *      /decisions.md`) and never shells out to Graphviz, so it never emits
 *      a `svek-N.dot` dump and has no DOT oracle to compare against (D7,
 *      same decision that removes the DOT gate for json/yaml/hcl). The only
 *      eligibility condition here is byte-for-byte conformance.
 *   2. NO `unknown` tree (class's cdd5-T2/D4 router-repair mechanism) — out
 *      of scope for mindmap, which has its own dedicated dispatcher entry
 *      once a plugin registers.
 *
 * `renderFixtureMindmap` (`render-fixture-mindmap.ts`, `renderSync` under
 * the hood — there is no dedicated per-engine pipeline to call instead,
 * since no mindmap plugin exists yet) replaces `renderFixtureClass` as the
 * render helper.
 *
 * STARTS EMPTY (T0b): `ratchet.json` is `{ "fixtures": [] }`. No mindmap
 * plugin is registered (`src/index.ts:108-121`), so every fixture renders
 * `src/core/dispatcher.ts`'s `ERROR_SENTINEL` (`:252-267`) today, which can
 * never be zero-diff against a real jar mindmap render. AC1/AC2 below both
 * degrade gracefully to a documented placeholder assertion when
 * `ratchet.json` is empty, exactly as `class.golden.ratchet.test.ts`'s own
 * AC1/AC2 already do for its own N0 starting state.
 *
 * PINNING IS ORCHESTRATOR-ONLY, AT BATCH CLOSES (D7, D10) — this task (T0b)
 * pins nothing. No dedicated `pin-goldens.mts`-style tool exists for
 * mindmap yet; `oracle/goldens/svg-mindmap/README.md`'s "Add rule" section
 * is the (manual, 3-step) pin procedure a future close follows, mirroring
 * `oracle/goldens/svg-class/README.md`'s tool-shaped precedent.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg } from './compare.js';
import { renderFixtureMindmap } from './render-fixture-mindmap.js';

interface RatchetFixture {
  slug: string;
  addedAt: string;
  source: string;
}

interface RatchetManifest {
  fixtures: RatchetFixture[];
}

const GOLDENS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../oracle/goldens/svg-mindmap');

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
  return renderFixtureMindmap(readSource(f), new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
}

// ---------------------------------------------------------------------------
// AC1 — every locked fixture stays conformant.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-mindmap conformance ratchet (AC1)', () => {
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
  it('has no pinned svg-mindmap goldens yet (skip gracefully, not a failure)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 — tamper detection: an in-memory golden mutation must be caught, and
// the failure message must name the slug + first diff path.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-mindmap conformance ratchet — tamper detection (AC2)', () => {
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
  it('has no pinned svg-mindmap golden yet to exercise tamper detection against (AC2, deferred)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}
