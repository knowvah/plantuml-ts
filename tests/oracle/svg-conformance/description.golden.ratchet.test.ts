/**
 * Offline SVG-conformance RATCHET for description-engine diagrams
 * (component + usecase, both routed through the unified description/
 * deployment engine — see `.claude/catalog.md`). T18.
 *
 * Unlike the census script (`scripts/svg-conformance-census.ts`, a
 * discovery tool), this is a real assertion: every fixture listed in
 * `oracle/goldens/svg-description/ratchet.json` is PINNED at zero-diff
 * (`compareSvg(ours, golden, 'deterministic').pass`) against its committed
 * `golden.svg`. Once a slug is pinned here, any regression in our
 * description-engine SVG emission for that fixture fails `npm test` — the
 * ratchet only tightens, it never silently loosens. Modeled on the DOT
 * ratchet precedent, `tests/oracle/description-parity.ratchet.test.ts`.
 *
 * Renders via `renderFixture` (`./render-fixture.js`), NOT `renderSync`:
 * production hardcodes `jarMeasurer` (AWT), which cannot reach zero-diff
 * against these deterministic-text-mode goldens no matter how faithful the
 * emission is (see `src/core/measurer-deterministic.ts`'s doc comment, D12).
 * `renderFixture` injects `DeterministicMeasurer` into both the layout and
 * render stages instead, matching the system the goldens were captured in.
 *
 * Fully offline: goldens are committed `in.puml` + `golden.svg` pairs under
 * `oracle/goldens/svg-description/<type>/<slug>/` (no `test-results/`
 * dependency at test time — that tree is gitignored and regenerable; see
 * `oracle/goldens/svg-description/README.md`).
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from './compare.js';
import { renderFixture } from './render-fixture.js';
import { dotEligibility, type Eligibility, type SurveyRow } from './description-eligibility.js';
import { CI_RENDER_BUDGET_MS } from '../../helpers/ci-test-budgets.js';

// See the matching note in description.diff-baseline.ratchet.test.ts:
// `usecase/sprite-svg-bootstrap-0` renders in ~1.6s alone but is the slowest
// case in the suite, and full-suite worker contention pushed it past the 5s
// default twice, always as a timeout rather than a diff. Scoped to this file
// so the rest of the suite keeps the tight default.
vi.setConfig({ testTimeout: CI_RENDER_BUDGET_MS });

interface RatchetFixture {
  slug: string;
  type: string;
  addedAt: string;
  source: string;
}

interface RatchetManifest {
  fixtures: RatchetFixture[];
}

interface RoutingRow {
  tree: string;
  type: string;
  slug: string;
  ourType: string;
}

const GOLDENS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../oracle/goldens/svg-description');

const manifest = JSON.parse(readFileSync(join(GOLDENS_ROOT, 'ratchet.json'), 'utf8')) as RatchetManifest;

// Source of DOT-EQUAL truth for eligibility (AC3, codd T1a / D4): the PER-TYPE
// survey file `parity-<type>.json` (current), not the legacy `parity.json`
// (stale since 2026-09-21). `unknown`/`c4` rows additionally need the routing
// baseline's `ourType === 'DESCRIPTION'` -- see `./description-eligibility.ts`.
const HERE = dirname(fileURLToPath(import.meta.url));

function surveyRows(type: string): SurveyRow[] {
  return (JSON.parse(readFileSync(join(HERE, `parity-${type}.json`), 'utf8')) as { fixtures: SurveyRow[] }).fixtures;
}

const routing = (
  JSON.parse(readFileSync(join(HERE, '../../../oracle/goldens/svg-conformance/routing-baseline.json'), 'utf8')) as {
    fixtures: RoutingRow[];
  }
).fixtures;

function ourTypeOf(type: string, slug: string): string | undefined {
  return routing.find((r) => r.tree === 'dot-cache' && r.type === type && r.slug === slug)?.ourType;
}

function eligibilityOf(type: string, slug: string): Eligibility {
  return dotEligibility(
    type,
    surveyRows(type).find((r) => r.slug === slug),
    ourTypeOf(type, slug),
  );
}

function fixtureDir(f: RatchetFixture): string {
  return join(GOLDENS_ROOT, f.type, f.slug);
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
// bodyenhanced-atom-seams T1 (2026-07-29): 22 candidate fixtures were
// evaluated ahead of ADR-1/ADR-4's `decorate`/`BodyFactory` port — the 11
// known-affected folder/package/widened fixtures (bozana-38-xufi750,
// bozoju-49-kufo528, gucefa-91-pume734, kanute-77-lacu414, lotofa-28-rudo664,
// sevage-80-seva382, texacu-57-daci050, cobuju-30-paxo591, bootstrap-0,
// ruziru-69-xixo434, jecici-56-bimu826) plus 11 separator-bearing fixtures
// found by scanning `test-results/dot-cache/{component,usecase}` for creole
// block-separator lines (codabo-50-mupa164, xufexu-38-fola855,
// fepuvo-06-rugi981, nixura-77-bina738 titled; babafi-51-dixi026,
// butebe-90-dozo380, dexigu-24-deru622, kenece-24-juku624, tajadu-40-juro990,
// zifaji-87-raki559, pivudu-29-pele178 bare). ZERO of the 22 reached
// zero-diff — none were pinned. See `oracle/goldens/svg-description/
// README.md`'s "Known gap #2" and `.agent-notes/T1-svg-goldens.md` for the
// full per-fixture diff data and mechanism. Re-run this same candidate list
// once the `decorate` port lands; that is the population expected to go
// green next.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// AC1 — every locked fixture stays conformant.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-description conformance ratchet (AC1)', () => {
  for (const f of manifest.fixtures) {
    it(`${f.type}/${f.slug}: stays zero-diff against the pinned golden`, () => {
      const golden = readGolden(f);
      const markup = readSource(f);
      const ours = renderFixture(markup, new DeterministicMeasurer());
      const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
      expect(
        pass,
        `${f.type}/${f.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
          ` — ${JSON.stringify(diffs[0])}`,
      ).toBe(true);
      expect(diffs).toEqual([]);
    });
  }
});

if (manifest.fixtures.length === 0) {
  it('has no pinned svg-description goldens yet (skip gracefully, not a failure)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 — tamper detection: an in-memory golden mutation must be caught, and
// the failure message must name the slug + first diff path.
// ---------------------------------------------------------------------------

describe('svg-description conformance ratchet — tamper detection (AC2)', () => {
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
    expect(clean.pass, `${target.type}/${target.slug}: expected zero-diff baseline`).toBe(true);

    // Mutate a numeric attribute in-memory — never touches disk.
    const tampered = golden.replace(/rect x="(\d+)"/, (_m, x: string) => `rect x="${Number(x) + 500}"`);
    expect(tampered).not.toBe(golden);

    const { pass, diffs } = compareSvg(ours, tampered, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs.length).toBeGreaterThan(0);

    // The failure message a maintainer sees must name the slug + first
    // diff path, exactly as the AC1 assertion above does.
    const message =
      `${target.type}/${target.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
      ` — ${JSON.stringify(diffs[0])}`;
    expect(message).toContain(target.slug);
    expect(message).toContain(diffs[0]!.path);
  });
});

// ---------------------------------------------------------------------------
// AC3 — DOT-EQUAL eligibility is enforced in the suite, not just documented.
// ---------------------------------------------------------------------------

describe('svg-description conformance ratchet — eligibility (AC3)', () => {
  it('every manifest slug is dotEqual=true in its per-type parity file (and routed DESCRIPTION if unknown/c4)', () => {
    for (const f of manifest.fixtures) {
      const e = eligibilityOf(f.type, f.slug);
      expect(e.ok, `${f.type}/${f.slug}: ineligible for the ratchet — ${e.reason}`).toBe(true);
    }
  });

  it('rejects adding a fixture whose DOT is not EQUAL', () => {
    // Real rows known (via parity-component.json) to be dotEqual=false:
    // `berelu-46-namo819` (diverged; `gutute-00-gaki684` is now dotEqual) and `dirofi-81-cuga514`, which is
    // verdict=conformant yet dotEqual=false -- conformance alone is not enough.
    for (const slug of ['berelu-46-namo819', 'dirofi-81-cuga514']) {
      const entry = surveyRows('component').find((r) => r.slug === slug);
      expect(entry, `expected ${slug} in parity-component.json`).toBeDefined();
      expect(entry!.dotEqual).toBe(false);
      expect(eligibilityOf('component', slug)).toEqual({
        ok: false,
        reason: 'dotEqual=false in parity-component.json',
      });
      expect(manifest.fixtures.some((f) => f.slug === slug)).toBe(false);
    }
  });

  it('rejects a dotEqual unknown row routed to another engine', () => {
    // Real row: dotEqual=true in parity-unknown.json, but routed CLASS.
    const slug = surveyRows('unknown').find(
      (r) => r.dotEqual === true && ourTypeOf('unknown', r.slug) === 'CLASS',
    )!.slug;
    expect(eligibilityOf('unknown', slug).reason).toBe('routing-baseline ourType=CLASS, not DESCRIPTION');
  });
});
