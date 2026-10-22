/**
 * Offline SVG-conformance RATCHET for the class diagram engine
 * (`src/diagrams/class/`). G2/N0.
 *
 * Mirrors `description.golden.ratchet.test.ts` (svg-description, mission
 * G1/T18) exactly in procedure — see that file's doc comment for the full
 * rationale (offline, committed goldens; `DeterministicMeasurer` so both
 * sides measure text in the SAME system; a fixture ratchets in only once
 * and then never regresses). Two differences from the description ratchet,
 * both structural, not procedural:
 *
 *   1. Class fixtures have no `<type>` dimension (component vs usecase) —
 *      `oracle/goldens/svg-class/<slug>/`, not `<type>/<slug>/`; the
 *      manifest/parity shapes here drop the `type` field accordingly. A
 *      manifest entry MAY instead carry `tree: 'unknown'` (cdd5-T2, D4), in
 *      which case its golden lives at `svg-class/unknown/<slug>/` — a
 *      CLASS-routed fixture our router currently misfiles as `unknown`.
 *   2. `renderClassFixture` (`render-fixture-class.ts`, `renderSync` under
 *      the hood — cdd5-T1/D3) replaces `renderFixture` (`render-fixture
 *      .ts`) as the render helper — the class engine's own pipeline
 *      (`parseClass` -> `layoutClass` -> `renderClass`), not description's,
 *      reached the SAME way production reaches it.
 *
 * STARTS EMPTY (N0): the N0 family scan found the corpus-wide "SVG root
 * shell" gap (missing `xmlns:xlink`/`version`/`zoomAndPan`/
 * `preserveAspectRatio`/`contentStyleType`/`background` root attrs + a
 * flat-children-vs-single-wrapping-`<g>` structural gap) blocks EVERY
 * fixture from zero-diff — see `plans/g2-class-svg/ledger.md` N0 and
 * `oracle/goldens/svg-class/README.md`. AC1/AC2/AC3 below all degrade
 * gracefully to a documented placeholder assertion when `ratchet.json`/
 * `parity-class.json` are empty, exactly as `description.golden.ratchet
 * .test.ts`'s AC1 already does for its own empty case — this is the SAME
 * pattern applied to all three describe blocks, since class starts at zero
 * on every axis (ratchet AND parity survey) where description started with
 * ratchet already seeded.
 */
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from './compare.js';
import { prepareElkOnce, renderClassFixture } from './render-fixture-class.js';
// cdd5-T2 (D4): the survey's own asset/include stores, shared through T1's
// `censusClassFixtureOptions` -- imported, not re-combined locally. Before
// this task the ratchet built its OWN `combineAssetStores(buildSprite...,
// buildEmoji...)` instance here, a second copy of the exact wiring
// `scripts/svg-conformance-census.ts#censusClassFixtureOptions` already
// carries (itself lifted from `scripts/svg-parity-survey.ts`'s
// `SURVEY_ASSET_STORE` + `fixtureIncludeStore()`) -- see that module's own
// doc comment for why a duplicated measurement seam defeats the cross-check
// between the ratchet, the census and the survey.
import { censusClassFixtureOptions } from '../../../scripts/svg-conformance-census.js';
import { CI_RENDER_BUDGET_MS } from '../../helpers/ci-test-budgets.js';

// Renders past half of vitest's 5s default on the CI runner (worst observed:
// unknown/xuloxo-85-vibu502, 5,046ms (timed out));
// derivation in tests/helpers/ci-test-budgets.ts.
vi.setConfig({ testTimeout: CI_RENDER_BUDGET_MS });

interface RatchetFixture {
  slug: string;
  addedAt: string;
  source: string;
  /** cdd5-T2 (D4): absent means 'class' -- the ratchet's original, and still
   *  overwhelming, majority. 'unknown' fixtures are CLASS-routed corpus rows
   *  our router currently misfiles as `unknown` (see `oracle/goldens/
   *  svg-conformance/routing-baseline.json`'s `ourType`); their golden lives
   *  one directory level deeper (`fixtureDir` below). */
  tree?: 'class' | 'unknown';
}

interface RatchetManifest {
  fixtures: RatchetFixture[];
}

interface ParityEntry {
  slug: string;
  dotEqual: boolean;
  /** The jar dumped no svek DOT for this row (`scripts/dot-sync-report.ts:288`). */
  oracleBlind?: boolean;
}

interface ParityReport {
  fixtures: ParityEntry[];
}

const GOLDENS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../oracle/goldens/svg-class');

const manifest = JSON.parse(readFileSync(join(GOLDENS_ROOT, 'ratchet.json'), 'utf8')) as RatchetManifest;

