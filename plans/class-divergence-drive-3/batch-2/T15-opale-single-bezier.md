# T15 — Opale single-bezier guard + freestanding scope

**Agent:** typescript-pro (sonnet) · **Depends on:** T14 · wave B (serial, main).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

zepeki-75-pifo352, vudepo-27-cuvo793, lejoga-79-poji465, temise-16-neco018 (+ pejone/xonamo partial)

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **C-15 = E3-19** (`C.md` § vudepo, `E3.md` § zepeki): missing `SvekEdge#isOpalisable` bezier-count guard (`SvekEdge.java:769-770,804-806`) — Opale is only applied to single-bezier connectors.
- **E3-21** (`E3.md` § temise): `note-freestanding.ts`'s scope guard refuses to opalise a note linked to an association point; it was added against a regression measured WITHOUT E3-7 and E3-19 — re-measure on the post-T14 tree and port upstream's condition.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/core/svek/image/Opale.ts`, `src/diagrams/class/note-layout-tip.ts`, `note-freestanding.ts`; tests beside each; `.agent-notes/cdd3-T15.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

Opale is shared: survey object, state, component, usecase, unknown vs T0 baseline.

## Acceptance criteria

- Given zepeki, vudepo, lejoga, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
