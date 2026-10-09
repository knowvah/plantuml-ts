/**
 * One JVM per render (mission instrument-space-width, T0b). The shell
 * equivalent is scripts/oracle-render.sh -- keep the flags and classpath in
 * sync with it BY HAND.
 *
 * WHY one JVM per fixture: JVM static state leaks between diagrams in one
 * process. Measured (`.agent-notes/oracle-svg-seam.md`): `{{ }}` diagram
 * usecase/zidebi-71-nocu387 renders 875 px wide batched, 895 px solo; and 5
 * `oracle/goldens/svg-dot/*` goldens report CHANGED batched yet equal a solo
 * render. Batching is therefore not byte-identical and is never used here.
 *
 * Unlike a copy of oracle-render.sh (whose REPO derives from its own
 * directory and so silently loses Batik when moved), `repo` is explicit.
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ORACLE_JAR_TIMEOUT_MS } from './oracle-jar-timeout.js';
import { runInPlainMinute, type GuardClock, type GuardSleep } from './oracle-minute-guard.js';
import type { Rendered } from './recapture-classify.js';

export interface RenderOptions {
  /** Oracle jar to render with. */
  readonly jar: string;
  /** Repo root: where `oracle/dist/batik` (and the cwd) come from. */
  readonly repo: string;
  /** Parent of the per-render scratch directories. */
  readonly scratchRoot: string;
  readonly timeoutMs?: number;
  readonly now?: GuardClock;
  readonly sleep?: GuardSleep;
}

/** Renders one absolute `.puml` path in its own JVM; returns every `.svg` and
 *  `svek-*.dot` the jar wrote. Never throws on a non-zero exit. */
export type Renderer = (pumlAbs: string, opts: RenderOptions) => Promise<Rendered>;

/** Batik is needed ONLY for `<latex>`/`<math>` (see oracle-render.sh header). */
export function classpath(jar: string, repo: string): string {
  const batik = join(repo, 'oracle', 'dist', 'batik');
  const hasBatik = existsSync(batik) && readdirSync(batik).some((f) => f.endsWith('.jar'));
  return hasBatik ? `${jar}:${join(batik, '*')}` : jar;
}

export function javaArgs(jar: string, repo: string, out: string, pumlAbs: string): string[] {
  return [
    '-DPLANTUML_DETERMINISTIC_TEXT=true',
    `-DPLANTUML_DUMP_DOT=${out}`,
    '-cp',
    classpath(jar, repo),
    'net.sourceforge.plantuml.Run',
    '-tsvg',
    '-o',
    out,
    pumlAbs,
  ];
}

interface ExecOutcome {
  exitCode: number | null;
  timedOut: boolean;
}

function runJava(args: readonly string[], cwd: string, timeoutMs: number): Promise<ExecOutcome> {
  return new Promise((resolve) => {
    execFile(
      'java',
      [...args],
      { cwd, timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer: 64 * 1024 * 1024 },
      (err) => {
        if (!err) return resolve({ exitCode: 0, timedOut: false });
        const e = err as NodeJS.ErrnoException & { killed?: boolean; code?: number | string };
        if (e.killed) return resolve({ exitCode: null, timedOut: true });
        // The exit code is not a success signal; a spawn failure (ENOENT) leaves
        // no files, which the classifier reports as FAILED.
        resolve({ exitCode: typeof e.code === 'number' ? e.code : -1, timedOut: false });
      },
    );
  });
}

function collect(dir: string): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.svg') || /^svek-\d+\.dot$/.test(name)) files.set(name, readFileSync(join(dir, name)));
  }
  return files;
}

/** The production renderer: guarded against PSystemError's time-based
 *  error-page decorations (scripts/lib/oracle-minute-guard.ts). */
export const renderPuml: Renderer = (pumlAbs, opts) =>
  runInPlainMinute(
    async () => {
      mkdirSync(opts.scratchRoot, { recursive: true });
      const out = mkdtempSync(join(opts.scratchRoot, 'r-'));
      try {
        const outcome = await runJava(
          javaArgs(opts.jar, opts.repo, out, pumlAbs),
          opts.repo,
          opts.timeoutMs ?? ORACLE_JAR_TIMEOUT_MS,
        );
        return { files: collect(out), ...outcome };
      } finally {
        rmSync(out, { recursive: true, force: true });
      }
    },
    opts.now,
    opts.sleep,
  );

/** Bounded-concurrency map preserving input order. */
export async function runPool<T, R>(items: readonly T[], workers: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const lane = async (): Promise<void> => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(workers, items.length)) }, lane));
  return results;
}
