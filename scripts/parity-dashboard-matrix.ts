/**
 * `docs/parity-report.md` dashboard — pure matrix/freshness column logic
 * (mission parity-dashboard-refresh, T6). Split from `parity-dashboard.ts`
 * to keep that file's `renderReport`/CLI under the complexity cap.
 *
 * D8 (plans/parity-dashboard-refresh/decisions.md): every `n/a` cell carries
 * a parenthetical reason from a fixed vocabulary. Two words are new here,
 * beyond the ones D8 lists verbatim — reported in the mission handback:
 * `no data-diagram-type classification` (already named by the T6 amendment,
 * item 4) and `no diff-baseline yet` (this file — no vocabulary word covered
 * "the family exists but has no diff-baseline.json", or "no family at all").
 */
import type { TypeRow } from './dot-parity-rows.js';
import type { SurveySummary, CensusSummary } from './parity-dashboard-inputs.js';
import type { RatchetSummary, DiffBaselineSummary, GroupSummary } from './parity-dashboard-goldens.js';

// ---------------------------------------------------------------------------
// Engine column (D7 row universe; D-row ids per planning/mission-index.md)
// ---------------------------------------------------------------------------

/** Buckets whose plugin `type` differs from the bucket name, or has no
 *  plugin at all despite being covered by an existing engine (`object` —
 *  no separate object engine upstream, `dot-parity-rows.ts#EXPECTED_TAG`). */
const ENGINE_OVERRIDE: Readonly<Record<string, string>> = {
  component: 'description',
  usecase: 'description',
  c4: 'description',
  packet: 'packetdiag',
  object: 'class',
};

/** planning/mission-index.md Phase D rows for the 10 buckets with no engine
 *  at all yet. `unknown` is handled separately (accounting bucket, not a
 *  todo) and is deliberately absent from this map. */
const NO_ENGINE_D_ID: Readonly<Record<string, string>> = {
  timing: 'D1',
  mindmap: 'D2',
  wbs: 'D3',
  gantt: 'D4',
  network: 'D5',
  salt: 'D7',
  ditaa: 'D8',
  ebnf: 'D10',
  regex: 'D11',
  wire: 'D12',
};

/** Pure: which engine (if any) owns `bucket`. Throws rather than emitting a
 *  bare `n/a` (D8: "a bare n/a is a generator failure") when a bucket has
 *  neither a mapping nor a D-row id — that is this module falling out of
 *  sync with the 28-bucket corpus, not a legitimate "not yet measured". */
export function engineCell(bucket: string, registeredEngines: readonly string[]): string {
  if (bucket === 'unknown') return 'n/a (accounting bucket)';
  const override = ENGINE_OVERRIDE[bucket];
  if (override !== undefined) return override;
  if (registeredEngines.includes(bucket)) return bucket;
  const dId = NO_ENGINE_D_ID[bucket];
  if (dId !== undefined) return `n/a (no engine (${dId} todo))`;
  throw new Error(`parity-dashboard: bucket "${bucket}" has no engine mapping and no D-row id`);
}

// ---------------------------------------------------------------------------
// One column result: the rendered cell, plus the freshness date it carries
// (undefined for an n/a cell — there is nothing to date).
// ---------------------------------------------------------------------------

export interface ColumnResult {
  cell: string;
  freshness: string | undefined;
}

const NOT_STARTED = (cell: string): ColumnResult => ({ cell, freshness: undefined });

export function oracleColumn(bucket: string, oracleCounts: Readonly<Record<string, number>>): ColumnResult {
  const n = oracleCounts[bucket];
  return n === undefined ? NOT_STARTED('n/a (no oracle captured)') : NOT_STARTED(String(n));
}

const DOT_NOTE_MAP: Readonly<Record<string, string>> = {
  'n/a (no DOT stage)': 'n/a (no DOT stage (non-svek))',
  'no oracle captured': 'n/a (no oracle captured)',
  'no data-diagram-type classification': 'n/a (no data-diagram-type classification)',
};

export function dotColumn(row: TypeRow | undefined, generatedAt: string): ColumnResult {
  if (row === undefined) return NOT_STARTED('n/a (no oracle captured)');
  if (row.note === '—') return { cell: `${row.equal}/${row.comparable} (${row.pct})`, freshness: generatedAt };
  const mapped = DOT_NOTE_MAP[row.note];
  if (mapped === undefined)
    throw new Error(`parity-dashboard: unmapped dot-parity note "${row.note}" (type ${row.type})`);
  return NOT_STARTED(mapped);
}

export function surveyColumn(s: SurveySummary | undefined): ColumnResult {
  if (s === undefined) return NOT_STARTED('n/a (no survey yet)');
  return { cell: `${s.conformant} / ${s.structural} / ${s.diverged}`, freshness: s.generatedAt };
}

export function censusColumn(s: CensusSummary | undefined): ColumnResult {
  if (s === undefined) return NOT_STARTED('n/a (no census yet)');
  return { cell: String(s.zeroDiff), freshness: s.generatedAt };
}

export function ratchetColumn(s: RatchetSummary | undefined): ColumnResult {
  if (s === undefined) return NOT_STARTED('n/a (no ratchet yet)');
  return { cell: String(s.count), freshness: s.addedAt };
}

export function diffBaselineColumn(s: DiffBaselineSummary | undefined): ColumnResult {
  if (s === undefined) return NOT_STARTED('n/a (no diff-baseline yet)');
  return { cell: `${s.count} · ${s.sum}`, freshness: s.measuredAt };
}

function groupColumn(s: GroupSummary | undefined, statusKey: string): ColumnResult {
  if (s === undefined) return NOT_STARTED('n/a (no oracle captured)');
  return { cell: `${s.counts[statusKey] ?? 0}/${s.total}`, freshness: s.measuredAt };
}

export function routingColumn(s: GroupSummary | undefined): ColumnResult {
  return groupColumn(s, 'agree');
}

export function refusalColumn(s: GroupSummary | undefined): ColumnResult {
  return groupColumn(s, 'ok');
}
