# Batch 1 — diagnosis ledger (no src commits)

Three parallel worktrees, each writing ONE ledger file and nothing else. Probe
edits to `src/` are allowed inside the worktree for measurement only and are
never committed (`git checkout -- src` before the commit; the hand-back lists
what was probed). Method and row format: [diagnosis-method.md](diagnosis-method.md).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-json-subpixel.md) | json rows, node \|Δ\| ≤ 1px (18) | debugger (opus, effort high), jfp-T1a | `plans/json-family-parity/diagnosis/json-subpixel.md` | b0 close | [x] |
| [T1b](T1b-json-large.md) | json rows, node \|Δ\| > 1px (18, incl. timafu) | debugger (opus, effort high), jfp-T1b | `plans/json-family-parity/diagnosis/json-large.md` | b0 close | [x] |
| [T1c](T1c-yaml-hcl.md) | yaml (32) + hcl (2) | debugger (opus, effort high), jfp-T1c | `plans/json-family-parity/diagnosis/yaml-hcl.md` | b0 close | [x] |
| close | merge ledgers; build `diagnosis/ledger.md`; file any graphviz-issues drafts; write the Batch 4 amendment (decisions.md + batch-4/); no gates beyond merge-one (no src change) | orchestrator | per close-procedure + `docs/graphviz-issues/**`, `decisions.md`, `batch-4/**` | T1a, T1b, T1c | [x] (rulings 2026-10-30) |

## Close specifics
1. Every row of `fixtures.md`'s three tables appears in exactly one ledger with a
   class (stop 10: no "unknown", no Smetana without D3).
2. Conflicting mechanisms for the same code site across ledgers: reconcile by
   re-measuring, journal the resolution.
3. `ledger.md` = one table, all 70 rows, columns as in diagnosis-method.md, plus
   a mechanism index (mechanism → rows → predicted closure).
4. Batch 4 amendment: one task per port-controlled mechanism NOT in {M1, M2},
   write-sets disjoint or collapsed (parallelism rule), acceptance = its rows
   byte-conformant or their residue reduced to a named D3 class. Dated
   amendment in `decisions.md`. If none: journal "B4 empty" (push-forward).
5. dot-engine ≠ `dot` drafts become `docs/graphviz-issues/<n>-<slug>.md` + a
   `TRACKER.md` line (CLAUDE.md "Where things live").
