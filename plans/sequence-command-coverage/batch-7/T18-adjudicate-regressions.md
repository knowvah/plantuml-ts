# T18 — Adjudicate every ratchet rise; diagnose the real ones

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML. This mission made ~195
fixtures start rendering and changed what the other ~946 emit. The sequence
ratchet fails on any `weightedScore` rise, and its header says a rise "has no
benign reading left."

**That is true within one comparison and false here.** `compareNodes`' three
short-circuits charge `units(actual) + units(expected)` (`compare.ts:198,229,404`),
so the same "still mismatched" verdict costs strictly more once our side grows.
A prior mission measured this across 242 rises: **162 moved CLOSER to the
golden** (98.6% of total rise), 35 moved further, 22 unchanged, 23 had no
top-level childCount short-circuit. The 35 real regressions were invisible
underneath the artefacts.

## Task

1. Run `scripts/sequence-ratchet-adjudicate.ts` (T4) across the full sequence
   corpus, base = the mission's branch point, live = current HEAD.
2. For every fixture verdict:
   - `artefact` (score rose, child-count distance **fell**) — record for T19's
     re-pin. **No diagnosis needed**; this is D5's authorised path.
   - `improved` (score fell) — record for T19.
   - `regression` (distance rose or unchanged) — **diagnose per
     `rules/diagnosis.md`**: mechanism, origin `file:line`, causal chain, what
     you ruled out and the evidence that ruled it out. Then fix at the
     mechanism's origin.
   - `inconclusive` (no top-level childCount short-circuit) — diagnose the same
     way. Do not guess a verdict.
3. Write the full classification to `findings/adjudication.json` for T19.

**Do not re-pin anything in this task.** T19 owns the baselines.

## Write-set

- `findings/adjudication.json` (new)
- Source files wherever a diagnosed mechanism leads — **declare each in the
  decision journal before editing it.** A file outside every task's write-set
  is stop condition 1.

## Read-set

- `scripts/sequence-ratchet-adjudicate.ts` (T4) and its header
- `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts`
- `../prior-observations.md` — **all of it**, especially §1 and §2
- `~/.claude/rules/diagnosis.md`

## Prior observations — bear directly on this task

- **The metric artefact.** Canonical example `sequence/bexoce-95-vibe195`:
  622 → 950, entire delta one diff, child count `actual=14 expected=59` →
  `actual=60 expected=59`. Off by one instead of by 45, score up 328.
  Re-pinning that is correct and is **not** hiding a regression.
- **Compensating errors exist.** A prior mission found fixtures where a
  spurious extra child had made our top-level count coincidentally *equal* the
  golden's; correcting the shape made the count honestly short, replaced a
  descent with a short-circuit, and **raised** the score while every emitted
  element moved closer to upstream. Verify element-for-element before calling
  such a case a regression.
- **Harness.** Every measurement passes `tests/helpers/fixture-include-store.ts`
  and `DeterministicMeasurer`, or it measures its own missing store.
- **Reading output.** vitest hides `console.log` in redirected runs. Use
  `--reporter=verbose`. Never conclude a branch did not fire from a piped run.

## Architecture decisions in force

D5 (locked). The adjudicator's verdict is the **only** thing that authorises a
re-pin. D6 (locked): residual fidelity is measured and filed, not chased — a
`regression` must be fixed, but a fixture that merely scores poorly must not.

## Interface contracts

Produces `findings/adjudication.json` for T19:

```
{ slug, verdict, baseScore, liveScore,
  baseChildDistance, liveChildDistance,
  mechanism?: { summary, file, line, ruledOut } }
```

`mechanism` is **required** on every `regression` and `inconclusive`.

## Acceptance criteria

- Given the corpus, when adjudicated, then every fixture has a verdict and no
  fixture is silently skipped.
- Given every `regression` verdict, then each carries a mechanism with
  `file:line` and a non-empty `ruledOut` — an empty `ruledOut` on a non-trivial
  defect means the cause was guessed, not isolated.
- Given every `regression`, then it is fixed at the mechanism's origin, not
  suppressed downstream at the symptom site.
- Given `findings/adjudication.json`, then its counts reconcile with the
  ratchet's own failure list.

## Observability

This task produces the mission's fidelity report.

## Rollback

**Reversible.** Fixes are ordinary code changes.

## Quality bar

All four gates green. The 2-fix-attempt cap bounds **edits, not inquiry** —
continue diagnosing until you can state the mechanism, then stop and log it.
"Two attempts failed" is not a diagnosis.

## Boundaries

- **Always**: state the mechanism before proposing any fix.
- **Never**: re-pin here; never fit a value; never call a rise a regression
  without checking the compensating-error case above.
- **Ask first**: any file outside the mission's declared write-sets.

## Commit

`fix(T18): diagnose and fix ratchet regressions surfaced by coverage work`

Body required: the artefact/regression split with counts, and the mechanism for
each regression fixed.
