# T34 — `scale` factor and dpi-scaled constants

**Agent:** typescript-pro (sonnet) · **Depends on:** T30 · wave A (worktree, ∥ T31, T33).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

cagace-55-libu760, nadaba-37-zaku242, kujiji-68-cujo036, ziparo-17-joku307

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **C-10** (`C.md` § cagace): `scale` k uses the truncated canvas instead of the fractional `calculateFinalDimension` (`class/layout.ts:499`). Probe-closed cagace, nadaba; kujiji keeps 14 S (font 9.873 vs 9.874 → D3).
- **E1-8** (`E1.md` § ziparo): under dpi 300 the jar scales the whole image (`TextBlockExporter.java:205-208`); we leave the visibility-icon offsets/origin margin (`VisibilityModifier.java:179`) and Opale cornersize 10 / delta 4 (`Opale.java:53,173`) unscaled.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/layout.ts`, `class-visibility-icon.ts`, `renderer-classifier-rows.ts`, `renderer-note.ts` (Opale call site; extend into `core/svek/image/Opale.ts` only if needed — T15 has merged by then); tests beside each; `.agent-notes/cdd3-T34.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

Opale/scale: survey object, state vs T0 baseline.

## Acceptance criteria

- Given cagace and nadaba, when rendered, then 0/0; ziparo numerics fall to its D3 residual
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
