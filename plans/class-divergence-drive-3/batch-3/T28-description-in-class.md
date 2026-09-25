# T28 — Description diagrams in the class corpus

**Agent:** typescript-pro (opus) · **Depends on:** T19 · wave C (serial, main).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

sokevu-87-toce485, gujigi-63-roki030 (E3-13 part is T32)

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **E3-9** (`E3.md` § sokevu): `descriptionPlugin.render` ignores the renderSync measurer (uses jarMeasurer) — `description/index.ts:76-80`, `renderer.ts:170-173`.
- **E3-10**: port nodes are also put in a ROOT `rank=source` set, so graphviz evicts them from the cluster (`graph-layout-build.ts:174-189`, `description/layout-dot-tree.ts:98`).
- **E3-22**: a shielded description interface has no shieldMargins → laid out as a bare 18×18 box.
- **E3-23**: `portTablePad` misses the `(int)` truncation (`SvekNode.java:181-186`).
- **E3-14** (`E3.md` § gujigi): a `descriptive` leaf with usymbol `package` is rendered as a class box (`renderer-usymbol-entity.ts:185-191`); route it through the EntityImageDescription port. Post-E3-10 residual for sokevu is unmeasured — measure after each step.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/description/index.ts`, `renderer.ts`, `layout-dot-tree.ts`, `layout-helpers-shape-endpoint.ts`, `src/core/graph-layout-build.ts`, `src/diagrams/class/renderer-usymbol-entity.ts`; tests beside each; `.agent-notes/cdd3-T28.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

description engine + graph-layout-build: survey component, usecase, unknown, object, state vs T0 baseline.

## Acceptance criteria

- Given sokevu and gujigi, when rendered, then their E3-9/10/14/22/23 diffs are 0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
