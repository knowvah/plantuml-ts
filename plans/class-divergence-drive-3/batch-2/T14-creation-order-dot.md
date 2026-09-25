# T14 — Creation-order DOT emission

**Agent:** typescript-pro (opus) · **Depends on:** T13 · wave A (worktree, ∥ T17).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

xitobu-41-lame230, nuxoni-26-xala894, dibinu-95-kavo178, puvono-84-doro361, sekame-22-meze147, vudepo-27-cuvo793, lejoga-79-poji465, pejone-71-tige404, xonamo-50-podo529, xoteci-81-jena668, temise-16-neco018

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **E1-1** (`diagnosis/E1.md` § E1-1, xitobu/nuxoni/ziparo): root DOT nodes and root magma leaves are emitted `[...classifiers, ...notes]` with collapsed empty packages last; the jar uses creation order and prints a muted EMPTY_PACKAGE inside `printGroups` (`GraphvizImageBuilder.java:226-227,401,417`).
- **E1-4** (`E1.md` § E1-4, dibinu): magma edges are emitted before note-on-entity edges; `applySingleStrategy` adds them last (`ClassDiagram.java:87`).
- **C-14 = E3-7** (`diagnosis/C.md` § puvono/vudepo/pejone, `E3.md` § E3-7 xoteci/temise): note nodes and note links are emitted after all classifiers/relationships instead of in creation order — both DOT order and link draw order.
Probe-verified closures (C.md): vudepo/lejoga close with C-14 + C-15 (C-15 is T15), pejone/xonamo additionally need C-16 (T16); puvono/sekame reach 0/1 (residual → D3). Partial movement here is expected; report it per fixture.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/class-dot-graph.ts`, `class-magma.ts`, `class-namespace.ts`, `src/core/svek-dot-sequence.ts`, the class link draw-order site (locate it; name it in the commit); tests beside each; `.agent-notes/cdd3-T14.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

DOT text changes: class DOT parity must stay green; survey object + unknown vs the T0 baseline.

## Acceptance criteria

- Given xitobu, nuxoni, dibinu, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
