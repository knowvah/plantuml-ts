# Decision journal — graphviz-tracker-consume

Append-only, orchestrator only. One row per decision, mover, flip, tick, halt, re-slot or write-set extension.

| # | Date | Task | Decision / observation | Mechanism / evidence | sha |
|---|---|---|---|---|---|
| 1 | 2026-10-16 | T0 | Branch `fix/graphviz-tracker-consume` from 9094705aa; brief committed 4924b1b48 unsigned via `git -c commit.gpgsign=false` (repo config has gpgsign true; D7 says unsigned, so per-commit override instead of editing config). dot-engine 2.4.0 (D1). | `npm ls @knowvah/dot-engine` | 4924b1b48 |
| 2 | 2026-10-16 | T0 | Orchestrator cd'd into the brief dir for one read-only `cat` before the mission started, then cd'd back to the root; no Serena call ran there, `git status` showed only the brief. Not a stop-9 event under way, but recorded. | git status after return: `?? plans/graphviz-tracker-consume/` only | — |
| 3 | 2026-10-16 | T0 | b0 gates: npm test exit 0, collected 1420 = on-disk 1420, 30677 passed, 0 failed; typecheck/lint/build exit 0. | measurements/b0-*.log | — |
| 4 | 2026-10-16 | T0 | b0 all-engine survey equals dur's b4-eng exactly (28 engines, 0 movers, 0 losses). Conformant: activity 448, class 723, component 188, unknown 486, usecase 62, state 78, object 63, mindmap 142, wbs 204, salt 51, json 13, yaml 7, timing 6, dot 5, c4 2, gantt 1, hcl 1, network 1; sequence 0/1143 as before. | diff-eng dur b4-eng → b0-eng | — |
| 5 | 2026-10-16 | T0 | b0 census Σ (diffCount): component 1927 (266 rows, 187 zero), usecase 715 (94/62), unknown 22449 (825/460), state 8201 (273/74). Ratchet pins: class 1003, description 367, activity 433, state 60, wbs 176, mindmap 137, salt 50, object 34, utility 15, json 10, yaml 6, dot 5, hcl 1, skin 1, sequence 0. | measurements/b0-*-census.json | — |
| 6 | 2026-10-16 | T0 | Target render-diffs all equal the plan column (no drift); layoutEqual true on every target row. | measurements/b0-rd.txt, b0/rows.json | — |
| 7 | 2026-10-16 | T0 | TICK 34: rubebe conformant, errorPage true; the jar's in.svg is a stock NPE crash page (`pt4` is null), stock-error-pages.json provenance oracle-widths. render-diff 160/63 is against the jar's error page, which D2's "where the jar draws" clause exempts. | b0-eng/parity-unknown.json; docs/svg-conformance.md "Error pages" | (this commit) |
