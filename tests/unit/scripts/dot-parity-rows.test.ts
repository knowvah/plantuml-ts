/**
 * Unit tests for the DOT-sync report's per-type row builder
 * (`scripts/dot-parity-rows.ts`, mission parity-dashboard-refresh T4).
 *
 * `dotParityRows` reads three filesystem roots (manifest dir, dot-cache dir,
 * canonical-SVG dir). The first version of this suite called it against the
 * REAL repo roots, relying on `test-results/visual-qa-svg/canonical/` being
 * absent in this worktree to keep every type on the "no data-diagram-type
 * classification" branch. Once that directory was linked in (it holds real
 * canonical SVGs for class/component/object/state/usecase in the main
 * checkout), `class` reached `buildAgg` and ran the full ~700-fixture
 * aggregate on every call — about 11s per call, timing out the 5000ms test
 * default. `roots` (`DotParityRoots`) exists so a row's note is a function of
 * an INJECTED tree, never of what happens to be cached on whatever machine or
 * worktree runs the suite. Every test below builds its own temp tree and
 * passes it explicitly; none call `dotParityRows` with the real, ambient
 * default roots.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  dotParityRows,
  dotParityMarkdown,
  dotParityJson,
  NON_SVEK_TYPES,
  type TypeRow,
  type DotParityRoots,
} from '../../../scripts/dot-parity-rows.js';

/** Never invoked in this suite: every temp-tree type below resolves before
 *  `rowForType` reaches `buildAgg` (no `roots.canonDir` is ever created, so
 *  `hasCanon` is false for every type unconditionally). */
const UNUSED_JAR = 'unused-test-jar';

let tmp: string;
let roots: DotParityRoots;

function writeManifest(dataDir: string, type: string, fixtures: unknown[]): void {
  writeFileSync(join(dataDir, type + '.json'), JSON.stringify(fixtures), 'utf-8');
}

function markDone(cacheDir: string, type: string, slug: string): void {
  const dir = join(cacheDir, type, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, '.done'), '', 'utf-8');
}

function rowFor(rows: TypeRow[], type: string): TypeRow {
  const row = rows.find((r) => r.type === type);
  if (row === undefined) throw new Error(`no row for "${type}" — check the temp manifest still has ${type}.json`);
  return row;
}

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), 'dot-parity-rows-'));
  const dataDir = join(tmp, 'data');
  const cacheDir = join(tmp, 'cache');
  // roots.canonDir is deliberately never created — every type must resolve
  // via a branch earlier than "no data-diagram-type classification"'s
  // buildAgg call, or via that branch itself, never past it.
  const canonDir = join(tmp, 'canon-never-created');
  mkdirSync(dataDir, { recursive: true });
  roots = { dataDir, cacheDir, canonDir };

  // sequence: NON_SVEK_TYPES member, cached anyway — the short circuit must
  // fire BEFORE the cache is even inspected.
  writeManifest(dataDir, 'sequence', [{ slug: 'seq-1', markup: '@startuml\nA -> B\n@enduml\n' }]);
  markDone(cacheDir, 'sequence', 'seq-1');

  // c4: manifest exists, no cache dir at all (and not a NON_SVEK_TYPES
  // member -- board and salt both moved into that set once captured).
  writeManifest(dataDir, 'c4', [{ slug: 'c4-1', markup: '@startuml\nsalt\n{T\n}\n@enduml\n' }]);

  // class: cached (has .done), has EXPECTED_TAG, but canonDir never exists —
  // exercises "no data-diagram-type classification" without ever reaching
  // buildAgg.
  writeManifest(dataDir, 'class', [{ slug: 'cls-1', markup: '@startuml\nclass A\n@enduml\n' }]);
  markDone(cacheDir, 'class', 'cls-1');

  // alpha / zeta: empty manifests bracketing the alphabet, to prove sort order.
  writeManifest(dataDir, 'alpha', []);
  writeManifest(dataDir, 'zeta', []);
});

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// NON_SVEK_TYPES — the structural constant
// ---------------------------------------------------------------------------

