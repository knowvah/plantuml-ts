# T17 — Association couple orientation + subsumed-link uid

**Agent:** typescript-pro (sonnet) · **Depends on:** T13 · wave A (worktree, ∥ T14).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

besepi-37-rori892 (partial; E3-15 is T16)

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **E3-16** (`E3.md` § besepi): a subsumed inverted link's phantom tick is not re-injected, so uids are off by 1.
- **E3-17** (`E3.md` § besepi): the association couple is oriented by `(A,B)` syntax order, not `existingLink.getEntity1/2`.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/class-assoc-couple.ts`, `class-assoc-subsume.ts`, `renderer-uid.ts`; tests beside each; `.agent-notes/cdd3-T17.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

class only.

## Acceptance criteria

- Given besepi, when rendered, then every `@id` equals the jar's (unit test asserts the uid sequence citing the Java line)
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
