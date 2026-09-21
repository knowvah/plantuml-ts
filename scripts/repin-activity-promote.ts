/**
 * Error-to-baseline PROMOTION for the four activity baselines (mission
 * `unknown-bucket-routing-repair`, batch 2 / T10 merge).
 *
 * `repin-activity-baselines.ts` re-measures only `status: "baseline"` rows,
 * so a fixture pinned `status: "error"` (our parser refused it) that now
 * RENDERS had no path back into the ratchet: every one of the four gates
 * fails it loudly ("recorded as status "error" ... but rendering SUCCEEDED
 * this run. Move it to status "baseline" with a freshly measured census").
 * `repin-sequence-baselines.ts` has that path for sequence
 * (`status "error" -> "baseline" once a fixture renders`); this is the
 * activity twin, split into its own module for the 500-line cap.
 *
 * Contract: a row is promoted only when the SAME render seam the gates use
 * (`renderFixtureActivity` + `DeterministicMeasurer` + `fixtureIncludeStore()`,
 * supplied by the caller as `measure`) returns instead of throwing. A row
 * that still throws is untouched. Nothing is written unless `write` is
 * true; every promotion is printed as `PROMOTED <file> <slug>` either way.
 */

/** The fields a promoted row gains; the file decides which are present. */
export interface PromotedFields {
  readonly weightedScore?: number;
  readonly diffCount?: number;
  readonly ours?: unknown;
  readonly jar?: unknown;
  readonly laneCount?: number;
}

export interface PromoteRow {
  slug: string;
  status: string;
  reason?: string;
  [key: string]: unknown;
}

export interface PromoteDates {
  readonly today: string;
  readonly commit: string;
  /** style/text/diff pin dates per fixture; swimlane pins them at file level only. */
  readonly perFixture: boolean;
}

/** Pure: the promoted copy of an `error` row. `reason` is dropped (it named
 * the refusal that no longer happens); `status` becomes `baseline`; the
 * measured fields follow; dates only when the file pins them per fixture. */
export function promoteRow(row: PromoteRow, fields: PromotedFields, dates: PromoteDates): PromoteRow {
  const rest: PromoteRow = { ...row };
  delete rest.reason;
  const dated = dates.perFixture ? { measuredAt: dates.today, measuredAgainstCommit: dates.commit } : {};
  return { ...rest, status: 'baseline', ...fields, ...dated };
}

/** `measure` returns the promoted fields, or `undefined` when the fixture
 * still errors (the caller wraps the render in try/catch, exactly as the
 * gates do). Mutates `fixtures` in place when `write`; returns the promoted
 * slugs either way. */
export function promoteErrorRows(
  fixtures: PromoteRow[],
  measure: (slug: string) => PromotedFields | undefined,
  dates: PromoteDates,
  opts: { readonly label: string; readonly write: boolean },
): string[] {
  const promoted: string[] = [];
  for (let i = 0; i < fixtures.length; i++) {
    const f = fixtures[i]!;
    if (f.status !== 'error') continue;
    const fields = measure(f.slug);
    if (fields === undefined) continue;
    console.log(`PROMOTED ${opts.label} ${f.slug}`);
    promoted.push(f.slug);
    if (opts.write) fixtures[i] = promoteRow(f, fields, dates);
  }
  return promoted;
}

/** Wraps a throwing measurer into the `undefined`-on-error shape
 * `promoteErrorRows` consumes. */
export function measureOrUndefined<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}
