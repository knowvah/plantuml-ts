# T5 — Close-out (runs in every branch, including "we did nothing")

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-run-isolation`. **You write no `src/`** — stop 2.

Read this brief's `README.md`, `decisions.md` and **`decision-journal.md` in
full**. The journal outranks any task file it postdates — SI34 had several
task-file expectations corrected by evidence mid-flight, and this mission is
explicitly designed to allow the same.

**Re-measure every number you publish.** Do not restate a figure from a task
report. SI34's predecessor published four confidently-stated numbers that
re-measurement disproved.

## Task
1. Establish which branch the mission took and say so in one sentence:
   (a) T0 could not reproduce — hole is theoretical; (b) user chose to accept
   permanently; (c) user approved a mechanism and it shipped.
2. Append a "Close-out (2026-XX-XX)" section to this brief's `README.md`:
   the exposure measurement from T0 (including "could not reproduce", if so),
   T1's reader census with the corrected count, the option chosen and by whom
   — **the user, by name of the decision, not an agent** — and your
   re-measured `npm test` wall-clock with the machine load at measurement
   time.
3. **Update SI34's residual section**
   (`plans/stdlib-build-race/README.md`, "The residual hole (D3)"). It
   currently says relocating the tree was declined partly because two import
   sites use fixed paths. Correct that to T1's real count, and link this
   mission's outcome. Do not delete SI34's reasoning — you are correcting a
   number and adding an outcome, not rewriting its history.
4. Update `planning/next-missions.md`: record the outcome. If the residual
   was accepted permanently, say so explicitly with the exposure measurement,
   so nobody re-opens it a third time without new information.
5. State plainly what this mission did **not** do: no `src/` touched, no
   product behaviour changed, no rendering affected (render-manifest "0
   unexpected" at every batch), and — if applicable — nothing about the
   published package surface changed.
6. Tick every batch in this brief's `README.md`.

Read-only git only; no commits.

## Write-set
- `plans/stdlib-run-isolation/README.md`
- `plans/stdlib-build-race/README.md` — the residual section only
- `planning/next-missions.md`
- `.agent-notes/sri-T5.md`

## Read-set
- This brief's `README.md`, `decisions.md`, `decision-journal.md`
- `.agent-notes/sri-T0.md` … `sri-T4.md` (whichever exist)
- `planning/adr/<NNN>-stdlib-run-isolation.md`
- `plans/stdlib-build-race/README.md` — the close-out shape to mirror

## Acceptance
- Given the outcome, then the close-out names which branch was taken and why.
- Given every published number, then it was re-measured here, with the load.
- Given SI34's residual section, then its import-site count is corrected and
  its reasoning is preserved.
- Given a "we accepted it" outcome, then the close-out is as complete as a
  code outcome would be — exposure, census, reasoning, and what would change
  the decision.
- Given `git diff --name-only main..HEAD -- src/`, then it is empty — quote it.

## Quality bar
Four gates on a docs-only tree. `npm test` under 60.3 s on a settled machine;
say what the load was.

## Boundaries
- **Always:** re-measure; correct SI34's count; attribute the decision to the
  user where it was the user's.
- **Never:** touch `src/`; restate a number without re-measuring; describe a
  residual as closed when it was accepted; run git write commands.

## Report (<=400 tokens)
The branch taken; the re-measured numbers with their load; the corrected
census count; and anything the orchestrator must fix before merge.
