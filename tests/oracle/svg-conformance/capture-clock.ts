/**
 * The capture clock (gantt-engine-port D3b): which oracle sources read the
 * wall clock, how a sidecar key is named, and the sidecar's shape.
 *
 * Pure -- no I/O. The scripts (`scripts/oracle-render.sh` via
 * `scripts/record-capture-clock.ts`, `scripts/oracle-corpus.ts`) and
 * `capture-clock.test.ts` all share these functions so the key format cannot
 * drift between the recorder and the checker.
 */

/** One sidecar row: the instant the jar started and the JVM default zone. */
export interface CaptureClockEntry {
  readonly epochMillis: number;
  readonly zone: string;
}

/** `oracle/capture-clock.json`: `{ "<key>": CaptureClockEntry }`. */
export type CaptureClockRecord = Readonly<Record<string, CaptureClockEntry>>;

/** Key prefix for authored sources under `tests/fixtures/`. */
export const FIXTURE_KEY_PREFIX = 'fixtures/';

const PUML_SUFFIX = '.puml';
const TIM_NOW = /%now\s*\(/gi;
const TIM_DATE = /%date\s*\(/gi;
/** `%date(format, epochSeconds)`: a timestamp argument pins the instant. */
const DATE_TIMESTAMP_ARG_COUNT = 2;

const GANTT_START = /^\s*@startgantt\b/im;
/** `today is colored ...` -- `SubjectToday` verb `isColored` (reads the clock when `today` is unset). */
const TODAY_COLORED_FIRST = /^\s*today\s+is\s+colored\b/i;
/** `today is <date>` -- verb `is` + `ComplementDate`, which sets `today` (`GanttDiagram.java:469`). */
const TODAY_SET = /^\s*today\s+is\s+(?!colored\b)\S/i;
/** Day subject `T+N` / `T-N` (`SubjectDayAsDate.java:113-123`, ubrex `[dDtTeE][-+]\d+` at `:132-137`). */
const T_OFFSET = /(?<![\w$])[tT][-+]\d+\b/;

/** Number of top-level arguments of the call whose `(` is at `open`; -1 if unterminated. */
function countCallArguments(source: string, open: number): number {
  let depth = 0;
  let args = 0;
  let sawToken = false;
  let quote: string | undefined;
  for (let i = open; i < source.length; i++) {
    const c = source[i]!;
    if (quote !== undefined) {
      if (c === quote) quote = undefined;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      sawToken = true;
    } else if (c === '(') {
      depth++;
      if (depth > 1) sawToken = true;
    } else if (c === ')') {
      depth--;
      if (depth === 0) return sawToken ? args + 1 : 0;
    } else if (c === ',' && depth === 1) {
      args++;
    } else if (!/\s/.test(c)) {
      sawToken = true;
    }
  }
  return -1;
}

/**
 * TIM: `%now()` always reads the clock (`tim/builtin/Now.java:56`,
 * `System.currentTimeMillis()`); `%date` reads it unless a timestamp argument
 * is given -- 0 args: `new Date()` (`DateFunction.java:71-72`); 1 arg:
 * `System.currentTimeMillis()` (`:76-79`); >= 2 args: `1000L * values.get(1)`
 * (`:76-77`), fixed.
 */
function timReadsClock(source: string): boolean {
  if (new RegExp(TIM_NOW.source, 'i').test(source)) return true;
  for (const m of source.matchAll(TIM_DATE)) {
    const args = countCallArguments(source, m.index + m[0].length - 1);
    if (args < DATE_TIMESTAMP_ARG_COUNT) return true;
  }
  return false;
}

/**
 * Gantt: statement order matters. `today` falls back to the clock when it is
 * read before being set (`GanttDiagram.java:455-466`: `getToday()` and
 * `setTodayColors()` call `TimePoint.todayAtMidnight()` when `today == null`;
 * `setToday` at `:469` sets it). Readers: `today is colored ...` and a `T+N`
 * day subject. `D+N` / `E+N` read the project's own min/max day.
 */
function ganttReadsClock(source: string): boolean {
  let todaySet = false;
  for (const line of source.split(/\r?\n/)) {
    if (TODAY_COLORED_FIRST.test(line)) {
      if (!todaySet) return true;
    } else if (TODAY_SET.test(line)) {
      todaySet = true;
    }
    if (!todaySet && T_OFFSET.test(line) && !/^\s*(?:'|\/')/.test(line)) return true;
  }
  return false;
}

/** True when the jar's output for this source depends on the wall clock. */
export function isClockDependentSource(source: string): boolean {
  if (timReadsClock(source)) return true;
  return GANTT_START.test(source) && ganttReadsClock(source);
}

/** Sidecar key for a corpus row: `<engine>/<slug>` (`test-results/dot-cache/<engine>/<slug>`). */
export function corpusClockKey(engine: string, slug: string): string {
  return `${engine}/${slug}`;
}

/** Sidecar key for an authored source: `fixtures/<path under tests/fixtures without .puml>`. */
export function fixtureClockKey(relativePath: string): string {
  const normal = relativePath.split('\\').join('/');
  return `${FIXTURE_KEY_PREFIX}${normal.endsWith(PUML_SUFFIX) ? normal.slice(0, -PUML_SUFFIX.length) : normal}`;
}

/**
 * Derives the sidecar key from a source path, or `undefined` when the path is
 * in neither tree: `.../tests/fixtures/<rest>.puml` -> `fixtures/<rest>`;
 * `.../test-results/dot-cache/<engine>/<slug>/<file>.puml` -> `<engine>/<slug>`.
 */
export function clockKeyForPath(pumlPath: string): string | undefined {
  const p = pumlPath.split('\\').join('/');
  const fixtures = /\/tests\/fixtures\/(.+\.puml)$/.exec(p);
  if (fixtures) return fixtureClockKey(fixtures[1]!);
  const cache = /\/test-results\/dot-cache\/([^/]+)\/([^/]+)\/[^/]+\.puml$/.exec(p);
  if (cache) return corpusClockKey(cache[1]!, cache[2]!);
  return undefined;
}

/** Returns `record` with `key` set to `entry`, keys sorted (stable diffs). */
export function withClockEntry(record: CaptureClockRecord, key: string, entry: CaptureClockEntry): CaptureClockRecord {
  const merged: Record<string, CaptureClockEntry> = { ...record, [key]: entry };
  return Object.fromEntries(Object.entries(merged).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}