describe('NON_SVEK_TYPES', () => {
  it('is exactly the twenty-two non-svek buckets', () => {
    expect(new Set(NON_SVEK_TYPES)).toEqual(
      new Set([
        'sequence',
        'activity',
        'json',
        'yaml',
        'hcl',
        'dot',
        'gitgraph',
        'board',
        'chart',
        'chronology',
        'files',
        'packet',
        'ditaa',
        'ebnf',
        'gantt',
        'mindmap',
        'network',
        'regex',
        'salt',
        'timing',
        'wbs',
        'wire',
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// dotParityRows — AC1, AC2, against an injected temp tree (never real roots)
// ---------------------------------------------------------------------------

describe('dotParityRows', () => {
  it('returns exactly one row per manifest in roots.dataDir, sorted by type', () => {
    const rows = dotParityRows(UNUSED_JAR, roots);
    expect(rows.map((r) => r.type)).toEqual(['alpha', 'c4', 'class', 'sequence', 'zeta']);
  });

  // AC1: a NON_SVEK_TYPES member is n/a with comparable 0 even though it has
  // a populated cache dir — the short circuit must fire first.
  it('sequence: n/a (no DOT stage), comparable 0, despite a populated cache dir', () => {
    const row = rowFor(dotParityRows(UNUSED_JAR, roots), 'sequence');
    expect(row.note).toBe('n/a (no DOT stage)');
    expect(row.comparable).toBe(0);
    expect(row.equal).toBe(0);
    expect(row.oracleBlind).toBe(0);
    expect(row.pct).toBe('—');
  });

  // AC2: a manifest type with no cache dir at all gets "no oracle captured".
  it('c4 (no cache dir, not a NON_SVEK_TYPES member): no oracle captured', () => {
    const row = rowFor(dotParityRows(UNUSED_JAR, roots), 'c4');
    expect(row.note).toBe('no oracle captured');
    expect(row.comparable).toBe(0);
  });

  // Third vocabulary member: cache populated, manifest present, but
  // roots.canonDir was never created — buildAgg is never reached.
  it('class (cached, no canonical SVGs in roots.canonDir): no data-diagram-type classification', () => {
    const row = rowFor(dotParityRows(UNUSED_JAR, roots), 'class');
    expect(row.note).toBe('no data-diagram-type classification');
    expect(row.comparable).toBe(0);
  });

  it('alpha and zeta (no cache dir, empty manifests): no oracle captured', () => {
    const rows = dotParityRows(UNUSED_JAR, roots);
    expect(rowFor(rows, 'alpha').note).toBe('no oracle captured');
    expect(rowFor(rows, 'zeta').note).toBe('no oracle captured');
  });

  // `roots` defaulting to the real repo paths is exercised by
  // dot-sync-report.ts's own `--markdown` CLI mode, not here: calling
  // dotParityRows with no roots against this worktree's real, populated
  // test-results/ would reach buildAgg's ~700-fixture class aggregate and
  // couple this suite to ambient state it must stay independent of.
});

// ---------------------------------------------------------------------------
// dotParityMarkdown — pure rendering, no filesystem or jar involved
// ---------------------------------------------------------------------------

describe('dotParityMarkdown', () => {
  const rows: TypeRow[] = [
    { type: 'class', comparable: 708, equal: 708, pct: '100%', oracleBlind: 7, note: '—' },
    { type: 'dot', comparable: 0, equal: 0, pct: '—', oracleBlind: 0, note: 'n/a (no DOT stage)' },
    { type: 'c4', comparable: 0, equal: 0, pct: '—', oracleBlind: 0, note: 'no oracle captured' },
  ];

  it('renders the generated-on date, the header, one table row per TypeRow, and the legend', () => {
    const out = dotParityMarkdown(rows, '2026-09-20');

    expect(out).toContain('Generated by `npx tsx scripts/dot-sync-report.ts --markdown` on 2026-09-20.');
    expect(out).toContain('| class | 708 | 708 | 100% | 7 | — |');
    expect(out).toContain('| dot | 0 | 0 | — | 0 | n/a (no DOT stage) |');
    expect(out).toContain('| c4 | 0 | 0 | — | 0 | no oracle captured |');
  });

  it('documents n/a (no DOT stage) in the legend', () => {
    const out = dotParityMarkdown(rows, '2026-09-20');
    expect(out).toContain('**n/a (no DOT stage)**');
  });

  it('ends with a single trailing newline (matches the previous generator byte-for-byte convention)', () => {
    const out = dotParityMarkdown([], '2026-09-20');
    expect(out.endsWith('\n')).toBe(true);
    expect(out.endsWith('\n\n\n')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// dotParityJson — pure pairing of rows + injected meta (T6 amendment: the
// dashboard reads this committed shape instead of calling dotParityRows live)
// ---------------------------------------------------------------------------

describe('dotParityJson', () => {
  const rows: TypeRow[] = [{ type: 'class', comparable: 708, equal: 708, pct: '100%', oracleBlind: 7, note: '—' }];
  const meta = { generatedAt: '2026-09-20T00:00:00.000Z', measuredAgainstCommit: 'abc1234' };

  it('pairs the given rows with the given meta verbatim, never reading the clock or git itself', () => {
    expect(dotParityJson(rows, meta)).toEqual({
      generatedAt: '2026-09-20T00:00:00.000Z',
      measuredAgainstCommit: 'abc1234',
      rows,
    });
  });

  it('is a pure function of its arguments: same rows and meta always produce the same result', () => {
    expect(dotParityJson(rows, meta)).toEqual(dotParityJson(rows, meta));
  });

  it('carries an empty rows array through unchanged', () => {
    expect(dotParityJson([], meta).rows).toEqual([]);
  });
});
