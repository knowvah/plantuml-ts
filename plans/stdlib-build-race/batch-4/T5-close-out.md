# T5 — Close-out

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-build-race`. **No `src/`** — stop 2.

Read this brief's `README.md`, `decisions.md` and `decision-journal.md` **in
full** — the journal is authoritative and outranks any task file it postdates.

**Re-measure every number you publish.** Do not restate a figure from a task
report. The predecessor mission published four confidently-stated numbers that
re-measurement disproved, two of them the orchestrator's own.

## Task
1. Run T1's guarded repro on the fixed tree **5 times**. It must pass 5/5 —
   quote the runs. Compare against the verbatim pre-fix failure T1 recorded;
   the contrast is the mission's central evidence.
2. Append a "Close-out (2026-XX-XX)" section to this brief's `README.md`:
   the proven mechanism in one or two sentences with its `file:line`; the repro
   before/after; what the fix consists of (lock + content-derived skip); the
   re-measured `npm test` wall-clock against the 60.3 s ceiling, **with the
   machine load at measurement time**; and confirmation that
   `git diff --name-only main..HEAD -- src/` is empty — run it and quote the
   result.
3. **Document the residual hole** (D3) as prominently as the fix: if a second
   run genuinely must rebuild because the source really changed mid-run, it
   still `rmSync`s while the first run's workers import. Say why that was
   accepted — the per-run isolated directory that would close it was declined
   for packaging blast radius — and what symptom it would produce, so the next
   person recognises it instead of re-opening this investigation.
4. `planning/next-missions.md`: mark the `stdlib-remote-e2e` intermittent
   **closed**, replacing the OPEN/undiagnosed entry, and record the residual
   hole as the remaining known limit.
5. Tick every batch in this brief's `README.md`.
6. State plainly what this mission did **not** do: no `src/` touched, no
   product behaviour changed, no rendering affected.

Read-only git only; no commits.

## Write-set
- `plans/stdlib-build-race/README.md`
- `planning/next-missions.md`
- `.agent-notes/sre-T5.md`

## Read-set
- This brief's `README.md`, `decisions.md`, `decision-journal.md`
- `.agent-notes/sre-T0.md` … `sre-T4.md`
- `planning/next-missions.md` — the current OPEN entry
- `plans/sequence-oracle-harness/README.md` — the close-out shape to mirror

## Acceptance
- Given T1's guarded repro on the fixed tree, when run 5 times, then it passes
  5/5 — quoted.
- Given every published number, then it was re-measured here, and the close-out
  says how and at what machine load.
- Given `git diff --name-only main..HEAD -- src/`, then it is empty and the
  close-out quotes that.
- Given the close-out, then the residual hole is documented with its symptom
  and the reason it was accepted.
- Given `planning/next-missions.md`, then the intermittent is no longer listed
  as OPEN/undiagnosed.

## Observability
N/A — docs and register rows.

## Rollback
Reversible. Docs only.

## Quality bar
The four gates on a docs-only tree. `npm test` under 60.3 s on a settled
machine — check `uptime` and say what it was.

## Boundaries
- **Always:** re-measure; quote raw output; document the limit as plainly as
  the fix.
- **Never:** touch `src/`; restate a number without re-measuring; describe the
  race as fully eliminated when D3's residual hole remains; run git write
  commands.

## Report (<=400 tokens)
The repro before/after; the re-measured wall-clock and the load it was taken
at; confirmation `src/` is untouched; the residual hole as you documented it;
anything the orchestrator must fix before merge.
