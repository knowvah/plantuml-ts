# T18 — `together {}` as `subgraph cluster<N>t<k>`

**Agent:** typescript-pro (opus) · **Depends on:** T16 · wave B (serial, main).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

foxosa-41-bono202, jakapi-64-tine258, nadono-22-gidu983, voluca-76-fosu617, boseba-99-zopo693

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **E1-6 = B-2** (`E1.md` § E1-6, `B.md` § boseba): `together {}` is parsed but never recorded, so no `subgraph clusterNtK` is emitted; graphviz treats a `cluster`-prefixed subgraph as a real unlabelled cluster (`Cluster.java:528-583` printTogether/printCluster2). Controlled experiments: deleting only the together wrappers from the jar DOT reproduces OUR layout (foxosa, jakapi, boseba).

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/class-container.ts` (+ parser state), `class-dot-clusters.ts`, `src/core/graph-layout.types.ts`, `src/core/graph-layout-build.ts`, `src/core/svek-dot-emit*.ts`; tests beside each; `.agent-notes/cdd3-T18.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

survey ALL engines (together exists in description/usecase too) vs T0 baseline; class DOT parity green.

## Acceptance criteria

- Given the five fixtures, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
