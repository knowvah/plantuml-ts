# T7b — activation-group edge cases

Agent: `typescript-pro` (sonnet), worktree `sdd2-T7b`. Commit:
`fix(sequence): mirror activation group emission edge cases`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (research D cluster N)
`skin/rose/ComponentRoseActiveLine.java:75-79`: height 0 → no group, else
`startGroup`; `teoz/LiveBoxesDrawer.java:107-149`.
(a) An activation clipped to another page must emit an empty
`<g><title> </title></g>` (fululo, lifene, covuco) — lifelines already do
(`renderer-lifeline.ts:163`), activations do not. (b) `deactivate C`
before `activate C` produces an extra 10px activation `<g>` in ours
(jasixo, zujuge) — MEDIUM confidence; read `LiveBoxes` (T2b's port)
before changing anything.

## Targets
fululo, lifene, covuco, jasixo, zujuge.

## Write-set
`src/diagrams/sequence/renderer-lifeline.ts`, `sequence-layout-
activation.ts`, tests.

## Read-set
`research/research-d-structure.md` N; `renderer-lifeline.ts:140-200`;
`sequence-layout-activation.ts`; `sequence-live-boxes.ts` (read);
`LiveBoxesDrawer.java`, `ComponentRoseActiveLine.java`.

## Acceptance
- Given a clipped activation, then the empty titled group is emitted
  (test).
- Given `deactivate C` before `activate C`, then no extra group, or the
  mechanism is journaled if the jar's behaviour differs from research D.
- Given the targets, then structural sites are gone; no pinned change.
