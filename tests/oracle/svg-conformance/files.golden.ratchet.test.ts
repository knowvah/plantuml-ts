/**
 * Offline SVG-conformance RATCHET for the files diagram engine
 * (`src/diagrams/files/`; mission data-diagram-conformance / T0b, D4).
 *
 * Mirrors `wbs.golden.ratchet.test.ts`: offline committed goldens,
 * `DeterministicMeasurer` on both sides, a fixture ratchets in once and never
 * regresses. No DOT-parity check: files has no layout engine (D1) -- the
 * jar's bytes are the target (`filesdiagram/FilesDiagram.java`). The render
 * helper is `renderFixtureFiles` (jar-compatible style input, like the survey).
 *
 * STARTS EMPTY: `ratchet.json` is `{ "fixtures": [] }`; AC1/AC2 degrade to a
 * documented placeholder assertion. Pinning is orchestrator-only
 * (`plans/data-diagram-conformance/measurements/pin-files.mts`;
 * `oracle/goldens/svg-files/README.md` "Add rule").
 */
import { describe, it, expect } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg } from './compare.js';
import { renderFixtureFiles } from './render-fixture-files.js';

interface RatchetFixture {
  slug: string;
  addedAt: string;
  source: string;
}

interface RatchetManifest {
  fixtures: RatchetFixture[];
}

const GOLDENS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../oracle/goldens/svg-files');

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
  return renderFixtureFiles(readSource(f), {
    measurer: new DeterministicMeasurer(),
    includeStore: fixtureIncludeStore(),
  });
}

// ---------------------------------------------------------------------------
// AC1 — every locked fixture stays conformant.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-files conformance ratchet (AC1)', () => {
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
  it('has no pinned svg-files goldens yet (skip gracefully, not a failure)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 — tamper detection: an in-memory golden mutation must be caught, and
// the failure message must name the slug + first diff path.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-files conformance ratchet — tamper detection (AC2)', () => {
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
    // Accept a decimal x: files rects may sit at fractional x.
    const tampered = golden.replace(/<text x="(\d+)"/, (_m, x: string) => `<text x="${Number(x) + 500}"`);
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
  it('has no pinned svg-files golden yet to exercise tamper detection against (AC2, deferred)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 harness check on a test-local temp golden: a hand-made golden dir whose
// golden.svg is edited fails naming the slug (independent of any pin).
// ---------------------------------------------------------------------------

describe('svg-files conformance ratchet -- tamper detection on a temp golden', () => {
  it('an edited golden.svg in a temp copy fails naming the slug + first diff path', () => {
    const slug = 'temp-files-default';
    const markup = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/lengthadjust/files-default.puml'),
      'utf8',
    );
    const dir = mkdtempSync(join(tmpdir(), 'svg-files-'));
    try {
      mkdirSync(join(dir, slug));
      writeFileSync(join(dir, slug, 'in.puml'), markup);
      const ours = renderFixtureFiles(readFileSync(join(dir, slug, 'in.puml'), 'utf8'), {
        measurer: new DeterministicMeasurer(),
        includeStore: fixtureIncludeStore(),
      });
      writeFileSync(join(dir, slug, 'golden.svg'), ours);
      const golden = readFileSync(join(dir, slug, 'golden.svg'), 'utf8');
      expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);

      const tampered = golden.replace(/<text x="(\d+)"/, (_m, x: string) => `<text x="${Number(x) + 500}"`);
      expect(tampered).not.toBe(golden);
      writeFileSync(join(dir, slug, 'golden.svg'), tampered);
      const { pass, diffs } = compareSvg(ours, readFileSync(join(dir, slug, 'golden.svg'), 'utf8'), 'deterministic');
      expect(pass).toBe(false);
      const message = `${slug}: conformance regression -- first diff: ${firstDiffPath(diffs)}`;
      expect(message).toContain(slug);
      expect(message).toContain(diffs[0]!.path);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
