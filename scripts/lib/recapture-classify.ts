/**
 * Pure classification for scripts/recapture-oracles.ts (mission
 * instrument-space-width, T0b): which rendered files become which committed
 * outputs, and whether they equal what is committed. No I/O -- bytes in,
 * verdict out -- so the renderer is injectable (testability.md #1, #3).
 */
import { posix } from 'node:path';
import { TARGET_KIND, isSvekDot, type Target } from './recapture-manifest.js';

export const STATUS = {
  same: 'SAME',
  changed: 'CHANGED',
  failed: 'FAILED',
  /** A fixture svg the CURRENT jar does not reproduce byte-equal: ours, not
   *  the jar's. Listed, never written. */
  notAJarRender: 'not-a-jar-render',
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

/** What one JVM produced, keyed by the file names it wrote into its scratch
 *  output directory. */
export interface Rendered {
  readonly files: ReadonlyMap<string, Buffer>;
  /** The JVM's exit status; null when it was killed. Not a success signal
   *  (aoh-T0.md Finding 1) -- files decide -- but reported. */
  readonly exitCode: number | null;
  readonly timedOut: boolean;
}

/** Committed bytes per output name; `undefined` = absent. */
export type Existing = ReadonlyMap<string, Buffer | undefined>;

export interface Evaluation {
  readonly status: Status;
  /** What `--write` would put on disk, name -> bytes (empty unless CHANGED). */
  readonly desired: ReadonlyMap<string, Buffer>;
  /** Output names that differ from, or are new relative to, the committed set. */
  readonly changedOutputs: readonly string[];
  /** Committed outputs the jar no longer emits (stale `svek-*.dot`). */
  readonly removedOutputs: readonly string[];
  readonly detail?: string;
  readonly jarExit?: number;
}

function svgOutputName(t: Target): string {
  return t.outputs.find((o) => o.endsWith('.svg')) ?? '';
}

function wantsSvg(t: Target): boolean {
  return t.kind !== TARGET_KIND.dotGolden;
}

function wantsDots(t: Target): boolean {
  return t.kind === TARGET_KIND.dotCache || t.kind === TARGET_KIND.dotGolden;
}

/** `<puml base>.svg` if the jar wrote it, else the sole `.svg` (a block that
 *  names itself, `@startuml <name>`, writes `<name>.svg` -- aoh-T0.md
 *  Finding 2); more than one other svg is ambiguous. */
export function pickSvg(t: Target, files: ReadonlyMap<string, Buffer>): Buffer | string {
  const svgs = [...files.keys()].filter((n) => n.endsWith('.svg'));
  const named = `${posix.basename(t.puml, '.puml')}.svg`;
  if (files.has(named)) return files.get(named)!;
  if (svgs.length === 0) return 'jar produced no SVG';
  if (svgs.length > 1) return `ambiguous SVG output (${svgs.sort().join(', ')})`;
  return files.get(svgs[0]!)!;
}

/** Output name -> bytes the jar would put in the target; or an error string. */
export function selectOutputs(t: Target, files: ReadonlyMap<string, Buffer>): Map<string, Buffer> | string {
  const out = new Map<string, Buffer>();
  if (wantsSvg(t)) {
    const svg = pickSvg(t, files);
    if (typeof svg === 'string') return svg;
    out.set(svgOutputName(t), svg);
  }
  if (wantsDots(t)) {
    for (const [name, bytes] of files) if (isSvekDot(name)) out.set(name, bytes);
    if (!wantsSvg(t) && out.size === 0) return 'jar produced no svek DOT';
  }
  return out;
}

function failed(detail: string, jarExit?: number): Evaluation {
  const base = {
    status: STATUS.failed,
    desired: new Map<string, Buffer>(),
    changedOutputs: [],
    removedOutputs: [],
    detail,
  };
  return jarExit === undefined || jarExit === 0 ? base : { ...base, jarExit };
}

/** SAME/CHANGED/FAILED for one rendered target against its committed bytes. */
export function evaluate(t: Target, existing: Existing, rendered: Rendered): Evaluation {
  if (rendered.timedOut) return failed('jar timed out');
  const exit = rendered.exitCode ?? undefined;
  const selected = selectOutputs(t, rendered.files);
  if (typeof selected === 'string') return failed(selected, exit);
  const changedOutputs = [...selected]
    .filter(([name, bytes]) => !existing.get(name)?.equals(bytes))
    .map(([name]) => name);
  const removedOutputs = wantsDots(t) ? t.outputs.filter((n) => isSvekDot(n) && !selected.has(n)) : [];
  const same = changedOutputs.length === 0 && removedOutputs.length === 0;
  const base = {
    status: same ? STATUS.same : STATUS.changed,
    desired: same ? new Map<string, Buffer>() : selected,
    changedOutputs,
    removedOutputs,
  };
  return exit === undefined || exit === 0 ? base : { ...base, jarExit: exit, detail: `jar exit ${exit}` };
}

/** A fixture svg is a jar render iff the REFERENCE (current-pin) jar
 *  reproduces it byte-equal. Pure verdict over that reference evaluation. */
export function isJarRender(reference: Evaluation): boolean {
  return reference.status === STATUS.same;
}

/** `not-a-jar-render` verdict, carrying why the reference did not match. */
export function notAJarRender(reference: Evaluation): Evaluation {
  const why =
    reference.status === STATUS.failed ? `reference render failed: ${reference.detail}` : 'reference jar differs';
  return {
    ...reference,
    status: STATUS.notAJarRender,
    desired: new Map(),
    changedOutputs: [],
    removedOutputs: [],
    detail: why,
  };
}

export interface StatusCounts {
  readonly [status: string]: number;
}

export function countByStatus(statuses: readonly Status[]): StatusCounts {
  const counts: Record<string, number> = {};
  for (const s of statuses) counts[s] = (counts[s] ?? 0) + 1;
  return counts;
}

/** Fixture svgs: first decide whether the committed bytes are a render of the
 *  reference (current-pin) jar at all; only then is `candidate` (the jar being
 *  adopted, absent when it IS the reference) judged against them. A svg the
 *  reference does not reproduce is `not-a-jar-render` and is never written. */
export function evaluateFixtureSvg(
  t: Target,
  existing: Existing,
  reference: Rendered,
  candidate: Rendered | undefined,
): Evaluation {
  const ref = evaluate(t, existing, reference);
  if (!isJarRender(ref)) return notAJarRender(ref);
  return candidate ? evaluate(t, existing, candidate) : ref;
}