// Source of DOT-EQUAL truth for eligibility (AC3) — mirrors description's
// own `parity.json`, but class-scoped (see `render-fixture-class.ts`'s doc
// comment and `oracle/goldens/svg-class/README.md`'s "Add rule"). Surveyed:
// 721 rows as of SI13 (2026-08-04), including AUTHORED fixtures — SI13
// taught `dot-sync-fixtures.ts` the flat `svg-class/<slug>/` layout, so an
// authored golden flows dot-cache → survey → a real row here and its
// ratchet eligibility turns solely on AC1's zero-diff, exactly as SI9
// arranged for description. Regenerate with
// `SVG_PARITY_CONCURRENCY=2 npx jiti scripts/svg-parity-survey.ts
// --out tests/oracle/svg-conformance/parity-class.json class`
// (single-type `--out` only — a shared-file write TRUNCATES other types).
// NOTE the survey's verdict comes from a different render path
// (`renderSync` + `WidthTableMeasurer`) than this suite's
// (`renderFixtureClass` + `DeterministicMeasurer`) — a `conformant`
// verdict is a candidate signal, not the AC1 measurement itself.
const parity = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'parity-class.json'), 'utf8'),
) as ParityReport;

// cdd5-T5 (D4): an unknown-tree pin's survey row lives in parity-unknown.json.
const parityUnknown = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'parity-unknown.json'), 'utf8'),
) as ParityReport;

function findParityEntry(slug: string, tree: 'class' | 'unknown' = 'class'): ParityEntry | undefined {
  return (tree === 'unknown' ? parityUnknown : parity).fixtures.find((f) => f.slug === slug);
}

/** cdd5-T2 (D4): `tree: 'unknown'` goldens live one level deeper
 *  (`svg-class/unknown/<slug>/`); absent/`'class'` resolves at the flat
 *  root, unchanged from before this task. Covered directly by the
 *  tree-resolution unit test below -- a path-join is cheap to get wrong
 *  silently (a typo'd segment still resolves to SOME path, just the wrong
 *  one) and expensive to notice once 706 fixtures are already reading
 *  through it. */
