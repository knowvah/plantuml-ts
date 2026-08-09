/**
 * Shared ratchet body for the svg-json / svg-yaml / svg-hcl suites (A5 / T1).
 *
 * **Why this is a factory when class/object/state each duplicate their body.**
 * Those three genuinely differ: each has its own render helper and its own
 * `parity-<type>.json`. These three differ by a type STRING and nothing else —
 * yaml and hcl have no layout or renderer of their own (`yaml/index.ts` and
 * `hcl/index.ts` both import `layoutJson`/`renderJson`), so all three share
 * `renderFixtureJson`, and ADR-3 removes the parity file from all three alike.
 * Triplicating the body would have produced three files differing in one
 * literal, which is a worse guard, not a more faithful one.
 *
 * **AC3 is absent by decision, not oversight (ADR-3).** The sibling suites
 * gate ratchet eligibility on a fixture already being DOT-equal, so a residual
 * SVG diff is attributable to assembly rather than layout. The jar emits NO
 * DOT for this family — it lays json out through `jsondiagram/SmetanaForJson`
 * in-process and never writes `svek-N.dot` — so that precondition cannot be
 * computed at any price and there is deliberately no `parity-json.json`.
 * `oracle/goldens/svg-dot/` (mission D14) sets the precedent for a ratchet
 * with no parity file for a structurally analogous reason.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from './compare.js';
import { renderFixtureJson } from './render-fixture-json.js';

export interface RatchetFixture {
  slug: string;
  addedAt: string;
  source: string;
}

interface RatchetManifest {
  fixtures: RatchetFixture[];
}

function firstDiffPath(diffs: readonly { path: string }[]): string {
  return diffs.length > 0 ? diffs[0]!.path : '(none)';
}

/**
 * Registers AC1 (locked fixtures stay conformant) and AC2 (tamper detection)
 * for one json-family type. `type` is both the goldens directory suffix and
 * the label in every failure message.
 */
export function describeJsonFamilyRatchet(type: 'json' | 'yaml' | 'hcl'): void {
  const goldensRoot = join(
    dirname(fileURLToPath(import.meta.url)),
    `../../../oracle/goldens/svg-${type}`,
  );

  const manifest = JSON.parse(
    readFileSync(join(goldensRoot, 'ratchet.json'), 'utf8'),
  ) as RatchetManifest;

  const readGolden = (f: RatchetFixture): string =>
    readFileSync(join(goldensRoot, f.slug, 'golden.svg'), 'utf8');
  const readSource = (f: RatchetFixture): string =>
    readFileSync(join(goldensRoot, f.slug, 'in.puml'), 'utf8');

  // -------------------------------------------------------------------------
  // AC1 — every locked fixture stays conformant.
  // -------------------------------------------------------------------------
  describe.skipIf(manifest.fixtures.length === 0)(
    `svg-${type} conformance ratchet (AC1)`,
    () => {
      for (const f of manifest.fixtures) {
        it(`${type}/${f.slug}: stays zero-diff against the pinned golden`, () => {
          const ours = renderFixtureJson(readSource(f), new DeterministicMeasurer());
          const { pass, diffs } = compareSvg(ours, readGolden(f), 'deterministic');
          expect(
            pass,
            `${type}/${f.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
              ` — ${JSON.stringify(diffs[0])}`,
          ).toBe(true);
          expect(diffs).toEqual([]);
        });
      }
    },
  );

  if (manifest.fixtures.length === 0) {
    it(`has no pinned svg-${type} goldens yet (skip gracefully, not a failure)`, () => {
      expect(manifest.fixtures).toHaveLength(0);
    });
  }

  // -------------------------------------------------------------------------
  // AC2 — tamper detection, with the slug and first diff path in the message.
  // -------------------------------------------------------------------------
  describe.skipIf(manifest.fixtures.length === 0)(
    `svg-${type} conformance ratchet — tamper detection (AC2)`,
    () => {
      it('a mutated golden (in-memory only) produces a failure naming slug + diff path', () => {
        const target = manifest.fixtures[0]!;
        const golden = readGolden(target);
        const ours = renderFixtureJson(readSource(target), new DeterministicMeasurer());

        // Confirm the untampered pair really is zero-diff first, so the
        // tampered failure below is attributable to the mutation alone.
        expect(
          compareSvg(ours, golden, 'deterministic').pass,
          `${type}/${target.slug}: expected zero-diff baseline`,
        ).toBe(true);

        // Mutate a numeric attribute in-memory — never touches disk.
        const tampered = golden.replace(
          /(<rect[^>]*\sx=")([\d.]+)"/,
          (_m, head: string, x: string) => `${head}${Number(x) + 500}"`,
        );
        expect(tampered).not.toBe(golden);

        const { pass, diffs } = compareSvg(ours, tampered, 'deterministic');
        expect(pass).toBe(false);
        expect(diffs.length).toBeGreaterThan(0);

        const message =
          `${type}/${target.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
          ` — ${JSON.stringify(diffs[0])}`;
        expect(message).toContain(target.slug);
        expect(message).toContain(diffs[0]!.path);
      });
    },
  );

  if (manifest.fixtures.length === 0) {
    it(`has no pinned svg-${type} golden yet to tamper with (AC2, deferred)`, () => {
      expect(manifest.fixtures).toHaveLength(0);
    });
  }
}
