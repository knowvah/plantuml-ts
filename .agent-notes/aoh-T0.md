# T0 — capture the activity oracle corpus

## Result

- `tests/corpus/activity/*.puml`: 452 files (already populated; did not
  re-run `populate-corpus.py`).
- Typed through OUR dispatcher (`buildBlockUmls` -> first block ->
  `registry.resolve(first.source).plugin.type`, the
  `scripts/oracle-corpus.ts:58` idiom): **373 activity, 73 class, 2
  sequence, 4 unparseable (`none`)** — sums to 452, matches the mission
  brief's pre-mission measurement exactly.
- Captured: **373 of 373** typed-activity fixtures — every one that types
  as activity now has `test-results/dot-cache/activity/<slug>/{in.puml,
  in.svg,.done}`. Verified: `find test-results/dot-cache/activity -name
  '.done' | wc -l` == `ls test-results/dot-cache/activity | wc -l` == 373,
  and every directory contains exactly `{in.puml, in.svg, .done}`, no
  extras.
- `jarFailed`: **empty** (see "jar exit code" finding below — the first
  pass mis-classified 24 fixtures as failed; all 24 were fixed and
  captured on re-inspection).
- `svek-*.dot`: **zero**, across all 373 captured fixtures and all
  intermediate render attempts (D9 confirmed — activity never routes
  through dot).
- `ourParserGaps`: **90** of the 373 activity-typed fixtures make OUR
  `renderSync` (via `src/index.js`, `DeterministicMeasurer` +
  `fixtureIncludeStore()`) produce an error-diagram SVG (detected by the
  text marker `"From string (line"`, drawn by
  `src/core/error/error-renderer.ts`'s `[From string (line N) ]` band —
  see `error-renderer.ts:19`). This matches the mission brief's pre-
  measurement of ~90. Per [D8] these are captured (their jar oracle
  exists) but not fixed here; T2 records them `status:"error"`.

## Finding 1 — jar exit code is not a capture-success signal

`net.sourceforge.plantuml.Run` (invoked by `scripts/oracle-render.sh`,
which is `set -euo pipefail; exec java ...`) exits **200**, not 0, whenever
ANY per-diagram error occurred during that run — an internal
`SlotFinder`/`Slot` edge case (`IllegalArgumentException: start=X end=X`,
16 fixtures), an embedded-diagram (`{{ ... }}`) sub-render failure
(`NullPointerException` in `PortableImageAwt.getWidth`, 2 fixtures), or a
parse-level "Some diagram description contains errors" (6 fixtures) — even
though it still writes a COMPLETE, valid SVG for the outer diagram to
`-o`. This is upstream's own CLI convention: the exit code communicates
"an error occurred somewhere," independent of whether output was
produced.

The first capture pass treated `execFileSync` throwing (nonzero exit) as
"no oracle available" and deleted the just-written SVG. Verified by
manually re-running all 24 originally-"jarFailed" slugs: every one
produced a real `data-diagram-type="ACTIVITY"` SVG despite exit 200.
Fixed by re-running with success determined from the files actually
present in the output directory, ignoring the process exit code. Net
result: `jarFailed` is empty; `captured` == `typed activity` == 373.

## Finding 2 — one fixture's SVG is named after its diagram, not its input file

`pufuzi-99-vone170.puml` opens `@startuml test` (single block — the
mission brief's pre-mission note "a second `@startuml` block" does not
literally apply to this fixture; the underlying naming mechanism is the
same). When a PlantUML block carries an explicit name, the jar names that
block's output SVG after the diagram's own name rather than the input
file's basename — confirmed with a synthetic two-block probe
(`@startuml` / `@startuml test` -> `<input>.svg` + `test.svg`; two
untitled blocks -> `<input>.svg` + `<input>_001.svg`). Handling: after
render, if `in.svg` is absent but exactly one `.svg` was produced, that
lone file is the block-0 capture regardless of its name, copied into the
cache as `in.svg`. No multi-block source exists in this corpus (`grep -c
'@startuml' tests/corpus/activity/*.puml` — none has more than 1), so this
path affected exactly one fixture.

