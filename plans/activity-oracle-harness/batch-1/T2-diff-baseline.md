# T2 — Pre-chrome diff-baseline ratchet

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-oracle-harness`. T0 captured the activity oracle corpus into
`test-results/dot-cache/activity/`; T1 wrote `renderFixtureActivity`.

**You are pinning a floor, not fixing anything.** Every fixture currently
sits at exactly 12 diffs. T5 will fix the chrome; this baseline is the only
evidence that it worked ([D5]).

## Task
Write the ratchet suite and its manifest, mirroring
`sequence.diff-baseline.ratchet.test.ts`. Read that file's doc comment in
full before starting — especially the paragraph explaining why the gated
quantity is `weightedScore` and not `diffCount`.

Gate semantics:
- **rise** (live `weightedScore` > recorded baseline) → **FAIL**, naming the
  fixture, its baseline, and its new score. No bypass; the gate must never
  acquire one.
- **fall** → PASS, logged `[IMPROVED]`.
- **reaches 0** → PASS, logged `[PROMOTION READY]`. Reports eligibility
  ONLY — this test never writes `ratchet.json` and never copies a file.
  Assert that as a test, not as a claim.
- **error** → `status:"error"` with a `reason`, never a numeric baseline
  ([D8]).

Manifest field names mirror the sequence sibling exactly: `type`, `slug`,
`status`, `weightedScore`, `diffCount`, `measuredAt`,
`measuredAgainstCommit`. Add a `$comment` recording D2's artefact: a risen
`diffCount` beside a fallen `weightedScore` is expected, not a failure.

Create `ratchet.json` with `{"fixtures": []}` — the promotion path exists
but starts empty, exactly as sequence's does.

**Do NOT** create `parity-activity.json` and **do NOT** write an AC3-style
eligibility check ([D9] — activity emits no DOT).

**Do NOT** wrap the suite in `describe.skipIf(!cacheAvailable)` ([D4]). The
cache is committed; an absent tree means a broken checkout. Assert the corpus
is present and complete instead — a gate that can silently skip its own
input is the failure this rule exists to prevent.

`oracle/goldens/svg-activity/README.md` records: the population and how it
was typed, the add rule, and the current state (the 12-path floor, with the
decomposition from the mission README).

## Write-set
- `tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts`
- `oracle/goldens/svg-activity/diff-baseline.json`
- `oracle/goldens/svg-activity/ratchet.json`
- `oracle/goldens/svg-activity/README.md`

Nothing else. No `src/`. Not `oracle-freshness.test.ts` — that is T3.

## Read-set
- `plans/activity-oracle-harness/decisions.md` — D1, D2, D4, D8, D9
- `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts` —
  the template; read the whole doc comment
- `oracle/goldens/svg-sequence/diff-baseline.json` — the exact record shape
- `plans/sequence-root-chrome/decisions.md` — D5 (why `weightedScore`)
- `tests/oracle/svg-conformance/compare.ts:437-480` — `compareSvg`,
  `weightedScore`
- `tests/oracle/svg-conformance/render-fixture-activity.ts` — T1's helper

## Architecture decisions
[D1] diff-baseline not freeze · [D2] gate `weightedScore` · [D4] assert,
never `skipIf` · [D8] errors are not numbers · [D9] no eligibility gate.

## Interface contracts
Consumed by T6:
```json
{ "type": "activity", "slug": "", "status": "baseline|error",
  "weightedScore": 0, "diffCount": 0, "reason": "",
  "measuredAt": "", "measuredAgainstCommit": "" }
```

## Acceptance criteria
- Given a fixture whose live `weightedScore` exceeds its baseline, when the
  suite runs, then it FAILS naming slug, baseline and new score.
- Given a live score below baseline, then it PASSES logged `[IMPROVED]`.
- Given a fixture at 0, then it PASSES logged `[PROMOTION READY]` **and** the
  test is asserted to write no golden and copy no file.
- Given a fixture our parser rejects, then its record is `status:"error"`
  with a reason and **no** `weightedScore`.
- Given an absent or incomplete cache, then the suite FAILS — it does not skip.

## Observability
The gate is the instrument. Its failure message must name the slug and the
first diff path, so the reproduction is `dot-cache/activity/<slug>/in.puml`
plus `scripts/oracle-render.sh`.

## Rollback
**Reversible.** New test + new JSON; deleting them reverts the task.

## Quality bar
All four gates green. Report the suite wall-clock delta — the pre-mission
estimate is ~1.5 s for ~283 fixtures (sequence: 1141 fixtures = 5.91 s test
time). A materially larger number is worth reporting, not tuning for.

## Commit
`test(aoh-T2): pin the pre-chrome activity diff baseline`
