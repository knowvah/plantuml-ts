/**
 * SVG golden rebaseline script (mission svg-output-size-reduction, T2 / ADR-4).
 *
 * The 450 committed `oracle/goldens/svg-<type>/<slug>/golden.svg` files are the
 * PINNED JAR's SVG output, byte-compared against ours by five ratchet
 * suites. When the oracle pin advances, every golden must be re-captured
 * from the jar -- this script is that procedure, made repeatable instead
 * of ad hoc. It reads the jar only; it never touches `src/` or our
 * renderer.
 *
 * Walks every `in.puml` under `oracle/goldens/svg-<type>/`, captures each with the
 * pinned jar (the exact deterministic-text invocation `oracle/capture.sh`
 * uses) into a scratch directory, and byte-compares the capture against
 * the sibling `golden.svg`. Report-only by default; `--write` copies each
 * CHANGED capture over its golden -- but only after the oracle drift guard
 * (oracle/build-oracle.sh's pin.json check) passes, replicated here without
 * paying for a full `gradlew jar` build. A drifted jar produces a silently
 * wrong oracle -- the exact defect class this mission's predecessor left
 * behind (see oracle/pin.json:previousPin.svgSuitesNotRebaselined) -- so
 * --write refuses outright rather than writing from an unverified jar.
 *
 * Usage: `npx tsx scripts/rebaseline-svg-goldens.ts [--write]`
 * Output: one line per CHANGED/FAILED fixture, then a summary line
 * `SAME=<n> CHANGED=<n> FAILED=<n>`. Exit 0 iff zero fixtures FAILED (and,
 * under --write, the drift guard passed); non-zero otherwise.
 */
