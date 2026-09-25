# T32 — Edge geometry: collision order, inheritance stubs, unplaced labels, label boxes

**Agent:** typescript-pro (opus) · **Depends on:** T31 · wave B (serial, main).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

joguva-54-tevo966, cukaze-78-zija070, mefike-75-vova900, delasa-80-jusu462, vonago-16-zime449, tunelu-64-xica833, gujigi-63-roki030

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **E2-2** (`E2.md` § joguva): `manageCollision` walks nodes in dot-engine's order, not the jar's node-creation (colour) order (`class-edge-geo.ts:351`, order source `core/svek-dot-sequence.ts`).
- **E2-5** (`E2.md` § mefike): `groupInheritance` stubs end at the raw spline point; the jar ends them where the path starts after decoration trimming (`class-edge-group-inheritance.ts:131-132`, `class-edge-geo.ts:315`).
- **E3-12** (`E3.md` § delasa): an unplaced centre label (`lp->set` false) is still drawn at the origin and counted as ink — this is delasa's 73.5 px offset. The dot-engine gate is filed as a graphviz-issue; here, consume it defensively ONLY if upstream's own code gates on it (read `SvekEdge`/`DotStringFactory` label reads) — else record and hand off.
- **E3-13** (`E3.md` § vonago): `withLayoutBox` drops the box for an empty label (note-only label or constraint spot) (`class-layout-edge-labels.ts:416-420`).

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/class-edge-geo.ts`, `class-edge-group-inheritance.ts`, `class-layout-edge-labels.ts`, `class-edge-label-anchor.ts`, `src/core/svek-dot-sequence.ts`, `class-ink-box.ts` (E3-12 ink only); tests beside each; `.agent-notes/cdd3-T32.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

class DOT parity green; survey object vs T0 baseline.

## Acceptance criteria

- Given joguva, cukaze, mefike, vonago, tunelu, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
