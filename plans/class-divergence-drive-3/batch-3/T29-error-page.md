# T29 — Error page metrics

**Agent:** typescript-pro (sonnet) · **Depends on:** T20 · wave B (worktree, ∥ T26, T27).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

luzive-62-zote562, sadamo-18-siva346

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **C-17** (`C.md` § luzive): error-page line metrics were fitted to a non-deterministic jar render; no textLength, band width, canvas truncation. Derive the banner→band spacing (jar top 5 → 25) from `GraphicStrings` — do not fit.
- **C-18** (proposed-accept, D6): version banner string and `[From in.puml` vs `[From string` (`SourceStringReader.java:104`) — do NOT chase; leave for maintainer sign-off.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/core/error/error-renderer.ts`; tests beside each; `.agent-notes/cdd3-T29.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

error page is shared: survey ALL engines vs T0 baseline (error fixtures exist everywhere).

## Acceptance criteria

- Given luzive and sadamo, when rendered, then every diff except the C-18 identity lines is 0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
