# T6 — Sweep, re-baseline, close

## Context

Batches 1–2 landed; the corpus reports prove what moved. This task makes
the record complete and re-pins the self-baseline that later missions diff
against.

## Task

1. `mv plans/leaf-draw-order/baseline/note-order.txt baseline/note-order.t1.txt`
   (keep the pre-mission capture) and re-capture `note-order.txt` and
   `order-vs-jar.txt` from the final tree. Run
   `--check-order baseline/note-order.t1.txt` once more and paste the
   `moved=`/`offenders=` line into the journal.
2. Journal: an evidence row per D1–D6 (numbers, fixture names, commit ids);
   the batch gate results; the final `--vs-jar` tally.
3. README: tick every batch; append a "Session summary" (tasks completed vs
   planned, decisions count + flagged, gate results, known follow-ups —
   the OTHER-77 feed from T5).
4. `plans/note-leaf-model/README.md` + `decision-journal.md` +
   `batch-3/overview.md`: one row/paragraph stating Batch 3 was retired into
   `leaf-draw-order` (commit range), so its `[ ]` boxes are not read as
   pending. `planning/next-missions.md`: replace section 2 with the outcome
   and add the OTHER-77 feed as a candidate.
5. `.agent-notes/leaf-draw-order.md`: observations only (anything
   non-obvious learned about creation vs quark order, fallback uid mode,
   hidden hosts).

## Write-set

As in the batch overview. No `src/`.

## Read-set

- `plans/leaf-draw-order/decision-journal.md` (all rows)
- `plans/note-leaf-model/README.md` "Session summary", its journal's Batch 3 rows

## Acceptance criteria

- Given the final tree, when `--check-order baseline/note-order.t1.txt` runs,
  then `offenders=0` and `moved` equals the count recorded at T4.
- Given the brief, when read top-down, then no `[ ]` remains and every
  decision has evidence.
- Given `plans/note-leaf-model/README.md`, when read, then Batch 3's status
  is explained (retired), not left as pending.

## Quality bar

Docs only; run `npm run lint` anyway (harmless).

## Observability requirements — N/A. ## Rollback notes — Reversible.

## Boundaries

- Never: touch `src/`; re-baseline a pin.
- No git commands (the orchestrator commits: `docs(T6): ...`).
