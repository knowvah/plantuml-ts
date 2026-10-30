# Exit — final measurement, DIVERGENCES, docs, memory, PR prep

Agent: orchestrator. Commits: `chore(jfp-exit): exit bar — <summary>`, then `docs(jfp): close out`.

## Steps
1. **Final measurement** at load < 8: `gates.sh final`; `cmp dist/plantuml-ts.d.ts $M/b0-plantuml-ts.d.ts.txt`;
   chain `final-eng` vs **b0**: 0 conformant losses outside json/yaml/hcl (reuse the
   last close's chain if `git rev-parse HEAD:src` is unchanged since).
   `npx tsx $T/residue.mts --all --json $M/final-residue.json`.
2. **Bar (README "Target"):** every row of `fixtures.md` is conformant + pinned, or its
   `diagnosis/ledger.md` class is `Smetana` (D3 evidence) or `dot-engine` (filed);
   no port-controlled `Mn` left open (an open one is a halt naming it); positional
   ceilings ≤ b0 on every row; manifest ceilings ≤ b0; every extended mover journaled.
3. **DIVERGENCES.md**, "Smetana-backed diagram types" (line ~17): replace the
   generic "geometry differs" with the measured result — the M1/M2 port, the per-family
   counts, and a row-level table of every `Smetana` row (row, residue, D3 evidence
   pointer into `plans/json-family-parity/diagnosis/ledger.md`). `dot-engine` rows
   point at their `docs/graphviz-issues/` file. Category stays "limitation (one engine, by choice)".
4. **Other docs:** `oracle/goldens/svg-json/README.md` counts; `planning/next-missions.md`
   (json parity item → DONE, follow-ons: any dot-engine issue, any user-signature item);
   `planning/mission-guide.md` open-work line.
5. **Dashboards:** `npm run parity:dashboard`, `npm run catalog`.
6. **Memory:** `jfp-status` memory + MEMORY.md line; `.agent-notes/jfp-execution.md` (novel findings only).
7. **README:** final status block (per-batch counts from `fixtures.md`).
8. **PR prep:** PR body in the scratchpad (one line per batch, the three surveys
   before → after, the positional totals before → after, the Smetana/dot-engine row
   counts, test plan). Then the [squash batch](../batch-squash/overview.md).

## Acceptance
- Given the final diff vs b0, then 0 conformant losses outside the three engines.
- Given the bar, then every clause holds or the halt names the clause.
- Given DIVERGENCES, then every `Smetana` row is listed with its measured residue.

Observability: N/A. Rollback: Reversible.