## Finding 3 — `.done` is a hidden dotfile

A bare `ls` on a capture directory looks like it's missing the marker;
`ls -a` (or `find -name .done`) is required. Not a defect, just a
recording so a later `ls`-based sanity check doesn't misfire.

## Manifest re-pin

`test-results/render-manifest-baseline.json`, on disk only (gitignored,
never committed — `.gitignore:24-25`; per prior mission precedent this
task does NOT `git add -f` it):
- Before: 3158 entries, sha256
  `31d876ce0e9e5131fddcc56eb0d9d1164b38d988372663a42ff8347a24381a9f`
- After: 3531 entries, sha256
  `51cd7bf24f62f5afb8edc70e5ceecdca9c5691e12385904b08222b504382e42f`
- Delta: +373, exactly `captured`.

## BLOCKER — not resolved by this task, holding the commit

`npm test` (full suite) fails with **2 failed test files**, both
pre-existing, unrelated-mission corpus-completeness gates that are not in
this mission's scope:

- `tests/oracle/svg-conformance/routing-conformance.test.ts` — "every
  fixture on disk is pinned, and every pin is on disk" (source ~line 458)
- `tests/oracle/svg-conformance/refusal-coverage.test.ts` — same
  assertion shape (source ~line 461)

Both walk the FULL `test-results/dot-cache/**` + `oracle/goldens/**` tree
and assert every discovered fixture has a matching entry in
`oracle/goldens/svg-conformance/routing-baseline.json` /
`refusal-baseline.json`. Those two baseline files are maintained by
`routing-heuristic-repair` / `dispatch-by-parse-attempt` (unrelated prior
missions) and were last re-pinned 2026-08-24, before `dot-cache/activity/`
existed. Adding 373 new directories under `test-results/dot-cache/`
(exactly this task's write-set) makes both gates report 373 unpinned
fixtures each — confirmed NOT the coverage/.tmp race (both failures carry
a full `Test Files 2 failed | 679 passed | 1 skipped (682)` summary line
and named `AssertionError`s, not an `ENOENT`).

This is not a fixable-within-write-set failure:
- `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json` are not
  in T0's write-set, nor in ANY task's write-set across
  `plans/activity-oracle-harness/batch-{0..5}/overview.md` (grepped, no
  hits). The mission brief did not anticipate this interaction.
- `scripts/repin-sequence-baselines.ts`'s own header states the repo
  convention explicitly: "ORCHESTRATOR-ONLY. Task agents never write a
  baseline JSON: five parallel agents would collide on one file, and
  re-pinning before adjudicating would bake regressions into the
  baseline." Classifying each new fixture (`agree` / `known-misroute` /
  `jar-error`) is real per-fixture judgment work (that is what
  `routing-heuristic-repair` spent multiple batches doing for the other
  engines), not a mechanical append.
- This matches the mission brief's own stop condition 1 verbatim: "A task
  requires modifying files outside its declared write-set, and those
  files aren't in any other task's write-set either."

Gate status at hand-off: `npm test` RED (2/682 files, the above two only —
all 17638+2 individual test cases in every OTHER file pass, including
680/682 files clean); `npm run typecheck` GREEN; `npm run lint` GREEN;
`npm run build` GREEN (exit 0; the dts-generation step prints benign
`TS2591`/`TS2503` noise from `src/core/include-resolver-node.ts` under
API Extractor's bundled TS 5.9.3 vs. the project's TS 6.0.3 — pre-existing,
untouched by this task, and does not affect the build's exit code).

**Not committed.** `test-results/dot-cache/activity/**` and this note are
staged-and-ready but held pending a decision on how the routing/refusal
baselines get their 373 new entries (a dedicated repin task/script, or an
explicit, coordinator-authorized extension of T0's write-set).
