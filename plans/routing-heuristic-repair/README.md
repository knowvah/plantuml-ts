# Mission: `routing-heuristic-repair`

**Branch:** `feat/routing-heuristic-repair` · **Planned:** 2026-08-23 ·
**Baseline commit:** `95cd89ab` (`feat/routing-conformance`, all gates green)

Re-scoped out of `sequence-engine-overclaims-nested-diagrams` batch 4, which
halted at T2 before reaching it. **Every bucket below was re-measured against
the live tree**, not carried over: the parent brief scoped its batch-4 tasks
"by the residual T3 measured", and T3 will never run.

## Prerequisite, already landed

`oracle/goldens/svg-conformance/routing-baseline.json` and
`tests/oracle/svg-conformance/routing-conformance.test.ts` (`ef62ef74`). This
mission does not build a measuring instrument; it consumes one. The gate
compares our `data-diagram-type` against the jar's across 3158 fixtures in
both trees and ratchets **down only**.

## Objective

Close the routing gap **without touching registration order**. The parent
mission proved the order is load-bearing (see [D1](decisions.md#d1)); this
mission narrows the `accepts()` heuristics that the order is currently
compensating for. Baseline **79**; **75** of those are real defects and this
mission targets all 75.

## The measured scope — verify, do not re-derive

Measured 2026-08-23 at `95cd89ab` over all 3158 fixtures. Every mechanism
below was read out of the source or the fixture, not inferred from a bucket
name.

| n | jar → ours | mechanism | lives in | task |
|---|---|---|---|---|
| 34 | SEQUENCE → DESCRIPTION | `hasDescriptiveSignal` over-declines: `queue` is both a sequence participant type and a description keyword | `src/core/descriptive-keywords.ts` | [T4](batch-3/T4-descriptive-signal.md) |
| 12 | SEQUENCE → JSON | json's `accepts()` claims braces in **message text** — `struct timespec initialTimeout={1,0}` | `src/diagrams/json/index.ts` | [T3](batch-2/T3-json-yaml-braces.md) |
| 9 | SEQUENCE → NONE | activity's `/^\|.+\|/` swimlane pattern claims `\|\|\|`, `\|\|0\|\|` and **creole table rows** in a legend | `src/diagrams/activity/index.ts` | [T2](batch-2/T2-activity-swimlane.md) |
| 6 | SEQUENCE → CLASS | the 20-line detection window is exhausted by `sprite` data or `!include` expansion before any diagram line is seen | `src/core/block-extractor.ts` | [T5](batch-4/T5-detect-uml-type.md) |
| 3 | SEQUENCE → CLASS | `probeSequence`'s `/->\|-->/` misses **left-pointing** arrows (`<<--`), and `activate`/`deactivate`/`note over` are not sequence signals | `src/core/block-extractor.ts` | [T5](batch-4/T5-detect-uml-type.md) |
| 3 | SEQUENCE → CLASS | `classAccepts` probes **inside** `{{ }}` embedded diagrams and `!procedure` bodies, and reads `o->` / `<<--o` as class relations | `src/diagrams/class/class-dispatch.ts` | [T6](batch-5/T6-class-dispatch.md) |
| 2 | SEQUENCE → YAML | yaml's `accepts()`, same shape as json's | `src/diagrams/yaml/index.ts` | [T3](batch-2/T3-json-yaml-braces.md) |
| 2 | CLASS → YAML | yaml's `accepts()` claims class diagrams | `src/diagrams/yaml/index.ts` | [T3](batch-2/T3-json-yaml-braces.md) |
| 2 | CLASS → DESCRIPTION | description over-claims class sources under `component/` | `src/core/descriptive-keywords.ts` | [T4](batch-3/T4-descriptive-signal.md) |
| 1 | CLASS → SEQUENCE | `SEQUENCE_PATTERNS[0]` is an unanchored `/->>?\|-->>?/`, matching `-->` inside the string literal `$arrow("-->")` | `src/diagrams/sequence/index.ts` | [T7](batch-5/T7-sequence-arrow.md) |
| 1 | SEQUENCE → NONE | preprocessor failure — `nuvoja-46-dezu541` produces no usable block at all | unknown | [T9](batch-6/T9-preprocessor-failure.md) |
| **4** | **NONE → CLASS** | **not a defect** — the jar produced an ERROR PAGE (two version banners, one `NullPointerException`, one deliberate `allowmixing` rejection) and we render the diagram | gate classification | [T1](batch-1/T1-jar-error-classification.md) |

**75 defects + 4 non-defects = 79.** T1 exists so the denominator stops
lying: three of the four are jar crashes, and the fourth
(`svg-class/class-actor-bare-no-allowmixing`) is a fixture whose **own header
already documents** that this port reaching its class engine is correct.

## The lesson that shapes every task

The parent mission died because a change was judged by "did engine X stop
claiming this" instead of "did the fixture reach the jar's engine". `resolve`
takes the **first** accepting plugin, so a narrowing does not deliver a
fixture to the right engine — it releases it to whichever plugin is next.

So this was measured too, per fixture. **Where each bucket lands once its
over-claimer declines:**

| bucket | next claimer | verdict |
|---|---|---|
| SEQUENCE → JSON (12) | sequence ×12 | ✅ lands right |
| SEQUENCE → YAML (2) | sequence ×2 | ✅ |
| SEQUENCE → CLASS (3, `classAccepts`) | sequence ×3 | ✅ |
| CLASS → YAML (2) | nobody → falls back to detected `class` | ✅ |
| CLASS → DESCRIPTION (2) | nobody → falls back to detected `class` | ✅ |
| SEQUENCE → DESCRIPTION (34) | nobody ×33 → detected `sequence` ✅ · **json ×1** | ⚠️ 1 crosses |
| SEQUENCE → NONE (9, activity) | sequence ×8 ✅ · **yaml ×1** | ⚠️ 1 crosses |
| CLASS → SEQUENCE (1) | nobody → falls back to detected **`sequence`** | ❌ needs T6 too |

**Three measured cross-task dependencies**, which is why the batches are
ordered the way they are and not simply run in parallel:

1. `sequence/dugeki-47-celo546` (T2's bucket) falls to **yaml** unless T3 has
   landed.
2. `sequence/repudi-21-rovo448` (T4's bucket) falls to **json** unless T3 has
   landed.
3. `object/zuvila-56-nuda425` (T7's bucket) is *detected* as sequence, so
   narrowing sequence's arrow alone leaves the fallback routing it to
   sequence anyway. It closes only when **T6 makes `classAccepts` claim
   `map` positively**. Neither task fixes it alone.

## Exit bar

- Routing gate at **0 real misroutes**, with the 4 jar-error fixtures
  classified rather than pinned
- **Zero** fixtures newly misroute — the gate ratchets down only
- **Zero** of the 482 promoted zero-diff fixtures de-promoted across the 10
  `ratchet.json` files
- `src/index.ts` registration order **unchanged** ([D1](decisions.md#d1))
- All four gates green

## Quality gates — all four, between every batch

```
- command: npm test
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: git diff --name-only HEAD~1
  pass: output matches the batch's declared write-set only
  on_fail: stop
```

## Batches

| Batch | Tasks | Parallel | Closes | Status |
|---|---|---|---|---|
| [1](batch-1/overview.md) | T1 jar-error classification | — | 4 non-defects (8 measured, see decision journal) | [x] |
| [2](batch-2/overview.md) | T2 activity · T3 json/yaml | yes | 25 | [x] |
| [3](batch-3/overview.md) | T4 descriptive signal | — | 36 | [ ] |
| [4](batch-4/overview.md) | T5 `detectUmlType` | — | 9 | [ ] |
| [5](batch-5/overview.md) | T6 class dispatch · T7 sequence arrow | yes | 4 | [ ] |
| [6](batch-6/overview.md) | T8 re-pin · T9 preprocessor failure | yes | 1 + baselines | [ ] |

**Batch order is by blast radius, ascending, with one exception.** T3 is in
batch 2 rather than later because two other batches' fixtures fall through to
json/yaml without it (dependencies 1 and 2 above). T4 and T5 are alone
because `descriptive-keywords.ts` and `block-extractor.ts` are each consulted
for a large share of the corpus.

## Stop conditions

- **Any fixture NEWLY misroutes.** The gate ratchets down only
- **Any of the 482 promoted zero-diff fixtures is de-promoted**
- **A repair would WIDEN a pattern rather than narrow it** — with the two
  documented exceptions in [D3](decisions.md#d3), both of which are
  under-claims and both of which name the upstream command class that
  bounds the widening
- **A task's bucket cannot be closed without changing registration order** —
  that is [D1](decisions.md#d1), settled by measurement; stop and record
- **A bucket can only be closed by parse-attempt** — that is
  `dispatch-by-parse-attempt`, a separately filed mission. Stop and record;
  do not start it
- A file outside the current task's write-set needs changing, and it is in
  no other task's write-set either
- Two consecutive quality-gate failures on the same check
- A constant is needed that has no upstream `file:line` citation

## Push forward without asking

- Naming inside new modules; formatting; test-helper placement
- Adding test cases beyond the listed acceptance criteria
- **A task whose bucket is already empty when it starts** — close it as a
  measured no-op and record the measurement; do not invent work for it
- A mass FALL in the misroute count — the intended outcome; record and continue
- Splitting a function to stay under the hook's limits (30 NLOC / 10 CCN /
  5 params / 500 lines)
- Regenerating `docs/catalog.md` when a `src/` module is added

## Repo conventions this mission must honour

- **Read the Java method body first** — not a filename, not this table. Every
  mechanism above is stated with the file it lives in precisely so it can be
  checked rather than believed
- **Diagrams are PlantUML**, in ```` ```plantuml ```` fences. The source must
  actually parse — render and check it. Note the trap the parent mission hit:
  a participant named after a diagram-type keyword (`JSON`, `CLASS`) silently
  re-routes the diagram itself
- **Never run Prettier.** No config, not a dependency; it rewrites every
  single-quoted string and **no gate catches it**
- Every constant carries its upstream `file:line`. Never fit a value

## Index

- [decisions.md](decisions.md) — D1–D5, with the evidence for each
- [diagrams/dispatch-map.md](diagrams/dispatch-map.md) — what decides what,
  and where each bucket falls out
- [decision-journal.md](decision-journal.md) — appended during execution
- `../sequence-engine-overclaims-nested-diagrams/README.md#mission-halted-at-t2--2026-08-23`
  — why the parent halted
- `.agent-notes/T2-registration-order-halt.md` — the full halt diagnosis,
  including the plugin↔factory↔line derivation this mission must NOT apply
