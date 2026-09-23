/**
 * `npx jiti plans/class-divergence-drive/tools/pin-diff.mts <a.json> <b.json>`
 *
 * Prints, per slug present in either file: verdict transitions
 * (`a.verdict -> b.verdict`), `dotEqual` flips (only when BOTH files carry
 * the field — `parity-class.json`'s `FixtureRow` does, `render-all.mts`'s
 * `RenderAllRow` does not), and diff-count deltas where
 * `b.structural + b.numeric > a.structural + a.numeric` (only when both
 * files carry `structural`/`numeric`, i.e. both are `render-all.mts`
 * output — `FixtureRow` has no per-count fields, only `maxDelta`). A slug
 * present in only one file is reported, never silently dropped (D11).
 *
 * Accepts either shape on either side: a `ParityReport` object
 * (`{ generatedAt, fixtures: FixtureRow[] }`, `parity-class.json`'s shape)
 * or a bare `RenderAllRow[]` array (`render-all.mts`'s output shape).
 *
 * This is a report, not a gate (mirrors `svg-parity-survey.ts`'s own
 * framing): it always exits 0, even when it finds transitions. Journaling
 * and adopting a rise is a human/close-task decision (D11), not this tool's.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

interface UnifiedRow {
  slug: string;
  verdict: string;
  dotEqual?: boolean;
  structural?: number;
  numeric?: number;
}

interface FixtureRowLike {
  slug: string;
  verdict: string;
  dotEqual: boolean;
}

interface RenderAllRowLike {
  slug: string;
  verdict: string;
  structural: number;
  numeric: number;
}

type ParityReportLike = { generatedAt: string; fixtures: FixtureRowLike[] };
type PinFile = ParityReportLike | RenderAllRowLike[];

function toUnifiedRow(r: FixtureRowLike | RenderAllRowLike): UnifiedRow {
  const base: UnifiedRow = { slug: r.slug, verdict: r.verdict };
  if ('dotEqual' in r) base.dotEqual = r.dotEqual;
  if ('structural' in r) base.structural = r.structural;
  if ('numeric' in r) base.numeric = r.numeric;
  return base;
}

/** Normalizes either accepted shape into a slug -> row map, preserving only
 *  the fields each shape actually carries (T0b correction 4). */
export function toUnifiedRows(parsed: PinFile): Map<string, UnifiedRow> {
  const rows = Array.isArray(parsed) ? parsed : parsed.fixtures;
  const map = new Map<string, UnifiedRow>();
  for (const r of rows) map.set(r.slug, toUnifiedRow(r));
  return map;
}

export function loadPinFile(path: string): Map<string, UnifiedRow> {
  const parsed = JSON.parse(readFileSync(path, 'utf-8')) as PinFile;
  return toUnifiedRows(parsed);
}

function onlyInOne(slug: string, side: 'A' | 'B', row: UnifiedRow): string {
  const marker = side === 'A' ? '-' : '+';
  const other = side === 'A' ? 'A' : 'B';
  return `${marker} ${slug}: only in ${other} (verdict=${row.verdict})`;
}

function transitionLines(a: UnifiedRow, b: UnifiedRow): string[] {
  const lines: string[] = [];
  if (a.verdict !== b.verdict) lines.push(`verdict ${a.verdict} -> ${b.verdict}`);
  if (a.dotEqual !== undefined && b.dotEqual !== undefined && a.dotEqual !== b.dotEqual) {
    lines.push(`dotEqual ${a.dotEqual} -> ${b.dotEqual}`);
  }
  if (a.structural !== undefined && a.numeric !== undefined && b.structural !== undefined && b.numeric !== undefined) {
    const sumA = a.structural + a.numeric;
    const sumB = b.structural + b.numeric;
    if (sumB > sumA) lines.push(`diff count rose ${sumA} -> ${sumB}`);
  }
  return lines;
}

/** One transition line for a slug present in both, one, or (defensively)
 *  neither file, or `undefined` when nothing changed. */
export function diffRow(slug: string, a: UnifiedRow | undefined, b: UnifiedRow | undefined): string | undefined {
  if (b === undefined) return a === undefined ? undefined : onlyInOne(slug, 'A', a);
  if (a === undefined) return onlyInOne(slug, 'B', b);
  const lines = transitionLines(a, b);
  return lines.length === 0 ? undefined : `${slug}: ${lines.join(', ')}`;
}

export function computeTransitions(a: Map<string, UnifiedRow>, b: Map<string, UnifiedRow>): string[] {
  const slugs = [...new Set([...a.keys(), ...b.keys()])].sort();
  const out: string[] = [];
  for (const slug of slugs) {
    const line = diffRow(slug, a.get(slug), b.get(slug));
    if (line !== undefined) out.push(line);
  }
  return out;
}

function main(): void {
  const [aPath, bPath] = process.argv.slice(2);
  if (aPath === undefined || bPath === undefined) {
    console.error('usage: pin-diff.mts <a.json> <b.json>');
    process.exitCode = 2;
    return;
  }
  const transitions = computeTransitions(loadPinFile(aPath), loadPinFile(bPath));
  if (transitions.length === 0) {
    console.log('0 transitions');
    return;
  }
  for (const line of transitions) console.log(line);
  console.log(`${transitions.length} transition(s)`);
}

/* v8 ignore start -- CLI entry point; exercised via the acceptance run, not
 * the unit-test suite. */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
