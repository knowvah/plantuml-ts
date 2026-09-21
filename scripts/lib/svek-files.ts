/**
 * Shared `svek-N.dot` file listing, used by every script that walks a
 * `oracle/goldens/<type>/<slug>/` directory's captured DOT passes in the
 * order the jar produced them.
 *
 * Extracted from six scripts that each defined an identical `svekFiles`
 * (code-review-tasks.md item 2): audit-size-metric-identity.ts,
 * measure-description-size-deltas.ts, measure-class-size-deltas.ts,
 * measure-state-size-deltas.ts, label-box-triage.ts, and oracle-gap.ts
 * (which additionally mapped the result to full paths — see its call site).
 */
import { readdirSync } from 'node:fs';

/** Bare `svek-N.dot` filenames in a golden directory, sorted numerically by N. */
export function svekFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => /^svek-\d+\.dot$/.test(f))
    .sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]));
}
