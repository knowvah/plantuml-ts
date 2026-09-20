/**
 * Unit tests for the unified parity dashboard (mission
 * parity-dashboard-refresh, T6): the pure matrix/freshness/render core in
 * `parity-dashboard.ts`, the pure summarizers in `parity-dashboard-inputs.ts`
 * / `parity-dashboard-goldens.ts` / `parity-dashboard-matrix.ts`, and the D9
 * drift gate against the committed `docs/parity-report.md`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildMatrix,
  buildFreshness,
  buildReportModel,
  renderReport,
  loadInputs,
  type RawInputs,
} from '../../../scripts/parity-dashboard.js';
import { tallySurvey, zeroDiffCount, registeredEngineTypes } from '../../../scripts/parity-dashboard-inputs.js';
import { ratchetPinsOf, diffBaselineStatsOf, groupBaselineByType } from '../../../scripts/parity-dashboard-goldens.js';
import { engineCell } from '../../../scripts/parity-dashboard-matrix.js';
import type { TypeRow } from '../../../scripts/dot-parity-rows.js';
import type { FixtureRow } from '../../../scripts/svg-parity-survey.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const REPORT_PATH = join(REPO, 'docs', 'parity-report.md');

// ---------------------------------------------------------------------------
// Synthetic RawInputs — covers every vocabulary branch buildMatrix/
// buildFreshness must handle, without touching real disk state.
// ---------------------------------------------------------------------------

function dotRow(type: string, over: Partial<TypeRow>): TypeRow {
  return { type, comparable: 0, equal: 0, pct: '—', oracleBlind: 0, note: '—', ...over };
}

function baseInputs(): RawInputs {
  const buckets = ['class', 'component', 'ditaa', 'sequence', 'unknown'];
  return {
    buckets,
    corpusCounts: { class: 768, component: 384, ditaa: 2, sequence: 1271, unknown: 825 },
    registeredEngines: ['class', 'description', 'sequence'],
    oracleCounts: { class: 723, component: 266, sequence: 1141 },
    jarUnsupportedCounts: {},
    dotParity: {
      generatedAt: '2026-09-20T14:44:15.369Z',
      measuredAgainstCommit: 'bdd3344e',
      rows: [
        dotRow('class', { comparable: 711, equal: 710, pct: '100%', oracleBlind: 7 }),
        dotRow('component', { comparable: 263, equal: 259, pct: '98%', oracleBlind: 1 }),
        dotRow('ditaa', { note: 'no oracle captured' }),
        dotRow('sequence', { note: 'n/a (no DOT stage)' }),
        dotRow('unknown', { note: 'no oracle captured' }),
      ],
    },
    surveyByType: {
      class: { conformant: 412, structural: 50, diverged: 261, generatedAt: '2026-09-03T18:45:20.062Z' },
    },
    censusByType: {},
    ratchetByType: {
      class: { count: 314, addedAt: '2026-08-17' },
      component: { count: 32, addedAt: '2026-07-15' },
      sequence: { count: 0, addedAt: undefined },
    },
    diffBaselineByType: {
      component: { count: 15, sum: 853, measuredAt: '2026-09-03' },
      sequence: { count: 1124, sum: 1158537, measuredAt: '2026-09-19' },
    },
    routingByType: {
      class: { counts: { agree: 720, 'jar-error': 3 }, total: 723, measuredAt: '2026-08-24' },
      sequence: { counts: { agree: 1124, 'known-misroute': 17 }, total: 1141, measuredAt: '2026-08-26' },
    },
    refusalByType: {
      class: { counts: { ok: 723 }, total: 723, measuredAt: '2026-08-24' },
      sequence: { counts: { ok: 1132, 'known-gap': 9 }, total: 1141, measuredAt: '2026-08-26' },
    },
  };
}

// ---------------------------------------------------------------------------
// buildMatrix
// ---------------------------------------------------------------------------

describe('buildMatrix', () => {
  const rows = buildMatrix(baseInputs());
  const row = (type: string) => rows.find((r) => r.type === type)!;

  it('returns one row per bucket, in bucket order', () => {
    expect(rows.map((r) => r.type)).toEqual(['class', 'component', 'ditaa', 'sequence', 'unknown']);
  });

  it('resolves a real DOT-equal fraction and a full survey/ratchet/routing/refusal row for class', () => {
    expect(row('class')).toEqual({
      type: 'class',
      engine: 'class',
      corpus: 768,
      oracle: '723',
      dot: '710/711 (100%)',
      survey: '412 / 50 / 261',
      census: 'n/a (no census yet)',
      ratchet: '314',
      diffBaseline: 'n/a (no diff-baseline yet)',
      routing: '720/723',
      refusal: '723/723',
    });
  });

  it('maps component to the description engine override and reports its diff-baseline', () => {
    expect(row('component').engine).toBe('description');
    expect(row('component').diffBaseline).toBe('15 · 853');
  });

  it('reports a real zero ratchet count for sequence (empty-by-design, not n/a)', () => {
    expect(row('sequence').ratchet).toBe('0');
    expect(row('sequence').dot).toBe('n/a (no DOT stage (non-svek))');
    expect(row('sequence').diffBaseline).toBe('1124 · 1158537');
    expect(row('sequence').routing).toBe('1124/1141');
    expect(row('sequence').refusal).toBe('1132/1141');
  });

  it('turns every comparison cell of a jar-unsupported type into n/a (plantuml-ts only)', () => {
    const inputs = baseInputs();
    inputs.buckets = [...inputs.buckets, 'chronology'].sort();
    inputs.corpusCounts['chronology'] = 1;
    inputs.registeredEngines = [...inputs.registeredEngines, 'chronology'];
    inputs.oracleCounts['chronology'] = 1;
    inputs.jarUnsupportedCounts['chronology'] = 1;
    inputs.dotParity.rows.push(dotRow('chronology', { note: 'n/a (no DOT stage)' }));
    inputs.surveyByType['chronology'] = { conformant: 0, structural: 0, diverged: 1, generatedAt: '2026-09-20' };
    inputs.routingByType['chronology'] = { counts: { agree: 1 }, total: 1, measuredAt: '2026-09-20' };
    const r = buildMatrix(inputs).find((x) => x.type === 'chronology')!;
    expect(r.engine).toBe('chronology');
    expect(r.corpus).toBe(1);
    for (const cell of [r.oracle, r.dot, r.survey, r.census, r.ratchet, r.diffBaseline, r.routing, r.refusal]) {
      expect(cell).toBe('n/a (plantuml-ts only)');
    }
    const f = buildFreshness(inputs).find((x) => x.type === 'chronology')!;
    expect([f.dot, f.survey, f.routing]).toEqual([undefined, undefined, undefined]);
  });

  it('gives ditaa a D-row "no engine" reason, not a bare n/a', () => {
    expect(row('ditaa').engine).toBe('n/a (no engine (D8 todo))');
    expect(row('ditaa').oracle).toBe('n/a (no oracle captured)');
  });

  it('gives unknown the accounting-bucket engine reason', () => {
    expect(row('unknown').engine).toBe('n/a (accounting bucket)');
  });

  it('never emits a bare "n/a" cell — every one carries a parenthetical reason', () => {
    for (const r of rows) {
      for (const cell of Object.values(r)) {
        if (typeof cell === 'string' && cell.startsWith('n/a')) expect(cell).toMatch(/^n\/a \(.+\)$/);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// buildFreshness
// ---------------------------------------------------------------------------

describe('buildFreshness', () => {
  const rows = buildFreshness(baseInputs());
  const row = (type: string) => rows.find((r) => r.type === type)!;

  it('carries a date for every source class actually has data for', () => {
    expect(row('class')).toEqual({
      type: 'class',
      dot: '2026-09-20T14:44:15.369Z',
      survey: '2026-09-03T18:45:20.062Z',
      census: undefined,
      ratchet: '2026-08-17',
      diffBaseline: undefined,
      routing: '2026-08-24',
      refusal: '2026-08-24',
    });
  });

  it('leaves every source undefined for a bucket with no data at all (unknown)', () => {
    expect(row('unknown')).toEqual({
      type: 'unknown',
      dot: undefined,
      survey: undefined,
      census: undefined,
      ratchet: undefined,
      diffBaseline: undefined,
      routing: undefined,
      refusal: undefined,
    });
  });

  it('a real zero ratchet count still carries no addedAt (sequence: never pinned, D2 empty-by-design)', () => {
    expect(row('sequence').ratchet).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// renderReport
// ---------------------------------------------------------------------------

describe('renderReport', () => {
  const model = buildReportModel(baseInputs());
  const out = renderReport(model);

  it('opens with the generated-by banner', () => {
    expect(out.startsWith('<!-- GENERATED by scripts/parity-dashboard.ts')).toBe(true);
  });

  it('states the freshest measurement date, derived from an input, not the clock', () => {
    expect(out).toContain('Freshest measurement across every source below: 2026-09-20T14:44:15.369Z.');
  });

  it('renders the matrix header and a class row', () => {
    expect(out).toContain('| type | engine | corpus | oracle | DOT equal |');
    expect(out).toContain('| class | class | 768 | 723 | 710/711 (100%) |');
  });

  it('renders the freshness table', () => {
    expect(out).toContain('## Freshness');
    expect(out).toContain('| class | 2026-09-20T14:44:15.369Z | 2026-09-03T18:45:20.062Z |');
  });

  // AC2: every n/a cell in the MATRIX table carries a parenthetical reason
  // from the fixed D8 vocabulary — a bare "n/a" never appears. Scoped to the
  // table block (not the whole document) so the preamble's own prose
  // ("a bare `n/a` never appears") can't produce a false positive.
  it('AC2: every n/a in the Matrix table matches the D8 vocabulary, no bare n/a', () => {
    const tableBlock = out.slice(out.indexOf('## Matrix'), out.indexOf('## Freshness'));
    const vocab =
      /^n\/a \((no engine \(D\d+ todo\)|no DOT stage \(non-svek\)|no oracle captured|no ratchet yet|no survey yet|no census yet|no diff-baseline yet|no data-diagram-type classification|plantuml-ts only|engine, unclassifiable corpus|accounting bucket)\)$/;
    for (const line of tableBlock.split('\n').filter((l) => l.startsWith('| '))) {
      for (const cell of line.split('|').map((c) => c.trim())) {
        if (cell.startsWith('n/a')) expect(cell).toMatch(vocab);
      }
    }
  });

  it('embeds the verbatim DOT-parity section', () => {
    expect(out).toContain('# DOT parity report');
    expect(out).toContain('| class | 711 | 710 | 100% | 7 | — |');
  });

  it('ends with the D7 footnote naming all eleven members', () => {
    expect(out).toContain('## Footnote: upstream types with neither a bucket nor an engine');
    for (const m of [
      'HELP',
      'BPM',
      'JCCKIT',
      'COMPOSITE',
      'CREOLE',
      'MATH',
      'LATEX',
      'DEFINITION',
      'FLOW',
      'SPRITES',
      'CRASH',
    ]) {
      expect(out).toContain(m);
    }
  });

  it("ends with a trailing blank line, matching this codebase's other generated reports (e.g. PARITY-SVG.md)", () => {
    expect(out.endsWith('\n\n')).toBe(true);
    expect(out.endsWith('\n\n\n')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Pure summarizers (parity-dashboard-inputs.ts / -goldens.ts / -matrix.ts)
// ---------------------------------------------------------------------------

describe('tallySurvey', () => {
  it('counts conformant/structural-match/diverged, ignoring other verdicts', () => {
    const rows = [
      { verdict: 'conformant' },
      { verdict: 'conformant' },
      { verdict: 'structural-match' },
      { verdict: 'diverged' },
      { verdict: 'errored' },
    ] as unknown as FixtureRow[];
    expect(tallySurvey(rows)).toEqual({ conformant: 2, structural: 1, diverged: 1 });
  });
});

describe('zeroDiffCount', () => {
  it('counts only ok fixtures in the "0" bucket', () => {
    const fixtures = [
      { slug: 'a', status: 'ok' as const, diffCount: 0, bucket: '0' as const },
      { slug: 'b', status: 'ok' as const, diffCount: 3, bucket: '1-3' as const },
      { slug: 'c', status: 'error' as const, diffCount: null, bucket: null },
    ];
    expect(zeroDiffCount(fixtures)).toBe(1);
  });
});

describe('registeredEngineTypes', () => {
  it('extracts the type from each registry.register(<name>Plugin) call, in order', () => {
    const src =
      'registry.register(sequencePlugin);\nregistry.register(classPlugin);\n// registry.register(fakePlugin) in a comment still matches textually';
    expect(registeredEngineTypes(src)).toEqual(['sequence', 'class', 'fake']);
  });

  it('returns an empty array when the source registers nothing', () => {
    expect(registeredEngineTypes('// no registrations here')).toEqual([]);
  });
});

describe('ratchetPinsOf', () => {
  it('filters by type when any fixture carries a type field (shared family)', () => {
    const fixtures = [
      { type: 'component', addedAt: '2026-07-10' },
      { type: 'usecase', addedAt: '2026-07-31' },
      { type: 'component', addedAt: '2026-07-15' },
    ];
    expect(ratchetPinsOf(fixtures, 'component')).toEqual({ count: 2, addedAt: '2026-07-15' });
  });

  it('uses every fixture when none carries a type field (single-type family)', () => {
    const fixtures = [{ addedAt: '2026-08-17' }, { addedAt: '2026-07-18' }];
    expect(ratchetPinsOf(fixtures, 'class')).toEqual({ count: 2, addedAt: '2026-08-17' });
  });

  it('reports a real zero for an empty family, not undefined count', () => {
    expect(ratchetPinsOf([], 'sequence')).toEqual({ count: 0, addedAt: undefined });
  });
});

describe('diffBaselineStatsOf', () => {
  it('sums weightedScore over status=baseline fixtures of the given type only', () => {
    const fixtures = [
      { type: 'activity', status: 'baseline', weightedScore: 51, measuredAt: '2026-09-10' },
      { type: 'activity', status: 'error', measuredAt: '2026-09-10' },
      { type: 'sequence', status: 'baseline', weightedScore: 999, measuredAt: '2026-09-19' },
    ];
    expect(diffBaselineStatsOf(fixtures, 'activity')).toEqual({ count: 1, sum: 51, measuredAt: '2026-09-10' });
  });

  it('falls back to diffCount when weightedScore is absent (svg-description schema)', () => {
    const fixtures = [{ type: 'component', status: 'baseline', diffCount: 28, measuredAt: '2026-09-03' }];
    expect(diffBaselineStatsOf(fixtures, 'component')).toEqual({ count: 1, sum: 28, measuredAt: '2026-09-03' });
  });
});

describe('groupBaselineByType', () => {
  it('tallies status counts per type, restricted to the dot-cache tree', () => {
    const fixtures = [
      { tree: 'dot-cache', type: 'class', status: 'agree', measuredAt: '2026-08-23' },
      { tree: 'dot-cache', type: 'class', status: 'agree', measuredAt: '2026-08-24' },
      { tree: 'dot-cache', type: 'class', status: 'jar-error', measuredAt: '2026-08-23' },
      { tree: 'goldens', type: 'svg-class', status: 'agree', measuredAt: '2026-09-01' },
    ];
    expect(groupBaselineByType(fixtures)).toEqual({
      class: { counts: { agree: 2, 'jar-error': 1 }, total: 3, measuredAt: '2026-08-24' },
    });
  });
});

describe('engineCell', () => {
  it('maps a bucket sharing its plugin type name straight through', () => {
    expect(engineCell('class', ['class', 'sequence'])).toBe('class');
  });

  it('maps component/usecase/c4 to description and packet to packetdiag', () => {
    expect(engineCell('component', [])).toBe('description');
    expect(engineCell('usecase', [])).toBe('description');
    expect(engineCell('c4', [])).toBe('description');
    expect(engineCell('packet', [])).toBe('packetdiag');
  });

  it('maps object to class (no separate object engine upstream)', () => {
    expect(engineCell('object', [])).toBe('class');
  });

  it('gives unknown the accounting-bucket reason regardless of the registry', () => {
    expect(engineCell('unknown', ['unknown'])).toBe('n/a (accounting bucket)');
  });

  it('throws for a bucket with neither a mapping nor a D-row id', () => {
    expect(() => engineCell('not-a-real-bucket', [])).toThrow(/no engine mapping and no D-row id/);
  });
});

// ---------------------------------------------------------------------------
// D9 drift gate — rebuild from disk twice, assert byte-equality with the
// committed report both times (determinism + no drift).
// ---------------------------------------------------------------------------

describe('D9 drift gate', () => {
  it('renderReport(buildReportModel(loadInputs())) matches the committed docs/parity-report.md, twice', () => {
    const committed = readFileSync(REPORT_PATH, 'utf-8');
    const first = renderReport(buildReportModel(loadInputs()));
    const second = renderReport(buildReportModel(loadInputs()));
    expect(first).toBe(committed);
    expect(second).toBe(committed);
  });
});
