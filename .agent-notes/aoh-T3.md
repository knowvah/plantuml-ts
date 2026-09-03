# T3 — extend oracle-freshness to activity

## Result

Added one `SENTINELS` entry to
`tests/oracle/svg-conformance/oracle-freshness.test.ts:96-106`:
`{ type: 'activity', slug: 'movexa-27-rexe388' }`.

## Slug choice — why representative, not degenerate

Measured file size and `.puml` line count across all 291 non-error activity
fixtures (`oracle/goldens/svg-activity/diff-baseline.json`, `status !==
'error'`). `movexa-27-rexe388` sits at the median on both axes (4255 of
291 `in.svg` byte sizes; 11 of 291 `.puml` line counts). Its source uses two
swimlanes (`|lane1c|`, `|lane2c|`) plus an `if/then/else` branch — real
branching and layout content, not a single bare `:action;` statement.

Rejected `activity-creole-table` (the only fixture with a human-chosen slug,
so the obvious first look): its `.puml` is 2 statements
(`:|Creole Table Line1|\n|Line2|;`) — exactly the "two-line diagram" the task
spec warns against as degenerate.

## Homogeneity scan coverage — confirmed by reading the code, not assumed

`oracle-freshness.test.ts:191` iterates `SENTINELS.map((s) => [s.type, s])`,
so the new `activity` entry produces a new `it.each` row automatically.
Inside that row, `:203` builds `const dir = join(CACHE, type)` — using the
loop's `type` variable, not a hardcoded list — and `:204`
(`readdirSync(dir)`) walks every slug under `test-results/dot-cache/activity/`,
not just the sentinel's own directory. No code change was needed for the
homogeneity layer to cover activity; adding the `SENTINELS` entry was
sufficient, confirmed by running the suite (see below).

## Verification

- Ran `tests/oracle/svg-conformance/oracle-freshness.test.ts` in isolation:
  20/20 pass (10 types x 2 checks, activity included in both). The
  homogeneity row `'every activity oracle shares the emission form of a
  fresh render, not just the sentinel'` passed, i.e. `offenders.length === 0`
  across all 373 `test-results/dot-cache/activity/*/in.svg` files.
- Independently `cmp`-verified the sentinel outside the test harness:
  copied `test-results/dot-cache/activity/movexa-27-rexe388/in.puml` to a
  temp dir as `activity.puml`, ran `scripts/oracle-render.sh <tmp>
  <tmp>/activity.puml` (which sets `-DPLANTUML_DETERMINISTIC_TEXT=true`),
  and `cmp`'d the fresh `activity.svg` against the cached `in.svg` —
  byte-identical.
- The skip-without-jar path is unchanged code, inherited generically: both
  `it.each` blocks (`:150-156` and `:194-197`) check `haveJar` (set once at
  `:134` from `existsSync(JAR)`) and `console.warn` + assert only presence
  of the cached file rather than failing when the jar is absent. Since
  `activity` is just another `SENTINELS` row, it falls through the same
  branch with no new code.

## Gates

All four run serially, nothing concurrent (per boundary rule):
- `npm test` (full suite): PASS — see commit message / report for exact
  counts and wall-clock.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.
