/**
 * Offline SVG-conformance GOLDEN ratchet for sequence diagrams
 * (sequence-oracle-harness / T3, 2026-08-20).
 *
 * Mirrors `state.golden.ratchet.test.ts` procedurally -- see that file's doc
 * comment for the full AC1 (byte-diff regression) / AC2 (tamper detection)
 * rationale, which applies here unchanged: `DeterministicMeasurer` so both
 * sides measure text in the SAME system; a fixture ratchets in only once and
 * then never regresses; `describe.skipIf` degrades every block gracefully to
 * a documented placeholder assertion when the manifest is empty.
 *
 * ONE deliberate omission from state: NO AC3 (DOT-equal eligibility). D1
 * (`plans/sequence-oracle-harness/decisions.md`) establishes that sequence
 * emits no DOT -- exactly the ADR-3 rationale `json.golden.ratchet.test.ts`
 * already cites for the DOT-less json/yaml/hcl family: "the jar emits no DOT
 * for this family, so the DOT-equal eligibility gate the siblings use cannot
 * be computed." No `parity-sequence.json` exists in this directory (only
 * `parity-class.json` / `parity-object.json` / `parity-state.json` do), and
 * none is created here -- doing so would be a second, uncalled-for
 * comparator (D1, stop 4).
 *
 * SHIPS EMPTY, BY MEASUREMENT, NOT BY OVERSIGHT. Sequence's diff-baseline
 * floor (`sequence.diff-baseline.ratchet.test.ts`, T2) is min 10 diffs
 * across all 1138 measurable fixtures -- ZERO reach 0. `fixtures: []` here
 * is therefore the correct, measured state, not a placeholder awaiting a
 * first pass. See `oracle/goldens/svg-sequence/README.md` "Current state"
 * for the full accounting and "Add rule" for how a fixture graduates in once
 * one exists.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from './compare.js';
import { renderFixtureSequence } from './render-fixture-sequence.js';

interface RatchetFixture {
  slug: string;
  addedAt: string;
  source: string;
}

interface RatchetManifest {
  fixtures: RatchetFixture[];
}

const GOLDENS_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../oracle/goldens/svg-sequence',
);

const manifest = JSON.parse(
  readFileSync(join(GOLDENS_ROOT, 'ratchet.json'), 'utf8'),
) as RatchetManifest;

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

// ---------------------------------------------------------------------------
// AC1 -- every locked fixture stays conformant.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)(
  'svg-sequence conformance ratchet (AC1)',
  () => {
    for (const f of manifest.fixtures) {
      it(`sequence/${f.slug}: stays zero-diff against the pinned golden`, () => {
        const golden = readGolden(f);
        const markup = readSource(f);
        const ours = renderFixtureSequence(markup, new DeterministicMeasurer());
        const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
        expect(
          pass,
          `sequence/${f.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
            ` — ${JSON.stringify(diffs[0])}`,
        ).toBe(true);
        expect(diffs).toEqual([]);
      });
    }
  },
);

if (manifest.fixtures.length === 0) {
  it('has no pinned svg-sequence goldens yet (skip gracefully, not a failure)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 -- tamper detection: an in-memory golden mutation must be caught, and
// the failure message must name the slug + first diff path.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)(
  'svg-sequence conformance ratchet — tamper detection (AC2)',
  () => {
    it('a mutated golden (in-memory only) produces a failure naming slug + diff path', () => {
      const f = manifest.fixtures[0];
      expect(f, 'expected at least one seeded fixture to exercise tamper detection').toBeDefined();
      const target = f!;

      const golden = readGolden(target);
      const markup = readSource(target);
      const ours = renderFixtureSequence(markup, new DeterministicMeasurer());

      // Confirm the untampered pair really is zero-diff first, so the
      // tampered-case failure below is attributable to the mutation alone.
      const clean = compareSvg(ours, golden, 'deterministic');
      expect(clean.pass, `sequence/${target.slug}: expected zero-diff baseline`).toBe(true);

      // Mutate a numeric attribute in-memory — never touches disk.
      const tampered = golden.replace(/rect x="(\d+)"/, (_m, x: string) => `rect x="${Number(x) + 500}"`);
      expect(tampered).not.toBe(golden);

      const { pass, diffs } = compareSvg(ours, tampered, 'deterministic');
      expect(pass).toBe(false);
      expect(diffs.length).toBeGreaterThan(0);

      const message =
        `sequence/${target.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
        ` — ${JSON.stringify(diffs[0])}`;
      expect(message).toContain(target.slug);
      expect(message).toContain(diffs[0]!.path);
    });
  },
);

if (manifest.fixtures.length === 0) {
  it('has no pinned svg-sequence golden yet to exercise tamper detection against (AC2, deferred)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}
