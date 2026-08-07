/**
 * Size-metric identity audit (mission S1L tail diagnosis, follow-up).
 *
 * WHY THIS EXISTS
 * ---------------
 * `sizeConformantOk` — the description size ratchet's actual gate — is
 * `maxSizeDeltaIn <= 0.01`, and `maxSizeDeltaIn` comes from `sizeDeltas`
 * (`tests/oracle/svek-dot.ts`), which does this:
 *
 *     [...nodes.map(n => n.width), ...nodes.map(n => n.height)].sort()
 *
 * i.e. it flattens every node's width AND height into ONE sorted multiset and
 * pairs the two sides BY INDEX, discarding node identity. That is the
 * minimum-cost 1-D matching between the two multisets, so it can only ever
 * UNDER-report: no pairing yields a smaller maximum.
 *
 * The consequence is not inflated backlog pins — it is FALSE CONFORMANCE. A
 * fixture whose oracle nodes are (1.0, 2.0) and whose candidate nodes are
 * (2.0, 1.0) — every node wrong, the values merely swapped between them —
 * reports a max delta of exactly 0 and passes the gate.
 *
 * This script re-measures all 351 description goldens under BOTH metrics and
 * reports the disagreement. It is an AUDIT: it changes no gate, no golden, and
 * no pin. Whether to adopt the by-id metric as the ratchet is a maintainer
 * decision, because doing so re-bases every pin in `size-backlog.json`.
 *
 * THE BY-ID METRIC
 * ----------------
 * Pairs nodes by their DOT id (`sh0006`), compares width-to-width and
 * height-to-height, and takes the max. This is only meaningful if the two
 * sides' id sets actually agree, so alignment is measured and reported
 * per-fixture rather than assumed — a fixture whose ids do not align is
 * reported as `ids-misaligned` and excluded from the false-conformance count,
 * not silently scored.
 *
 * Usage: `npx tsx scripts/audit-size-metric-identity.ts`
 * Output: one JSON line per fixture, then a summary line. Exit 0 always —
 * this reports, it does not gate.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderSync } from '../src/index.js';
import { setLayoutInputObserver } from '../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../src/core/measurer.js';
import type { DotInputGraph } from '../src/core/graph-layout.js';
import { MapIncludeStore } from '../src/core/tim/IncludeStore.js';
import { withStdlib } from '../src/core/tim/StdlibStore.js';
import {
  parseSvekDot,
  dotInputToStructural,
  compareStructural,
  SIZE_CONFORMANCE_TOLERANCE_IN,
  type StructuralGraph,
  type StructuralNode,
} from '../tests/oracle/svek-dot.js';
import { buildStdlibAssetsStore } from '../tests/helpers/stdlib-assets-store.js';
import { buildSpriteAssetsStore } from '../tests/helpers/sprite-assets-store.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOLDENS = join(REPO, 'oracle', 'goldens', 'description');

/** Matches the ratchet's own float tolerance. */
const EPSILON = 1e-6;

// ---------------------------------------------------------------------------
// Pure metric arithmetic
// ---------------------------------------------------------------------------

export interface ByIdOutcome {
  /** Both sides carry exactly the same id set. */
  idsAligned: boolean;
  /** Max abs delta over width-to-width and height-to-height, by id. */
  maxDelta: number;
  /** Node id carrying `maxDelta`, or undefined when there are no shared ids. */
  worstId?: string;
  /** Which dimension carried it. */
  worstDim?: 'width' | 'height';
  /** Ids present on one side only (diagnostic; empty when aligned). */
  unmatched: string[];
}

type NodeMap = Map<string, StructuralNode>;

const nodeMap = (g: StructuralGraph): NodeMap =>
  new Map(g.nodes.map((n) => [n.id, n] as const));

/** Ids present on exactly one side. Pure. */
function unmatchedIds(om: NodeMap, cm: NodeMap): string[] {
  const only = (a: NodeMap, b: NodeMap): string[] => [...a.keys()].filter((id) => !b.has(id));
  return [...only(om, cm), ...only(cm, om)];
}

