# T5 — Close out

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-lock-sharing`. **You write no `src/`** — stop 1.

Read this brief's `README.md`, `decisions.md`, and **`decision-journal.md` in
full**. The journal outranks any task file it postdates.

**Re-measure every number you publish.** Do not restate a figure from a task
report. Predecessor missions published confidently-stated numbers that
re-measurement disproved.

## Task
1. Append a `## Close-out (2026-XX-XX)` section to this brief's `README.md`:
   the before/after contention table (re-measured), the concurrent-trial pass
   rate, whether SI35's ~37 per-test 120 s timeouts are now unnecessary (say
   so if they are — but **do not lower them in this task**; propose it), and
   your re-measured `npm test` wall-clock with the machine load.
2. Update `planning/next-missions.md`. It currently carries item **(b)** —
   the stdlib build-lock timeout — as OPEN with the measured 229.6 s/35.9 s
   figures and "recommended: a shared/exclusive lock". Replace that with the
   outcome. If the residual is closed, say **closed** and give the evidence;
   if partially, say exactly what remains.
3. State plainly what this mission did **not** do: no `src/` touched, no
   product behaviour changed, no rendering affected (render-manifest
   "0 unexpected" at every batch), and nothing about what the four
   `@knowvah/plantuml-stdlib*` packages publish changed.
4. Record the costs and the residuals honestly — including any new failure
   mode shared mode introduces (reader-entry leakage, writer starvation under
   pathological arrival rates, inode churn), even if unobserved. An unobserved
   risk that was reasoned about is worth more than silence.
5. Tick every batch in this brief's `README.md`.

## Write-set
- `plans/stdlib-lock-sharing/README.md`
- `planning/next-missions.md`
- `.agent-notes/lsh-T5.md`

## Read-set
- This brief's `README.md`, `decisions.md`, `decision-journal.md`
- `.agent-notes/lsh-T0.md`, `lsh-T4.md`
- `planning/next-missions.md` — the item (b) block to replace
- `plans/stdlib-run-isolation/README.md` close-out — the shape to mirror

## Acceptance
- Given every published number, then it was re-measured here, with the load.
- Given `planning/next-missions.md`, then item (b) reflects the real outcome
  and does not still read "OPEN" if it is closed.
- Given `git diff --name-only main..HEAD -- src/`, then it is empty — quote it.
- Given the close-out, then residuals and costs are stated, not just the win.

## Observability requirements
N/A.

## Rollback
N/A — docs only.

## Quality bar
Four gates on a docs-only tree. Report `npm test` duration with the load.

## Boundaries
- **Always:** re-measure; state residuals; describe the outcome precisely.
- **Never:** touch `src/`; restate a number without re-measuring; call a
  partially-closed residual closed; lower SI35's timeouts here; run any git
  write command.

## Report (<=350 tokens)
The re-measured before/after; the trial pass rate; what remains open; anything
the orchestrator must fix before merge. No preamble.
