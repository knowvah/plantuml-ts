# Exit — final measurement, docs, memory, PR prep

Agent: orchestrator. Commits: `chore(jse-exit): exit bar — <summary>`, then `docs(jse): close out`.

## Steps
1. **Final measurement** at load < 8: `gates.sh final`; `cmp dist/plantuml-ts.d.ts $M/b0-plantuml-ts.d.ts.txt`;
   chain `final-eng` vs **b0**: 0 conformant losses outside json/yaml/hcl (reuse the last close's chain if `src` is unchanged since — compare `git rev-parse HEAD:src`).
2. **D7 bar:** the 4 target rows and every T0c row clean (in the manifest `clean` list); pins byte-equal and every new byte-conformant row pinned; D6: every extended-mode mover since b0 journaled.
3. **Docs:** `DIVERGENCES.md` "Two style paths" — the json family moves to the engine; "Extensions" rows re-measured (T3a) incl. the `defaultFontColor` wrapper; `planning/next-missions.md` ddc block's style-engine item → DONE; `oracle/goldens/svg-json/README.md` counts; `planning/mission-guide.md` open-work line.
4. **Dashboards:** `npm run parity:dashboard`, `npm run catalog`.
5. **Memory:** `jse-status` memory + MEMORY.md line; `.agent-notes/jse-execution.md` (novel findings only).
6. **README:** final status block (per-batch counts).
7. **PR prep:** PR body in the scratchpad (one line per batch, the three surveys before → after, output changes, test plan). Then the [squash batch](../batch-squash/overview.md).

## Acceptance
- Given the final diff vs b0, then 0 conformant losses outside the three engines.
- Given the D7 checks, then every clause holds or the halt names the clause.

Observability: N/A. Rollback: Reversible.
