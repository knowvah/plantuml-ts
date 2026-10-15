# T0b — TRACKER verification ledger (read-only)

**Agent:** `debugger`, read-only. Prompt rule: use only Read/Grep/Glob/Bash, no Write/Edit and no
Serena edit tools. The orchestrator writes `measurements/tracker-ledger.md` from the report.
Do not prepend the worktree header; this task runs in the main checkout, read-only.

## Context
`docs/graphviz-issues/TRACKER.md` records dot-engine findings. Several entries were later
reclassified as "ours, not dot-engine" with native `dot -Tdot` (09, 11, 12, 15, 18, 20, 21). D8
requires every layout-side fix in this mission to check this ledger first. The ledger must say,
for each entry that can touch component drawing, whether the defect is the engine's or ours today.

## Task
For entries **11, 12, 14, 15, 18, 20, 28, 29, 30, 32, 35** (and 16, for the pavuzo residual):
1. Read the entry's `.md` in `docs/graphviz-issues/` and its TRACKER block.
2. Pick its named fixtures that live in `test-results/dot-cache/{component,usecase,unknown}`. If
   none does, find one description-family fixture that shows the same shape (grep the jar
   `svek-1.dot`).
3. Run native `/opt/homebrew/bin/dot -Tdot` on that fixture's `svek-1.dot`. Compare it with the
   in-process dot-engine 2.4.0 layout via layoutParity (`tests/oracle/layout-parity.ts`; see
   `scripts/lib/survey-layout-equal.ts` for the call) and with our builder graph.
4. Classify the entry: `engine` (dot-engine ≠ native on the same input), `ours-input` (our DOT
   input differs), `ours-draw` (layout equal, the drawing differs), or `clean` (re-measures clean;
   name the fixtures).
5. For #14: quote `USymbolFolder.java:228` and state which component fixtures draw a package or
   folder title. These are the rows where consuming `cluster.label` would regress.

## Output (one table, no prose)
`| entry | fixtures checked | native vs dot-engine | ours vs jar DOT | class | consequence for codd (task) |`

## Acceptance
- Given each listed entry, then the table has a class backed by a command the orchestrator can
  re-run (quoted in the row).
- Given an `engine` classification, then the orchestrator journals it as a D8 stop candidate before
  batch 1 starts.

**Observability:** N/A. **Rollback:** Reversible (no code).
