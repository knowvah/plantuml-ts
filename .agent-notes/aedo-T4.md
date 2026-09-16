# aedo-T4 — re-pin and close-out observations

Mission `activity-edge-draw-order`, batch 3. Orchestrator-only: re-pinning is
never delegated, because a pin that rose must be matched to a journal row by
the one reader who saw every task.

## Observation: a targeted vitest run can collect ZERO files and still exit 0

- **Context**: T4 step 6, proving stop 7 (no sibling suite's test count
  changed) by running the five named sibling ratchets at `6ff347f8` and at
  HEAD.
- **Finding**: `npx vitest run <path1> <path2> ... <path10>`, passing ten
  explicit test-file paths as positional filters, printed
  `No test files found, exiting with code 0` in BOTH trees and exited **0**.
  The same files are collected normally — all 27 `svg-conformance` files
  appear in `npx vitest list --filesOnly`. Re-running with a single
  unambiguous substring filter (`npx vitest run svg-conformance`) collected
  27 files and 3428 tests in both trees.
- **Impact**: an exit code of 0 from a *filtered* vitest run is not evidence
  that anything ran. This is the same class as the `coverage/.tmp` silent
  under-collect but reaches further: there, some files ran; here, none did,
  and the run still looked successful. Any gate proved by a filtered run must
  assert on the collected FILE COUNT, not on the exit code. Prefer a
  directory-level substring filter over a list of explicit paths.
- **Confidence**: High — reproduced in two independent trees, and the
  contradiction with `vitest list` isolates it to filter matching.

## Observation: the re-pin tool names four baselines in its summary but writes only the ones that changed

- **Context**: step 3/4, checking that a draw-order change had not disturbed
  the style, text or swimlane pins.
- **Finding**: `repin-activity-baselines.ts` ends with
  `38 change(s) across diff-baseline/style-baseline/text-baseline/swimlane-baseline`,
  which reads as though all four files changed. `git diff --stat` shows
  **one** file modified (`diff-baseline.json`, 131 insertions / 131
  deletions); the other three are byte-identical, not even a
  `measuredAgainstCommit` touch. The sentence names the tool's SCOPE, not its
  writes.
- **Impact**: do not infer which pins moved from that line — diff the
  directory. The distinction matters because three of those four gates being
  unreachable by a draw-order change was itself a finding this mission
  corrected the brief on.
- **Confidence**: High — `git diff --stat` on the working tree after
  `--write`.

## Observation: a prediction derived from the diagnosis task cross-validates the implementation for free

- **Context**: before dispatching T3, deriving from T1's Q5 that rule (a) on
  top of rule (b) must move exactly `gevaxi` (-5) and `jupivo` (-6) — the
  only two affected rows (b) does not touch — for -11, landing at 52067.
- **Finding**: handed to T3 as an explicitly falsifiable prediction with
  instructions NOT to tune toward it. It held to the unit. Three independent
  derivations then agreed on 52067: T1's throwaway scratch (which permuted
  the arrays by hand), the orchestrator's arithmetic over T1's table, and
  T3's real implementation.
- **Impact**: cheap and worth repeating. A diagnosis task that measures each
  rule in isolation lets the orchestrator predict the combined result, so the
  implementing task's number is a CHECK rather than merely an outcome. State
  it as a prediction to be falsified, never as a target — CLAUDE.md forbids
  fitting values, and a target invites exactly that.
- **Confidence**: High — `measurements/scratch-ab.json` and
  `measurements/t3.json` both 52067.

## Observation: the mission's five risers are a metric artefact, and the metric says so

- **Context**: stop 5 required every rise to carry a mechanism before its pin
  was accepted.
- **Finding**: all five (`bumaca` +4, `decudi` +4, `xarumo` +4, `judatu` +2,
  `maketa` +1) are element-COUNT mismatches against the jar, where
  `compareSvg` pairs positionally and `compare.ts:404`'s `[childCount]`
  short-circuit charges the SUM of both sides' sizes. `maketa` is the clean
  proof: its (tag,lane) alignment IMPROVES 10 -> 12 while its score rises.
  Corroboration that these are not implementation bugs: T1's throwaway and
  T2's real implementation produced identical risers at identical magnitudes
  across all 38 rows — a T2 bug could not reproduce T1's numbers to the unit.
- **Impact**: on a pure draw-order mission, budget for named risers from the
  start. An exit bar of "zero rises" would have been unreachable; "zero
  UNEXPLAINED rises" was both achievable and stricter in the way that matters.
- **Confidence**: High — measured per fixture against `base.json`.
