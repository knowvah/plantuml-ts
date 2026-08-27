# Batch 2 — Adjudicate, re-pin, close out

Sequential. Orchestrator-owned: **task agents never write a baseline JSON**
(`scripts/repin-sequence-baselines.ts` header — parallel writers collide, and
re-pinning before adjudicating bakes regressions in).

| Task | Title | Done |
|---|---|---|
| T4 | Adjudicate the full corpus, then re-pin | [ ] |
| T5 | Close out: promote, document, file follow-ons | [ ] |

## T4 — Adjudicate, then re-pin

1. `npx jiti scripts/sequence-ratchet-adjudicate.ts --snapshot <path>`
2. Read the report. **Zero `regression` and zero unadjudicated rise is the
   precondition for step 3.** A rise that cannot be traced to a jar
   `file:line` halts the mission (stop condition 1).
3. `npx tsx scripts/repin-sequence-baselines.ts <snapshot>`
4. Any fixture that reached zero diffs is **promotion-eligible**, not
   promoted. Promotion writes `oracle/goldens/svg-sequence/ratchet.json` and
   copies `in.puml` + `golden.svg`; do it deliberately in T5, and record the
   count either way — a first-ever pinned sequence fixture is a mission
   result worth stating plainly.

## T5 — Close out

1. Update `oracle/goldens/svg-sequence/README.md` "Current state" with the new
   numbers and the date.
2. Write `findings/CLOSE-OUT.md`: what moved, what did not, and the residuals
   with their mechanisms.
3. Update `planning/next-missions.md` — mark `sequence-participant-g-wrapper`
   DONE with the measured outcome, and **explicitly state whether the
   comparator can now measure arrow fidelity**, since the two missions
   sequenced behind this one (`sequence-arrow-background-colour` and the
   dressing-bucket work) were told to wait for exactly that answer.
4. If the thesis did **not** fully hold — if arrow attributes still do not
   appear in the diff records — that is the most important thing the mission
   produces. File it with its mechanism; do not soften it.
5. File any verified `@knowvah/dot-engine` finding as a self-contained `.md`
   in `docs/graphviz-issues/` plus a `TRACKER.md` line (living only in this
   ledger is not filed).
6. Append the mission summary to the brief README: tasks completed vs
   planned, decisions logged, gate results, known issues.

## Quality gates

All four, on the full feature branch, before the merge commit.
