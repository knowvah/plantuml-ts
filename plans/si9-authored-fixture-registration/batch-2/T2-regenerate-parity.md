# T2 — Regenerate `usecase` parity; inspect drift

## Context

See [`../README.md`](../README.md) for the chain. T1 made the three authored
fixtures reachable by the cache builder; this task turns that into
`parity.json` rows, which is what the ratchet's AC3 eligibility test reads.

**No source file changes in this task.** The deliverable is a regenerated
data file plus a review of what moved.

## Task

1. Rebuild the `usecase` dot-cache so the three authored fixtures are
   present. Confirm each has `.done`, `in.puml`, `in.svg`, `svek-1.dot`
   before proceeding — if any is missing, T1 is incomplete and this is a
   **STOP**, not something to work around.
2. Run the parity survey for `usecase` only
   ([ADR-3](../decisions.md#adr-3)) and write
   `tests/oracle/svg-conformance/parity.json`.
3. Diff the regenerated file against the committed one and **read every
   changed row**.

Both scripts take the jar from `oracle/dist/plantuml-oracle.jar` (present;
java 21 present). Cache builds are slow — expect minutes, not seconds, and do
not assume a fast run means it worked.

## Write-set — write NOTHING outside these

- `tests/oracle/svg-conformance/parity.json` (regenerate — never hand-edit)
- `plans/si9-authored-fixture-registration/decision-journal.md` (the drift
  report)

`test-results/` is gitignored; rebuilding it is expected and is not a
write-set violation.

## Read-set

- `scripts/svg-parity-survey.ts` — `computeDotEqual` :158,
  `listFixtureDirs` :182, `renderOneMode` :211, `parseSurveyArgs` :373.
  **Line numbers drift — follow the code.**
- `scripts/dot-sync-report.ts` — the cache builder, as modified by T1
- `tests/oracle/svg-conformance/parity.json` — the committed baseline

## Architecture decisions (locked)

- [ADR-3](../decisions.md#adr-3) — regenerate `usecase` **only**. Do not
  regenerate other types "for consistency"; it mixes unrelated drift into
  this mission's diff and defeats the review below.

## Interface contract (consumed by T3)

Three rows in `parity.json`:

```json
{ "slug": "sprite-svg-bootstrap-0",  "type": "usecase", "dotEqual": true, ... }
{ "slug": "sprite-svg-archimate-0",  "type": "usecase", "dotEqual": true, ... }
{ "slug": "sprite-svg-multiline-0",  "type": "usecase", "dotEqual": true, ... }
```

`dotEqual: true` is what AC3 requires. The remaining fields
(`verdict`, `maxDelta`, `firstDiff`, `maxDeltaPath`) are whatever the survey
measures — **do not curate them.**

## Acceptance criteria

1. Given the rebuilt cache, when the survey runs for `usecase`, then
   `parity.json` gains exactly three rows, all `dotEqual: true`.
2. Given the regenerated file diffed against the committed one, then every
   changed pre-existing row is recorded in the journal with before/after
   values.
3. Given zero changed pre-existing rows, then say so explicitly — a clean
   diff is a result worth stating, not silence.
4. Given any changed row whose movement is not explained by this mission,
   then **STOP and report it**; do not commit the regenerated file.
5. Given `npm test`, then it exits 0 with the three new rows present and no
   fixture yet ratcheted (T3 does that).

## Quality bar

All four gates exit 0. 389 SVG goldens byte-identical.
`npx tsx scripts/measure-description-size-deltas.ts` at 320/351, widened 0.

## Observability

N/A — no new observable operations. T1 owns this mission's diagnostics.

## Rollback

**Reversible** — `git checkout` the committed `parity.json`. The local cache
under `test-results/` is gitignored and rebuildable.

## Boundaries

**Always:** treat `parity.json` as generated output. Regenerate it; never
type into it.

**Never — this is a STOP:** hand-write, adjust, reorder or "fix" a row to
make something pass. Its fields come from a measured render path
(`renderSync` + `WidthTableMeasurer`), so an edited row is fabricated oracle
data. If a row looks wrong, that is a finding for the maintainer.

**Never:** edit a `golden.svg`. Never re-pin
`oracle/goldens/description/size-backlog.json`.

## Method rules

1. **Trace dependency cascades TWO levels** — before declaring the diff
   clean, check what else reads `parity.json` (at minimum
   `description.golden.ratchet.test.ts`, `scripts/svg-overlay-report.ts`,
   `scripts/svg-parity-dashboard.ts`) and whether a changed row affects them.
2. **Verify any "already fixed / already generated" claim against the CURRENT
   state on disk.** A cache directory that exists is not proof it was rebuilt
   — check timestamps or contents, not existence.

## Commit

One commit: `test(T2): regenerate usecase parity with authored fixtures`
