/**
 * `docs/parity-report.md` dashboard — `oracle/goldens/**` loaders (ratchet
 * pins, diff-baseline, routing, refusal). Split from
 * `parity-dashboard-inputs.ts` purely to keep each file under the 500-line
 * complexity cap; both feed `parity-dashboard.ts#loadInputs` (D2: every
 * loader here reads a committed artifact, never renders or invokes the jar).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** `component`/`usecase` share `svg-description`; every other mapped type
 *  has its own family. Types absent from this map have no ratchet family at
 *  all (D8: `no ratchet yet`). */
export const RATCHET_FAMILY: Readonly<Record<string, string>> = {
  component: 'svg-description',
  usecase: 'svg-description',
  class: 'svg-class',
  object: 'svg-object',
  state: 'svg-state',
  sequence: 'svg-sequence',
  json: 'svg-json',
  yaml: 'svg-yaml',
  hcl: 'svg-hcl',
  dot: 'svg-dot',
  activity: 'svg-activity',
};

/** Subset of `RATCHET_FAMILY` whose family also carries a `diff-baseline.json`. */
export const DIFF_BASELINE_FAMILY: Readonly<Record<string, string>> = {
  component: 'svg-description',
  usecase: 'svg-description',
  activity: 'svg-activity',
  sequence: 'svg-sequence',
};

interface RatchetFixture {
  type?: string;
  addedAt?: string;
}

export interface RatchetSummary {
  count: number;
  addedAt: string | undefined;
}

/** Pure: pins for `type` within one family's fixtures. A family with no
 *  per-entry `type` field (every single-type family) uses every fixture;
 *  `svg-description` (the only shared family) filters by it. */
export function ratchetPinsOf(fixtures: readonly RatchetFixture[], type: string): RatchetSummary {
  const shared = fixtures.some((f) => f.type !== undefined);
  const filtered = shared ? fixtures.filter((f) => f.type === type) : fixtures;
  const dates = filtered.map((f) => f.addedAt).filter((d): d is string => d !== undefined);
  return { count: filtered.length, addedAt: dates.length > 0 ? dates.sort().at(-1) : undefined };
}

export function loadRatchetByType(goldensDir: string): Record<string, RatchetSummary> {
  const out: Record<string, RatchetSummary> = {};
  const familiesRead = new Map<string, RatchetFixture[]>();
  for (const [type, family] of Object.entries(RATCHET_FAMILY)) {
    if (!familiesRead.has(family)) {
      const p = join(goldensDir, family, 'ratchet.json');
      const parsed = JSON.parse(readFileSync(p, 'utf-8')) as { fixtures: RatchetFixture[] };
      familiesRead.set(family, parsed.fixtures);
    }
    out[type] = ratchetPinsOf(familiesRead.get(family)!, type);
  }
  return out;
}

interface DiffBaselineFixture {
  type?: string;
  status: string;
  weightedScore?: number;
  diffCount?: number | 'error' | null;
  measuredAt?: string;
}

export interface DiffBaselineSummary {
  count: number;
  sum: number;
  measuredAt: string | undefined;
}

/** Pure: baseline-status count and weighted-score sum for `type` within one
 *  family's fixtures. Falls back to `diffCount` when a family (e.g.
 *  svg-description) predates `weightedScore` (D5, plans/sequence-root-chrome). */
export function diffBaselineStatsOf(fixtures: readonly DiffBaselineFixture[], type: string): DiffBaselineSummary {
  const forType = fixtures.filter((f) => f.type === type);
  const baseline = forType.filter((f) => f.status === 'baseline');
  const sum = baseline.reduce(
    (acc, f) => acc + (f.weightedScore ?? (typeof f.diffCount === 'number' ? f.diffCount : 0)),
    0,
  );
  const dates = forType.map((f) => f.measuredAt).filter((d): d is string => d !== undefined);
  return { count: baseline.length, sum, measuredAt: dates.length > 0 ? dates.sort().at(-1) : undefined };
}

export function loadDiffBaselineByType(goldensDir: string): Record<string, DiffBaselineSummary> {
  const out: Record<string, DiffBaselineSummary> = {};
  const familiesRead = new Map<string, DiffBaselineFixture[]>();
  for (const [type, family] of Object.entries(DIFF_BASELINE_FAMILY)) {
    const p = join(goldensDir, family, 'diff-baseline.json');
    if (!existsSync(p)) continue;
    if (!familiesRead.has(family)) {
      const parsed = JSON.parse(readFileSync(p, 'utf-8')) as { fixtures: DiffBaselineFixture[] };
      familiesRead.set(family, parsed.fixtures);
    }
    out[type] = diffBaselineStatsOf(familiesRead.get(family)!, type);
  }
  return out;
}

interface BaselineFixture {
  tree: string;
  type: string;
  status: string;
  measuredAt?: string;
}

export interface GroupSummary {
  counts: Record<string, number>;
  total: number;
  measuredAt: string | undefined;
}

/** Pure: per-type status tally over ONLY the `dot-cache` tree entries — the
 *  same 11-type population the Oracle column measures (D6, routing-baseline
 *  and refusal-baseline also carry a `goldens` tree with unrelated types). */
export function groupBaselineByType(fixtures: readonly BaselineFixture[]): Record<string, GroupSummary> {
  const out: Record<string, GroupSummary> = {};
  for (const f of fixtures) {
    if (f.tree !== 'dot-cache') continue;
    const g = (out[f.type] ??= { counts: {}, total: 0, measuredAt: undefined });
    g.counts[f.status] = (g.counts[f.status] ?? 0) + 1;
    g.total++;
    if (f.measuredAt !== undefined && (g.measuredAt === undefined || f.measuredAt > g.measuredAt))
      g.measuredAt = f.measuredAt;
  }
  return out;
}

function loadBaselineFile(path: string): Record<string, GroupSummary> {
  const parsed = JSON.parse(readFileSync(path, 'utf-8')) as { fixtures: BaselineFixture[] };
  return groupBaselineByType(parsed.fixtures);
}

export function loadRoutingByType(svgConformanceDir: string): Record<string, GroupSummary> {
  return loadBaselineFile(join(svgConformanceDir, 'routing-baseline.json'));
}

export function loadRefusalByType(svgConformanceDir: string): Record<string, GroupSummary> {
  return loadBaselineFile(join(svgConformanceDir, 'refusal-baseline.json'));
}
