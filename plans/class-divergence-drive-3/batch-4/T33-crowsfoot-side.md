# T33 — Crow's-foot closest side

**Agent:** typescript-pro (sonnet) · **Depends on:** T30 · wave A (worktree, ∥ T31, T34).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

medosa-71-ligu412

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **C-11** (`C.md` § medosa): the crow's-foot `side` is always null — the adapter lacks node geometry; port `getClosestSide` (`core/svek/svek-edge-extremity.ts:51`, `renderer-arrowhead.ts:233`).

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/core/svek/svek-edge-extremity.ts`, `src/diagrams/class/renderer-arrowhead.ts`, the SvekEdge adapter that builds its input; tests beside each; `.agent-notes/cdd3-T33.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

svek extremity is shared: survey object, component, usecase, state vs T0 baseline.

## Acceptance criteria

- Given medosa, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
