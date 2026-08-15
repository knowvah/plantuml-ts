/**
 * Per-slug structural-check backlogs shared by the four DOT-parity ratchets
 * (description / class / object / state).
 *
 * A backlog file (`direction-backlog.json`, `label-size-backlog.json`) lists
 * slugs known to fail ONE named check of `compareStructural`. Listing a slug
 * is NOT a skip — every other structural check stays live for it, and the
 * fixture must still actually fail the named check, so a fix forces the
 * entry's removal (shrink-only). See each file's own `_doc`.
 *
 * Why the assertion is split across per-file and per-fixture: a fixture with
 * several `svek-N.dot` graphs (state `xupefu-98-roni234`: svek-1 clean,
 * svek-2 label-box miss) is ONE backlog entry, so per file the failures may
 * only be a SUBSET of what the backlogs name, and it is the UNION over the
 * fixture's files that must equal them exactly.
 *
 * `sizeConformantOk` is never a structural check: it is the tolerant size
 * metric, kept out of `structurallyEqual` by design and gated separately by
 * each suite's `size-backlog.json`. It is filtered out here for that reason.
 */
import { expect } from 'vitest';
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

/**
 * Assert one fixture's graphs against its backlogs. `perFile` is the sorted
 * structural failures of each `svek-N.dot` comparison in order.
 *
 * - no backlog entry: every graph must be `structurallyEqual`;
 * - otherwise: each graph may fail only checks the backlogs name, and the
 *   union over all graphs must be EXACTLY those checks.
 */
export function assertBacklogFailures(
  name: string,
  files: readonly string[],
  perFile: readonly (readonly string[])[],
  expected: readonly string[],
): void {
  const seen = new Set<string>();
  perFile.forEach((failing, i) => {
    const file = files[i]!;
    if (expected.length === 0) {
      expect(failing, `${name}/${file}: structural regression — failing checks: ${failing.join(', ')}`).toEqual([]);
      return;
    }
    const extra = failing.filter((k) => !expected.includes(k));
    expect(
      extra,
      `${name}/${file}: backlog fixtures may fail ${expected.join('+')} and NOTHING else — also failing: ${extra.join(', ')}`,
    ).toEqual([]);
    for (const k of failing) seen.add(k);
  });
  if (expected.length > 0) {
    expect(
      [...seen].sort(),
      `${name}: listed in a backlog but no longer fails ${expected.join('+')} — remove its entry (shrink-only)`,
    ).toEqual(expected);
  }
}
