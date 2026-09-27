# T21 — Package skinparams + empty-package leaf

**Agent:** typescript-pro (opus) · **Depends on:** T20 · wave A (worktree, ∥ T22, T24).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

giraca-14-xome136, dojanu-92-vizo468, nijeli-04-ponu844

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **E3-1** (`E3.md`): per-stereo package skinparams (`package<X><<s>>`) fall into `acc.unknown`.
- **E3-2**: plain `packageStereotypeFontColor` unknown.
- **E3-4**: `renderNamespaceRect` drops style RoundCorner (`Cluster.java:321-324`).
- **E3-5**: `packageFontName`/`packageFontStyle` unknown.
- **E3-6**: the empty-package leaf is not an `EntityImageEmptyPackage`/`ClusterDecoration` port — always a folder, stereotype never drawn (T9 already moved its draw into `renderer-empty-package-leaf.ts` and ported its colour).

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/core/skinparam-stereo-keys.ts`, `src/core/skinparam-key-handlers-table-b.ts`, `src/diagrams/class/class-namespace-shape.ts`, `renderer-empty-package-leaf.ts`, `renderer.ts`; tests beside each; `.agent-notes/cdd3-T21.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

skinparam tables are shared: survey object, component, usecase, state, unknown vs T0 baseline.

## Acceptance criteria

- Given the three fixtures, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
