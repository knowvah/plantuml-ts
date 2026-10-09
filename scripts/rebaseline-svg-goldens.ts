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
 * uses) -- ONE JVM PER FIXTURE, via scripts/lib/recapture-render.ts, the same
 * renderer as scripts/recapture-oracles.ts (which supersedes this script for
 * a full-oracle re-capture) -- and byte-compares the capture against
 * the sibling `golden.svg`. Report-only by default; `--write` copies each
 * CHANGED capture over its golden -- but only after the oracle drift guard
 * (oracle/build-oracle.sh's pin.json check) passes, replicated here without
 * paying for a full `gradlew jar` build. A drifted jar produces a silently
 * wrong oracle -- the exact defect class this mission's predecessor left
 * behind (see oracle/pin.json:previousPin.svgSuitesNotRebaselined) -- so
 * --write refuses outright rather than writing from an unverified jar.
 *
 * Batching several fixtures into one JVM is NOT byte-identical to solo
 * renders (an earlier version of this script claimed it was, "verified over
 * 20 real fixtures"; that claim was false). Measured counter-examples
 * (`.agent-notes/oracle-svg-seam.md`, `.agent-notes/isw-T0b.md`): the `{{ }}`
 * diagram usecase/zidebi-71-nocu387 renders 875 px wide batched vs 895 px
 * solo, because JVM static state leaks between diagrams; and 5
 * `oracle/goldens/svg-dot/*` goldens report CHANGED batched yet equal a solo
 * render (`@startdot` output differs under batching).
 *
 * Usage: `npx tsx scripts/rebaseline-svg-goldens.ts [--write]`
 * Output: one line per CHANGED/FAILED fixture, then a summary line
 * `SAME=<n> CHANGED=<n> FAILED=<n>`. Exit 0 iff zero fixtures FAILED (and,
 * under --write, the drift guard passed); non-zero otherwise.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import type { GuardClock, GuardSleep } from './lib/oracle-minute-guard.js';
import { selectOutputs } from './lib/recapture-classify.js';
import { TARGET_KIND } from './lib/recapture-manifest.js';
import { renderPuml, type Renderer } from './lib/recapture-render.js';

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
export function checkDriftGuard(): DriftResult {
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

/** Injectable clock/sleep for `runInPlainMinute` (D9: PSystemError.java's
 *  time-based error-page decorations). Both undefined in production --
 *  `runInPlainMinute` then defaults to real `Date.now`/a real timer; tests
 *  inject fakes so a decorated minute never causes a real sleep. */
export interface GuardDeps {
  now?: GuardClock;
  sleep?: GuardSleep;
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

/** Fixtures rendered concurrently, each in its OWN JVM. Concurrency across
 *  JVMs shares no state; only batching inside one JVM does. */
const RENDER_WORKERS = 4;

/** Captures each fixture in its own JVM, guarded against PSystemError.java's
 *  time-based error-page decorations (D9) inside `renderPuml` -- see
 *  scripts/lib/oracle-minute-guard.ts. The renderer is injectable. */
export async function captureEach(
  fixtures: readonly { relPath: string; fixtureDir: string }[],
  scratchRoot: string,
  guard: GuardDeps = {},
  render: Renderer = renderPuml,
): Promise<Map<string, Capture>> {
  const out = new Map<string, Capture>();
  const pending = [...fixtures];
  const lane = async (): Promise<void> => {
    for (let f = pending.shift(); f; f = pending.shift()) {
      const puml = join(f.fixtureDir, 'in.puml');
      const rendered = await render(puml, { jar: JAR_PATH, repo: REPO, scratchRoot, ...guard });
      const target = { kind: TARGET_KIND.svgGolden, dir: f.relPath, puml, outputs: ['golden.svg'] } as const;
      const selected = rendered.timedOut ? 'timed out' : selectOutputs(target, rendered.files);
      const bytes = typeof selected === 'string' ? undefined : selected.get('golden.svg');
      out.set(f.relPath, { bytes, exitCode: rendered.exitCode ?? -1 });
    }
  };
  await Promise.all(Array.from({ length: Math.min(RENDER_WORKERS, fixtures.length) }, lane));
  return out;
}

function evaluateFixture(fixtureDir: string, write: boolean, captured: Capture): FixtureOutcome {
  const relPath = relative(GOLDENS_ROOT, fixtureDir);
  const goldenPath = join(fixtureDir, 'golden.svg');
  if (!existsSync(goldenPath)) {
    return { relPath, status: 'FAILED', detail: 'missing golden.svg' };
  }
  const golden = readFileSync(goldenPath);
  const status = compareCapture(captured.bytes, golden);
  if (status === 'CHANGED' && write) writeFileSync(goldenPath, captured.bytes!);
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
async function runFixtures(scratchRoot: string, write: boolean, guard: GuardDeps = {}): Promise<FixtureOutcome[]> {
  const fixtureDirs = findSvgGoldenTypeDirs().flatMap((typeDir) => findFixtureDirs(typeDir));
  const all = fixtureDirs.map((d) => ({ fixtureDir: d, relPath: relative(GOLDENS_ROOT, d) }));
  const captures = await captureEach(all, scratchRoot, guard);
  const outcomes: FixtureOutcome[] = [];
  for (const f of all) {
    const captured = captures.get(f.relPath) ?? { bytes: undefined, exitCode: -1 };
    const outcome = evaluateFixture(f.fixtureDir, write, captured);
    outcomes.push(outcome);
    const line = formatOutcomeLine(outcome);
    if (line) process.stdout.write(`${line}\n`);
  }
  return outcomes;
}

/* v8 ignore start -- CLI entry point; pure functions above are exercised
 * directly by tests/unit/scripts/rebaseline-svg-goldens.test.ts. */
async function main(): Promise<void> {
  const write = process.argv.includes('--write');

  const precondition = checkPreconditions(write);
  if (precondition) {
    process.stderr.write(`${precondition}\n`);
    process.exitCode = 1;
    return;
  }

  const scratchRoot = mkdtempSync(join(tmpdir(), 'rebaseline-svg-goldens-'));
  const outcomes = await runFixtures(scratchRoot, write);

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
  main().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
}
/* v8 ignore stop */
