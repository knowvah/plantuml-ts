# T23 — Member-row sprites, badge glyph, lecelo

**Agent:** typescript-pro (sonnet) · **Depends on:** T22 · wave C (serial, main).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

bidusa-22-jutu505, ruliki-78-biji661, gamevo-26-runo973, lecelo-92-loma110

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **C-3** (`C.md` § bidusa): the class plugin builds its SpriteRegistry with no internal store, so `sprite X jar:…` stays unresolved (`class/index.ts:47-48`, `parser.ts:53`). Alone proven insufficient.
- **C-4**: the class member-row sprite resolver has no SpriteSvg branch (`class-member-atom-resolve.ts:87-88` + row renderer). C-3+C-4 closure not probed — probe first.
- **E1-7** (`E1.md` § gamevo): the default size-17 `BADGE_GLYPH_D.Q` is the size-12 outline scraped from befasi-62-vimu310; `W` has the same bug (no fixture). Regenerate from a size-17 jar render (`scripts/oracle-render.sh`), never hand-edit.
- **lecelo residual** (T7 note): `<<$sprite>>` stereotype row glyph (`🏷` vs `label`) — undiagnosed; diagnose, fix if reachable, else record the artifact.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/index.ts`, `parser.ts`, `class-member-atom-resolve.ts`, `class-badge-glyph-data.ts`; tests beside each; `.agent-notes/cdd3-T23.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

class only unless a core sprite file is extended.

## Acceptance criteria

- Given bidusa, ruliki, gamevo, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
