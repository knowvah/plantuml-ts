/**
 * The committed pin generator for the routing/refusal conformance gates
 * (D5, `plans/unknown-bucket-routing-repair/decisions.md`).
 *
 * ```
 * npx jiti scripts/pin-corpus-tree.ts <type> --tree <dir> --ledger <dir> [--dry]
 * ```
 *
 * Measures every `<tree>/<slug>/{in.puml,in.svg}` fixture through the same
 * seams `tests/oracle/svg-conformance/routing-conformance.test.ts` and
 * `refusal-coverage.test.ts` use (`scripts/pin-corpus-tree-measure.ts`),
 * joins the result against a ledger of adjudication rows (D4: one JSON
 * fragment per task, under `--ledger`, merged by slug), and appends one row
 * per fixture to BOTH
 * `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`.
 *
 * ORCHESTRATOR-ONLY, like `repin-activity-baselines.ts` and
 * `repin-sequence-baselines.ts`: a task agent never writes a baseline JSON
 * directly, and this tool REFUSES rather than writing a defect it cannot
 * excuse -- see `runPinCorpusTree`'s three refusal checks below. This is the
 * third mission to write this measurement as scratch (D5); it is committed
 * so the fourth does not.
 *
 * NOTE ON LEDGER SEMANTICS (mission brief): a fixture that is BOTH
 * misrouted and errors needs an excuse for both baselines. One ledger row
 * per slug covers both -- its `reason`, if present and not `fixed`, is used
 * for a `known-misroute` routing row AND a `known-gap` refusal row alike,
 * regardless of which of the two the row's own `disposition` names. A
 * `disposition: "fixed"` row's `reason` is never consulted: `fixed` asserts
 * the fixture now measures clean, so if the measurement still disagrees the
 * row is stale, not an excuse -- the fixture is treated exactly as if no
 * ledger row existed (unpinned in `--dry`, a refusal otherwise).
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { measureTree, type MeasuredFixture } from './pin-corpus-tree-measure.js';
import { assertJsonObjectShape } from './lib/assert-json-shape.js';

const DEFAULT_LEDGER_DIR = 'tests/oracle/svg-conformance/unknown-ledger';
const ROUTING_BASELINE_PATH = 'oracle/goldens/svg-conformance/routing-baseline.json';
const REFUSAL_BASELINE_PATH = 'oracle/goldens/svg-conformance/refusal-baseline.json';
/** D4: every excuse must name the upstream mechanism with a `File.java:line`. */
const REASON_RE = /\w+\.java:\d+/;

// ---------------------------------------------------------------------------
// Ledger -- D4's per-task fragments, merged by slug.
// ---------------------------------------------------------------------------

export type Disposition = 'agree' | 'jar-error' | 'known-misroute' | 'known-gap' | 'fix-candidate' | 'fixed';

export interface LedgerRow {
  readonly slug: string;
  readonly cohort: string;
  readonly disposition: Disposition;
  readonly reason?: string;
  readonly seam?: string;
  readonly command?: string;
  readonly size?: number;
  readonly task: string;
}

interface LedgerFragment {
  readonly rows: readonly LedgerRow[];
}

/** Merges every `<ledgerDir>/*.json` fragment by slug. A directory that does
 *  not exist yet -- a task that writes ledger rows can land in a parallel
 *  worktree before this one -- reads as zero rows, never an error: the tool
 *  must be runnable in `--dry` before that worktree merges. A slug present
 *  in two fragments is a data-integrity error (D4) and throws immediately. */
