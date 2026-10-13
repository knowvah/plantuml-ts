/**
 * Offline SVG-conformance RATCHET for the wbs diagram engine
 * (`src/diagrams/wbs/`, not yet built — mission `wbs-engine-port` / T0b,
 * 2026-10-12).
 *
 * Mirrors `salt.golden.ratchet.test.ts` (salt-engine-port/T0b) exactly in
 * procedure — see that file's and `mindmap.golden.ratchet.test.ts`'s doc
 * comments for the full rationale (offline, committed goldens;
 * `DeterministicMeasurer` so both sides measure text in the SAME system; a
 * fixture ratchets in once and then never regresses). Two structural
 * differences from the class ratchet, shared with mindmap and salt:
 *
 *   1. NO DOT-parity eligibility check (class's own AC3, `parity-class
 *      .json`'s `dotEqual`). WBS lays its tree out itself
 *      (`WBSDiagram#getTextBlock`, `wbs/WBSDiagram.java:95`; `Fork`,
 *      `ITFComposed`, `ITFLeaf`) and never shells out to Graphviz — the only
 *      "svek" reference under `wbs/` is `WBSLink.java:46`'s
 *      `import net.sourceforge.plantuml.svek.extremity.ExtremityArrow`, an
 *      arrowhead shape — so it never emits a `svek-N.dot` dump and has no DOT
 *      oracle to compare against. The only eligibility condition here is
 *      byte-for-byte conformance.
 *   2. NO `unknown` tree (class's cdd5-T2/D4 router-repair mechanism).
 *
 * `renderFixtureWbs` (`render-fixture-wbs.ts`, `renderSync` under the hood)
 * is the render helper.
 *
 * STARTS EMPTY (T0b): `ratchet.json` is `{ "fixtures": [] }`. No wbs plugin is
 * registered (`src/index.ts`), so every fixture renders `src/core/dispatcher
 * .ts`'s `ERROR_SENTINEL` today, which can never be zero-diff against a real
 * jar wbs render. AC1/AC2 below both degrade to a documented placeholder
 * assertion when `ratchet.json` is empty, exactly as the salt ratchet's did
 * at its own T0b. The AC2 tamper case stays that placeholder until a pin
 * exists.
 *
 * PINNING IS ORCHESTRATOR-ONLY, AT BATCH CLOSES (D7) — this task (T0b) pins
 * nothing. The pin tool is `plans/wbs-engine-port/measurements/pin-wbs.mts`;
 * `oracle/goldens/svg-wbs/README.md`'s "Add rule" section names it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg } from './compare.js';
import { renderFixtureWbs } from './render-fixture-wbs.js';

interface RatchetFixture {
  slug: string;
  addedAt: string;
  source: string;
}

interface RatchetManifest {
  fixtures: RatchetFixture[];
}

const GOLDENS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../oracle/goldens/svg-wbs');

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
  return renderFixtureWbs(readSource(f), new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
}

// ---------------------------------------------------------------------------
// AC1 — every locked fixture stays conformant.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-wbs conformance ratchet (AC1)', () => {
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
  it('has no pinned svg-wbs goldens yet (skip gracefully, not a failure)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 — tamper detection: an in-memory golden mutation must be caught, and
// the failure message must name the slug + first diff path.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-wbs conformance ratchet — tamper detection (AC2)', () => {
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
    // Wbs rects sit at fractional x (`WBS-arrow-0`: x="113.4"), so the
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
  it('has no pinned svg-wbs golden yet to exercise tamper detection against (AC2, deferred)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}