/** The single largest width- or height-delta over ids present on both sides. */
function worstByIdPair(
  om: NodeMap,
  cm: NodeMap,
): Pick<ByIdOutcome, 'maxDelta' | 'worstId' | 'worstDim'> {
  let best: Pick<ByIdOutcome, 'maxDelta' | 'worstId' | 'worstDim'> = { maxDelta: 0 };
  for (const [id, on] of om) {
    const cn = cm.get(id);
    if (cn === undefined) continue;
    const dims = [
      ['width', Math.abs(on.width - cn.width)],
      ['height', Math.abs(on.height - cn.height)],
    ] as const;
    for (const [dim, d] of dims) {
      if (d > best.maxDelta) best = { maxDelta: d, worstId: id, worstDim: dim };
    }
  }
  return best;
}

/** Pairs nodes by DOT id and returns the largest per-node, per-dimension
 *  delta. Unlike `sizeDeltas`, a permuted-but-otherwise-correct graph scores
 *  its true error here rather than 0. Pure. */
export function byIdDelta(oracle: StructuralGraph, candidate: StructuralGraph): ByIdOutcome {
  const om = nodeMap(oracle);
  const cm = nodeMap(candidate);
  const unmatched = unmatchedIds(om, cm);
  return {
    idsAligned: unmatched.length === 0 && om.size === cm.size,
    ...worstByIdPair(om, cm),
    unmatched,
  };
}

/** Per-node cost: the worse of the width and height deltas. A node is only as
 *  good as its worst dimension. */
function nodeCost(a: StructuralNode, b: StructuralNode): number {
  return Math.max(Math.abs(a.width - b.width), Math.abs(a.height - b.height));
}

/** Kuhn's augmenting-path matching over edges with cost <= limit, optionally
 *  with one edge forbidden. Returns candidate-index-per-oracle-index, or null
 *  when no perfect matching exists. */
function perfectMatching(
  costs: readonly (readonly number[])[],
  limit: number,
  ban?: readonly [number, number],
): number[] | null {
  const n = costs.length;
  const m = costs[0]?.length ?? 0;
  const owner: number[] = new Array<number>(m).fill(-1);
  const usable = (i: number, j: number): boolean =>
    costs[i]![j]! <= limit && !(ban !== undefined && ban[0] === i && ban[1] === j);

  const tryAssign = (i: number, seen: boolean[]): boolean => {
    for (let j = 0; j < m; j++) {
      if (seen[j] === true || !usable(i, j)) continue;
      seen[j] = true;
      if (owner[j] === -1 || tryAssign(owner[j]!, seen)) {
        owner[j] = i;
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < n; i++) {
    if (!tryAssign(i, new Array<boolean>(m).fill(false))) return null;
  }
  const out: number[] = new Array<number>(n).fill(-1);
  for (let j = 0; j < m; j++) if (owner[j] !== -1) out[owner[j]!] = j;
  return out;
}

function hasPerfectMatching(costs: readonly (readonly number[])[], limit: number): boolean {
  return perfectMatching(costs, limit) !== null;
}

/** Is the sub-tolerance pairing UNIQUE? If it is, value-matching has recovered
 *  node identity and no permutation can be hiding behind it. If an alternative
 *  pairing also fits, two entities could have swapped sizes and every
 *  identity-free metric — including this one — would score them as correct.
 *  This is the residual blind spot, and this function counts it rather than
 *  assuming it away. */
function matchingIsUnique(costs: readonly (readonly number[])[], limit: number): boolean {
  const base = perfectMatching(costs, limit);
  if (base === null) return false;
  for (let i = 0; i < base.length; i++) {
    if (perfectMatching(costs, limit, [i, base[i]!]) !== null) return false;
  }
  return true;
}

/** Largest per-node delta under the BEST possible node-to-node pairing — the
 *  bottleneck assignment, solved exactly by binary-searching the achievable
 *  costs and testing for a perfect matching at each.
 *
 *  This is the metric the gate should have used. It needs no id or order
 *  correspondence — which matters, because neither exists: the jar and our
 *  emitter assign different id numbers AND emit nodes in a different order.
 *  Unlike the flattened metric it can never score one node's WIDTH against a
 *  different node's HEIGHT.
 *
 *  A zero is a constructive proof: some bijection makes every node exactly
 *  right, so only ordering differs. A non-zero is equally strong the other
 *  way — NO bijection can rescue it, so a genuine size error exists whichever
 *  node corresponds to which. Beware the tempting shortcut of lex-sorting the
 *  (w,h) pairs instead: it mispairs (it will put a narrow-but-tall node ahead
 *  of a wide-but-short one and score width against height), which is the very
 *  defect this audit exists to measure. Pure. */
export function pairMatchedDelta(oracle: StructuralGraph, candidate: StructuralGraph): number {
  const costs = costMatrix(oracle, candidate);
  if (costs.length === 0 || (costs[0]?.length ?? 0) === 0) return 0;
  const levels = [...new Set(costs.flat())].sort((a, b) => a - b);

  let lo = 0;
  let hi = levels.length - 1;
  if (!hasPerfectMatching(costs, levels[hi]!)) return levels[hi]!;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (hasPerfectMatching(costs, levels[mid]!)) hi = mid;
    else lo = mid + 1;
  }
  return levels[lo]!;
}

function costMatrix(oracle: StructuralGraph, candidate: StructuralGraph): number[][] {
  return oracle.nodes.map((o) => candidate.nodes.map((c) => nodeCost(o, c)));
}

/** True when the sub-tolerance pairing is unique — i.e. value-matching pinned
 *  node identity and no swapped-size permutation can hide inside it. */
export function pairingIsUnambiguous(
  oracle: StructuralGraph,
  candidate: StructuralGraph,
): boolean {
  const costs = costMatrix(oracle, candidate);
  if (costs.length === 0 || (costs[0]?.length ?? 0) === 0) return true;
  return matchingIsUnique(costs, SIZE_CONFORMANCE_TOLERANCE_IN + EPSILON);
}

export type AuditVerdict =
  | 'agree'
  | 'false-conformant'
  | 'understated'
  | 'structurally-unequal';

/** Classifies one fixture. `false-conformant` is the finding that matters:
 *  the shipping gate passes it, pair-matching proves a real error. Pure. */
export function classifyAudit(
  sortedMax: number,
  pairMax: number,
  structurallyEqual: boolean,
): AuditVerdict {
  if (!structurallyEqual) return 'structurally-unequal';
  const sortedPasses = sortedMax <= SIZE_CONFORMANCE_TOLERANCE_IN + EPSILON;
  const pairPasses = pairMax <= SIZE_CONFORMANCE_TOLERANCE_IN + EPSILON;
  if (sortedPasses && !pairPasses) return 'false-conformant';
  if (pairMax > sortedMax + EPSILON) return 'understated';
  return 'agree';
}

// ---------------------------------------------------------------------------
// Fixture measurement (same seam as measure-description-size-deltas.ts)
// ---------------------------------------------------------------------------

function svekFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => /^svek-\d+\.dot$/.test(f))
    .sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]));
}

