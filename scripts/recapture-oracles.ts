/**
 * One-JVM-per-fixture oracle re-capture (mission instrument-space-width, T0b).
 *
 * Re-renders every committed artifact that is a render of the pinned oracle
 * jar -- see scripts/lib/recapture-manifest.ts for the four kinds -- with ONE
 * JVM PER TARGET (batching is unsafe: scripts/lib/recapture-render.ts).
 *
 * Default / `--verify`: render into scratch, report SAME / CHANGED / FAILED /
 * not-a-jar-render per target; no tracked file is touched. `--write` copies
 * CHANGED renders over the committed bytes, but only after the oracle drift
 * guard passes (same guard as scripts/rebaseline-svg-goldens.ts).
 *
 * Usage:
 *   npx jiti scripts/recapture-oracles.ts [--verify|--write] [--workers N]
 *     [--only glob[,glob]]… [--jar path] [--report out.json] [--scratch dir]
 *
 * `--jar` is the jar to adopt; the reference for "is this fixture svg a jar
 * render" is always `oracle/dist/plantuml-oracle.jar`.
 * Exit 0 iff no target FAILED.
 */
import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkDriftGuard } from './rebaseline-svg-goldens.js';
import { parseArgs, USAGE, type CliOptions } from './lib/recapture-cli.js';
import {
  STATUS,
  countByStatus,
  evaluate,
  evaluateFixtureSvg,
  type Evaluation,
  type Existing,
  type Status,
} from './lib/recapture-classify.js';
import {
  TARGET_KIND,
  buildManifest,
  filterTargets,
  listRepoFiles,
  targetId,
  type Target,
} from './lib/recapture-manifest.js';
import { renderPuml, runPool, type Renderer, type RenderOptions } from './lib/recapture-render.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const REFERENCE_JAR = join(REPO, 'oracle', 'dist', 'plantuml-oracle.jar');

/** One row of the JSON report consumed by T1b. */
export interface ReportRow {
  readonly target: string;
  readonly kind: Target['kind'];
  readonly status: Status;
  readonly outputs: readonly string[];
  readonly changedOutputs: readonly string[];
  readonly removedOutputs: readonly string[];
  readonly detail?: string;
  readonly jarExit?: number;
}

export interface Context {
  readonly repo: string;
  readonly jar: string;
  readonly referenceJar: string;
  readonly scratchRoot: string;
  readonly write: boolean;
  readonly render: Renderer;
}

function readExisting(repo: string, t: Target): Existing {
  const m = new Map<string, Buffer | undefined>();
  for (const name of t.outputs) {
    const p = join(repo, t.dir, name);
    m.set(name, existsSync(p) ? readFileSync(p) : undefined);
  }
  return m;
}

/** Applies a CHANGED evaluation to disk. The only writer in this tool. */
function applyWrite(repo: string, t: Target, ev: Evaluation): void {
  for (const [name, bytes] of ev.desired) writeFileSync(join(repo, t.dir, name), bytes);
  for (const name of ev.removedOutputs) unlinkSync(join(repo, t.dir, name));
}

async function evaluateTarget(t: Target, ctx: Context): Promise<Evaluation> {
  const existing = readExisting(ctx.repo, t);
  const abs = join(ctx.repo, t.puml);
  const opts = (jar: string): RenderOptions => ({ jar, repo: ctx.repo, scratchRoot: ctx.scratchRoot });
  if (t.kind !== TARGET_KIND.fixtureSvg) return evaluate(t, existing, await ctx.render(abs, opts(ctx.jar)));
  const reference = await ctx.render(abs, opts(ctx.referenceJar));
  const candidate = ctx.jar === ctx.referenceJar ? undefined : await ctx.render(abs, opts(ctx.jar));
  return evaluateFixtureSvg(t, existing, reference, candidate);
}

/** Renders, classifies and (under `write`) persists one target. */
export async function processTarget(t: Target, ctx: Context): Promise<ReportRow> {
  const ev = await evaluateTarget(t, ctx);
  if (ctx.write && ev.status === STATUS.changed) applyWrite(ctx.repo, t, ev);
  return {
    target: targetId(t),
    kind: t.kind,
    status: ev.status,
    outputs: t.outputs,
    changedOutputs: ev.changedOutputs,
    removedOutputs: ev.removedOutputs,
    ...(ev.detail === undefined ? {} : { detail: ev.detail }),
    ...(ev.jarExit === undefined ? {} : { jarExit: ev.jarExit }),
  };
}

/** `SAME=n CHANGED=n FAILED=n not-a-jar-render=n`, fixed order. */
export function formatCounts(rows: readonly ReportRow[]): string {
  const counts = countByStatus(rows.map((r) => r.status));
  return Object.values(STATUS)
    .map((s) => `${s}=${counts[s] ?? 0}`)
    .join(' ');
}

export async function recapture(targets: readonly Target[], ctx: Context, workers: number): Promise<ReportRow[]> {
  return runPool(targets, workers, async (t) => {
    const row = await processTarget(t, ctx);
    if (row.status !== STATUS.same)
      process.stdout.write(`${row.status} ${row.target}${row.detail ? `: ${row.detail}` : ''}\n`);
    return row;
  });
}

function precondition(opts: CliOptions, jar: string): string | undefined {
  if (!existsSync(jar)) return `oracle jar missing at ${jar} -- run oracle/build-oracle.sh first`;
  if (!existsSync(REFERENCE_JAR)) return `reference jar missing at ${REFERENCE_JAR}`;
  if (opts.mode === 'write') {
    const drift = checkDriftGuard();
    if (!drift.ok) return `refusing to write: drift guard failed -- ${drift.reason}`;
  }
  return undefined;
}

/* v8 ignore start -- CLI entry point; the pure parts above/in lib are unit-tested. */
async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if ('error' in parsed) {
    process.stderr.write(`${parsed.error}\n${USAGE}\n`);
    process.exitCode = 2;
    return;
  }
  const jar = resolve(parsed.jar ?? REFERENCE_JAR);
  const problem = precondition(parsed, jar);
  if (problem) {
    process.stderr.write(`${problem}\n`);
    process.exitCode = 1;
    return;
  }
  const targets = filterTargets(buildManifest(listRepoFiles(REPO)), parsed.only);
  const scratchRoot = join(parsed.scratch ?? tmpdir(), `recapture-${process.pid}`);
  const ctx: Context = {
    repo: REPO,
    jar,
    referenceJar: REFERENCE_JAR,
    scratchRoot,
    write: parsed.mode === 'write',
    render: renderPuml,
  };
  try {
    const rows = await recapture(targets, ctx, parsed.workers);
    if (parsed.report) writeFileSync(parsed.report, `${JSON.stringify(rows, null, 2)}\n`);
    process.stdout.write(`${formatCounts(rows)} (targets=${rows.length}, mode=${parsed.mode})\n`);
    process.exitCode = rows.some((r) => r.status === STATUS.failed) ? 1 : 0;
  } finally {
    rmSync(scratchRoot, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
}
/* v8 ignore stop */
