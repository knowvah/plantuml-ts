/**
 * Offline byte-exact SVG-conformance RATCHET for BUNDLED-SKIN rendering
 * (`skin rose`, `skin debug`, ...). Sibling of the corpus-driven
 * `description.golden.ratchet.test.ts`, but for AUTHORED skin fixtures.
 *
 * Every fixture listed in `oracle/goldens/svg-skin/ratchet.json` is PINNED at
 * zero-diff (`compareSvg(ours, golden, 'deterministic').pass`) against its
 * committed `golden.svg` (the jar's deterministic-text-mode capture). Once a
 * slug is pinned here, any regression in the port's skin-driven SVG emission
 * fails `npm test` — the ratchet only tightens.
 *
 * No DOT-parity (AC3) gate: skins are authored, not corpus slugs, so they
 * carry no `parity.json` entry, and a full-SVG zero-diff already subsumes
 * DOT equality (matching every coordinate implies the layout matched). See
 * `oracle/goldens/svg-skin/README.md` for the full rationale.
 *
 * Renders via `renderFixture` with `DeterministicMeasurer` (NOT `renderSync`),
 * exactly as the `svg-description` ratchet does — see that test's header for
 * why production's `jarMeasurer` cannot reach these deterministic goldens.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from './compare.js';
import { renderFixture } from './render-fixture.js';

interface SkinRatchetFixture {
  skin: string;
  slug: string;
  addedAt: string;
  exercises: string;
}

interface SkinRatchetManifest {
  fixtures: SkinRatchetFixture[];
}

const GOLDENS_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../oracle/goldens/svg-skin',
);

const manifest = JSON.parse(
  readFileSync(join(GOLDENS_ROOT, 'ratchet.json'), 'utf8'),
) as SkinRatchetManifest;

function fixtureDir(f: SkinRatchetFixture): string {
  return join(GOLDENS_ROOT, f.skin, f.slug);
}

function readGolden(f: SkinRatchetFixture): string {
  return readFileSync(join(fixtureDir(f), 'golden.svg'), 'utf8');
}

function readSource(f: SkinRatchetFixture): string {
  return readFileSync(join(fixtureDir(f), 'in.puml'), 'utf8');
}

function firstDiffPath(diffs: readonly { path: string }[]): string {
  return diffs.length > 0 ? diffs[0]!.path : '(none)';
}

// ---------------------------------------------------------------------------
// AC1 — every locked skin fixture stays byte-exact against its golden.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)(
  'svg-skin conformance ratchet (AC1)',
  () => {
    for (const f of manifest.fixtures) {
      it(`${f.skin}/${f.slug}: stays zero-diff against the pinned golden`, () => {
        const golden = readGolden(f);
        const markup = readSource(f);
        const ours = renderFixture(markup, new DeterministicMeasurer());
        const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
        expect(
          pass,
          `${f.skin}/${f.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
            ` — ${JSON.stringify(diffs[0])}`,
        ).toBe(true);
        expect(diffs).toEqual([]);
      });
    }
  },
);

if (manifest.fixtures.length === 0) {
  it('has no pinned svg-skin goldens yet (skip gracefully, not a failure)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 — tamper detection: an in-memory golden mutation must be caught, and
// the failure message must name the slug + first diff path.
// ---------------------------------------------------------------------------

describe('svg-skin conformance ratchet — tamper detection (AC2)', () => {
  it('a mutated golden (in-memory only) produces a failure naming slug + diff path', () => {
    const f = manifest.fixtures[0];
    expect(f, 'expected at least one seeded fixture to exercise tamper detection').toBeDefined();
    const target = f!;

    const golden = readGolden(target);
    const markup = readSource(target);
    const ours = renderFixture(markup, new DeterministicMeasurer());

    // Confirm the untampered pair really is zero-diff first, so the
    // tampered-case failure below is attributable to the mutation alone.
    const clean = compareSvg(ours, golden, 'deterministic');
    expect(clean.pass, `${target.skin}/${target.slug}: expected zero-diff baseline`).toBe(true);

    // Mutate a numeric attribute in-memory — never touches disk.
    const tampered = golden.replace(/polygon points="7,17/, 'polygon points="99,17');
    expect(tampered).not.toBe(golden);

    const { pass, diffs } = compareSvg(ours, tampered, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs.length).toBeGreaterThan(0);

    const message =
      `${target.skin}/${target.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
      ` — ${JSON.stringify(diffs[0])}`;
    expect(message).toContain(target.slug);
    expect(message).toContain(diffs[0]!.path);
  });
});