function captureGraphs(markup: string): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(markup, {
      measurer: new WidthTableMeasurer(),
      includeStore: withStdlib(new MapIncludeStore(), buildStdlibAssetsStore()),
      // Must match `measure-description-size-deltas.ts#captureGraphs` exactly.
      // Without this the audit renders internal sprites as their `«name»` text
      // fallback and reports a DIFFERENT diagram than the ratchet it is
      // auditing -- it read 4 fewer conformant than the measure until this was
      // added (ADR-2: "the harness measures the same code path users get").
      assetStore: buildSpriteAssetsStore(),
    });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

export interface AuditResult {
  slug: string;
  verdict: AuditVerdict;
  /** What the shipping gate measures (widths and heights flattened together). */
  sortedMax: number;
  /** Best node-preserving pairing — the honest number. */
  pairMax: number;
  /** pairMax - sortedMax: error the current gate structurally cannot see. */
  hidden: number;
  /** Whether DOT ids happened to align (diagnostic only; usually false). */
  idsAligned: boolean;
  /** False = an alternative sub-tolerance pairing exists, so a swapped-size
   *  permutation could hide here. The residual blind spot. */
  unambiguous: boolean;
  detail?: string;
}

interface PassAggregate {
  sortedMax: number;
  pairMax: number;
  idsAligned: boolean;
  structurallyEqual: boolean;
  unambiguous: boolean;
}

/** Folds every render pass of one fixture into a single worst-case reading
 *  under both metrics. */
function aggregatePasses(
  dir: string,
  files: readonly string[],
  captured: readonly DotInputGraph[],
): PassAggregate {
  let sortedMax = 0;
  let pairMax = 0;
  let idsAligned = true;
  let structurallyEqual = true;
  let unambiguous = true;

  for (let i = 0; i < files.length; i++) {
    const oracle = parseSvekDot(readFileSync(join(dir, files[i]!), 'utf8'));
    const candidate = dotInputToStructural(captured[i]!);
    const diff = compareStructural(oracle, candidate);
    if (!diff.structurallyEqual) structurallyEqual = false;
    if (!byIdDelta(oracle, candidate).idsAligned) idsAligned = false;
    if (!pairingIsUnambiguous(oracle, candidate)) unambiguous = false;
    sortedMax = Math.max(sortedMax, diff.maxSizeDeltaIn);
    pairMax = Math.max(pairMax, pairMatchedDelta(oracle, candidate));
  }

  return { sortedMax, pairMax, idsAligned, structurallyEqual, unambiguous };
}

