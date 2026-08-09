/**
 * Offline SVG-conformance RATCHET for `@startdot` diagrams. Mission D14.
 *
 * Mirrors `state.golden.ratchet.test.ts` in procedure — offline, committed
 * goldens; a fixture ratchets in once and then never regresses. See
 * `oracle/goldens/svg-dot/README.md` for why this type's harness is shorter
 * than its siblings', in full. In brief:
 *
 *  - **AC3 is absent, not omitted.** The sibling suites gate eligibility on a
 *    fixture already being DOT-equal. `@startdot` forwards the user's own DOT
 *    verbatim, so that equality holds by construction and the gate would
 *    assert nothing. There is deliberately no `parity-dot.json`.
 *  - **No `render-fixture-dot.ts`, and no `DeterministicMeasurer`.** The
 *    passthrough consults neither theme nor measurer — graphviz produces the
 *    finished document — so there are no production defaults to hold out of
 *    the comparison, and the ratchet exercises the shipped `renderSync` path.
 *    The text measurement that DOES matter happens inside the engine, pinned
 *    once by `src/core/dot-engine-measurer.ts`.
 *
 * SEEDS FULL, unlike state's S0: all 5 cached fixtures were zero-diff the
 * moment the passthrough landed (baseline 0/5, at ≥6 diffs each).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { compareSvg } from './compare.js';

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
  '../../../oracle/goldens/svg-dot',
);

const manifest = JSON.parse(
  readFileSync(join(GOLDENS_ROOT, 'ratchet.json'), 'utf8'),
) as RatchetManifest;

function readGolden(f: RatchetFixture): string {
  return readFileSync(join(GOLDENS_ROOT, f.slug, 'golden.svg'), 'utf8');
}

function readSource(f: RatchetFixture): string {
  return readFileSync(join(GOLDENS_ROOT, f.slug, 'in.puml'), 'utf8');
}

function firstDiffPath(diffs: readonly { path: string }[]): string {
  return diffs.length > 0 ? diffs[0]!.path : '(none)';
}

// ---------------------------------------------------------------------------
// AC1 — every locked fixture stays conformant.
// ---------------------------------------------------------------------------

describe('svg-dot conformance ratchet (AC1)', () => {
  for (const f of manifest.fixtures) {
    it(`dot/${f.slug}: stays zero-diff against the pinned golden`, () => {
      const { pass, diffs } = compareSvg(
        renderSync(readSource(f)),
        readGolden(f),
        'deterministic',
      );
      expect(
        pass,
        `dot/${f.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
          ` — ${JSON.stringify(diffs[0])}`,
      ).toBe(true);
      expect(diffs).toEqual([]);
    });
  }

  it('pins the whole known @startdot corpus', () => {
    expect(manifest.fixtures.length).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// AC2 — tamper detection: an in-memory golden mutation must be caught, and
// the failure message must name the slug + first diff path.
// ---------------------------------------------------------------------------

describe('svg-dot conformance ratchet — tamper detection (AC2)', () => {
  it('a mutated golden (in-memory only) produces a failure naming slug + diff path', () => {
    const target = manifest.fixtures[0]!;
    const golden = readGolden(target);
    const ours = renderSync(readSource(target));

    // Confirm the untampered pair really is zero-diff first, so the tampered
    // failure below is attributable to the mutation alone.
    expect(
      compareSvg(ours, golden, 'deterministic').pass,
      `dot/${target.slug}: expected zero-diff baseline`,
    ).toBe(true);

    // Mutate a numeric attribute in-memory — never touches disk. graphviz
    // writes ellipse centres, so shift one well outside tolerance.
    const tampered = golden.replace(/cx="([\d.]+)"/, (_m, cx: string) => `cx="${Number(cx) + 500}"`);
    expect(tampered).not.toBe(golden);

    const { pass, diffs } = compareSvg(ours, tampered, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs.length).toBeGreaterThan(0);

    const message =
      `dot/${target.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
      ` — ${JSON.stringify(diffs[0])}`;
    expect(message).toContain(target.slug);
    expect(message).toContain(diffs[0]!.path);
  });
});

// ---------------------------------------------------------------------------
// The passthrough contract itself: this is what makes the type conformant, so
// assert it directly rather than only through the goldens.
// ---------------------------------------------------------------------------

describe('svg-dot — passthrough is byte-exact', () => {
  for (const f of manifest.fixtures) {
    it(`dot/${f.slug}: renderSync emits graphviz's document, not this port's markup`, () => {
      const ours = renderSync(readSource(f));
      expect(ours).toContain('id="graph0"');
      // This port's shared shell auto-embeds arrowhead <marker> defs. Their
      // presence would mean the document went through `svgRoot` — the exact
      // regression that made the baseline 0/5.
      expect(ours).not.toContain('<marker');
    });
  }
});
