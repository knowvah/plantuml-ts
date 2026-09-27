# T19 — DOT attribute fidelity: weight, searchsize, label-first lines

**Agent:** typescript-pro (sonnet) · **Depends on:** T18 · wave B (serial, main).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

majuva-44-luta965, delasa-80-jusu462 (partial), cobumi-83-bapu892 (partial)

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **B-1** (`B.md` § majuva): the layout forwards `@3` as `weight=3`; the jar never puts it in its DOT (`Link#getWeight` has no caller; `CommandLinkClass.java:381-385`). Adding `weight=3` to the cached DOT reproduces ours exactly.
- **E3-11** (`E3.md` § delasa): the layout builder never sets `searchsize=500` (`DotStringFactory.java:154`). Set `searchsize` ONLY — do not set `remincross` through the builder (E3-D2: that cancels searchsize in dot-engine; graphviz treats a missing remincross as true, `mincross.c:379`).
- **E3-18** (`E3.md` § cobumi): `Bibliotekon#addLine`'s label-first insertion into `lines0` is unported.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/class-dot-edges.ts`, `src/core/graph-layout-build.ts`, `src/core/graph-layout-build-edges.ts` (+ emitter sequence); tests beside each; `.agent-notes/cdd3-T19.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

searchsize reaches every DOT-backed engine: survey ALL engines vs T0 baseline.

## Acceptance criteria

- Given majuva, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
