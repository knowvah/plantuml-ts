# Batch 7 — grammar top, factory, plugin, turn-on + capture

L12–L16 depend on each other in a chain, so one worktree `gep-T7` runs
T7a→T7c serially (D6). T7c turns gantt ON (D7). The close is special: the
orchestrator re-pins the gates gantt trips BEFORE capturing, then captures.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T7a](T7a-grammar-l12-l13.md) | grammar top part 1 (L12–L13) (1447 Java lines) | typescript-pro (sonnet), same agent | `src/diagrams/gantt/…` + tests | B6 | [ ] |
| [T7b](T7b-grammar-l14-l15.md) | grammar top part 2 (L14–L15) (963 Java lines) | typescript-pro (sonnet), same agent | `src/diagrams/gantt/…` + tests | T7a | [ ] |
| [T7c](T7c-factory-plugin.md) | GanttDiagramFactory, the plugin, registration and {{gantt}} (130 Java lines) | typescript-pro (sonnet), same agent | `src/diagrams/gantt/…` + tests + plugin/registration | T7b | [ ] |
| close | see below | orchestrator | per close-procedure + the turn-on pins | T7c | [ ] |

## Close (turn-on) — orchestrator only, in this order
1. Merge `gep/T7` (`merge-one.sh T7`).
2. **Re-pin first (D7):** run `routing-conformance.test.ts`,
   `refusal-coverage.test.ts`, `oracle-freshness.test.ts`; for each red row,
   confirm the mechanism is "gantt now renders" and re-pin with the row count
   journaled. Commit `chore(gep-b7): re-pin gates gantt trips on turn-on`.
3. **Capture:** `npm run svg:survey -- gantt --out
   tests/oracle/svg-conformance/parity-gantt.json`; pin every gantt fixture and
   corpus row into the gantt golden ratchet (conformant rows) and
   diff-baseline (all rows, current score as the never-rises bar). Commit
   `chore(gep-b7): capture the gantt baseline`.
4. Standard close steps 2–8 as `b7` (only gantt may move in the chain; any
   other engine's conformant loss is stop 4). The ledger gets the first
   family table (firstDiff family → rows → candidate mechanism).
