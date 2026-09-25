# T16 — printCluster1 / getNodesOrderedTop

**Agent:** typescript-pro (opus) · **Depends on:** T15 · wave B (serial, main).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

nagega-30-poso418, xamule-03-jeda376, vegubu-29-bomu147, besepi-37-rori892, pejone-71-tige404, xonamo-50-podo529

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **E2-4 = C-16 = E3-15** (`E2.md` § nagega, `C.md` § pejone, `E3.md` § E3-15): `Cluster#printCluster1` / `getNodesOrderedTop` is unported — the jar declares the tails of inverted edges first. Needs an `inverted` flag on the DOT input edge.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/core/svek-dot-order.ts`, `src/core/graph-layout.types.ts`, `src/core/svek-dot-emit.ts`, `src/diagrams/class/class-dot-graph.ts`; tests beside each; `.agent-notes/cdd3-T16.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

DOT text changes for every DOT-backed engine: survey ALL engines vs T0 baseline; class DOT parity green; `npm run test -- tests/oracle` DOT-parity suites green.

## Acceptance criteria

- Given nagega, xamule, vegubu, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
