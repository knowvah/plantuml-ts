# T22 — OpenIconic atoms in member rows

**Agent:** typescript-pro (opus) · **Depends on:** T20 · wave A (worktree, ∥ T21, T24).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

cuzoga-39-tufu259, rideze-59-lizu265, jevuvi-65-dipo437

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **E1-3** (`E1.md`): an OpenIconic atom enters the row's Sea height with altitude 0 instead of `-3*factor` (`AtomOpenIconic.java:72-73`); text placed with a text-only maxSpan; visibility icon keyed off the baseline, not the row top. Land the altitude and the full-line maxSpan TOGETHER (see the regression note at `class-member-creole.ts:247-256`). rideze's visibility-icon re-key is MEDIUM — probe it first.
- **E2-3** (`E2.md` § jevuvi): the icon's `-3*factor` offset is kept out of `Sea`, and the row baseline is not anchored to the row bottom. Same subsystem as E1-3 — reconcile them into one port.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/class-member-creole.ts`, `class-member-atom-resolve.ts`, `renderer-classifier-rows.ts`, `class-member-rows.ts`, `renderer-openiconic.ts`, `src/core/svek/image/creole-sea-line.ts`, `src/core/openiconic-glyphs.ts`; tests beside each; `.agent-notes/cdd3-T22.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

creole-sea-line and openiconic are shared: survey object, state, component, usecase, unknown, sequence vs T0 baseline.

## Acceptance criteria

- Given the three fixtures, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
