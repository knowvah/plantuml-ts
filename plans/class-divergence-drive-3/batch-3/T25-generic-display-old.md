# T25 — `genericDisplay old`

**Agent:** typescript-pro (sonnet) · **Depends on:** T21 · wave C (serial, main).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

bijevi-38-duza931

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **E3-3** (`E3.md` § bijevi): `skinparam genericDisplay old` is unported (skinparam handler, theme, stereotype layout, badge-tag render).

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/core/theme.ts`, the skinparam handler table that owns the key, `src/diagrams/class/class-stereotype-layout.ts`, `renderer-classifier-badge-tag.ts`; tests beside each; `.agent-notes/cdd3-T25.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

class + object.

## Acceptance criteria

- Given bijevi, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