import { existsSync, readdirSync, readFileSync, copyFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOLDENS_ROOT = join(REPO, 'oracle', 'goldens');
const JAR_PATH = join(REPO, 'oracle', 'dist', 'plantuml-oracle.jar');
const PIN_JSON_PATH = join(REPO, 'oracle', 'pin.json');

// ---------------------------------------------------------------------------
// Pure comparator / summary logic (unit-tested without a JVM).
// ---------------------------------------------------------------------------

export type CaptureStatus = 'SAME' | 'CHANGED' | 'FAILED';

/** Byte-compares a capture against its golden. `captured` is `undefined`
 *  when the jar produced no SVG at all (AC4: must count as FAILED, never
 *  be silently skipped). Pure -- takes bytes, not paths. */
export function compareCapture(captured: Buffer | undefined, golden: Buffer): CaptureStatus {
  if (!captured) return 'FAILED';
  return captured.equals(golden) ? 'SAME' : 'CHANGED';
}

export interface FixtureOutcome {
  relPath: string;
  status: CaptureStatus;
  detail?: string;
  /** Set only when the jar exited non-zero -- see `Capture.exitCode`. */
  jarExit?: number;
}

/** Builds the `detail` string for an outcome, folding in a non-zero jar exit
 *  so an error-diagram capture is never reported as an ordinary CHANGED. */
export function describeOutcome(status: CaptureStatus, exitCode: number): string | undefined {
  const failed = status === 'FAILED' ? 'jar produced no SVG' : undefined;
  if (exitCode === 0) return failed;
  const errored = `jar exit ${exitCode} (error diagram)`;
  return failed ? `${failed}; ${errored}` : errored;
}

export interface Summary {
  same: number;
  changed: number;
  failed: number;
}

export function summarize(outcomes: readonly FixtureOutcome[]): Summary {
  const s: Summary = { same: 0, changed: 0, failed: 0 };
  for (const o of outcomes) {
    if (o.status === 'SAME') s.same += 1;
    else if (o.status === 'CHANGED') s.changed += 1;
    else s.failed += 1;
  }
  return s;
}

/** Exact interface-contract format consumed by T9: `SAME=<n> CHANGED=<n> FAILED=<n>`. */
export function formatSummaryLine(s: Summary): string {
  return `SAME=${s.same} CHANGED=${s.changed} FAILED=${s.failed}`;
}

/** Non-SAME fixtures are reported by name so a change can never be
 *  silently under-counted; SAME fixtures produce no line (450 of them
 *  would be pure noise) UNLESS the jar errored on them, which is worth a
 *  line even when the bytes match. Returns `undefined` otherwise. */
export function formatOutcomeLine(o: FixtureOutcome): string | undefined {
  if (o.status === 'SAME' && o.jarExit === undefined) return undefined;
  return o.detail ? `${o.status} ${o.relPath}: ${o.detail}` : `${o.status} ${o.relPath}`;
}

// ---------------------------------------------------------------------------
// Drift guard -- replicates oracle/build-oracle.sh's pin.json tree check
// (see that script's comment for why a silent warn is unacceptable here)
// without paying for a `gradlew jar` build.
// ---------------------------------------------------------------------------

export interface DriftCheckInput {
  pinTree: string | undefined;
  baseTree: string | undefined;
  allowOverride: boolean;
}

export interface DriftResult {
  ok: boolean;
  reason?: string;
}

/** Pure comparison mirroring build-oracle.sh lines 27-40: the pinned
 *  upstream tree must equal `dot-output~seamCommitCount`'s tree, unless
 *  ORACLE_ALLOW_DRIFT=1. */
export function evaluateDrift(input: DriftCheckInput): DriftResult {
  const { pinTree, baseTree, allowOverride } = input;
  if (!pinTree) return { ok: false, reason: 'pin.json upstreamSha not found in fork' };
  if (baseTree !== pinTree) {
    if (allowOverride) return { ok: true, reason: 'ORACLE_ALLOW_DRIFT=1 override' };
    return { ok: false, reason: 'dot-output~seamCommitCount tree != pinned upstream tree' };
  }
  return { ok: true };
}

interface Pin {
  upstreamSha: string;
  seamCommitCount: number;
}

function readPin(): Pin {
  const raw = JSON.parse(readFileSync(PIN_JSON_PATH, 'utf8')) as Record<string, unknown>;
  return {
    upstreamSha: raw.upstreamSha as string,
    seamCommitCount: (raw.seamCommitCount as number) ?? 1,
  };
}

function gitTree(fork: string, rev: string): string | undefined {
  try {
    return execFileSync('git', ['-C', fork, 'rev-parse', `${rev}^{tree}`], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return undefined;
  }
}

/** I/O wrapper around `evaluateDrift`: locates the fork checkout, resolves
 *  both tree hashes via read-only `git rev-parse`, and defers the actual
 *  judgment to the pure function above. */
function checkDriftGuard(): DriftResult {
  const fork = process.env.PLANTUML_FORK ?? join(homedir(), 'git', 'plantuml');
  if (!existsSync(join(fork, '.git'))) {
    return { ok: false, reason: `fork not found at ${fork} (set PLANTUML_FORK)` };
  }
  const pin = readPin();
  const baseTree = gitTree(fork, `dot-output~${pin.seamCommitCount}`);
  const pinTree = gitTree(fork, pin.upstreamSha);
  return evaluateDrift({
    pinTree,
    baseTree,
    allowOverride: process.env.ORACLE_ALLOW_DRIFT === '1',
  });
}

// ---------------------------------------------------------------------------
// Fixture discovery + capture (I/O; exercised by the manual run, not tests).
// ---------------------------------------------------------------------------

/** Recursively finds every directory under `root` containing `in.puml`,
 *  regardless of nesting depth (svg-class is one level, svg-description is
 *  two -- `<type>/<slug>/`). */
function findFixtureDirs(root: string): string[] {
  if (!existsSync(root)) return [];
  const found: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    const entries = readdirSync(dir, { withFileTypes: true });
    if (entries.some((e) => e.isFile() && e.name === 'in.puml')) {
      found.push(dir);
      continue;
    }
    for (const e of entries) {
      if (e.isDirectory()) stack.push(join(dir, e.name));
    }
  }
  return found.sort();
}

function findSvgGoldenTypeDirs(): string[] {
  return readdirSync(GOLDENS_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('svg-'))
    .map((e) => join(GOLDENS_ROOT, e.name));
}

export interface Capture {
  bytes: Buffer | undefined;
  /** The jar's exit status. Non-zero means the jar reported a diagram error
   *  and the SVG it wrote (if any) is an ERROR DIAGRAM, not a rendering.
   *  Tracked separately from `bytes` because the two genuinely disagree:
   *  `svg-class/class-actor-bare-no-allowmixing` exits 200 AND writes a
   *  valid 2.1KB error-diagram SVG, which is exactly what its golden is
   *  meant to pin. Classifying by exit code would call that a capture
   *  failure; classifying by bytes alone would let a NEWLY-broken fixture
   *  re-baseline its error diagram over a real rendering without a word.
   *  Reporting both is the only option that hides neither. */
  exitCode: number;
}

/** Every fixture the jar reported a diagram error for, keyed by the input
 *  path it printed. A BATCHED run returns a single process exit code, so
 *  this is how per-fixture error status survives batching -- without it the
 *  ERROR-DIAGRAM signal would be lost the moment more than one file shares
 *  a JVM.
 *
 *  Format, verified against the pinned jar:
 *  `Error line 13 in file: <path>` on stderr, one line per errored input. */
export function parseErroredFiles(stderr: string): ReadonlySet<string> {
  const out = new Set<string>();
  for (const m of stderr.matchAll(/^Error line \d+ in file: (.+)$/gm)) {
    out.add(m[1]!.trim());
  }
  return out;
}

/** How many `in.puml` paths to hand a single JVM. The win here is entirely
 *  JVM STARTUP amortisation -- measured on this corpus, 60 fixtures take
 *  ~2.3s in one JVM against ~120s one-JVM-per-file, a ~50x difference --
 *  so the chunk exists only to keep the argv comfortably under ARG_MAX,
 *  not to tune throughput. Output is byte-identical either way (verified
 *  over 20 real fixtures).
 *
 *  `-nbthread` is deliberately NOT used: it buys about 10% on top of
 *  batching and shares mutable id state across threads, which is not a
 *  trade worth making for an oracle. */
const BATCH_SIZE = 120;

/** Captures a batch of fixtures in ONE jar invocation.
 *
 *  Each fixture's `in.puml` is mirrored into the scratch tree first, and
 *  `-o` is passed RELATIVE (`cap`) so the jar writes beside each input
 *  rather than into one shared directory -- with a shared `-o`, 446 files
 *  all named `in.svg` would overwrite each other. */
function captureBatch(fixtures: readonly { relPath: string; fixtureDir: string }[], scratchRoot: string): Map<string, Capture> {
  for (const f of fixtures) {
    mkdirSync(join(scratchRoot, f.relPath), { recursive: true });
    copyFileSync(join(f.fixtureDir, 'in.puml'), join(scratchRoot, f.relPath, 'in.puml'));
  }
  const inputs = fixtures.map((f) => join(scratchRoot, f.relPath, 'in.puml'));
  const proc = spawnSync(
    'java',
    ['-DPLANTUML_DETERMINISTIC_TEXT=true', '-jar', JAR_PATH, '-tsvg', '-o', 'cap', ...inputs],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  const errored = parseErroredFiles(proc.stderr ?? '');
  const out = new Map<string, Capture>();
  for (const f of fixtures) {
    const outDir = join(scratchRoot, f.relPath, 'cap');
    const svgs = existsSync(outDir) ? readdirSync(outDir).filter((n) => n.endsWith('.svg')) : [];
    const bytes = svgs.length === 0 ? undefined : readFileSync(join(outDir, svgs[0]!));
    const inPuml = join(scratchRoot, f.relPath, 'in.puml');
    out.set(f.relPath, { bytes, exitCode: errored.has(inPuml) ? 200 : 0 });
  }
  return out;
}

function evaluateFixture(fixtureDir: string, scratchRoot: string, write: boolean, captured: Capture): FixtureOutcome {
  const relPath = relative(GOLDENS_ROOT, fixtureDir);
  const goldenPath = join(fixtureDir, 'golden.svg');
  if (!existsSync(goldenPath)) {
    return { relPath, status: 'FAILED', detail: 'missing golden.svg' };
  }
  const capturedPath = join(scratchRoot, relPath, 'cap');
  const golden = readFileSync(goldenPath);
  const status = compareCapture(captured.bytes, golden);
  if (status === 'CHANGED' && write) {
    const svgs = readdirSync(capturedPath).filter((f) => f.endsWith('.svg'));
    copyFileSync(join(capturedPath, svgs[0]!), goldenPath);
  }
  const outcome: FixtureOutcome = { relPath, status };
  const detail = describeOutcome(status, captured.exitCode);
  if (detail) outcome.detail = detail;
  if (captured.exitCode !== 0) outcome.jarExit = captured.exitCode;
  return outcome;
}

// ---------------------------------------------------------------------------
// CLI entry point.
// ---------------------------------------------------------------------------

/** Preconditions gating the run: under `--write` the drift guard must pass;
 *  the jar must exist regardless. Returns an error message, or `undefined`
 *  when clear to proceed. */
function checkPreconditions(write: boolean): string | undefined {
  if (write) {
    const drift = checkDriftGuard();
    if (!drift.ok) return `refusing to write: drift guard failed -- ${drift.reason}`;
  }
  if (!existsSync(JAR_PATH)) {
    return `oracle jar missing at ${JAR_PATH} -- run oracle/build-oracle.sh first`;
  }
  return undefined;
}

/** Captures + compares every fixture, printing a line per non-SAME result
 *  as it goes, and returns the full outcome list for the final summary. */
function runFixtures(scratchRoot: string, write: boolean): FixtureOutcome[] {
  const fixtureDirs = findSvgGoldenTypeDirs().flatMap((typeDir) => findFixtureDirs(typeDir));
  const all = fixtureDirs.map((d) => ({ fixtureDir: d, relPath: relative(GOLDENS_ROOT, d) }));
  const outcomes: FixtureOutcome[] = [];
  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    const batch = all.slice(i, i + BATCH_SIZE);
    const captures = captureBatch(batch, scratchRoot);
    for (const f of batch) {
      const captured = captures.get(f.relPath) ?? { bytes: undefined, exitCode: -1 };
      const outcome = evaluateFixture(f.fixtureDir, scratchRoot, write, captured);
      outcomes.push(outcome);
      const line = formatOutcomeLine(outcome);
      if (line) process.stdout.write(`${line}\n`);
    }
  }
  return outcomes;
}

/* v8 ignore start -- CLI entry point; pure functions above are exercised
 * directly by tests/unit/scripts/rebaseline-svg-goldens.test.ts. */
function main(): void {
  const write = process.argv.includes('--write');

  const precondition = checkPreconditions(write);
  if (precondition) {
    process.stderr.write(`${precondition}\n`);
    process.exitCode = 1;
    return;
  }

  const scratchRoot = mkdtempSync(join(tmpdir(), 'rebaseline-svg-goldens-'));
  const outcomes = runFixtures(scratchRoot, write);

  const summary = summarize(outcomes);
  process.stdout.write(`${formatSummaryLine(summary)}\n`);
  // Reported on its own line, never folded into the summary: T9 parses that
  // line and its format is a fixed contract.
  const errored = outcomes.filter((o) => o.jarExit !== undefined);
  if (errored.length > 0) {
    process.stdout.write(`ERROR-DIAGRAM=${errored.length} (${errored.map((o) => o.relPath).join(', ')})\n`);
  }
  process.exitCode = summary.failed > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