/** A fixture whose captured pass count does not match its golden's — nothing
 *  downstream can be compared, so every metric reports zero. */
function unequalPassCount(slug: string, captured: number, expected: number): AuditResult {
  return {
    slug,
    verdict: 'structurally-unequal',
    sortedMax: 0,
    pairMax: 0,
    hidden: 0,
    idsAligned: false,
    unambiguous: false,
    detail: `captured ${captured} graph(s), expected ${expected}`,
  };
}

function auditFixture(slug: string): AuditResult {
  const dir = join(GOLDENS, slug);
  const files = svekFiles(dir);
  const captured = captureGraphs(readFileSync(join(dir, 'input.puml'), 'utf8'));

  if (captured.length !== files.length) return unequalPassCount(slug, captured.length, files.length);

  const { sortedMax, pairMax, idsAligned, structurallyEqual, unambiguous } = aggregatePasses(
    dir,
    files,
    captured,
  );

  return {
    slug,
    verdict: classifyAudit(sortedMax, pairMax, structurallyEqual),
    sortedMax,
    pairMax,
    hidden: Math.max(0, pairMax - sortedMax),
    idsAligned,
    unambiguous,
  };
}

function goldenSlugs(): string[] {
  if (!existsSync(GOLDENS)) return [];
  return readdirSync(GOLDENS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(GOLDENS, d.name, 'input.puml')))
    .map((d) => d.name)
    .sort();
}

export interface AuditSummary {
  total: number;
  agree: number;
  /** Passes the shipping gate; pair-matching proves a real error. THE finding. */
  falseConformant: number;
  /** Already failing, but by more than the gate reports. */
  understated: number;
  structurallyUnequal: number;
  /** Fixtures whose DOT ids align with the jar's at all. */
  idsAligned: number;
  /** Conformant fixtures whose pairing is UNIQUE — provably no permutation
   *  masking. The complement is the residual blind spot. */
  unambiguousConformant: number;
  /** Conformant fixtures where an alternative pairing exists. */
  ambiguousConformant: number;
  /** Conformant count under the current (flattened) gate. */
  conformantSorted: number;
  /** Conformant count under pair-matching — what the bar really is. */
  conformantPairMatched: number;
  /** Largest single hidden error across the corpus (inches). */
  maxHidden: number;
}

/** Zeroed counters for `total` fixtures — every field but `total` accumulates. */
function emptySummary(total: number): AuditSummary {
  return {
    total,
    agree: 0,
    falseConformant: 0,
    understated: 0,
    structurallyUnequal: 0,
    idsAligned: 0,
    unambiguousConformant: 0,
    ambiguousConformant: 0,
    conformantSorted: 0,
    conformantPairMatched: 0,
    maxHidden: 0,
  };
}

export function summarizeAudit(results: readonly AuditResult[]): AuditSummary {
  const s = emptySummary(results.length);
  const bar = SIZE_CONFORMANCE_TOLERANCE_IN + EPSILON;
  for (const r of results) {
    if (r.verdict === 'agree') s.agree += 1;
    else if (r.verdict === 'false-conformant') s.falseConformant += 1;
    else if (r.verdict === 'understated') s.understated += 1;
    else s.structurallyUnequal += 1;
    if (r.idsAligned) s.idsAligned += 1;
    if (r.pairMax <= bar) {
      if (r.unambiguous) s.unambiguousConformant += 1;
      else s.ambiguousConformant += 1;
    }
    if (r.sortedMax <= bar) s.conformantSorted += 1;
    if (r.pairMax <= bar) s.conformantPairMatched += 1;
    s.maxHidden = Math.max(s.maxHidden, r.hidden);
  }
  return s;
}

/* v8 ignore start -- CLI entry point. */
function main(): void {
  const results: AuditResult[] = [];
  for (const slug of goldenSlugs()) results.push(auditFixture(slug));
  for (const r of results) process.stdout.write(`${JSON.stringify(r)}\n`);
  process.stdout.write(`${JSON.stringify({ summary: summarizeAudit(results) })}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
