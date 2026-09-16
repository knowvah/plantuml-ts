/**
 * `--align <slug>` helpers for `activity-probe.ts` (mission
 * `activity-if-tile-port`, T1/Q6).
 *
 * Split into a sibling module rather than grown inline: `activity-probe.ts`
 * was 442 lines before this flag, and `--align`'s per-tag-count +
 * positional-alignment logic would have crossed the file's 500-line cap
 * (`~/.claude/rules/code-principles.md`) -- see the T1 decision-journal row.
 * Pure functions only (no fs/CLI); `activity-probe.ts` owns the flag wiring
 * and fixture I/O, exactly like it owns `--dump`/`--lanes` today.
 *
 * `n/N` positional alignment mirrors the manual figure Q1's templates
 * record by hand and the ad hoc count in `.agent-notes/aedo-T1.md` (e.g.
 * "positional agreement 17/42" on `cemipu-87-dinu624`): elements are
 * compared INDEX-FOR-INDEX in `--dump`'s own document-order-filtered-to-
 * `DUMP_TAGS` list, matching when both `tag` and lane agree at the same
 * index -- never re-sorted or nearest-neighbour matched, since that is
 * exactly the positional pairing `weightedScore` itself performs
 * (`tests/oracle/svg-conformance/compare.ts`).
 */
import type { NormalizedNode } from '../tests/oracle/svg-conformance/normalize.js';
import { normalizeSvg } from '../tests/oracle/svg-conformance/normalize.js';
import { censusOf } from '../tests/oracle/svg-conformance/swimlane-census.js';
import { centerXOf, laneIndexOf, flattenElements } from './activity-probe.js';

/** The tags `--dump` already filters to (`activity-probe.ts`'s
 * `DUMP_TAGS`), duplicated as the literal Q6 asks for by name
 * (`polygon`, `line`, `text`, `rect`) rather than importing the private
 * set -- `ellipse` is deliberately excluded here: Q6 names four tags. */
const ALIGN_TAGS = new Set(['polygon', 'line', 'text', 'rect']);

export interface TagLane {
  readonly tag: string;
  readonly lane: number | null;
}

/** One (tag, lane) entry per matching element, in document order -- the
 * same order `--dump` prints, restricted to `ALIGN_TAGS`. */
export function taggedElementsOf(svg: string): TagLane[] {
  const lanes = censusOf(svg).lanes;
  const elements = flattenElements(normalizeSvg(svg)).filter((n: NormalizedNode) => ALIGN_TAGS.has(n.tag ?? ''));
  return elements.map((n) => {
    const x = centerXOf(n);
    const lane = x === undefined ? null : laneIndexOf(x, lanes);
    return { tag: n.tag!, lane };
  });
}

/** `{ ours, jar }` element counts per tag, over the four `ALIGN_TAGS`. */
export function perTagCounts(
  ours: readonly TagLane[],
  jar: readonly TagLane[],
): Record<string, { ours: number; jar: number }> {
  const out: Record<string, { ours: number; jar: number }> = {};
  for (const tag of ALIGN_TAGS) out[tag] = { ours: 0, jar: 0 };
  for (const e of ours) out[e.tag]!.ours += 1;
  for (const e of jar) out[e.tag]!.jar += 1;
  return out;
}

/** Index-for-index (tag, lane) agreement -- `matched` out of `total`
 * (`total` is the longer side's length; extra elements on either side
 * are automatic non-matches at their index, never dropped). */
export function alignmentOf(ours: readonly TagLane[], jar: readonly TagLane[]): { matched: number; total: number } {
  const total = Math.max(ours.length, jar.length);
  let matched = 0;
  for (let i = 0; i < total; i += 1) {
    const a = ours[i];
    const b = jar[i];
    if (a !== undefined && b !== undefined && a.tag === b.tag && a.lane === b.lane) matched += 1;
  }
  return { matched, total };
}

export interface AlignReport {
  readonly perTag: Record<string, { ours: number; jar: number }>;
  readonly alignment: { matched: number; total: number };
}

/** The full `--align` report for one slug's two rendered SVGs. */
export function alignReport(oursSvg: string, jarSvg: string): AlignReport {
  const ours = taggedElementsOf(oursSvg);
  const jar = taggedElementsOf(jarSvg);
  return { perTag: perTagCounts(ours, jar), alignment: alignmentOf(ours, jar) };
}