function fixtureDir(f: RatchetFixture): string {
  return f.tree === 'unknown' ? join(GOLDENS_ROOT, 'unknown', f.slug) : join(GOLDENS_ROOT, f.slug);
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
// Tree resolution (D4) — a synthetic entry, never a real ratchet row, so this
// never depends on any fixture actually being pinned.
// ---------------------------------------------------------------------------

describe('svg-class conformance ratchet — tree resolution (D4)', () => {
  it('a "unknown" entry resolves under svg-class/unknown/<slug>/', () => {
    const entry: RatchetFixture = {
      slug: 'synthetic-unknown-slug',
      addedAt: '2026-09-28',
      source: 'test',
      tree: 'unknown',
    };
    expect(fixtureDir(entry)).toBe(join(GOLDENS_ROOT, 'unknown', 'synthetic-unknown-slug'));
  });

  it('an entry with no tree field resolves under the flat svg-class/<slug>/ root (class default)', () => {
    const entry: RatchetFixture = { slug: 'synthetic-class-slug', addedAt: '2026-09-28', source: 'test' };
    expect(fixtureDir(entry)).toBe(join(GOLDENS_ROOT, 'synthetic-class-slug'));
  });
});

// ---------------------------------------------------------------------------
// AC1 — every locked fixture stays conformant.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-class conformance ratchet (AC1)', () => {
  // cdd8-T2e (D2d): pinned ELK rows render through a preloaded backend.
  beforeAll(async () => {
    await prepareElkOnce();
  });

  for (const f of manifest.fixtures) {
    const tree = f.tree ?? 'class';
    it(`${tree}/${f.slug}: stays zero-diff against the pinned golden`, () => {
      const golden = readGolden(f);
      const markup = readSource(f);
      // cdd5-T2 (D3/D4): `renderClassFixture` (renderSync) replaces
      // `renderFixtureClass`'s forced `parseClass` call -- the ratchet now
      // renders through the SAME path the census/survey do, with the SAME
      // shared asset/include stores (`censusClassFixtureOptions`), so a
      // `<bundle/...>` fixture the census found zero-diff can be held here
      // (cdd3 close-b3: cuzoga, jevuvi include `<tupadr3/common>`) and a
      // `tree: 'unknown'` fixture (censusable only under D3) can ratchet at
      // all.
      const ours = renderClassFixture(markup, new DeterministicMeasurer(), censusClassFixtureOptions());
      const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
      expect(
        pass,
        `${tree}/${f.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
          ` — ${JSON.stringify(diffs[0])}`,
      ).toBe(true);
      expect(diffs).toEqual([]);
    });
  }
});

if (manifest.fixtures.length === 0) {
  it('has no pinned svg-class goldens yet (skip gracefully, not a failure)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC2 — tamper detection: an in-memory golden mutation must be caught, and
// the failure message must name the slug + first diff path.
// ---------------------------------------------------------------------------

describe.skipIf(manifest.fixtures.length === 0)('svg-class conformance ratchet — tamper detection (AC2)', () => {
  it('a mutated golden (in-memory only) produces a failure naming slug + diff path', () => {
    const f = manifest.fixtures[0];
    expect(f, 'expected at least one seeded fixture to exercise tamper detection').toBeDefined();
    const target = f!;

    const targetTree = target.tree ?? 'class';
    const golden = readGolden(target);
    const markup = readSource(target);
    const ours = renderClassFixture(markup, new DeterministicMeasurer(), censusClassFixtureOptions());

    // Confirm the untampered pair really is zero-diff first, so the
    // tampered-case failure below is attributable to the mutation alone.
    const clean = compareSvg(ours, golden, 'deterministic');
    expect(clean.pass, `${targetTree}/${target.slug}: expected zero-diff baseline`).toBe(true);

    // Mutate a numeric attribute in-memory — never touches disk.
    const tampered = golden.replace(/rect x="(\d+)"/, (_m, x: string) => `rect x="${Number(x) + 500}"`);
    expect(tampered).not.toBe(golden);

    const { pass, diffs } = compareSvg(ours, tampered, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs.length).toBeGreaterThan(0);

    const message =
      `${targetTree}/${target.slug}: conformance regression — first diff: ${firstDiffPath(diffs)}` +
      ` — ${JSON.stringify(diffs[0])}`;
    expect(message).toContain(target.slug);
    expect(message).toContain(diffs[0]!.path);
  });
});

if (manifest.fixtures.length === 0) {
  it('has no pinned svg-class golden yet to exercise tamper detection against (AC2, deferred)', () => {
    expect(manifest.fixtures).toHaveLength(0);
  });
}

// ---------------------------------------------------------------------------
// AC3 — DOT-EQUAL eligibility is enforced in the suite, not just documented.
// ---------------------------------------------------------------------------

// cdd8 D12: an ELK row has no DOT stage (the jar's ELK path,
// `CucaDiagram.java:478-479`, dumps no `svek-N.dot`), so it is eligible when
// the survey marks it `oracleBlind` AND its cached source carries the pragma
// -- structural, never an exemption list. Read from the fixture's dot-cache
// directory, the same `in.puml` the survey rendered.
const DOT_CACHE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache');
const ELK_PRAGMA = /^\s*!pragma\s+layout\s+elk\s*$/im;

function hasElkPragma(tree: 'class' | 'unknown', slug: string): boolean {
  return ELK_PRAGMA.test(readFileSync(join(DOT_CACHE_ROOT, tree, slug, 'in.puml'), 'utf8'));
}

function isRatchetEligible(entry: ParityEntry, tree: 'class' | 'unknown'): boolean {
  return entry.dotEqual || (entry.oracleBlind === true && hasElkPragma(tree, entry.slug));
}

describe('svg-class conformance ratchet — ELK eligibility (D12)', () => {
  it('a dotEqual row is eligible', () => {
    expect(isRatchetEligible({ slug: 'bajotu-30-soku184', dotEqual: true }, 'class')).toBe(true);
  });

  it('an oracleBlind row whose source carries !pragma layout elk is eligible', () => {
    expect(isRatchetEligible({ slug: 'cadutu-02-lazu601', dotEqual: false, oracleBlind: true }, 'class')).toBe(true);
  });

  it('an oracleBlind row without the pragma is still ineligible', () => {
    expect(isRatchetEligible({ slug: 'bajotu-30-soku184', dotEqual: false, oracleBlind: true }, 'class')).toBe(false);
  });

  it('a row that is neither dotEqual nor oracleBlind is ineligible, pragma or not', () => {
    expect(isRatchetEligible({ slug: 'cadutu-02-lazu601', dotEqual: false }, 'class')).toBe(false);
  });
});

describe.skipIf(manifest.fixtures.length === 0)('svg-class conformance ratchet — eligibility (AC3)', () => {
  it('every manifest slug is DOT-EQUAL, or an ELK row with no DOT stage (D12)', () => {
    for (const f of manifest.fixtures) {
      const tree = f.tree ?? 'class';
      const entry = findParityEntry(f.slug, tree);
      expect(entry, `${tree}/${f.slug}: no parity-${tree}.json entry found`).toBeDefined();
      expect(
        isRatchetEligible(entry!, tree),
        `${tree}/${f.slug}: manifest entry is neither DOT-EQUAL nor an oracle-blind ELK row — ineligible for the ratchet`,
      ).toBe(true);
    }
  });
});

if (manifest.fixtures.length === 0) {
  it('parity-class.json is an unsurveyed placeholder — no eligibility check to run yet (AC3, deferred)', () => {
    // See this file's doc comment + oracle/goldens/svg-class/README.md
    // "Add rule": regenerate via `svg-parity-survey.ts --out ... class`
    // once a real zero-diff candidate exists (N1+).
    expect(parity.fixtures).toHaveLength(0);
  });
}