export function loadLedger(ledgerDir: string): Map<string, LedgerRow> {
  const out = new Map<string, LedgerRow>();
  if (!existsSync(ledgerDir)) return out;
  const files = readdirSync(ledgerDir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  for (const file of files) {
    const fragmentPath = join(ledgerDir, file);
    const parsedFragment: unknown = JSON.parse(readFileSync(fragmentPath, 'utf8'));
    assertJsonObjectShape(parsedFragment, fragmentPath, ['rows']);
    const fragment = parsedFragment as LedgerFragment;
    for (const row of fragment.rows) {
      if (out.has(row.slug)) {
        throw new Error(`pin-corpus-tree: ledger slug "${row.slug}" appears in two fragments (one is ${file})`);
      }
      out.set(row.slug, row);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pure derivation -- deriveRow, checkAdditive.
// ---------------------------------------------------------------------------

export type RoutingStatus = 'agree' | 'known-misroute' | 'jar-error';
export type RefusalCohort = 'jar-error' | 'ok' | 'known-gap';

export interface RoutingDerived {
  readonly status: RoutingStatus;
  readonly needsReason: boolean;
  readonly reason?: string;
}

export interface RefusalDerived {
  readonly status: 'ok' | 'known-gap';
  readonly cohort: RefusalCohort;
  readonly needsReason: boolean;
  readonly reason?: string;
}

export interface DerivedRow {
  readonly routing: RoutingDerived;
  readonly refusal: RefusalDerived;
}

/** The one reason a ledger row carries, usable for either baseline (see the
 *  module header's "Note on ledger semantics"). `undefined` when there is no
 *  row, or the row is a stale `fixed` pin. */
function ledgerReason(ledgerRow: LedgerRow | undefined): string | undefined {
  if (ledgerRow === undefined || ledgerRow.disposition === 'fixed') return undefined;
  return ledgerRow.reason;
}

function deriveRouting(m: MeasuredFixture, ledgerRow: LedgerRow | undefined): RoutingDerived {
  if (m.jarErrored) return { status: 'jar-error', needsReason: false };
  if (m.jarType === m.ourType) return { status: 'agree', needsReason: false };
  const reason = ledgerReason(ledgerRow);
  return reason === undefined
    ? { status: 'known-misroute', needsReason: true }
    : { status: 'known-misroute', needsReason: true, reason };
}

function deriveRefusal(m: MeasuredFixture, ledgerRow: LedgerRow | undefined): RefusalDerived {
  if (!m.jarRendered) return { status: 'ok', cohort: 'jar-error', needsReason: false };
  if (!m.weErrored) return { status: 'ok', cohort: 'ok', needsReason: false };
  const reason = ledgerReason(ledgerRow);
  return reason === undefined
    ? { status: 'known-gap', cohort: 'known-gap', needsReason: true }
    : { status: 'known-gap', cohort: 'known-gap', needsReason: true, reason };
}

/** Derives a fixture's routing and refusal disposition from its measurement
 *  and (if any) its ledger row. Pure: the measurement loop that produces
 *  `measured` and the filesystem lookup that produces `ledgerRow` both stay
 *  outside this function. */
export function deriveRow(measured: MeasuredFixture, ledgerRow: LedgerRow | undefined): DerivedRow {
  return { routing: deriveRouting(measured, ledgerRow), refusal: deriveRefusal(measured, ledgerRow) };
}

export interface AdditiveCheck {
  readonly ok: boolean;
  readonly message?: string;
}

/** A written baseline must be a strict, byte-identical prefix extension of
 *  what was already there (D5: "REFUSES to write unless every pre-existing
 *  row is byte-identical"). Rows are compared by `JSON.stringify` rather
 *  than reference so a row rebuilt with identical values still counts as
 *  unchanged, while a single mutated field is caught. */
export function checkAdditive(before: readonly unknown[], after: readonly unknown[]): AdditiveCheck {
  if (after.length < before.length) {
    return { ok: false, message: `baseline would shrink from ${before.length} to ${after.length} rows` };
  }
  for (let i = 0; i < before.length; i++) {
    const was = JSON.stringify(before[i]);
    const now = JSON.stringify(after[i]);
    if (now !== was) return { ok: false, message: `pre-existing row ${i} would change:\n  was: ${was}\n  now: ${now}` };
  }
  return { ok: true };
}

function isBlocked(d: DerivedRow): boolean {
  return (
    (d.routing.needsReason && d.routing.reason === undefined) ||
    (d.refusal.needsReason && d.refusal.reason === undefined)
  );
}

// ---------------------------------------------------------------------------
// Baseline row shapes -- exact key order of the existing committed files.
// ---------------------------------------------------------------------------

export interface RoutingBaselineRow {
  readonly tree: 'dot-cache';
  readonly type: string;
  readonly slug: string;
  readonly jarType: string;
  readonly jarErrored?: boolean;
  readonly ourType: string;
  readonly status: RoutingStatus;
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
  readonly reason?: string;
}

export interface RefusalBaselineRow {
  readonly tree: 'dot-cache';
  readonly type: string;
  readonly slug: string;
  readonly jarRendered: boolean;
  readonly weErrored: boolean;
  readonly engine: string;
  readonly status: 'ok' | 'known-gap';
  readonly measuredAt: string;
  readonly measuredAgainstCommit: string;
  readonly reason?: string;
}

function buildRoutingRow(
  type: string,
  m: MeasuredFixture,
  d: RoutingDerived,
  today: string,
  commit: string,
): RoutingBaselineRow {
  const withType = { tree: 'dot-cache' as const, type, slug: m.slug, jarType: m.jarType };
  const withErrored = d.status === 'jar-error' ? { ...withType, jarErrored: true as const } : withType;
  const withRest = {
    ...withErrored,
    ourType: m.ourType,
    status: d.status,
    measuredAt: today,
    measuredAgainstCommit: commit,
  };
  return d.reason === undefined ? withRest : { ...withRest, reason: d.reason };
}

function buildRefusalRow(
  type: string,
  m: MeasuredFixture,
  d: RefusalDerived,
  today: string,
  commit: string,
): RefusalBaselineRow {
  const base = {
    tree: 'dot-cache' as const,
    type,
    slug: m.slug,
    jarRendered: m.jarRendered,
    weErrored: m.weErrored,
    engine: m.engine,
    status: d.status,
    measuredAt: today,
    measuredAgainstCommit: commit,
  };
  return d.reason === undefined ? base : { ...base, reason: d.reason };
}

// ---------------------------------------------------------------------------
// Tally -- --dry's output, and the number this tool's smoke check reports.
// ---------------------------------------------------------------------------

export interface TallyEntry {
  readonly cohort: string;
  readonly routing: RoutingStatus;
  readonly refusal: RefusalCohort;
  readonly count: number;
}

export interface Tally {
  readonly entries: readonly TallyEntry[];
  /** Measured defects whose ledger row is `fix-candidate`: batch 2's work queue, not a pin. */
  readonly fixCandidates: number;
  /** Measured defects with no usable ledger row (absent, reason-less, or a stale `fixed`). */
  readonly unpinned: number;
}

const TALLY_KEY_SEP = '\u0000';

export function computeTally(
  measured: readonly MeasuredFixture[],
  ledger: ReadonlyMap<string, LedgerRow>,
  derived: ReadonlyMap<string, DerivedRow>,
): Tally {
  const counts = new Map<string, number>();
  let unpinned = 0;
  let fixCandidates = 0;
  for (const m of measured) {
    const ledgerRow = ledger.get(m.slug);
    const d = derived.get(m.slug);
    if (d === undefined) continue;
    if (ledgerRow?.disposition === 'fix-candidate') {
      fixCandidates++;
      continue;
    }
    if (isBlocked(d)) {
      unpinned++;
      continue;
    }
    const cohort = ledgerRow?.cohort ?? '(no ledger row)';
    const key = [cohort, d.routing.status, d.refusal.cohort].join(TALLY_KEY_SEP);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const entries = [...counts.entries()]
    .map(([key, count]) => {
      const [cohort, routing, refusal] = key.split(TALLY_KEY_SEP) as [string, RoutingStatus, RefusalCohort];
      return { cohort, routing, refusal, count };
    })
    .sort(
      (a, b) =>
        a.cohort.localeCompare(b.cohort) || a.routing.localeCompare(b.routing) || a.refusal.localeCompare(b.refusal),
    );
  return { entries, fixCandidates, unpinned };
}

// ---------------------------------------------------------------------------
// Orchestration -- runPinCorpusTree is the whole tool, minus argv/CLI glue.
// ---------------------------------------------------------------------------

export interface PinOptions {
  readonly type: string;
  readonly treeDir: string;
  readonly ledgerDir: string;
  readonly dry: boolean;
  readonly routingBaselinePath: string;
  readonly refusalBaselinePath: string;
  readonly today: string;
  readonly commit: string;
}

export interface PinResult {
  readonly tally: Tally;
  readonly total: number;
  readonly wrote: boolean;
}

function deriveAll(
  measured: readonly MeasuredFixture[],
  ledger: ReadonlyMap<string, LedgerRow>,
): Map<string, DerivedRow> {
  return new Map(measured.map((m) => [m.slug, deriveRow(m, ledger.get(m.slug))]));
}

function findMalformedReason(
  measured: readonly MeasuredFixture[],
  derived: ReadonlyMap<string, DerivedRow>,
): string | undefined {
  for (const m of measured) {
    const d = derived.get(m.slug);
    const reasons = [d?.routing.reason, d?.refusal.reason];
    if (reasons.some((r) => r !== undefined && !REASON_RE.test(r))) return m.slug;
  }
  return undefined;
}

function findBlockedSlug(
  measured: readonly MeasuredFixture[],
  ledger: ReadonlyMap<string, LedgerRow>,
  derived: ReadonlyMap<string, DerivedRow>,
): string | undefined {
  for (const m of measured) {
    const ledgerRow = ledger.get(m.slug);
    const d = derived.get(m.slug);
    if (ledgerRow?.disposition === 'fix-candidate') return m.slug;
    if (d !== undefined && isBlocked(d)) return m.slug;
  }
  return undefined;
}

interface BaselineFile<Row> {
  readonly $comment: string;
  readonly fixtures: readonly Row[];
}

function appendAndWrite<Row>(path: string, newRows: readonly Row[], commentSuffix: string): void {
  const parsedExisting: unknown = JSON.parse(readFileSync(path, 'utf8'));
  assertJsonObjectShape(parsedExisting, path, ['$comment', 'fixtures']);
  const existing = parsedExisting as BaselineFile<Row>;
  const after = [...existing.fixtures, ...newRows];
  const check = checkAdditive(existing.fixtures, after);
  if (!check.ok) throw new Error(`pin-corpus-tree: ${path}: ${check.message ?? 'additive check failed'}`);
  const updated: BaselineFile<Row> = { $comment: `${existing.$comment} ${commentSuffix}`, fixtures: after };
  writeFileSync(path, JSON.stringify(updated, null, 2) + '\n', 'utf8');
}

function writeBaselines(
  opts: PinOptions,
  measured: readonly MeasuredFixture[],
  derived: ReadonlyMap<string, DerivedRow>,
): void {
  const routingRows = measured.map((m) =>
    buildRoutingRow(opts.type, m, derived.get(m.slug)!.routing, opts.today, opts.commit),
  );
  const refusalRows = measured.map((m) =>
    buildRefusalRow(opts.type, m, derived.get(m.slug)!.refusal, opts.today, opts.commit),
  );
  const suffix = `Re-pinned ${opts.today} at ${opts.commit} by unknown-bucket-routing-repair / T0's pin-corpus-tree.ts, ADDITIVE ONLY (${measured.length} "${opts.type}" rows appended).`;
  appendAndWrite(opts.routingBaselinePath, routingRows, suffix);
  appendAndWrite(opts.refusalBaselinePath, refusalRows, suffix);
}

/**
 * Measures `opts.treeDir`, joins the result against `opts.ledgerDir`, and
 * either previews (`opts.dry`) or writes both baselines. Throws -- never
 * exits the process itself, so it stays directly callable from tests -- on
 * any of D5's three refusal conditions: a malformed ledger reason (checked
 * before `--dry` even short-circuits, since a bad reason is a ledger bug,
 * not a preview concern), a measured defect with no usable ledger row
 * (`fix-candidate`, absent, or a stale `fixed` pin), or a would-be change to
 * a pre-existing baseline row (`checkAdditive`, inside `appendAndWrite`).
 */
export function runPinCorpusTree(opts: PinOptions): PinResult {
  const ledger = loadLedger(opts.ledgerDir);
  const measured = measureTree(opts.treeDir);
  const derived = deriveAll(measured, ledger);

  const malformed = findMalformedReason(measured, derived);
  if (malformed !== undefined) {
    throw new Error(`pin-corpus-tree: ${malformed}: ledger reason does not match /\\w+\\.java:\\d+/`);
  }

  const tally = computeTally(measured, ledger, derived);
  if (opts.dry) return { tally, total: measured.length, wrote: false };

  const blocked = findBlockedSlug(measured, ledger, derived);
  if (blocked !== undefined) {
    throw new Error(
      `pin-corpus-tree: ${blocked}: no usable ledger row (missing, fix-candidate, or a stale "fixed" pin)`,
    );
  }

  writeBaselines(opts, measured, derived);
  return { tally, total: measured.length, wrote: true };
}

// ---------------------------------------------------------------------------
// CLI glue.
// ---------------------------------------------------------------------------

interface ParsedArgs {
  readonly type: string;
  readonly treeDir: string;
  readonly ledgerDir: string;
  readonly dry: boolean;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const [type, ...rest] = argv;
  if (type === undefined) {
    throw new Error('usage: pin-corpus-tree.ts <type> --tree <dir> --ledger <dir> [--dry]');
  }
  let treeDir = `test-results/dot-cache/${type}`;
  let ledgerDir = DEFAULT_LEDGER_DIR;
  let dry = false;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    const next = rest[i + 1];
    if (arg === '--tree' && next !== undefined) {
      treeDir = next;
      i++;
    } else if (arg === '--ledger' && next !== undefined) {
      ledgerDir = next;
      i++;
    } else if (arg === '--dry') {
      dry = true;
    }
  }
  return { type, treeDir, ledgerDir, dry };
}

/* v8 ignore start -- CLI entry point / console output glue. */
function printTally(tally: Tally, treeDir: string, total: number): void {
  console.log(`pin-corpus-tree: measured ${total} fixtures under ${treeDir}`);
  for (const e of tally.entries) {
    console.log(`  ${e.cohort}\trouting=${e.routing}\trefusal=${e.refusal}\t${e.count}`);
  }
  console.log(`  fix-candidate\t${tally.fixCandidates}`);
  console.log(`  unpinned\t${tally.unpinned}`);
}

function today(): string {
  return execFileSync('date', ['+%Y-%m-%d']).toString().trim();
}

function commitShort(): string {
  return execFileSync('git', ['rev-parse', '--short=8', 'HEAD']).toString().trim();
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  const opts: PinOptions = {
    ...parsed,
    routingBaselinePath: ROUTING_BASELINE_PATH,
    refusalBaselinePath: REFUSAL_BASELINE_PATH,
    today: today(),
    commit: commitShort(),
  };
  const result = runPinCorpusTree(opts);
  printTally(result.tally, opts.treeDir, result.total);
  console.log(
    result.wrote
      ? `pin-corpus-tree: wrote ${result.total} rows to each baseline.`
      : 'pin-corpus-tree: --dry -- nothing written.',
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
/* v8 ignore stop */
