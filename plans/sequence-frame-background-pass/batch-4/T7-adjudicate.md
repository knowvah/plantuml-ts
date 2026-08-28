# T7 — Adjudicate every rise

## Context

`sequence-participant-g-wrapper` is blocked because 10 fixtures rise
unadjudicated and 5 of those are measured structural regressions. This mission
exists to clear them. This task finds out whether it did.

`scripts/repin-sequence-baselines.ts` refuses to run unless there are zero
regressions **and zero unadjudicated rises**. That is D8 and it is not
negotiable — re-pinning while rises stand would bake regressions into the
baseline permanently.

Read `../README.md`, `../decisions.md` and `../prior-observations.md` first.

## Task

1. Run `npx jiti scripts/sequence-ratchet-adjudicate.ts` at two ref pairs:
   - against **Batch 3's parent commit** — this mission's own effect
   - against **`feat/sequence-participant-g-wrapper`'s tip** — the combined
     landing, which is what T9 actually merges
2. Record the full verdict split (`artefact` / `substructure` / `regression` /
   `improved` / `inconclusive`) for both, plus Σ `weightedScore`.
3. Name each of the 10 previously-blocking fixtures with its new verdict.
   The three named in the filing are `pixopo-04-zitu732`,
   `kejoke-76-curu931` and `luzapi-49-rati107`; recover the rest from the
   predecessor's close-out at
   `plans/sequence-participant-g-wrapper/findings/CLOSE-OUT.md`.
4. For every `regression`, enter diagnosis mode per `~/.claude/rules/
   diagnosis.md` and produce the full artefact **before proposing any fix**:
   mechanism, origin `file:line`, causal chain, and what you ruled out with the
   evidence that ruled it out. An empty "ruled out" on a non-trivial defect
   means you guessed.
5. For every `inconclusive`, say WHY it is inconclusive — the adjudicator
   yields that verdict when no top-level `childCount` record exists at either
   ref, which genuinely means either "the counts matched" or "the comparison
   short-circuited higher up". Do not guess between them; measure.

## Read-set

- `scripts/sequence-ratchet-adjudicate.ts:1-60` (what the verdicts mean)
- `plans/sequence-participant-g-wrapper/findings/CLOSE-OUT.md`
- `~/.claude/rules/diagnosis.md`
- `../prior-observations.md` — all six

## Architecture decisions (locked)

- **D8** — do NOT run `repin-sequence-baselines.ts`. That is T9 and it is
  orchestrator-only. Task agents never write a baseline JSON.

## Acceptance criteria

- Given both adjudicator runs complete, then every rise carries a verdict and
  the script's own **skip count is reported** — a census that hides its skips
  is worse than no census (`../prior-observations.md` §2).
- Given any `regression`, then a full diagnosis artefact exists in
  `findings/adjudication.md` before any code change.
- Given the 10 previously-blocking fixtures, then each is named with its new
  verdict and, where it changed, the mechanism that changed it.
- Given the run, then Σ `weightedScore` is reported against both refs.

## Observability

This task IS the observability step. Its output decides T9.

## Rollback

N/A for the measurement itself. Any `fix(T7)` commit is Reversible.

## Quality bar

Any throwaway script you write must report its own skip count and must go
through `render-fixture-sequence.ts` with `DeterministicMeasurer` and
`fixtureIncludeStore()` passed explicitly — never `renderSync`
(`../prior-observations.md` §§2-3).

**Do not** propose a fix before stating a mechanism. **Do not** offer "this is
hard" or "good enough" as a stop condition; they are not stop conditions.

## Commit

`docs(T7): adjudicate the frame background pass against both refs`
(plus any `fix(T7): …` commits a diagnosis requires)
