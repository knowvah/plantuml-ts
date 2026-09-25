# T27 — Gradient def order + def-id seed

**Agent:** typescript-pro (opus) · **Depends on:** T20 · wave B (worktree, ∥ T26, T29).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

givofi-11-xumu978, popesa-39-sobe866 (their C-8 canvas term is T31)

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **C-7** (`C.md` § givofi): `<defs>` puts klimt-fragment gradients before body-lifted ones, so seeded gradient numbering is out of creation order (`core/svg-defs.ts:331`).
- **C-9** (`C.md` § popesa, MEDIUM, already filed): the def-id seed hashes raw lines, not preprocessed ones (`BlockUmlBuilder`, `assemble-svg.ts:551`). Re-probe before porting.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/core/svg-defs.ts`, `src/core/BlockUmlBuilder.ts`, `src/core/assemble-svg.ts`; tests beside each; `.agent-notes/cdd3-T27.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

cross-engine: survey ALL engines vs T0 baseline.

## Acceptance criteria

- Given givofi and popesa, when rendered, then their gradient/id structural diffs are 0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
