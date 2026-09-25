# T26 — Note creole bullets and numbered lists

**Agent:** typescript-pro (sonnet) · **Depends on:** T20 · wave B (worktree, ∥ T27, T29).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

ponono-25-fevo574, sumocu-27-vubo674

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **C-1** (`C.md` § ponono): wrapped `*` bullet rows repeat the Bullet glyph; upstream draws only a width spacer, `blank(header)` (`Fission.java:87`).
- **C-2**: `#` numbered-list notes (HASH_HEADING_PATTERN / createListNumber) are not ported in the class note path — reuse core StripeStyle. Closure after C-1+C-2 is predicted, not probed: probe first.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/note-layout-measure.ts` (+ a split file if the 500-line cap bites); tests beside each; `.agent-notes/cdd3-T26.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

class only unless a core creole file is extended (then survey its engines).

## Acceptance criteria

- Given ponono and sumocu, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
