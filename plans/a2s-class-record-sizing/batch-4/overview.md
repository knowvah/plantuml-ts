# Batch 4 — Close-out (C1)

Single orchestrator task. Depends on: R1 complete (ADR-3 exit state
reached).

## Checklist

1. **Cold-tree gates ×2** (per the verify-gates-on-a-cold-tree rule):
   `rm -rf packages/*/assets` if applicable, then the four gates + all
   four ratchet commands, twice.
2. **Parity survey regen** — class rows only, non-destructively:
   `--out` + merge, concurrency 2 (single-type runs TRUNCATE other types'
   rows — never write parity-class.json in place from a scoped run).
   Apply the SI13 ADR-2 rule: journal the full drift breakdown; any
   dotEqual flip or verdict downgrade is a STOP.
3. **Ratchet eligibility sweep** — any authored/class fixture now meeting
   the add rule enters the ratchet (the 3 SI13 usecase fixtures enter iff
   the 1px viewBox/width gap closed via this mission's fixes; do not force).
4. **ledger.md final** — every remaining non-conformant fixture named with
   mechanism + evidence; count reconciles: conformant + ledger = 708.
5. **Backlog hygiene** — size-backlog.json contains exactly the ledger set;
   `_doc` updated with the new date/counts.
6. **mission-index.md** — update row A2s with outcome, counts, plan link.
7. **README summary** — tasks completed vs planned, decision count +
   flagged entries, gate results, known issues/follow-ups (bottom of
   plans/a2s-class-record-sizing/README.md).
8. **Library-finding filing** — if any iteration verified a NEW
   @knowvah/dot-engine finding, file `docs/graphviz-issues/<issue>.md` +
   TRACKER.md line before close (CLAUDE.md rule).
9. **Merge** — `--no-ff` to main; push per user instruction. Use a
   throwaway worktree if any agent is still running.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|------------|------|
| C1 | Close-out checklist above | orchestrator | ledger.md, size-backlog.json (_doc), planning/mission-index.md, README summary, parity-class.json (merged), decision-journal.md | R1 | [ ] |
