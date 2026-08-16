/**
 * The vitest-free half of `dot-parity-backlogs.ts`: which backlog file names
 * which `compareStructural` check, how to load a backlog, and the pure
 * set arithmetic over a `StructuralDiff`. Split out so that the size-delta
 * SCRIPTS (`scripts/measure-description-size-deltas.ts`,
 * `scripts/measure-class-size-deltas.ts` — run under `tsx`/`jiti` in CI, no
 * vitest runner) can honour the same backlog contract the ratchet tests do:
 * a fixture whose only failing checks are the ones its backlogs name is
 * still MEASURABLE for size, not "structurally unequal".
 *
 * Background (2026-08-15): edge-label-box D7 (`d3ff29be`) folded
 * `labelSizeOk` into `structurallyEqual` and pinned the fixtures it surfaced
 * in `label-size-backlog.json` for the ratchet TESTS — but the description
 * size-delta script kept short-circuiting on `!structurallyEqual`, so those
 * 10 description fixtures read as `widened` (delta null) and CI's
 * `description size deltas` gate exited 2 on the next push to main.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StructuralDiff } from './svek-dot.js';

/** Which `compareStructural` check each backlog file names. */
export const BACKLOG_CHECKS = {
  'direction-backlog.json': 'directionOk',
  'label-size-backlog.json': 'labelSizeOk',
} as const;
export type BacklogFile = keyof typeof BACKLOG_CHECKS;

/** `{ slugs: [...] }` from `<goldens>/<file>`, or empty when absent. */
export function loadSlugBacklog(goldens: string, file: BacklogFile): ReadonlySet<string> {
  const path = join(goldens, file);
  if (!existsSync(path)) return new Set();
  return new Set((JSON.parse(readFileSync(path, 'utf8')) as { slugs: string[] }).slugs);
}

/** Every backlog file under `goldens`, loaded once. */
export function loadStructuralBacklogs(goldens: string): ReadonlyMap<BacklogFile, ReadonlySet<string>> {
  const out = new Map<BacklogFile, ReadonlySet<string>>();
  for (const file of Object.keys(BACKLOG_CHECKS) as BacklogFile[]) out.set(file, loadSlugBacklog(goldens, file));
  return out;
}

/** The checks `name` is allowed (and required, in union) to fail, sorted. */
export function expectedBacklogFailures(
  name: string,
  backlogs: ReadonlyMap<BacklogFile, ReadonlySet<string>>,
): string[] {
  const out: string[] = [];
  for (const [file, slugs] of backlogs) if (slugs.has(name)) out.push(BACKLOG_CHECKS[file]);
  return out.sort();
}

/** Every `*Ok` check that is false on `diff`, excluding the size metric. */
export function structuralFailures(diff: StructuralDiff): string[] {
  return Object.entries(diff)
    .filter(([k, v]) => k.endsWith('Ok') && k !== 'sizeConformantOk' && v === false)
    .map(([k]) => k)
    .sort();
}

/** The failing checks of `diff` that NO backlog excuses — empty means the
 *  graph is structurally acceptable (equal, or off only where its backlogs
 *  say), so its size delta is meaningful. Pure. */
export function unexcusedFailures(diff: StructuralDiff, expected: readonly string[]): string[] {
  return structuralFailures(diff).filter((k) => !expected.includes(k));
}
