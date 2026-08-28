# T7 — Adjudicate and close out

## Context

The mission's code is done. This task measures what it did and records what it
deliberately did not do.

Read `../README.md`, `../decisions.md` and `~/.claude/rules/diagnosis.md`
first.

## Task

1. Run `npx jiti scripts/sequence-ratchet-adjudicate.ts --base <ref>` at two
   refs: Batch 4's parent (T6's isolated effect) and `main` (the whole
   mission). **`--base` and `--snapshot` are mutually exclusive** — `main()`
   tests `--snapshot` first and returns immediately, so passing both
   adjudicates nothing and still exits 0. Pass `--base` alone.
2. Record the full verdict split, Σ `weightedScore`, and **each run's own skip
   count** — a census that hides its skips is worse than no census.
3. Confirm the three baseline-red fixtures: `junaxa-14-biko373` **closed**,
   `fobube-11-nifo424` and `rugeco-70-muro754` **unchanged**.
4. For every `regression`, enter diagnosis mode and produce the full artefact
   BEFORE proposing any fix: mechanism, origin `file:line`, causal chain, and
   what you ruled out with the evidence that ruled it out. An empty "ruled
   out" means you guessed.
5. Write `findings/adjudication.md`, then update `DIVERGENCES.md` (anything
   left standing as a deliberate, understood difference — mechanism, not
   symptom) and close this mission's entry in `planning/next-missions.md`
   with measured numbers.

## Write-set (exhaustive)

- `plans/sequence-participant-symbols/findings/adjudication.md` (new)
- `plans/sequence-participant-symbols/decision-journal.md` (append only)
- `DIVERGENCES.md`
- `planning/next-missions.md`

## Read-set

- `scripts/sequence-ratchet-adjudicate.ts:1-60` — what the verdicts mean
- `~/.claude/rules/diagnosis.md`
- `DIVERGENCES.md` — existing entries, for house style

## Architecture decisions (locked)

- Do **NOT** run `scripts/repin-sequence-baselines.ts`. Re-pinning is
  **orchestrator-only**, and only on zero `regression` and zero unadjudicated
  rise. Task agents never write a baseline JSON.

## Acceptance criteria

- Every rise carries a verdict, and each run's skip count is reported.
- Every `regression` has a full diagnosis artefact before any code change.
- The three baseline fixtures are each named with their state.
- Σ `weightedScore` is reported against both refs.
- A clear bottom line: can the orchestrator re-pin, yes or no, and what blocks
  it if not.

## Observability

This task IS the observability step.

## Rollback

N/A for the measurement. Any `fix(T7)` commit is Reversible.

## Quality bar

Any throwaway script MUST report its own skip count and MUST go through
`tests/oracle/svg-conformance/render-fixture-sequence.ts` with
`DeterministicMeasurer` and `fixtureIncludeStore()` passed **explicitly** —
never `renderSync`, which returns `errorSvg` when `includeStore` is absent
(`src/index.ts:213`) and whose default `CanvasMeasurer` is unimplemented under
jsdom. Either turns a failure into a FALSE measurement. Delete the script
before committing.

**Do not** propose a fix before stating a mechanism. **Do not** offer "this is
hard" or "good enough" — they are not stop conditions.

## Commit

`docs(T7): adjudicate the participant-symbol re-mirror`
plus any `fix(T7): …` commits a diagnosis requires.
